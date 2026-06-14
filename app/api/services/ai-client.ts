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
    const blockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (blockMatch) {
      try {
        return JSON.parse(blockMatch[1]);
      } catch {
        /* weiter zum Fallback */
      }
    }
    const plainMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (plainMatch) {
      return JSON.parse(plainMatch[1]);
    }
    throw new Error("Kein gültiges JSON in der KI-Antwort gefunden");
  }

  protected async fetchWithRetry(
    url: string,
    options: { method: string; headers: Record<string, string>; body: string },
    maxRetries = 3,
  ): Promise<{ statusCode: number; body: string }> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(url, {
          method: options.method,
          headers: options.headers,
          body: options.body,
        });
        const responseBody = await res.text();
        const statusCode = res.status;

        if (statusCode >= 400) {
          // 4xx (außer 429) sind nicht retry-bar
          if (statusCode !== 429 && statusCode < 500) {
            throw new Error(`API ${statusCode}: ${responseBody.slice(0, 400)}`);
          }
          throw new Error(`API ${statusCode} (retry): ${responseBody.slice(0, 200)}`);
        }
        return { statusCode, body: responseBody };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const nonRetryable = /API 4\d\d:/.test(lastError.message);
        if (nonRetryable || attempt >= maxRetries) break;
        const delay = Math.min(1000 * 2 ** attempt, 10000);
        await new Promise((r) => setTimeout(r, delay));
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

    const { body } = await this.fetchWithRetry(`${this.baseUrl}/chat/completions`, {
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
    });

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

    const { body } = await this.fetchWithRetry(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = JSON.parse(body) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        groundingMetadata?: {
          groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
          webSearchQueries?: string[];
        };
      }>;
      error?: { message?: string };
    };

    if (data.error) {
      throw new Error(`Gemini API Fehler: ${data.error.message ?? "unbekannt"}`);
    }

    const candidate = data.candidates?.[0];
    const content = candidate?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!content) throw new Error("Gemini lieferte leeren Inhalt");

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

