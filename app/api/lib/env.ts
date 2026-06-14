import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

export const env = {
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  adminPassword: required("ADMIN_PASSWORD"),
  sessionSecret: required("SESSION_SECRET"),
  // ── KI-API (OPTIONAL — kann auch in der Admin-UI gesetzt werden) ──
  aiApiKey: process.env.AI_API_KEY ?? "",
  aiBaseUrl: process.env.AI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta",
  aiModel: process.env.AI_MODEL || "gemini-2.5-flash",
  // ── Debug/Test Modus ──
  isTestMode: process.env.TEST_MODE === "true",
};

// Logging beim Start
if (process.env.NODE_ENV !== "test") {
  console.log("🔐 Umgebungsvariablen geladen:", {
    DATABASE_URL: env.databaseUrl.substring(0, 50) + "...",
    AI_API_KEY: env.aiApiKey ? env.aiApiKey.substring(0, 20) + "..." : "NICHT GESETZT",
    AI_BASE_URL: env.aiBaseUrl,
    AI_MODEL: env.aiModel,
    NODE_ENV: process.env.NODE_ENV,
    TEST_MODE: env.isTestMode ? "🟢 AKTIV" : "🔴 AUS",
  });
}
