import { CronJob } from "cron";
import { runAllActiveTemplates } from "./workflow-engine";

/**
 * Startet den wöchentlichen Cronjob.
 * Montag 06:00 Uhr (Europe/Berlin) — führt alle aktiven Workflow-Templates aus.
 */
export function startWeeklyCronjob() {
  const job = new CronJob(
    "0 6 * * 1", // Jeden Montag um 06:00
    async () => {
      console.log("[Cron] Wöchentliche KI-Recherche gestartet…");
      try {
        const runIds = await runAllActiveTemplates("cron");
        console.log(`[Cron] ${runIds.length} Workflow-Läufe gestartet:`, runIds);
      } catch (err) {
        console.error("[Cron] Fehler:", err);
      }
    },
    null,
    true,
    "Europe/Berlin",
  );

  console.log("[Scheduler] Wöchentlicher Cronjob aktiviert (Mo 06:00, Europe/Berlin)");
  return job;
}
