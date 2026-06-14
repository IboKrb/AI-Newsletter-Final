import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "../queries/connection";
import * as schema from "@db/schema";
import { getAiClient, type GroundingSource } from "./ai-client";
import { getAiConfig } from "./settings";
import { enrichTags } from "./tagger";
import { hashContent, isDuplicate } from "./dedupe";

type Category = (typeof schema.categoryEnum.enumValues)[number];

const STANDARD_LIMIT = 5; // Standard-Quellen pro Lauf
const ROTATING_LIMIT = 5; // rotierende Quellen pro Lauf (LRU)

// ═══════════════════════════════════════════════════════════════
// TEMPLATES (die "gebauten" Workflows — editierbar)
// ═══════════════════════════════════════════════════════════════

export async function listTemplates() {
  return getDb()
    .select()
    .from(schema.workflowTemplates)
    .orderBy(asc(schema.workflowTemplates.category), asc(schema.workflowTemplates.name));
}

export async function getTemplate(id: number) {
  const rows = await getDb()
    .select()
    .from(schema.workflowTemplates)
    .where(eq(schema.workflowTemplates.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function createTemplate(data: schema.InsertWorkflowTemplate) {
  const [row] = await getDb().insert(schema.workflowTemplates).values(data).returning();
  return row;
}

export async function updateTemplate(id: number, data: Partial<schema.InsertWorkflowTemplate>) {
  const [row] = await getDb()
    .update(schema.workflowTemplates)
    .set(data)
    .where(eq(schema.workflowTemplates.id, id))
    .returning();
  return row;
}

export async function deleteTemplate(id: number) {
  await getDb().delete(schema.workflowTemplates).where(eq(schema.workflowTemplates.id, id));
}

// ═══════════════════════════════════════════════════════════════
// SOURCES (Quellen-Verwaltung)
// ═══════════════════════════════════════════════════════════════

export async function listSources(category?: Category) {
  const db = getDb();
  const where = category ? eq(schema.sources.category, category) : undefined;
  return db
    .select()
    .from(schema.sources)
    .where(where)
    .orderBy(
      desc(schema.sources.isStandard),
      desc(schema.sources.priority),
      asc(schema.sources.name),
    );
}

export async function addSource(data: schema.InsertSource) {
  const [row] = await getDb().insert(schema.sources).values(data).returning();
  return row;
}

export async function updateSource(id: number, data: Partial<schema.InsertSource>) {
  const [row] = await getDb()
    .update(schema.sources)
    .set(data)
    .where(eq(schema.sources.id, id))
    .returning();
  return row;
}

export async function deleteSource(id: number) {
  await getDb().delete(schema.sources).where(eq(schema.sources.id, id));
}

export async function setStandard(id: number, isStandard: boolean) {
  return updateSource(id, { isStandard });
}

// ═══════════════════════════════════════════════════════════════
// RUNS (Durchläufe / Verlauf)
// ═══════════════════════════════════════════════════════════════

export async function listRuns(limit = 50) {
  return getDb()
    .select()
    .from(schema.workflowRuns)
    .orderBy(desc(schema.workflowRuns.createdAt))
    .limit(limit);
}

export async function getRun(id: number) {
  const db = getDb();
  const [run] = await db
    .select()
    .from(schema.workflowRuns)
    .where(eq(schema.workflowRuns.id, id))
    .limit(1);
  if (!run) return null;

  const [sources, logs] = await Promise.all([
    db
      .select()
      .from(schema.workflowRunSources)
      .where(eq(schema.workflowRunSources.runId, id))
      .orderBy(asc(schema.workflowRunSources.id)),
    db
      .select()
      .from(schema.workflowRunLogs)
      .where(eq(schema.workflowRunLogs.runId, id))
      .orderBy(desc(schema.workflowRunLogs.createdAt))
      .limit(200),
  ]);

  return { ...run, sources, logs };
}

export async function cancelRun(id: number) {
  await getDb()
    .update(schema.workflowRuns)
    .set({ status: "cancelled", finishedAt: new Date(), errorMessage: "Manuell abgebrochen" })
    .where(eq(schema.workflowRuns.id, id));
}

async function isCancelled(runId: number): Promise<boolean> {
  const [row] = await getDb()
    .select({ status: schema.workflowRuns.status })
    .from(schema.workflowRuns)
    .where(eq(schema.workflowRuns.id, runId))
    .limit(1);
  return row?.status === "cancelled";
}

async function log(
  runId: number,
  level: (typeof schema.runLogLevelEnum.enumValues)[number],
  message: string,
  repetition?: number,
  metadata?: unknown,
) {
  await getDb().insert(schema.workflowRunLogs).values({
    runId,
    level,
    message,
    repetition: repetition ?? null,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });
}

/**
 * Startet einen Durchlauf für ein Template. Plant die Quellen und führt den
 * Lauf asynchron aus (Fortschritt wird in der DB aktualisiert, UI pollt).
 */
export async function startRun(
  templateId: number,
  opts: { extraSourceIds?: number[]; triggeredBy?: (typeof schema.triggeredByEnum.enumValues)[number] } = {},
): Promise<number> {
  const db = getDb();
  const template = await getTemplate(templateId);
  if (!template) throw new Error(`Template #${templateId} nicht gefunden`);

  const [run] = await db
    .insert(schema.workflowRuns)
    .values({
      templateId: template.id,
      templateName: template.name,
      category: template.category,
      status: "pending",
      repetitionsTotal: template.repetitions,
      triggeredBy: opts.triggeredBy ?? "manual",
    })
    .returning();

  // Quellen planen: alle Standard (Kategorie) + bis zu 5 rotierende (LRU) + manuelle Extras
  const standard = await db
    .select()
    .from(schema.sources)
    .where(
      and(
        eq(schema.sources.category, template.category),
        eq(schema.sources.isStandard, true),
        eq(schema.sources.isActive, true),
      ),
    )
    .orderBy(desc(schema.sources.priority))
    .limit(STANDARD_LIMIT);

  const rotating = await db
    .select()
    .from(schema.sources)
    .where(
      and(
        eq(schema.sources.category, template.category),
        eq(schema.sources.isStandard, false),
        eq(schema.sources.isActive, true),
      ),
    )
    .orderBy(sql`${schema.sources.lastUsedAt} asc nulls first`)
    .limit(ROTATING_LIMIT);

  const extras = opts.extraSourceIds?.length
    ? await db.select().from(schema.sources).where(inArray(schema.sources.id, opts.extraSourceIds))
    : [];

  const planned: { name: string; url: string; kind: "standard" | "rotating" | "manual"; id: number }[] = [
    ...standard.map((s) => ({ name: s.name, url: s.url, kind: "standard" as const, id: s.id })),
    ...rotating.map((s) => ({ name: s.name, url: s.url, kind: "rotating" as const, id: s.id })),
    ...extras.map((s) => ({ name: s.name, url: s.url, kind: "manual" as const, id: s.id })),
  ];

  if (planned.length > 0) {
    await db.insert(schema.workflowRunSources).values(
      planned.map((p) => ({ runId: run.id, name: p.name, url: p.url, kind: p.kind })),
    );
    // lastUsedAt aktualisieren
    await db
      .update(schema.sources)
      .set({ lastUsedAt: new Date() })
      .where(inArray(schema.sources.id, planned.map((p) => p.id)));
  }

  // Asynchron ausführen (nicht awaiten)
  void runWorkflow(run.id, template, planned).catch(async (err) => {
    console.error(`[Workflow] Lauf #${run.id} fataler Fehler:`, err);
    await db
      .update(schema.workflowRuns)
      .set({
        status: "failed",
        finishedAt: new Date(),
        errorMessage: err instanceof Error ? err.message : String(err),
      })
      .where(eq(schema.workflowRuns.id, run.id));
  });

  return run.id;
}

/** Startet mehrere Templates nacheinander (Free-Tier-Ratenlimit). */
export async function startMultiple(
  templateIds: number[],
  triggeredBy: (typeof schema.triggeredByEnum.enumValues)[number] = "manual",
): Promise<number[]> {
  const runIds: number[] = [];
  for (const id of templateIds) {
    try {
      runIds.push(await startRun(id, { triggeredBy }));
    } catch (err) {
      console.error(`[Workflow] startMultiple: Template #${id} fehlgeschlagen`, err);
    }
  }
  return runIds;
}

/** Führt alle aktiven Templates aus (für den Cronjob). */
export async function runAllActiveTemplates(
  triggeredBy: (typeof schema.triggeredByEnum.enumValues)[number] = "cron",
): Promise<number[]> {
  const active = await getDb()
    .select({ id: schema.workflowTemplates.id })
    .from(schema.workflowTemplates)
    .where(eq(schema.workflowTemplates.isActive, true));
  return startMultiple(active.map((t) => t.id), triggeredBy);
}

// ── Prompt-Bausteine ───────────────────────────────────────────────
function buildSourcesBlock(
  planned: { name: string; url: string; kind: string }[],
): string {
  if (planned.length === 0) return "";
  const list = planned.map((p) => `- ${p.name}: ${p.url}`).join("\n");
  return `\n\nBERÜCKSICHTIGE diese Quellen (durchsuche sie auf aktuelle Inhalte):\n${list}\n\nSuche ZUSÄTZLICH nach weiteren relevanten, aktuellen Quellen.`;
}

function buildOutputInstruction(category: string, maxArticles: number, knownTitles: string[]): string {
  const avoid =
    knownTitles.length > 0
      ? `\n\nVERMEIDE Duplikate. Diese Titel wurden bereits erfasst:\n${knownTitles
          .slice(0, 30)
          .map((t) => `- ${t}`)
          .join("\n")}`
      : "";

  return `${avoid}

WICHTIG — Gib AUSSCHLIESSLICH gültiges JSON zurück (kein Markdown, keine Erklärung), als Objekt mit "articles"-Array:
{
  "articles": [
    {
      "title": "string (5-300 Zeichen)",
      "summary": "string (deutsch, 1-3 Sätze)",
      "content": "string (deutsch, 100-1500 Wörter)",
      "category": "${category}",
      "tags": ["lowercase", "konkret", "mind. 3"],
      "sourceName": "string (echte Originalquelle)",
      "sourceUrl": "https://… (echte URL)",
      "publishedAt": "ISO-8601 (optional)",
      "relevanceScore": 0-100
    }
  ]
}
Liefere maximal ${maxArticles} Artikel. Nutze NUR echte, verifizierbare Quellen mit funktionierenden URLs.`;
}

interface RawArticle {
  title?: string;
  summary?: string;
  content?: string;
  category?: string;
  tags?: unknown;
  sourceName?: string;
  sourceUrl?: string;
  publishedAt?: string;
  relevanceScore?: number;
}

function coerceArticles(parsed: unknown): RawArticle[] {
  if (Array.isArray(parsed)) return parsed as RawArticle[];
  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.articles)) return obj.articles as RawArticle[];
  }
  return [];
}

