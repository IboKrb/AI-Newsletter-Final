# AI Newsletter Hub – Workflow & Zyklus

> **Dokument:** Schritt-für-Schritt-Abläufe der Software
> **Autor:** Miraiki
> **Stand:** 30.04.2026

---

## Übersicht: Der wöchentliche Zyklus

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  MONTAG     │ → │  MONTAG     │ → │  MONTAG     │ → │  DIENSTAG   │
│  06:00 Uhr  │    │  06:05 Uhr  │    │  06:10 Uhr  │    │  ab 06:15   │
│             │    │             │    │             │    │             │
│ Cronjob     │    │ KI sucht    │    │ Validierung │    │ Admin kann  │
│ startet     │    │ News        │    │ & Speicherung│   │ veröffentlichen│
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

---

## Workflow 1: Automatische KI-Recherche (wöchentlich)

### Schritt 1: Trigger (Montag, 06:00 Uhr)
**Wer:** Cronjob (automatisch) oder Admin (manuell)

```
┌────────────────────────┐
│  [Cronjob / Admin]     │
│  triggerAiResearch()   │
└──────────┬─────────────┘
           │
           ▼
```

**Code:**
```typescript
// api/services/scheduler.ts
const job = new CronJob("0 6 * * 1", async () => {
  await runAiResearch(isFirstRun);
});
```

---

### Schritt 2: System prüft Durchlauf-Typ
**Wer:** Backend (automatisch)

```
┌────────────────────────┐
│  Prüfe: Gibt es        │
│  bereits Quellen?      │
└──────────┬─────────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐ ┌──────────┐
│  JA     │ │   NEIN   │
│         │ │          │
│ Zweiter │ │ Erster   │
│ Durchlauf│ │ Durchlauf │
└─────────┘ └──────────┘
```

**Logik:**
```typescript
const sourceCount = await db.select({ count: sql`count(*)` }).from(sources);
const isFirstRun = sourceCount[0]?.count === 0;
```

---

### Schritt 3: KI-Call an Kimi API
**Wer:** Backend → Kimi API

```
┌────────────────────────┐       ┌────────────────────────┐
│  Backend (Node.js)      │ ────→ │  Kimi API (OpenAI)     │
│                         │       │                        │
│  POST /chat/completions │       │  1. Recherchiert News  │
│  + System-Prompt        │       │  2. Generiert JSON     │
│  + User-Prompt          │       │  3. Gibt Array zurück  │
└────────────────────────┘       └────────────────────────┘
```

**System-Prompt (Erster Durchlauf):**
```
"Du bist KI-Newsletter-Redakteur. Recherchiere aktuelle KI-News.
Gib NUR JSON zurück. Mindestens 10 Artikel, 4+ Tags pro Artikel."
```

**System-Prompt (Zweiter Durchlauf):**
```
"Bisherige Quellen: [Liste]. Prüfe auf Updates.
Suche auch nach neuen Quellen. Gib NUR JSON zurück."
```

---

### Schritt 4: JSON-Extraktion
**Wer:** Backend (automatisch)

```
┌────────────────────────┐
│  KI-Output (Rohtext)    │
│                         │
│  ```json                │
│  [{"title": "..."}]     │
│  ```                    │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│  extractJson()          │
│                         │
│  1. Regex: ```json ... │
│  2. Oder plain JSON     │
│  3. Parse mit JSON.parse│
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│  Parsed JSON (Array)    │
│  [{...}, {...}]         │
└────────────────────────┘
```

---

### Schritt 5: Validierung (Zod-Schema)
**Wer:** Backend (automatisch)

```
┌────────────────────────┐
│  validateArticleArray() │
│                         │
│  Prüft jedes Objekt:    │
│  • title: 5-500 chars  │
│  • summary: 20-2000    │
│  • content: 50-10000   │
│  • category: enum       │
│  • tags: min 4, max 10  │
│  • sourceUrl: URL      │
│  • relevanceScore: 0-100│
└──────────┬─────────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐ ┌──────────┐
│  ✅ OK   │ │   ❌ FEHLER  │
│         │ │          │
│ Weiter  │ │ Retry (max 3x)│
│         │ │ Sonst: Skip  │
└─────────┘ └──────────┘
```

---

### Schritt 6: Dublettenprüfung
**Wer:** Backend (automatisch)

```
┌────────────────────────┐
│  hashContent()           │
│                         │
│  SHA-256 von:           │
│  "url:title"            │
│                         │
│  z.B.:                  │
│  "techcrunch.com/...:OpenAI plant..." │
│  → a3f7c2...            │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│  isDuplicate(hash)      │
│                         │
│  SELECT * FROM articles │
│  WHERE content_hash = ?│
└──────────┬─────────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐ ┌──────────┐
│  NEIN   │ │   JA     │
│         │ │          │
│ Speichern│ │ Überspringen │
└─────────┘ └──────────┘
```

---

### Schritt 7: Quellen-Tracking
**Wer:** Backend (automatisch)

```
┌────────────────────────┐
│  Quelle bekannt?        │
│  (SELECT FROM sources)  │
└──────────┬─────────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐ ┌──────────┐
│  JA     │ │   NEIN   │
│         │ │          │
│ Update  │ │ INSERT   │
│ lastUsedAt│ │ neue Quelle │
└─────────┘ └──────────┘
           │
           ▼
