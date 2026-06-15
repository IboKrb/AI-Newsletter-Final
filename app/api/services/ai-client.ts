import { getAiConfig, type AiConfig } from "./settings";

/**
 * Eine erkannte Quelle aus dem KI-Lauf (z.B. via Google-Search-Grounding).
 */
export interface GroundingSource {
  name: string;
  url: string;
}

/**
 * Ergebnis eines Research-Calls: roher Text + tatsächlich genutzte Web-Quellen.
 */
export interface AiResearchResult {
  content: string;
  groundingSources: GroundingSource[];
  searchQueries: string[];
}

export interface ResearchOptions {
  grounding?: boolean;
  temperature?: number;
}

/**
 * Globale Serialisierung + Mindestabstand für echte KI-Aufrufe.
 * Verhindert, dass parallele Läufe (z.B. "Alle ausführen") das
 * Gemini-Free-Tier-Ratenlimit (429) sofort sprengen.
 */
const MIN_AI_INTERVAL_MS = 6000;
let aiQueue: Promise<unknown> = Promise.resolve();
let lastAiCallAt = 0;

function rateLimited<T>(fn: () => Promise<T>): Promise<T> {
  const run = aiQueue.then(async () => {
    const wait = MIN_AI_INTERVAL_MS - (Date.now() - lastAiCallAt);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    try {
      return await fn();
    } finally {
      lastAiCallAt = Date.now();
    }
  });
  aiQueue = run.catch(() => undefined);
  return run;
}

/**
 * Repariert in JSON-Strings enthaltene rohe Steuerzeichen (echte Zeilenumbrüche,
 * Tabs etc.), die `JSON.parse` sonst mit "Bad control character" abbrechen lassen.
 */
function sanitizeJsonControlChars(s: string): string {
  let out = "";
  let inStr = false;
  let esc = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const code = s.charCodeAt(i);
    if (inStr) {
      if (esc) { out += c; esc = false; continue; }
      if (c === "\\") { out += c; esc = true; continue; }
      if (c === '"') { out += c; inStr = false; continue; }
      if (code < 0x20) {
        out += c === "\n" ? "\\n" : c === "\r" ? "\\r" : c === "\t" ? "\\t" : "\\u" + code.toString(16).padStart(4, "0");
        continue;
      }
      out += c;
    } else {
      if (c === '"') { inStr = true; }
      out += c;
    }
  }
  return out;
}

/**
 * Abstrakter KI-Provider. Unterstützt Google Gemini (mit Web-Grounding),
 * OpenAI-kompatible APIs und einen Mock-Provider für lokale Tests.
 */
abstract class AiProvider {
  protected apiKey: string;
  protected baseUrl: string;
  protected model: string;

  constructor(apiKey: string, baseUrl: string, model: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.model = model;
  }

  abstract research(
    userPrompt: string,
    systemPrompt: string | undefined,
    opts?: ResearchOptions,
  ): Promise<AiResearchResult>;

  /** Bequemer Wrapper, wenn nur der Text gebraucht wird. */
  async chatCompletion(
    userPrompt: string,
    systemPrompt?: string,
    temperature = 0.7,
  ): Promise<string> {
    const res = await this.research(userPrompt, systemPrompt, { grounding: false, temperature });
    return res.content;
  }

  /** Extrahiert JSON aus einem (ggf. mit Prosa umgebenen) KI-Text. */
  extractJson(text: string): unknown {
    const candidates: string[] = [];
    const blockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (blockMatch) candidates.push(blockMatch[1]);
    const plainMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (plainMatch) candidates.push(plainMatch[1]);
    candidates.push(text);

    for (const c of candidates) {
      try {
        return JSON.parse(c);
      } catch {
        // Zweiter Versuch: rohe Steuerzeichen in Strings escapen
        try {
          return JSON.parse(sanitizeJsonControlChars(c));
        } catch {
          /* nächster Kandidat */
        }
      }
    }
    throw new Error("Kein gültiges JSON in der KI-Antwort gefunden");
  }