function isValidArticle(a: RawArticle): boolean {
  return (
    typeof a.title === "string" &&
    a.title.length >= 5 &&
    typeof a.summary === "string" &&
    a.summary.length >= 10 &&
    typeof a.content === "string" &&
    a.content.length >= 30 &&
    typeof a.sourceUrl === "string" &&
    /^https?:\/\//.test(a.sourceUrl)
  );
}

// ── Der eigentliche Ausführer ──────────────────────────────────────
async function runWorkflow(
  runId: number,
  template: schema.WorkflowTemplate,
  planned: { name: string; url: string; kind: string }[],
): Promise<void> {
  const db = getDb();
  const start = Date.now();
  const cfg = await getAiConfig();
  const knownTitles: string[] = [];
  const discoveredUrls = new Set<string>();
  let totalFound = 0;
  let totalSaved = 0;
  let totalDupes = 0;
  let repsWithError = 0;

  await db
    .update(schema.workflowRuns)
    .set({ status: "running", startedAt: new Date() })
    .where(eq(schema.workflowRuns.id, runId));
  await log(runId, "info", `Lauf gestartet — ${template.repetitions}× "${template.name}" (${template.category})`);

  const sourcesBlock = buildSourcesBlock(planned);

  for (let rep = 1; rep <= template.repetitions; rep++) {
    if (await isCancelled(runId)) {
      await log(runId, "info", "Lauf abgebrochen.");
      return;
    }

    await log(runId, "progress", `Wiederholung ${rep}/${template.repetitions} läuft…`, rep);

    try {
      const client = await getAiClient();
      const systemPrompt = template.systemPrompt;
      const userPrompt =
        template.userPrompt +
        sourcesBlock +
        buildOutputInstruction(template.category, template.maxArticles, knownTitles);

      const res = await client.research(userPrompt, systemPrompt, {
        grounding: template.useGrounding,
      });

      const parsed = client.extractJson(res.content);
      const rawArticles = coerceArticles(parsed);
      const valid = rawArticles.filter(isValidArticle);
      totalFound += valid.length;

      let savedThisRep = 0;
      for (const a of valid) {
        const title = a.title!.trim();
        const sourceUrl = a.sourceUrl!.trim();
        const hash = hashContent(sourceUrl, title);

        if (knownTitles.includes(title) || (await isDuplicate(hash))) {
          totalDupes++;
          continue;
        }

        const category = (
          schema.categoryEnum.enumValues as readonly string[]
        ).includes(a.category ?? "")
          ? (a.category as Category)
          : template.category;

        const aiTags = Array.isArray(a.tags) ? (a.tags as unknown[]).map(String) : [];
        const tags = enrichTags(title, a.content ?? "", aiTags);

        // Quelle finden oder anlegen (für Rotations-Pool)
        const sourceId = await upsertSource(a.sourceName ?? "Unbekannt", sourceUrl, category);

        try {
          await db.insert(schema.articles).values({
            sourceId,
            title,
            content: a.content!,
            summary: a.summary!,
            category,
            tags: JSON.stringify(tags),
            sourceName: a.sourceName ?? "Unbekannt",
            sourceUrl,
            publishedAt: a.publishedAt ? new Date(a.publishedAt) : new Date(),
            contentHash: hash,
            status: "draft",
            relevanceScore: typeof a.relevanceScore === "number" ? a.relevanceScore : 50,
            aiModel: cfg.model,
            aiProcessedAt: new Date(),
          });
          knownTitles.push(title);
          savedThisRep++;
          totalSaved++;
        } catch {
          totalDupes++;
        }
      }

      // Entdeckte Grounding-Quellen festhalten
      await recordDiscoveredSources(runId, res.groundingSources, discoveredUrls, rep);

      await db
        .update(schema.workflowRuns)
        .set({
          repetitionsDone: rep,
          progressPercent: Math.round((rep / template.repetitions) * 100),
          articlesFound: totalFound,
          articlesSaved: totalSaved,
          duplicatesSkipped: totalDupes,
        })
        .where(eq(schema.workflowRuns.id, runId));

      await log(
        runId,
        "success",
        `Wiederholung ${rep}: ${savedThisRep} neue Artikel gespeichert (${valid.length} gefunden), ${res.groundingSources.length} Web-Quellen.`,
        rep,
        { found: valid.length, saved: savedThisRep, sources: res.groundingSources.length },
      );
    } catch (err) {
      repsWithError++;
      const msg = err instanceof Error ? err.message : String(err);
      await log(runId, "error", `Wiederholung ${rep} fehlgeschlagen: ${msg}`, rep);
    }
  }

  const durationMs = Date.now() - start;
  const finalStatus =
    repsWithError === 0 ? "completed" : repsWithError === template.repetitions ? "failed" : "partial";

  await db
    .update(schema.workflowRuns)
    .set({
      status: finalStatus,
      finishedAt: new Date(),
      durationMs,
      repetitionsDone: template.repetitions,
      progressPercent: 100,
    })
    .where(eq(schema.workflowRuns.id, runId));

  await log(
    runId,
    finalStatus === "failed" ? "error" : "success",
    `Lauf abgeschlossen: ${totalSaved} Artikel gespeichert, ${totalDupes} Duplikate übersprungen (Status: ${finalStatus}).`,
  );
}