// ── Mock-Daten ─────────────────────────────────────────────────────
function generateMockArticles(theme: string): unknown[] {
  const rnd = Math.floor(Math.random() * 9000) + 1000;
  const base = (overrides: Record<string, unknown>) => ({
    category: theme,
    tags: ["openai", "llm", "ki", "release"],
    publishedAt: "2026-06-10T10:00:00Z",
    relevanceScore: 80 + Math.floor(Math.random() * 20),
    ...overrides,
  });

  const data: Record<string, unknown[]> = {
    news: [
      base({
        title: `OpenAI kündigt GPT-5.5 mit verbessertem Reasoning an (#${rnd})`,
        summary: "Das neue Modell erreicht Spitzenwerte in wissenschaftlichen Benchmarks und ist ab sofort für Enterprise-Kunden verfügbar.",
        content: "OpenAI hat heute GPT-5.5 vorgestellt. Das multimodale Modell verarbeitet Text, Bild und Audio und erreicht 95% menschlicher Leistung in MMLU. Der Preis liegt bei 0,02 USD pro 1K Tokens.",
        tags: ["openai", "gpt-5", "multimodal", "release", "llm"],
        sourceName: "TechCrunch",
        sourceUrl: `https://techcrunch.com/2026/06/openai-gpt55-${rnd}`,
      }),
      base({
        title: `DeepSeek-V4 schlägt Claude bei Mathe-Benchmarks (#${rnd})`,
        summary: "Das Open-Source-Modell erreicht 91% auf MATH-500 zu einem Bruchteil der Kosten.",
        content: "DeepSeek hat V4 veröffentlicht. Es übertrifft Claude bei MATH-500 und kostet nur 0,002 USD pro 1K Tokens. Verfügbar auf Hugging Face.",
        tags: ["deepseek", "open-source", "research", "benchmark", "llm"],
        sourceName: "VentureBeat",
        sourceUrl: `https://venturebeat.com/2026/06/deepseek-v4-${rnd}`,
      }),
    ],
    tools: [
      base({
        title: `Devin for Terminal: Autonomer Coding-Agent im CLI (#${rnd})`,
        summary: "Cognition Labs bringt Devin als Terminal-Tool — schreibt, testet und debuggt Code vollautomatisch.",
        content: "Devin for Terminal läuft direkt in der Kommandozeile, klont Repos, schreibt Code und behebt Bugs. Preis: 50 USD/Monat.",
        tags: ["devin", "agent", "coding", "cli"],
        sourceName: "Product Hunt",
        sourceUrl: `https://producthunt.com/devin-terminal-${rnd}`,
      }),
    ],
    prompts: [
      base({
        title: `Der 'World-Class Expert' Prompt für Analysen (#${rnd})`,
        summary: "Role-Playing + strukturierte Perspektiven für konsultative Spitzenqualität.",
        content: "Dieser Prompt nutzt Role-Playing und erzwungenes Format. Ideal für Strategie und Due Diligence.",
        tags: ["prompt-engineering", "analyse", "strategie", "llm"],
        sourceName: "PromptHero",
        sourceUrl: `https://prompthero.com/expert-${rnd}`,
      }),
    ],
    tutorials: [
      base({
        title: `RAG-Systeme von Grund auf bauen (#${rnd})`,
        summary: "Schritt-für-Schritt Guide für Retrieval-Augmented Generation.",
        content: "Dokumente chunken, Embeddings erstellen, Vector-DB einrichten, Retrieval-Chain bauen. Code auf GitHub.",
        tags: ["rag", "tutorial", "embeddings", "llm"],
        sourceName: "FreeCodeCamp",
        sourceUrl: `https://freecodecamp.org/rag-${rnd}`,
      }),
    ],
    podcasts: [
      base({
        title: `Latent Space: Developer Productivity (#${rnd})`,
        summary: "Swyx und Alessio sprechen über Claude Code und Devin.",
        content: "Episode über die Zukunft des AI-Assisted Coding mit Anthropic Engineers.",
        tags: ["podcast", "claude-code", "agent", "coding"],
        sourceName: "Spotify",
        sourceUrl: `https://open.spotify.com/latentspace-${rnd}`,
      }),
    ],
    videos: [
      base({
        title: `Claude Code Tutorial 2026 — Complete Guide (#${rnd})`,
        summary: "Von Plan Mode über Subagents bis Custom Skills.",
        content: "42-minütiges Tutorial über Claude Code: Plan Mode, Subagents, MCP-Integration.",
        tags: ["claude-code", "video", "tutorial", "coding"],
        sourceName: "YouTube",
        sourceUrl: `https://youtube.com/watch?v=cc-${rnd}`,
      }),
    ],
    reads: [
      base({
        title: `10 Things That Matter in AI Right Now (#${rnd})`,
        summary: "MIT Technology Review zur Lage der KI: World Models, Agent Orchestration.",
        content: "Die jährliche Liste: World Models, Agent Orchestration, Multimodal Reasoning, AI Safety.",
        tags: ["research", "trends", "agent", "llm"],
        sourceName: "MIT Technology Review",
        sourceUrl: `https://technologyreview.com/10-things-${rnd}`,
      }),
    ],
    image_gen: [
      base({
        title: `Photography Approach: Fotorealistische AI-Bilder (#${rnd})`,
        summary: "Kamera-Parameter + Licht-Setup für professionelle Ergebnisse.",
        content: "Spezifiziere Kamera-Body, Objektiv, Blende und Lichtquelle für fotorealistische Midjourney-Bilder.",
        tags: ["image-generation", "midjourney", "prompt-engineering", "photography"],
        sourceName: "Midjourney Community",
        sourceUrl: `https://midjourney.com/photography-${rnd}`,
      }),
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