┌────────────────────────┐
│  sourceId = ?          │
│  (für Artikel-Zuordnung)│
└────────────────────────┘
```

---

### Schritt 8: Artikel speichern
**Wer:** Backend → MySQL

```
┌────────────────────────┐       ┌────────────────────────┐
│  Backend                │ ────→ │  MySQL                │
│                         │       │                       │
│  INSERT INTO articles   │       │  articles             │
│  (title, summary,       │       │  ├── id               │
│   content, category,    │       │  ├── sourceId         │
│   tags, sourceName,     │       │  ├── title            │
│   sourceUrl, contentHash│       │  ├── summary          │
│   status: "draft")      │       │  ├── content          │
│                         │       │  ├── category         │
│  + sourceId (FK)        │       │  ├── tags (JSON)      │
│  + aiModel, aiProcessedAt│      │  ├── sourceName       │
│                         │       │  ├── sourceUrl        │
│                         │       │  ├── contentHash      │
│                         │       │  ├── status: "draft"  │
│                         │       │  ├── relevanceScore   │
│                         │       │  ├── aiModel          │
│                         │       │  └── aiProcessedAt    │
└────────────────────────┘       └────────────────────────┘
```

---

### Schritt 9: Job-Status aktualisieren
**Wer:** Backend → MySQL

```
┌────────────────────────┐
│  Job-Tracking           │
│                         │
│  UPDATE jobs            │
│  SET status = "completed"│
│  completedAt = NOW()    │
│  resultSummary = JSON({  │
│    articlesFound: 12,   │
│    articlesSaved: 10,   │
│    duplicatesSkipped: 2 │
│  })                     │
└────────────────────────┘
```

---

### Schritt 10: Fertig! Artikel sind als "Draft" in der DB
**Status:** Artikel haben `status: "draft"` → müssen noch veröffentlicht werden

---

## Workflow 2: Admin-Veröffentlichung

### Schritt 1: Admin öffnet Dashboard
**Wer:** Admin-User

```
┌────────────────────────┐
│  Browser                │
│                         │
│  /admin                 │
│  (nur für role=admin)   │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│  Admin-Dashboard        │
│                         │
│  [Artikel-Tab]         │
│  [Jobs-Tab]            │
│                         │
│  Tabelle zeigt:         │
│  • Alle Draft-Artikel   │
│  • Mit Filter: Status   │
└────────────────────────┘
```

---

### Schritt 2: Admin bearbeitet Artikel (optional)
**Wer:** Admin-User

```
┌────────────────────────┐
│  Klickt auf Edit-Icon   │
│  (Bleistift)            │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│  Edit-Dialog            │
│                         │
│  • Titel bearbeiten     │
│  • Summary anpassen     │
│  • Content korrigieren  │
│  • Kategorie wählen     │
│  • Status ändern        │
│                         │
│  [Speichern]            │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│  updateArticle()        │
│  → DB-Update            │
└────────────────────────┘
```

---

### Schritt 3: Admin veröffentlicht Artikel
**Wer:** Admin-User

```
┌────────────────────────┐
│  Status ändern auf      │
│  "published"            │
│  ODER:                  │
│  Artikel zu Issue       │
│  zuordnen               │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│  assignArticlesToIssue() │
│                         │
│  UPDATE articles        │
│  SET status = "published"│
│  issueId = 5             │
│  WHERE id IN (1,2,3)    │
└────────────────────────┘
```

---

### Schritt 4: Neue Issue wird veröffentlicht
**Wer:** Admin-User

```
┌────────────────────────┐
│  publishIssue()         │
│                         │
│  UPDATE newsletterIssues│
│  SET isPublished = TRUE │
│  WHERE id = 5           │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│  Ab jetzt ist diese     │
│  Issue die "Latest"     │
│  auf der Homepage       │
└────────────────────────┘
```

---

## Workflow 3: Nutzer besucht Homepage

### Schritt 1: Nutzer öffnet /
**Wer:** Normaler Besucher

```
┌────────────────────────┐
│  Browser                │
│  GET /                  │
└──────────┬─────────────┘
           │
           ▼