async function recordDiscoveredSources(
  runId: number,
  sources: GroundingSource[],
  seen: Set<string>,
  rep: number,
): Promise<void> {
  const fresh = sources.filter((s) => s.url && !seen.has(s.url));
  for (const s of fresh) seen.add(s.url);
  if (fresh.length === 0) return;
  await getDb()
    .insert(schema.workflowRunSources)
    .values(
      fresh.map((s) => ({
        runId,
        name: s.name.slice(0, 500),
        url: s.url,
        kind: "discovered" as const,
        repetition: rep,
      })),
    );
}

async function upsertSource(name: string, url: string, category: Category): Promise<number> {
  const db = getDb();
  const existing = await db
    .select({ id: schema.sources.id })
    .from(schema.sources)
    .where(eq(schema.sources.url, url))
    .limit(1);
  if (existing[0]) {
    await db
      .update(schema.sources)
      .set({ lastUsedAt: new Date() })
      .where(eq(schema.sources.id, existing[0].id));
    return existing[0].id;
  }
  const [row] = await db
    .insert(schema.sources)
    .values({ name: name.slice(0, 255), url, type: "website", category, lastUsedAt: new Date() })
    .returning();
  return row.id;
}

// ═══════════════════════════════════════════════════════════════
// SEED (Default-Templates + Standard-Quellen beim ersten Start)
// ═══════════════════════════════════════════════════════════════

