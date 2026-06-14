import { eq } from "drizzle-orm";
import { getDb } from "../queries/connection";
import { settings } from "@db/schema";
import { env } from "../lib/env";

/**
 * Settings-Service: Key-Value-Store in der DB mit Fallback auf .env.
 * Erlaubt das Eingeben des Gemini-Tokens & Modells direkt in der Admin-UI,
 * ohne Neustart/Redeploy.
 */

export type SettingKey =
  | "ai_api_key"
  | "ai_model"
  | "ai_base_url"
  | "ai_grounding_enabled"
  | "test_mode"
  | "cron_enabled"
  | "cron_day"
  | "cron_hour";

const ENV_FALLBACK: Record<SettingKey, string> = {
  ai_api_key: env.aiApiKey,
  ai_model: env.aiModel,
  ai_base_url: env.aiBaseUrl,
  ai_grounding_enabled: "true",
  test_mode: env.isTestMode ? "true" : "false",
  // Wöchentlicher Auto-Lauf: standardmäßig Montag (1) um 06:00 Uhr
  cron_enabled: "true",
  cron_day: "1",
  cron_hour: "6",
};

export async function getSetting(key: SettingKey): Promise<string> {
  const db = getDb();
  const rows = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  const value = rows[0]?.value;
  if (value !== undefined && value !== null && value !== "") return value;
  return ENV_FALLBACK[key] ?? "";
}

export async function setSetting(key: SettingKey, value: string): Promise<void> {
  const db = getDb();
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
}

export interface AiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  grounding: boolean;
  testMode: boolean;
}

export async function getAiConfig(): Promise<AiConfig> {
  const [apiKey, baseUrl, model, grounding, testMode] = await Promise.all([
    getSetting("ai_api_key"),
    getSetting("ai_base_url"),
    getSetting("ai_model"),
    getSetting("ai_grounding_enabled"),
    getSetting("test_mode"),
  ]);
  return {
    apiKey,
    baseUrl,
    model,
    grounding: grounding === "true",
    testMode: testMode === "true",
  };
}

export interface CronConfig {
  enabled: boolean;
  day: number; // 0=So, 1=Mo … 6=Sa
  hour: number; // 0-23
}

export async function getCronConfig(): Promise<CronConfig> {
  const [enabled, day, hour] = await Promise.all([
    getSetting("cron_enabled"),
    getSetting("cron_day"),
    getSetting("cron_hour"),
  ]);
  const d = parseInt(day, 10);
  const h = parseInt(hour, 10);
  return {
    enabled: enabled === "true",
    day: Number.isFinite(d) ? Math.min(6, Math.max(0, d)) : 1,
    hour: Number.isFinite(h) ? Math.min(23, Math.max(0, h)) : 6,
  };
}

/** Maskiert den API-Key für die Anzeige (z.B. "AIza…wXyz"). */
export function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

/** Liefert die Settings für die UI (API-Key maskiert). */
export async function getPublicSettings() {
  const [cfg, cron] = await Promise.all([getAiConfig(), getCronConfig()]);
  return {
    hasApiKey: !!cfg.apiKey,
    apiKeyMasked: maskKey(cfg.apiKey),
    model: cfg.model,
    baseUrl: cfg.baseUrl,
    grounding: cfg.grounding,
    testMode: cfg.testMode,
    cronEnabled: cron.enabled,
    cronDay: cron.day,
    cronHour: cron.hour,
  };
}