  protected async fetchWithRetry(
    url: string,
    options: { method: string; headers: Record<string, string>; body: string },
    maxRetries = 4,
  ): Promise<{ statusCode: number; body: string }> {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const expDelay = (attempt: number) =>
      Math.min(3000 * 2 ** (attempt - 1), 24000) + Math.floor(Math.random() * 1500);
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 90000); // 90s Request-Timeout
      try {
        const res = await fetch(url, {
          method: options.method,
          headers: options.headers,
          body: options.body,
          signal: ctrl.signal,
        });
        const body = await res.text();

        if (res.status < 400) return { statusCode: res.status, body };

        // 4xx außer 429 = nicht retry-bar
        if (res.status !== 429 && res.status < 500) {
          throw new Error(`API ${res.status}: ${body.slice(0, 400)}`);
        }
        // 429 / 5xx (z.B. 503 "high demand") = retry-bar
        lastError = new Error(`API ${res.status} (retry): ${body.slice(0, 200)}`);
        if (attempt >= maxRetries) break;

        let delay = expDelay(attempt);
        if (res.status === 429) {
          // Googles vorgeschlagene Wartezeit respektieren (retryDelay: "26s")
          const m = body.match(/"retryDelay":\s*"(\d+(?:\.\d+)?)s"/);
          if (m) delay = Math.min(Math.ceil(parseFloat(m[1]) * 1000) + 500, 50000);
        }
        await sleep(delay);
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        if (/API 4\d\d:/.test(e.message)) throw e; // nicht retry-bar
        lastError = e; // Netzwerkfehler / Timeout
        if (attempt >= maxRetries) break;
        await sleep(expDelay(attempt));
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError ?? new Error("Unbekannter KI-Fehler nach Retries");
  }
}

/**
 * OpenAI-kompatibler Provider (Kimi, OpenAI, etc.).
 * Hinweis: Kein natives Web-Grounding — die `grounding`-Option wird ignoriert.
 */
class OpenAiCompatibleProvider extends AiProvider {
  async research(
    userPrompt: string,
    systemPrompt?: string,
    opts: ResearchOptions = {},
  ): Promise<AiResearchResult> {
    const messages = [
      ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
      { role: "user" as const, content: userPrompt },
    ];

    const { body } = await rateLimited(() =>
      this.fetchWithRetry(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: opts.temperature ?? 0.7,
          max_tokens: 8192,
        }),
      }),
    );

    const data = JSON.parse(body) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("KI-API lieferte leeren Inhalt");
    return { content, groundingSources: [], searchQueries: [] };
  }
}

/**
 * Google Gemini Provider mit optionalem Google-Search-Grounding.
 * Bei aktivem Grounding recherchiert das Modell echte Web-Quellen und
 * liefert sie in `groundingMetadata` zurück.
 */
class GeminiProvider extends AiProvider {
  async research(
    userPrompt: string,
    systemPrompt?: string,
    opts: ResearchOptions = {},
  ): Promise<AiResearchResult> {
    const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;

    const requestBody: Record<string, unknown> = {
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: opts.temperature ?? 0.7,
        maxOutputTokens: 8192,
      },
    };

    if (systemPrompt) {
      requestBody.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    // Web-Grounding aktivieren (Gemini 2.x: google_search Tool).
    // Achtung: responseMimeType=application/json ist mit Tools NICHT erlaubt
    // -> JSON wird aus dem Text extrahiert.
    if (opts.grounding) {
      requestBody.tools = [{ google_search: {} }];
    }

    const { body } = await rateLimited(() =>
      this.fetchWithRetry(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }),
    );

    const data = JSON.parse(body) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        finishReason?: string;
        groundingMetadata?: {
          groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
          webSearchQueries?: string[];
        };
      }>;
      promptFeedback?: { blockReason?: string };
      error?: { message?: string };
    };

    if (data.error) {
      throw new Error(`Gemini API Fehler: ${data.error.message ?? "unbekannt"}`);
    }

    const candidate = data.candidates?.[0];
    const content = candidate?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!content) {
      const reason = candidate?.finishReason ?? data.promptFeedback?.blockReason ?? "unbekannt";
      throw new Error(`Gemini lieferte leeren Inhalt (Grund: ${reason})`);
    }

    const groundingSources: GroundingSource[] = [];
    for (const chunk of candidate?.groundingMetadata?.groundingChunks ?? []) {
      if (chunk.web?.uri) {
        groundingSources.push({
          name: chunk.web.title || chunk.web.uri,
          url: chunk.web.uri,
        });
      }
    }
    const searchQueries = candidate?.groundingMetadata?.webSearchQueries ?? [];

    return { content, groundingSources, searchQueries };
  }
}

