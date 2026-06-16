import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { startWeeklyCronjob, startDailyArchiveJob } from "./services/scheduler";
import { seedDefaults, archiveOldArticles } from "./services/workflow-engine";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// Health-Endpoint (für Coolify-Healthcheck) — vor dem tRPC-Catch-all.
app.get("/health", (c) => c.json({ ok: true, ts: Date.now() }));

app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

// Default-Templates & Standard-Quellen sicherstellen (idempotent).
// Läuft in Dev (via Vite) und Prod; Fehler (z.B. fehlende Tabellen vor db:push)
// werden geloggt, blockieren den Start aber nicht.
void seedDefaults()
  .then(() => archiveOldArticles(7)) // Catch-up: alte Artikel direkt beim Start archivieren
  .catch((err) => {
    console.warn("[Boot] Seed/Archiv übersprungen/fehlgeschlagen:", err instanceof Error ? err.message : err);
  });

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });

  // Wöchentlichen Cronjob starten (liest Planung aus den Einstellungen)
  void startWeeklyCronjob();
  // Täglicher Archivierungs-Job (Artikel > 7 Tage → Bibliothek)
  startDailyArchiveJob();
}