```

---

### Schritt 2: Frontend lädt aktuelle Issue
**Wer:** React + tRPC

```
┌────────────────────────┐       ┌────────────────────────┐
│  Frontend (React)       │ ────→ │  Backend (tRPC)        │
│                         │       │                        │
│  trpc.newsletter.       │       │  getLatest()             │
│    getLatest.useQuery() │       │  → SELECT * FROM       │
│                         │       │    newsletterIssues     │
│                         │       │    WHERE isPublished=1  │
│                         │       │    ORDER BY issueNumber  │
│                         │       │    DESC LIMIT 1         │
└────────────────────────┘       └────────────────────────┘
```

---

### Schritt 3: Alle Sections laden Content
**Wer:** React + tRPC (parallel)

```
┌────────────────────────┐
│  getIssueContent({     │
│    issueId: aktuelleId  │
│  })                     │
│                         │
│  Lädt parallel:         │
│  ├── news (7 Artikel)   │
│  ├── tools (5 Empfehl.) │
│  ├── prompts (1 Prompt) │
│  ├── tutorials (1 Guide)│
│  ├── podcasts (2 Folgen) │
│  ├── videos (2 Videos)  │
│  ├── reads (3 Artikel)  │
│  └── imageGen (2 Train.)│
└────────────────────────┘
```

---

### Schritt 4: Nutzer sieht aktuelle News
**Anzeige:** Landingpage mit allen 10 Sections

```
┌────────────────────────┐
│  [Navbar]               │
├────────────────────────┤
│  [HeroSection]          │
│  → Issue #1, Subscribe  │
├────────────────────────┤
│  [NewsSection]          │
│  → 7 KI-News als Cards  │
├────────────────────────┤
│  [ToolsSection]         │
│  → 5 Tool-Empfehlungen  │
├────────────────────────┤
│  ... (weitere Sections) │
├────────────────────────┤
│  [Footer]               │
└────────────────────────┘
```

---

## Workflow 4: Nutzer nutzt Bibliothek

### Schritt 1: Nutzer öffnet /library
**Wer:** Normaler Besucher

```
┌────────────────────────┐
│  Browser                │
│  /library               │
└──────────┬─────────────┘
           │
           ▼
```

---

### Schritt 2: Nutzer sucht / filtert
**Wer:** Normaler Besucher

```
┌────────────────────────┐
│  [Suchfeld]             │
│  "gemini"               │
│                         │
│  [Kategorie-Filter]     │
│  "tools"                │
│                         │
│  [Tag-Filter]           │
│  "bildgenerierung"      │
│                         │
│  [Suchen]               │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐       ┌────────────────────────┐
│  Frontend               │ ────→ │  Backend               │
│                         │       │                        │
│  searchArticles({       │       │  SELECT * FROM articles│
│    query: "gemini",     │       │  WHERE status="published"│
│    category: "tools",    │       │    AND (title LIKE ?    │
│    tags: ["bildgen"]     │       │         OR summary LIKE?│
│  })                     │       │         OR content LIKE?)│
│                         │       │    AND category = ?     │
│                         │       │    AND tags LIKE ?      │
│                         │       │  ORDER BY relevanceScore│
│                         │       │  LIMIT 20 OFFSET 0      │
└────────────────────────┘       └────────────────────────┘
```

---

### Schritt 3: Ergebnisse werden angezeigt
**Anzeige:** Artikel-Karten mit Paginierung

```
┌────────────────────────┐
│  "15 Artikel gefunden"  │
├────────────────────────┤
│  ┌─────┐ ┌─────┐      │
│  │Card │ │Card │ ...  │
│  │ #1  │ │ #2  │      │
│  │Gemini│ │DALL-E│     │
│  │Bild │ │Tool │      │
│  │Gen  │ │Review│     │
│  └─────┘ └─────┘      │
├────────────────────────┤
│  [← Seite 1 von 2 →]  │
└────────────────────────┘
```

---

### Schritt 4: Nutzer klickt auf Artikel
**Wer:** Normaler Besucher

```
┌────────────────────────┐
│  Klickt auf Card        │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│  [Dialog öffnet sich]   │
│                         │
│  • Titel                │
│  • Kategorie-Badge      │
│  • Quelle               │
│  • Volltext             │
│  • Tags                 │
│  • Datum                │
│  • [Original lesen] →   │
│    sourceUrl            │
└────────────────────────┘
```

---

## Workflow 5: Erstmaliger Login (Kimi OAuth)

### Schritt 1: Nutzer klickt "Login"
**Wer:** Besucher

```
┌────────────────────────┐
│  [Login-Button]         │
│  /login                 │
└──────────┬─────────────┘
           │
           ▼