const CATEGORY_LABELS: Record<Category, string> = {
  news: "KI-News",
  tools: "KI-Tools",
  prompts: "Prompts",
  tutorials: "Tutorials",
  podcasts: "Podcasts",
  videos: "Videos",
  reads: "Lesenswertes (Artikel/Essays)",
  image_gen: "Bildgenerierung",
};

const DEFAULT_STANDARD_SOURCES: Record<Category, { name: string; url: string }[]> = {
  news: [
    { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/" },
    { name: "The Verge AI", url: "https://www.theverge.com/ai-artificial-intelligence" },
    { name: "MIT Technology Review", url: "https://www.technologyreview.com/" },
    { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/" },
    { name: "Ars Technica AI", url: "https://arstechnica.com/ai/" },
  ],
  tools: [
    { name: "Product Hunt — AI", url: "https://www.producthunt.com/topics/artificial-intelligence" },
    { name: "GitHub Trending", url: "https://github.com/trending" },
    { name: "There's An AI For That", url: "https://theresanaiforthat.com/" },
    { name: "Hacker News", url: "https://news.ycombinator.com/" },
    { name: "Futurepedia", url: "https://www.futurepedia.io/" },
  ],
  prompts: [
    { name: "PromptHero", url: "https://prompthero.com/" },
    { name: "r/PromptEngineering", url: "https://www.reddit.com/r/PromptEngineering/" },
    { name: "Awesome ChatGPT Prompts", url: "https://github.com/f/awesome-chatgpt-prompts" },
  ],
  tutorials: [
    { name: "freeCodeCamp", url: "https://www.freecodecamp.org/news/" },
    { name: "Dev.to AI", url: "https://dev.to/t/ai" },
    { name: "YouTube AI Tutorials", url: "https://www.youtube.com/results?search_query=ai+tutorial" },
  ],
  podcasts: [
    { name: "Latent Space", url: "https://www.latent.space/" },
    { name: "The TWIML AI Podcast", url: "https://twimlai.com/podcast/" },
  ],
  videos: [
    { name: "YouTube — AI", url: "https://www.youtube.com/results?search_query=artificial+intelligence" },
  ],
  reads: [
    { name: "arXiv cs.AI", url: "https://arxiv.org/list/cs.AI/recent" },
    { name: "Substack AI", url: "https://substack.com/browse/technology" },
  ],
  image_gen: [
    { name: "Midjourney Showcase", url: "https://www.midjourney.com/showcase" },
    { name: "Civitai", url: "https://civitai.com/" },
  ],
};

function defaultPrompts(category: Category): { system: string; user: string } {
  const label = CATEGORY_LABELS[category];
  return {
    system: `Du bist ein erfahrener KI-Newsletter-Redakteur mit Fokus auf "${label}". Du recherchierst sorgfältig im Web nach aktuellen, relevanten und verifizierbaren Inhalten der letzten 7 Tage. Du schreibst auf Deutsch, prägnant und faktenbasiert. Du erfindest niemals Quellen oder URLs — verwende ausschließlich real existierende Quellen.`,
    user: `Recherchiere die wichtigsten und aktuellsten Inhalte der letzten Woche im Bereich "${label}". Konzentriere dich auf neue Entwicklungen, Releases und Trends mit hoher Relevanz für ein deutschsprachiges KI-interessiertes Publikum.`,
  };
}

/** Legt beim ersten Start Default-Templates und Standard-Quellen an (idempotent). */
export async function seedDefaults(): Promise<void> {
  const db = getDb();

  const existingTemplates = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.workflowTemplates);
  if (Number(existingTemplates[0]?.count ?? 0) === 0) {
    const categories = schema.categoryEnum.enumValues;
    for (const category of categories) {
      const p = defaultPrompts(category);
      await db.insert(schema.workflowTemplates).values({
        name: `${CATEGORY_LABELS[category]} — Wöchentliche Recherche`,
        category,
        description: `Standard-Workflow für ${CATEGORY_LABELS[category]} mit Web-Grounding.`,
        systemPrompt: p.system,
        userPrompt: p.user,
        repetitions: 3,
        maxArticles: 10,
        useGrounding: true,
        isActive: category === "news", // nur News standardmäßig aktiv (Cron)
      });
    }
    console.log("[Seed] Default-Workflow-Templates angelegt.");
  }

  const existingSources = await db.select({ count: sql<number>`count(*)` }).from(schema.sources);
  if (Number(existingSources[0]?.count ?? 0) === 0) {
    for (const category of schema.categoryEnum.enumValues) {
      const list = DEFAULT_STANDARD_SOURCES[category] ?? [];
      for (let i = 0; i < list.length; i++) {
        await db.insert(schema.sources).values({
          name: list[i].name,
          url: list[i].url,
          type: "website",
          category,
          isStandard: true,
          priority: list.length - i,
        });
      }
    }
    console.log("[Seed] Standard-Quellen angelegt.");
  }
}
