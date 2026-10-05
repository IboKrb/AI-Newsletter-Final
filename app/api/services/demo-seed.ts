import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "../queries/connection";
import * as schema from "@db/schema";
import { env } from "../lib/env";
import { getSetting } from "./settings";
import { enrichTags } from "./tagger";
import { hashContent } from "./dedupe";
import { CATEGORY_LABELS } from "./workflow-engine";
import {
  DEMO_ARTICLES,
  DEMO_BATCH,
  DEMO_EXTRA_DISCOVERED,
  DEMO_RATE_LIMIT_ERROR,
  DEMO_ROTATING_SOURCES,
  type DemoRunPlan,
} from "./demo-data";

/**
 * Demo-Daten für den öffentlichen Demo-Zugang: kuratierte Artikel aller Kategorien
 * plus Durchläufe (inkl. Quellen & Logs), wie sie die echte Engine erzeugt.
 * Läuft einmalig pro DEMO_SEED_VERSION und lässt vorhandene Daten unangetastet.
 */

type Category = (typeof schema.categoryEnum.enumValues)[number];
type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
type RunStatus = (typeof schema.workflowRunStatusEnum.enumValues)[number];
type SourceKind = (typeof schema.runSourceKindEnum.enumValues)[number];

const DEMO_SEED_VERSION = "1";
const DEMO_AI_MODEL = "gemini-3.1-flash-lite";
const SEC = 1000;
const HOUR = 60 * 60 * SEC;

const hostname = (url: string) => new URL(url).hostname.replace(/^www\./, "");

async function ensureSource(tx: Tx, name: string, url: string, category: Category, lastUsedAt: Date) {
  const [existing] = await tx
    .select({ id: schema.sources.id })
    .from(schema.sources)
    .where(eq(schema.sources.url, url))
    .limit(1);
  if (existing) return existing.id;
  const [row] = await tx
    .insert(schema.sources)
    .values({ name, url, type: "website", category, lastUsedAt })
    .returning({ id: schema.sources.id });
  return row.id;
}

/** Legt einen Lauf samt geplanter/entdeckter Quellen, Logs und Artikeln an. */
async function insertRun(
  tx: Tx,
  opts: {
    plan: DemoRunPlan;
    template: { id: number | null; name: string };
    createdAt: Date;
    startedAt: Date;
    saveArticles: boolean;
    /** Bezugszeitpunkt für die Erscheinungsdaten der Artikel */
    publishedBase?: Date;
  },
) {
  const { plan, template, createdAt, startedAt, saveArticles, publishedBase = startedAt } = opts;
  const { category } = plan;
  const reps = plan.repetitions ?? 1;
  const failed = new Set(plan.failedReps ?? []);
  const finishedAt = new Date(startedAt.getTime() + plan.durationSec * SEC);
  const articles = saveArticles ? DEMO_ARTICLES[category] : [];
  const saved = articles.length;
  const dupes = saveArticles ? plan.duplicates : 0;
  const status: RunStatus =
    failed.size === 0 ? "completed" : failed.size === reps ? "failed" : "partial";

  // Geplante Quellen: Standard (wie die Engine, max. 5) + Rotations-Pool
  const standard = await tx
    .select({ name: schema.sources.name, url: schema.sources.url })
    .from(schema.sources)
    .where(
      and(
        eq(schema.sources.category, category),
        eq(schema.sources.isStandard, true),
        eq(schema.sources.isActive, true),
      ),
    )
    .orderBy(desc(schema.sources.priority))
    .limit(5);
  const rotating = DEMO_ROTATING_SOURCES[category] ?? [];
  for (const s of rotating) await ensureSource(tx, s.name, s.url, category, startedAt);

  const discovered = saveArticles
    ? [...new Set([...articles.map((a) => a.sourceUrl), ...(DEMO_EXTRA_DISCOVERED[category] ?? [])])]
    : [];
  const successRep = reps; // die letzte Wiederholung liefert die Ergebnisse

  const [run] = await tx
    .insert(schema.workflowRuns)
    .values({
      templateId: template.id,
      templateName: template.name,
      category,
      status,
      repetitionsTotal: reps,
      repetitionsDone: reps,
      progressPercent: 100,
      articlesFound: saved + dupes,
      articlesSaved: saved,
      duplicatesSkipped: dupes,
      triggeredBy: "manual",
      startedAt,
      finishedAt,
      durationMs: plan.durationSec * SEC,
      createdAt,
    })
    .returning({ id: schema.workflowRuns.id });

  const runSources: { name: string; url: string; kind: SourceKind; repetition: number | null }[] = [
    ...standard.map((s) => ({ ...s, kind: "standard" as const, repetition: null })),
    ...rotating.map((s) => ({ ...s, kind: "rotating" as const, repetition: null })),
    ...discovered.map((url) => ({ name: hostname(url), url, kind: "discovered" as const, repetition: successRep })),
  ];
  if (runSources.length > 0) {
    await tx
      .insert(schema.workflowRunSources)
      .values(runSources.map((s) => ({ ...s, runId: run.id, createdAt: startedAt })));
  }

  // Logs mit denselben Texten wie die echte Engine, über die Laufzeit verteilt
  const at = (fraction: number) => new Date(startedAt.getTime() + plan.durationSec * SEC * fraction);
  const logs: (typeof schema.workflowRunLogs.$inferInsert)[] = [
    {
      runId: run.id,
      level: "info",
      message: `Lauf gestartet — ${reps}× "${template.name}" (${category})`,
      createdAt: at(0),
    },
  ];
  for (let rep = 1; rep <= reps; rep++) {
    const repStart = (rep - 1) / reps;
    const repEnd = rep / reps - 0.02;
    logs.push({
      runId: run.id,
      repetition: rep,
      level: "progress",
      message: `Wiederholung ${rep}/${reps} läuft…`,
      createdAt: at(repStart + 0.01),
    });
    if (failed.has(rep)) {
      logs.push({
        runId: run.id,
        repetition: rep,
        level: "error",
        message: `Wiederholung ${rep} fehlgeschlagen: ${DEMO_RATE_LIMIT_ERROR}`,
        createdAt: at(repEnd),
      });
    } else {
      const found = saved + dupes;
      logs.push({
        runId: run.id,
        repetition: rep,
        level: "success",
        message: `Wiederholung ${rep}: ${saved} neue Artikel gespeichert (${found} gefunden), ${discovered.length} Web-Quellen.`,
        metadata: JSON.stringify({ found, saved, sources: discovered.length }),
        createdAt: at(repEnd),
      });
    }
  }
  logs.push({
    runId: run.id,
    level: status === "failed" ? "error" : "success",
    message: `Lauf abgeschlossen: ${saved} Artikel gespeichert, ${dupes} Duplikate übersprungen (Status: ${status}).`,
    createdAt: finishedAt,
  });
  await tx.insert(schema.workflowRunLogs).values(logs);

  // Artikel: wie von der Engine gespeichert (Quelle im Rotations-Pool, Auto-Tags).
  // Erscheinungsdaten gestaffelt, sodass die jeweils wichtigsten Beiträge (News zuerst) oben stehen.
  const categoryRank = schema.categoryEnum.enumValues.indexOf(category);
  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    const savedAt = new Date(finishedAt.getTime() - (articles.length - i) * 1.5 * SEC);
    const sourceId = await ensureSource(tx, a.sourceName, a.sourceUrl, category, savedAt);
    await tx
      .insert(schema.articles)
      .values({
        sourceId,
        title: a.title,
        content: a.content,
        summary: a.summary,
        category,
        tags: JSON.stringify(enrichTags(a.title, a.content, a.tags)),
        sourceName: a.sourceName,
        sourceUrl: a.sourceUrl,
        imageUrl: a.imageUrl,
        publishedAt: new Date(publishedBase.getTime() - (i * 6 + categoryRank * 0.5 + 1) * HOUR),
        contentHash: hashContent(a.sourceUrl, a.title),
        status: a.status ?? "published",
        relevanceScore: a.relevanceScore,
        aiModel: DEMO_AI_MODEL,
        aiProcessedAt: savedAt,
        createdAt: savedAt,
      })
      .onConflictDoNothing({ target: schema.articles.contentHash });
  }

  return finishedAt;
}