```

---

### Schritt 2: Weiterleitung zu Kimi OAuth
**Wer:** Browser → Kimi Auth Server

```
┌────────────────────────┐       ┌────────────────────────┐
│  Browser                │ ────→ │  Kimi OAuth Server    │
│                         │       │                        │
│  GET /api/oauth/        │       │  Login-Seite anzeigen  │
│    authorize            │       │  "Sign in with Kimi"   │
│                         │       │                        │
│  Params:                │       │  Nutzer gibt           │
│  • client_id            │       │  Credentials ein       │
│  • redirect_uri         │       │                        │
│  • scope=profile        │       │  → Autorisierung       │
└────────────────────────┘       └────────────────────────┘
```

---

### Schritt 3: Callback mit Code
**Wer:** Kimi → Backend

```
┌────────────────────────┐       ┌────────────────────────┐
│  Kimi OAuth             │ ────→ │  Backend (Hono)         │
│                         │       │                        │
│  GET /api/oauth/        │       │  createOAuthCallback() │
│    callback             │       │                        │
│                         │       │  • code aus Query      │
│  Query Params:          │       │  • state validieren    │
│  • code=abc123          │       │  • Token tauschen      │
│  • state=xyz789         │       │  • Profil laden        │
└────────────────────────┘       │  • User in DB speichern │
                                 │  • Session-JWT signieren│
                                 │  • Cookie setzen         │
                                 └────────────────────────┘
```

---

### Schritt 4: Session-Cookie wird gesetzt
**Wer:** Backend → Browser

```
┌────────────────────────┐
│  HTTP-Response          │
│                         │
│  Set-Cookie:            │
│  kimi_sid=eyJhbG...     │
│  HttpOnly               │
│  Secure                 │
│  SameSite=Lax           │
│  Max-Age=365 Tage       │
│                         │
│  + Redirect zu /        │
└────────────────────────┘
```

---

### Schritt 5: Nutzer ist eingeloggt
**Wer:** Browser

```
┌────────────────────────┐
│  [Navbar zeigt User]    │
│                         │
│  • Avatar               │
│  • Name                 │
│  • Premium-Badge (falls)│
│  • Admin-Link (falls)   │
│                         │
│  trpc.auth.me()         │
│  → Cookie wird          │
│    automatisch          │
│    mitgesendet          │
└────────────────────────┘
```

---

## Zusammenfassung: Alle Workflows im Überblick

```
┌─────────────────────────────────────────────────────────┐
│                    DER GESAMTE ZYKLUS                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │ CRONJOB  │ →  │ KI-SUCHE │ →  │ VALIDIER.│          │
│  │ (Mo 6:00)│    │ (Kimi)   │    │ (Zod)    │          │
│  └──────────┘    └──────────┘    └──────────┘          │
│       │                                 │               │
│       │              ┌──────────────────┘               │
│       │              ▼                                  │
│  ┌────┴─────┐    ┌──────────┐    ┌──────────┐          │
│  │ DUBLETTEN│ →  │ SPEICHERN│ →  │ JOB-DONE │          │
│  │ (SHA256) │    │ (MySQL)  │    │ (Log)    │          │
│  └──────────┘    └──────────┘    └──────────┘          │
│                                                          │
│  ┌────────────────────────────────────────────┐          │
│  │         ADMIN DASHBOARD (/admin)            │          │
│  │                                            │          │
│  │  • Artikel bearbeiten                      │          │
│  │  • Status: draft → published               │          │
│  │  • Zu Issue zuordnen                       │          │
│  │  • Issue veröffentlichen                   │          │
│  └────────────────────────────────────────────┘          │
│                                                          │
│  ┌────────────────────────────────────────────┐          │
│  │         NUTZER-INTERAKTION                  │          │
│  │                                            │          │
│  │  / (Home) → Aktuelle Issue anzeigen        │          │
│  │  /library → Suche + Filter                 │          │
│  │  /login   → Kimi OAuth                     │          │
│  └────────────────────────────────────────────┘          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

*Workflow-Dokumentation erstellt am 30.04.2026*
*Autor: Miraiki*
*Projekt: AI Newsletter Hub – Uni-Projekt*
