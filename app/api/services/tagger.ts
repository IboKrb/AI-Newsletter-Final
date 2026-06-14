/**
 * Auto-Tagging: ergänzt die von der KI gelieferten Tags um deterministische
 * Kanon-Tags anhand erkannter Entitäten/Themen in Titel + Inhalt.
 * Sorgt für konsistente, durchsuchbare Tags in der Bibliothek
 * (z.B. immer "openai", "claude-code", "pdf", "video-editing").
 */

// Map: Kanon-Tag -> Liste von Keywords/Synonymen (lowercase, als Wortteil gesucht)
const TAG_RULES: Record<string, string[]> = {
  openai: ["openai", "gpt-4", "gpt-5", "gpt4", "gpt5", "chatgpt", "o1", "o3", "sora", "dall-e", "dalle"],
  anthropic: ["anthropic", "claude"],
  "claude-code": ["claude code", "claude-code"],
  gemini: ["gemini", "google deepmind", "deepmind"],
  google: ["google", "workspace", "vertex ai"],
  copilot: ["copilot", "github copilot"],
  "github-copilot": ["github copilot"],
  microsoft: ["microsoft", "azure", "bing"],
  meta: ["meta ai", "llama", "facebook ai"],
  mistral: ["mistral", "mixtral"],
  deepseek: ["deepseek"],
  grok: ["grok", "xai", "x.ai"],
  "image-generation": ["midjourney", "stable diffusion", "dall-e", "dalle", "flux", "bildgenerierung", "image generation", "imagen"],
  "video-editing": ["video editing", "videoschnitt", "video-editing", "runway", "pika", "sora", "kling", "capcut", "premiere"],
  video: ["youtube", "video"],
  pdf: ["pdf"],
  audio: ["audio", "whisper", "elevenlabs", "tts", "text-to-speech", "voice"],
  podcast: ["podcast", "spotify", "apple podcasts"],
  rag: ["rag", "retrieval-augmented", "retrieval augmented", "vector db", "embeddings", "pinecone", "weaviate"],
  agent: ["agent", "agentic", "autonom", "multi-agent", "mcp", "model context protocol"],
  llm: ["llm", "large language model", "sprachmodell", "foundation model"],
  "prompt-engineering": ["prompt", "prompt engineering", "few-shot", "chain-of-thought", "chain of thought"],
  coding: ["coding", "developer", "programming", "cursor", "vs code", "ide", "debugging", "refactoring"],
  "open-source": ["open source", "open-source", "huggingface", "hugging face", "github"],
  funding: ["funding", "raised", "series a", "series b", "series c", "series d", "investment", "valuation", "mrd", "milliarden", "billion"],
  regulation: ["regulation", "eu ai act", "ai act", "policy", "datenschutz", "gdpr", "dsgvo"],
  research: ["arxiv", "paper", "benchmark", "research", "studie"],
  robotics: ["robot", "robotik", "humanoid", "boston dynamics"],
  "image-gen": ["midjourney", "stable diffusion", "dall-e"],
};

function normalizeTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Kombiniert KI-Tags mit erkannten Kanon-Tags.
 * @returns normalisierte, deduplizierte Tagliste (max. 10)
 */
export function enrichTags(
  title: string,
  content: string,
  aiTags: string[] = [],
): string[] {
  const haystack = `${title} ${content}`.toLowerCase();
  const result = new Set<string>();

  // 1) KI-Tags normalisieren
  for (const t of aiTags) {
    const norm = normalizeTag(t);
    if (norm.length >= 2) result.add(norm);
  }

  // 2) Kanon-Tags aus Keywords ableiten
  for (const [canonical, keywords] of Object.entries(TAG_RULES)) {
    if (keywords.some((kw) => haystack.includes(kw))) {
      result.add(canonical);
    }
  }

  return Array.from(result).slice(0, 10);
}
