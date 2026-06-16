import { CronJob } from "cron";
import { runAllActiveTemplates, archiveOldArticles } from "./workflow-engine";

/**
 * Täglicher Job (05:00 Europe/Berlin): Artikel älter als 7 Tage archivieren.
 * → verschwinden von der Startseite, bleiben in der Bibliothek.
 */
export function startDailyArchiveJob() {
  const job = new CronJob(
    "0 5 * * *",
    async () => {
      try {
        const n = await archiveOldArticles(7);
        console.log(`[Cron] Archivierung: ${n} Artikel auf 'archived' gesetzt.`);
      } catch (err) {
        console.error("[Cron] Archivierung fehlgeschlagen:", err);
      }
    },
    null,
    true,
    "Europe/Berlin",
  );
  console.log("[Scheduler] Täglicher Archivierungs-Job aktiv (05:00, Europe/Berlin)");
  return job;
}
import { getCronConfig } from "./settings";

let currentJob: CronJob | null = null;

/**
 * Startet (oder erneuert) den wöchentlichen Cronjob anhand der Einstellungen.
 * Kann zur Laufzeit erneut aufgerufen werden, wenn der Admin die Planung ändert.
 */
export async function startWeeklyCronjob(): Promise<CronJob | null> {
  const { enabled, day, hour } = await getCronConfig();

  // Vorhandenen Job stoppen
  if (currentJob) {
    currentJob.stop();
    currentJob = null;
  }

  if (!enabled) {
    console.log("[Scheduler] Wöchentlicher Auto-Lauf ist deaktiviert.");
    return null;
  }

  const cronExpr = `0 ${hour} * * ${day}`; // Minute 0, Stunde, jeden Tag, jeden Monat, Wochentag
  currentJob = new CronJob(
    cronExpr,
    async () => {
      // Zur Sicherheit beim Auslösen erneut prüfen (falls zwischenzeitlich deaktiviert)
      const cfg = await getCronConfig();
      if (!cfg.enabled) return;
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

  console.log(`[Scheduler] Wöchentlicher Cron aktiv (Ausdruck "${cronExpr}", Europe/Berlin)`);
  return currentJob;
}

/** Alias zum erneuten Anwenden der Planung nach einer Settings-Änderung. */
export const restartWeeklyCronjob = startWeeklyCronjob;