/**
 * Mock-Provider für lokale Tests ohne echte KI-API (TEST_MODE=true).
 */
class MockAiProvider extends AiProvider {
  async research(
    userPrompt: string,
    systemPrompt?: string,
  ): Promise<AiResearchResult> {
    const full = `${userPrompt} ${systemPrompt ?? ""}`;
    const promptLower = full.toLowerCase();
    // Bevorzugt die explizite Zielkategorie aus dem JSON-Schema ("category": "X").
    const known = ["news", "tools", "prompts", "tutorials", "podcasts", "videos", "reads", "image_gen"];
    let theme = "news";
    const explicit = full.match(/"category"\s*:\s*"([a-z_]+)"/i);
    if (explicit && known.includes(explicit[1])) {
      theme = explicit[1];
    } else if (promptLower.includes("tool") || promptLower.includes("producthunt")) theme = "tools";
    else if (promptLower.includes("prompt")) theme = "prompts";
    else if (promptLower.includes("tutorial")) theme = "tutorials";
    else if (promptLower.includes("podcast")) theme = "podcasts";
    else if (promptLower.includes("video")) theme = "videos";
    else if (promptLower.includes("read") || promptLower.includes("article")) theme = "reads";
    else if (promptLower.includes("image") || promptLower.includes("bild")) theme = "image_gen";

    await new Promise((r) => setTimeout(r, 500 + Math.random() * 800));

    const articles = generateMockArticles(theme);
    return {
      content: JSON.stringify({ articles }),
      groundingSources: [
        { name: "TechCrunch (Mock)", url: "https://techcrunch.com/" },
        { name: "The Verge (Mock)", url: "https://www.theverge.com/" },
      ],
      searchQueries: [`${theme} ai news this week`],
    };
  }

  extractJson(text: string): unknown {
    return JSON.parse(text);
  }
}

