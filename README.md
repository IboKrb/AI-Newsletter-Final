# AI Newsletter Hub

Ein KI-gestützter Newsletter, der sich selbst recherchiert: Jede Woche durchsucht **Google Gemini** mit Live-Websuche (Grounding) aktuelle Quellen zu KI-News, Tools, Prompts, Tutorials, Podcasts, Videos, Lesenswertem und Bildgenerierung. Die Ergebnisse werden geprüft, dedupliziert, verschlagwortet und auf der Website veröffentlicht. Ein Redaktions-Dashboard steuert und überwacht die gesamte Pipeline.

**Live:** https://ai-newsletter.ima-dev.de · **Demo-Dashboard (ohne Login, nur Lesen):** https://ai-newsletter.ima-dev.de/demo

## Was man in der Demo sieht

Beim ersten Besuch startet ein **Klick-Guide**, der durch alle Bereiche führt:

| Bereich | Inhalt |
|---|---|
| Übersicht | Kennzahlen und die letzten Recherche-Läufe |
| Artikel | Alle KI-recherchierten Beiträge mit Status (Entwurf → veröffentlicht → archiviert) |
| Workflows | Ein Recherche-Auftrag pro Kategorie, mit editierbaren Prompts und Konfiguration |
| Board | Die Pipeline als Ablaufdiagramm (ähnlich wie n8n) mit dem Status eines Laufs |
| Durchläufe | Protokoll jeder Ausführung: genutzte und entdeckte Quellen, Logs, Fehler (z. B. API-Ratenlimit) |
| Quellen | Standard-Quellen und ein selbst wachsender Rotations-Pool |
| Einstellungen | Gemini-Anbindung, Modellwahl, Web-Grounding, automatischer Wochenlauf |

Der Demo-Zugang ist serverseitig schreibgeschützt. Speichern, Löschen und Workflow-Starts werden abgelehnt.

## Pipeline

```
Scheduler (Cron / manuell)
  → Standard- + rotierende Quellen
  → Gemini-Recherche mit Web-Grounding (N Wiederholungen, Warteschlange + Retry bei 429/503)
  → Schema-Validierung & Dubletten-Check (Content-Hash)
  → Auto-Tagging · Vorschaubild (og:image / YouTube) · Link-Check
  → Speichern (Entwurf oder Auto-Publish) → nach 7 Tagen automatisch ins Archiv
```

## Tech-Stack

React 19 · TypeScript · Vite · Tailwind/shadcn-ui · tRPC · Hono · PostgreSQL · Drizzle ORM · Google Gemini API · Docker / Coolify

## Lokal starten & deployen

- Lokales Setup: [SETUP-LOKAL.md](SETUP-LOKAL.md)
- Deployment (Docker Compose / Coolify): [DEPLOY-COOLIFY.md](DEPLOY-COOLIFY.md)

Mit `DEMO_MODE=true` (Standard) sind der Demo-Zugang unter `/demo` und einmalig angelegte Demo-Daten aktiv. `DEMO_MODE=false` schaltet beides ab.