export async function seedDemoData(): Promise<void> {
  if (!env.demoEnabled) return;
  if ((await getSetting("demo_seed_version")) === DEMO_SEED_VERSION) return;

  const db = getDb();
  const templates = await db
    .select({ id: schema.workflowTemplates.id, name: schema.workflowTemplates.name, category: schema.workflowTemplates.category })
    .from(schema.workflowTemplates)
    .orderBy(asc(schema.workflowTemplates.id));
  const templateFor = (category: Category) => {
    const t = templates.find((x) => x.category === category);
    return t ?? { id: null, name: `${CATEGORY_LABELS[category]} — Wöchentliche Recherche` };
  };

  const now = Date.now();

  await db.transaction(async (tx) => {
    // Älterer Lauf, der am Gemini-Ratenlimit scheitert (zeigt Fehler-Monitoring)
    const failedStart = new Date(now - 72 * HOUR);
    await insertRun(tx, {
      plan: { category: "image_gen", durationSec: 96, duplicates: 0, failedReps: [1] },
      template: templateFor("image_gen"),
      createdAt: failedStart,
      startedAt: failedStart,
      saveArticles: false,
    });

    // „Alle ausführen“ vor ~26 h: Läufe werden nacheinander abgearbeitet (Warteschlange)
    const batchStart = now - 26 * HOUR;
    let cursor = new Date(batchStart + SEC);
    for (let i = 0; i < DEMO_BATCH.length; i++) {
      const plan = DEMO_BATCH[i];
      const finishedAt = await insertRun(tx, {
        plan,
        template: templateFor(plan.category),
        createdAt: new Date(batchStart + i * 200),
        startedAt: cursor,
        saveArticles: true,
        publishedBase: new Date(batchStart),
      });
      cursor = new Date(finishedAt.getTime() + 2 * SEC);
    }

    await tx
      .insert(schema.settings)
      .values({ key: "demo_seed_version", value: DEMO_SEED_VERSION })
      .onConflictDoUpdate({ target: schema.settings.key, set: { value: DEMO_SEED_VERSION } });
  });

  console.log("[Seed] Demo-Daten angelegt (Artikel, Durchläufe, Quellen).");
}