// ── Mock-Daten (echte Homepage-URLs, garantierte Vorschaubilder, ≥3/Kategorie) ──
function generateMockArticles(theme: string): unknown[] {
  const recent = (d: number) => new Date(Date.now() - d * 86400000).toISOString();
  const img = (seed: string) => `https://picsum.photos/seed/${seed}/600/400`;
  const base = (o: Record<string, unknown>) => ({
    category: theme,
    relevanceScore: 78 + Math.floor(Math.random() * 22),
    ...o,
  });

  const data: Record<string, unknown[]> = {
    news: [
      base({ title: "OpenAI kündigt GPT-5.5 mit verbessertem Reasoning an", summary: "Das neue Modell erreicht Spitzenwerte in wissenschaftlichen Benchmarks und ist ab sofort für Enterprise-Kunden verfügbar.", content: "OpenAI hat GPT-5.5 vorgestellt. Das multimodale Modell verarbeitet Text, Bild und Audio und erreicht 95% menschlicher Leistung in MMLU.", tags: ["openai", "gpt-5", "multimodal", "release", "llm"], sourceName: "TechCrunch", sourceUrl: "https://techcrunch.com/category/artificial-intelligence/", imageUrl: img("gpt55"), publishedAt: recent(1) }),
      base({ title: "DeepSeek-V4 schlägt Claude bei Mathe-Benchmarks", summary: "Das Open-Source-Modell erreicht 91% auf MATH-500 zu einem Bruchteil der Kosten.", content: "DeepSeek hat V4 veröffentlicht. Es übertrifft Claude bei MATH-500 und kostet nur 0,002 USD pro 1K Tokens. Verfügbar auf Hugging Face.", tags: ["deepseek", "open-source", "research", "benchmark", "llm"], sourceName: "VentureBeat", sourceUrl: "https://venturebeat.com/category/ai/", imageUrl: img("deepseek4"), publishedAt: recent(2) }),
      base({ title: "EU AI Act 2.0: Verschärfte Regeln für Foundation Models", summary: "Die überarbeitete Verordnung fordert Transparenzberichte für große Modelle.", content: "Die EU hat den AI Act 2.0 verabschiedet. Modelle über 10 Mrd. Parametern müssen Transparenzberichte veröffentlichen und Sicherheitstests durchlaufen.", tags: ["eu-ai-act", "regulation", "policy", "llm"], sourceName: "The Verge", sourceUrl: "https://www.theverge.com/ai-artificial-intelligence", imageUrl: img("euaiact"), publishedAt: recent(3) }),
    ],
    tools: [
      base({ title: "Devin for Terminal: Autonomer Coding-Agent im CLI", summary: "Cognition Labs bringt Devin als Terminal-Tool — schreibt, testet und debuggt Code vollautomatisch.", content: "Devin for Terminal läuft direkt in der Kommandozeile, klont Repos, schreibt Code und behebt Bugs. Preis: 50 USD/Monat.", tags: ["devin", "agent", "coding", "cli"], sourceName: "Product Hunt", sourceUrl: "https://www.producthunt.com/topics/artificial-intelligence", imageUrl: img("devin"), publishedAt: recent(1) }),
      base({ title: "Cursor 2.0: KI-Editor mit Multi-Agenten", summary: "Der KI-Code-Editor kann jetzt mehrere Aufgaben parallel von Agenten erledigen lassen.", content: "Cursor 2.0 führt parallele Agenten ein, die Features eigenständig umsetzen, Tests schreiben und Reviews vorbereiten.", tags: ["cursor", "editor", "agent", "coding"], sourceName: "GitHub", sourceUrl: "https://github.com/trending", imageUrl: img("cursor2"), publishedAt: recent(2) }),
      base({ title: "Perplexity Labs: Recherche-Workflows automatisieren", summary: "Neues Tool bündelt Web-Recherche, Analyse und Report-Erstellung.", content: "Perplexity Labs erlaubt es, mehrstufige Recherche-Workflows zu definieren und als Report zu exportieren.", tags: ["perplexity", "recherche", "automation", "tool"], sourceName: "There's An AI For That", sourceUrl: "https://theresanaiforthat.com/", imageUrl: img("pplxlabs"), publishedAt: recent(3) }),
    ],
    prompts: [
      base({ title: "Der 'World-Class Expert' Prompt für Analysen", summary: "Role-Playing + strukturierte Perspektiven für konsultative Spitzenqualität.", content: "Dieser Prompt nutzt Role-Playing und erzwungenes Format. Ideal für Strategie und Due Diligence.", tags: ["prompt-engineering", "analyse", "strategie", "llm"], sourceName: "PromptHero", sourceUrl: "https://prompthero.com/", imageUrl: img("expertprompt"), publishedAt: recent(2) }),
      base({ title: "Chain-of-Thought für komplexe Mathe-Aufgaben", summary: "Schritt-für-Schritt-Denken erzwingt bessere Ergebnisse.", content: "Mit 'Löse Schritt für Schritt und überprüfe das Ergebnis' steigt die Genauigkeit bei Logik- und Mathe-Aufgaben deutlich.", tags: ["chain-of-thought", "reasoning", "prompt-engineering", "llm"], sourceName: "r/PromptEngineering", sourceUrl: "https://www.reddit.com/r/PromptEngineering/", imageUrl: img("cot"), publishedAt: recent(4) }),
      base({ title: "Die ultimative Bild-Prompt-Formel", summary: "Kamera-Parameter + Licht + Stil-Referenzen für fotorealistische Bilder.", content: "Kombiniere Kamera (Sony α7), Objektiv (85mm, f/1.4), Licht (golden hour) und Stil für überzeugende Ergebnisse.", tags: ["image-generation", "midjourney", "prompt-engineering", "photography"], sourceName: "Awesome ChatGPT Prompts", sourceUrl: "https://github.com/f/awesome-chatgpt-prompts", imageUrl: img("imgformula"), publishedAt: recent(5) }),
    ],
    tutorials: [
      base({ title: "RAG-Systeme von Grund auf bauen", summary: "Schritt-für-Schritt Guide für Retrieval-Augmented Generation.", content: "Dokumente chunken, Embeddings erstellen, Vector-DB einrichten, Retrieval-Chain bauen. Code auf GitHub.", tags: ["rag", "tutorial", "embeddings", "llm"], sourceName: "freeCodeCamp", sourceUrl: "https://www.freecodecamp.org/news/", imageUrl: img("ragtut"), publishedAt: recent(2) }),
      base({ title: "Claude Projects: Wissensbasis richtig nutzen", summary: "200K-Token-Kontext optimal ausschöpfen.", content: "Projektstruktur anlegen, Knowledge Base befüllen, mit Claude Code synchronisieren und Prompt-Patterns wiederverwenden.", tags: ["claude", "tutorial", "knowledge-base", "anthropic"], sourceName: "Dev.to", sourceUrl: "https://dev.to/t/ai", imageUrl: img("claudeproj"), publishedAt: recent(3) }),
      base({ title: "LLMs mit LoRA feintunen", summary: "Praxis-Guide für günstiges Fine-Tuning.", content: "Dataset vorbereiten, LoRA-Config setzen, mit Hugging Face trainieren und evaluieren — ab ca. 5 USD pro Epoch.", tags: ["fine-tuning", "lora", "tutorial", "llm"], sourceName: "YouTube", sourceUrl: "https://www.youtube.com/results?search_query=lora+fine+tuning", imageUrl: img("lora"), publishedAt: recent(5) }),
    ],
    podcasts: [
      base({ title: "Latent Space: Developer Productivity", summary: "Swyx und Alessio sprechen über Claude Code und Devin.", content: "Episode über die Zukunft des AI-Assisted Coding mit Anthropic Engineers.", tags: ["podcast", "claude-code", "agent", "coding"], sourceName: "Latent Space", sourceUrl: "https://www.latent.space/", imageUrl: img("latentspace"), publishedAt: recent(4) }),
      base({ title: "TWIML: Data Poisoning & KI-Sicherheit", summary: "Sam Charrington diskutiert den Schutz von Trainingsdaten.", content: "Gespräch über Nightshade, Data Poisoning, Copyright und die technischen Hintergründe.", tags: ["podcast", "security", "research", "ki"], sourceName: "The TWIML AI Podcast", sourceUrl: "https://twimlai.com/podcast/", imageUrl: img("twiml"), publishedAt: recent(6) }),
      base({ title: "AI Engineer: Agentic Workflows in Produktion", summary: "Wie autonome Agenten im Unternehmen eingesetzt werden.", content: "Harrison Chase und Jerry Liu über ReAct, Tool-Use und Multi-Agent-Systeme im Praxiseinsatz.", tags: ["podcast", "agent", "workflows", "langchain"], sourceName: "Spotify", sourceUrl: "https://open.spotify.com/", imageUrl: img("aieng"), publishedAt: recent(7) }),
    ],
    videos: [
      base({ title: "Claude Code Tutorial 2026 — Complete Guide", summary: "Von Plan Mode über Subagents bis Custom Skills.", content: "42-minütiges Tutorial über Claude Code: Plan Mode, Subagents, MCP-Integration.", tags: ["claude-code", "video", "tutorial", "coding"], sourceName: "YouTube", sourceUrl: "https://www.youtube.com/watch?v=gVsjjUIbE9k", imageUrl: img("ccvideo"), publishedAt: recent(2) }),
      base({ title: "Einen AI-Agenten in Python bauen", summary: "Schritt-für-Schritt-Coding-Tutorial für einen autonomen Agenten.", content: "OpenAI-API-Setup, Tool-Definition, ReAct-Loop, Memory und Fehlerbehandlung — Code auf GitHub.", tags: ["ai-agent", "python", "video", "tutorial"], sourceName: "YouTube", sourceUrl: "https://www.youtube.com/watch?v=agent-python", imageUrl: img("agentpy"), publishedAt: recent(4) }),
      base({ title: "Vision-Modelle erklärt: CLIP, DINOv2, SAM", summary: "Die wichtigsten Computer-Vision-Modelle 2026.", content: "Architektur, Training und Use-Cases von CLIP, DINOv2 und SAM verständlich erklärt.", tags: ["vision", "video", "research", "ki"], sourceName: "YouTube", sourceUrl: "https://www.youtube.com/watch?v=vision-models", imageUrl: img("vision"), publishedAt: recent(6) }),
    ],
    reads: [
      base({ title: "10 Things That Matter in AI Right Now", summary: "MIT Technology Review zur Lage der KI: World Models, Agent Orchestration.", content: "Die jährliche Liste: World Models, Agent Orchestration, Multimodal Reasoning, AI Safety.", tags: ["research", "trends", "agent", "llm"], sourceName: "MIT Technology Review", sourceUrl: "https://www.technologyreview.com/", imageUrl: img("mit10"), publishedAt: recent(5) }),
      base({ title: "Vier KI-Research-Trends für Enterprise-Teams", summary: "Continual Learning, Memory-Architekturen, Nested Learning, Agenten.", content: "VentureBeat analysiert vier Trends mit konkreten Anwendungsfällen für Unternehmen.", tags: ["enterprise", "research", "trends", "agent"], sourceName: "VentureBeat", sourceUrl: "https://venturebeat.com/category/ai/", imageUrl: img("4trends"), publishedAt: recent(7) }),
      base({ title: "Mastering AI Prompts: 10 bewährte Techniken", summary: "Von Photography Approach bis Weighted Control.", content: "Zehn Techniken für bessere Bildgenerierung mit Beispielen für Midjourney, DALL-E und Stable Diffusion.", tags: ["image-generation", "prompt-engineering", "reads", "midjourney"], sourceName: "Substack", sourceUrl: "https://substack.com/", imageUrl: img("masterprompts"), publishedAt: recent(8) }),
    ],
    image_gen: [
      base({ title: "Photography Approach: Fotorealistische AI-Bilder", summary: "Kamera-Parameter + Licht-Setup für professionelle Ergebnisse.", content: "Spezifiziere Kamera-Body, Objektiv, Blende und Lichtquelle für fotorealistische Midjourney-Bilder.", tags: ["image-generation", "midjourney", "prompt-engineering", "photography"], sourceName: "Midjourney", sourceUrl: "https://www.midjourney.com/showcase", imageUrl: img("photoapproach"), publishedAt: recent(3) }),
      base({ title: "Fantasy World Builder mit Künstler-Referenzen", summary: "Epische Szenen über Stil-Referenzen bekannter Künstler.", content: "Künstler-Namen als Shortcut für Stil, Stimmung und Komposition — plus atmosphärische Layer.", tags: ["image-generation", "fantasy", "midjourney", "stil"], sourceName: "Civitai", sourceUrl: "https://civitai.com/", imageUrl: img("fantasy"), publishedAt: recent(5) }),
      base({ title: "Character Consistency über mehrere Bilder", summary: "Gleiche Figur in Bildserien beibehalten.", content: "Seed-Locking, Referenzbilder, exakte Beschreibungen und Negative Prompting für konsistente Charaktere.", tags: ["image-generation", "character", "midjourney", "technik"], sourceName: "DALL-E Blog", sourceUrl: "https://openai.com/", imageUrl: img("charconsist"), publishedAt: recent(6) }),
    ],
  };
  return data[theme] ?? data.news;
}

/**
 * Factory: erzeugt den passenden Provider anhand der aktuellen Settings (DB → env).
 * Wird PRO Aufruf gelesen, damit ein in der UI eingegebener Key sofort wirkt.
 */
export async function getAiClient(): Promise<AiProvider> {
  const cfg: AiConfig = await getAiConfig();

  if (cfg.testMode) {
    return new MockAiProvider(cfg.apiKey || "mock-key", cfg.baseUrl, cfg.model || "mock");
  }

  if (!cfg.apiKey) {
    throw new Error(
      "Kein KI-API-Key gesetzt. Bitte in den Admin-Einstellungen einen Gemini-Token eintragen (oder TEST_MODE aktivieren).",
    );
  }

  const isGemini =
    cfg.baseUrl.includes("googleapis") || cfg.baseUrl.includes("generativelanguage");

  return isGemini
    ? new GeminiProvider(cfg.apiKey, cfg.baseUrl, cfg.model || "gemini-2.5-flash")
    : new OpenAiCompatibleProvider(cfg.apiKey, cfg.baseUrl, cfg.model);
}

export type { AiProvider };
