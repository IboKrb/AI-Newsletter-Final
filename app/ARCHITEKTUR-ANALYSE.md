# AI-Newsletter – Architekturanalyse & Implementierungsplan

> **Erstellt:** 29.04.2026 | **Autor:** Mira Jr | **Projekt:** AI-Newsletter Uni-Projekt

---

## 1. Ist-Analyse

### 1.1 Tech Stack (unverändert beibehalten)

| Layer | Technologie | Status |
|-------|-------------|--------|
| Frontend | React 19 + TypeScript + Vite 7 + Tailwind CSS 3.4 + shadcn/ui | ✅ Produktionsreif |
| Backend | Hono 4 + tRPC 11 + Drizzle ORM 0.45 | ✅ Produktionsreif |
| Datenbank | MySQL 8 (via mysql2, Planetscale-Mode) | ✅ Produktionsreif |
| Auth | Kimi OAuth 2.0 + Session-JWT-Cookies | ✅ Produktionsreif |
| State | TanStack Query + tRPC Client | ✅ Produktionsreif |
| Build | Vite (Frontend) + esbuild (API) | ✅ Produktionsreif |
| Container | Docker (node:20-alpine, Multi-Stage) | ✅ Produktionsreif |
| Tests | Vitest | ⚠️ Konfiguriert, wenig Tests |

### 1.2 Projektstruktur

```
app/
├── api/                    # Backend (Hono + tRPC)
│   ├── auth-router.ts      # Auth-Endpunkte (me, logout)
│   ├── newsletter-router.ts # Newsletter-CRUD + Queries
│   ├── router.ts           # tRPC-App-Router
│   ├── middleware.ts       # publicQuery / authedQuery / adminQuery
│   ├── context.ts          # TrpcContext (req, resHeaders, user)
│   ├── boot.ts             # Hono-App-Einstieg + Dev/Prod-Server
│   ├── kimi/               # Kimi-OAuth-Integration
│   │   ├── auth.ts         # OAuth-Callback, Token-Exchange, Session-Mgmt
│   │   ├── platform.ts     # Kimi Open Platform API-Wrapper
│   │   ├── session.ts      # JWT-Sign/Verify für Sessions
│   │   └── types.ts        # Token-Typen
│   ├── lib/                # Utilities
│   │   ├── cookies.ts      # Cookie-Optionen (secure, httpOnly, sameSite)
│   │   ├── env.ts          # Environment-Variablen-Loader
│   │   ├── http.ts         # HTTP-Utilities
│   │   └── vite.ts         # Static-File-Serving (Prod)
│   └── queries/            # DB-Queries
│       ├── connection.ts   # Drizzle-Instanz (Singleton)
│       └── users.ts        # User-Queries (findByUnionId, upsert)
├── contracts/              # Shared Types/Konstanten (Frontend + Backend)
│   ├── constants.ts        # Session.cookieName, ErrorMessages, Paths
│   ├── errors.ts           # Error-Factory
│   └── types.ts            # Shared TypeScript-Typen
├── db/                     # Datenbank
│   ├── schema.ts           # Drizzle-Schema (11 Tabellen)
│   ├── relations.ts        # Drizzle-Relations
│   └── migrations/         # Migrationen (.gitkeep)
├── src/                    # Frontend
│   ├── components/         # UI-Komponenten
│   │   ├── ui/             # 40+ shadcn/ui Komponenten
│   │   ├── Navbar.tsx      # Navigation + Auth-Status
│   │   ├── Footer.tsx      # Footer
│   │   ├── AuthLayout.tsx  # Auth-Guard-Layout
│   │   └── AuthLayoutSkeleton.tsx
│   ├── sections/           # Page-Sections (10 Stück)
│   │   ├── HeroSection.tsx
│   │   ├── NewsSection.tsx
│   │   ├── ToolsSection.tsx
│   │   ├── PromptSection.tsx
│   │   ├── ImageGenSection.tsx
│   │   ├── TutorialSection.tsx
│   │   ├── PodcastSection.tsx
│   │   ├── VideoSection.tsx
│   │   ├── ReadSection.tsx
│   │   └── PricingSection.tsx
│   ├── pages/              # Routen
│   │   ├── Home.tsx        # Landingpage (alle Sections)
│   │   ├── Login.tsx       # OAuth-Redirect
│   │   └── NotFound.tsx
│   ├── hooks/              # Custom Hooks
│   │   ├── useAuth.ts      # Auth-Status, Logout, Redirect
│   │   └── use-mobile.ts   # Mobile-Breakpoint
│   ├── providers/          # Context-Provider
│   │   └── trpc.tsx        # tRPC-Client + QueryClient
│   ├── data/               # Statische Demo-Daten
│   │   └── staticData.ts   # Issue #1 komplett
│   ├── App.tsx             # React Router
│   ├── main.tsx            # Entry Point
│   ├── const.ts            # Frontend-Konstanten
│   └── index.css           # Global Styles
├── public/assets/          # Statische Bilder
├── .env.example            # Env-Template
├── Dockerfile              # Multi-Stage Docker
├── vite.config.ts          # Vite-Konfiguration
├── tailwind.config.js      # Tailwind-Theme
├── drizzle.config.ts       # Drizzle-Kit-Config
├── tsconfig.*.json         # TypeScript-Configs
└── package.json            # Dependencies + Scripts
```

### 1.3 Bestehende Datenbank-Schema

**11 Tabellen – komplett und produktionsreif:**

| Tabelle | Primärzweck | Foreign Keys |
|---------|-------------|--------------|
| `users` | OAuth-User-Verwaltung | – |
| `newsletter_issues` | Ausgaben-Verwaltung | – |
| `news_items` | KI-News-Artikel | `issueId` → `newsletter_issues` |
| `tool_recommendations` | AI-Tool-Empfehlungen | `issueId` → `newsletter_issues` |
| `prompt_recommendations` | Prompt der Woche | `issueId` → `newsletter_issues` |
| `tutorials` | Deep-Dive Tutorials | `issueId` → `newsletter_issues` |
| `podcasts` | Podcast-Empfehlungen | `issueId` → `newsletter_issues` |
| `videos` | YouTube-Video-Empfehlungen | `issueId` → `newsletter_issues` |
| `reads` | Read of the Week | `issueId` → `newsletter_issues` |
| `image_gen_trainings` | Image-Gen Prompt-Training | `issueId` → `newsletter_issues` |
| `subscribers` | E-Mail-Abonnenten | – |

**Wichtige Felder pro Tabelle:**
- `users`: `id`, `unionId` (unique), `name`, `email`, `avatar`, `role` (user/admin), `tier` (free/premium), timestamps
- `newsletter_issues`: `id`, `issueNumber` (unique), `title`, `slug` (unique), `publishDate`, `isPublished`, `tier`, `summary`, timestamps
- Content-Tabellen (news_items, tool_recommendations, etc.): `id`, `issueId`, titel/beschreibung/felder je Typ, `createdAt`
- `subscribers`: `id`, `email` (unique), `name`, `tier`, `isActive`, `preferences` (JSON), timestamps

### 1.4 Bestehende API-Endpunkte (tRPC)

**Auth Router:**
- `auth.me` – Authed-Query, gibt aktuellen User zurück
- `auth.logout` – Authed-Mutation, löscht Session-Cookie

**Newsletter Router (Öffentlich):**
- `getLatest` – Letzte veröffentlichte Issue
- `getBySlug` – Issue nach Slug
- `listIssues` – Alle veröffentlichten Issues
- `getIssueContent` – Vollständiger Issue-Inhalt (alle 8 Content-Typen parallel)
- `subscribe` – E-Mail-Abonnement speichern

**Newsletter Router (Admin):**
- `createIssue`, `publishIssue` – Issue-Management
- `addNews`, `addTool`, `addPrompt`, `addTutorial`, `addPodcast`, `addVideo`, `addRead`, `addImageGen` – Content-CRUD

### 1.5 Authentifizierung & Auth-Flow

**Kimi OAuth 2.0 + OpenID Connect:**
1. Nutzer klickt Login → Redirect zu `https://auth.kimi.com/api/oauth/authorize`
2. Callback auf `/api/oauth/callback` mit `code` + `state`
3. Backend tauscht `code` gegen `access_token` + `refresh_token`
4. `access_token` wird via JWKS (`https://auth.kimi.com/api/.well-known/jwks.json`) verifiziert
5. User-Profil von Kimi Open Platform geholt
6. `upsertUser` in DB (automatisch `role: "admin"` für `OWNER_UNION_ID`)
7. Eigenes Session-JWT signiert (Payload: `{ unionId, clientId }`)
8. Cookie `kimi_sid` gesetzt (httpOnly, secure, sameSite, maxAge: 365 Tage)

**Middleware-Chain:**
```
publicQuery   → keine Auth
authedQuery   → publicQuery + requireAuth (Session valid)
adminQuery    → authedQuery + requireRole("admin")
```

### 1.6 Frontend-Architektur

**Routing (React Router 7):**
| Route | Page | Auth |
|-------|------|------|
| `/` | Home | Öffentlich |
| `/login` | Login | Öffentlich |
| `*` | NotFound | Öffentlich |

**Home-Page Sections (10 Stück):**
Jede Section nutzt das gleiche Pattern:
1. tRPC-Query für aktuelle Issue-Daten
2. Falls API-Daten vorhanden → API-Daten anzeigen
3. Falls API leer → `staticData.ts` als Fallback

**Data-Flow:**
```
HeroSection    → trpc.newsletter.getLatest.useQuery()           + staticIssue fallback
NewsSection    → trpc.newsletter.getIssueContent.useQuery()     + staticNews fallback
ToolsSection   → trpc.newsletter.getIssueContent.useQuery()     + staticTools fallback
PromptSection  → trpc.newsletter.getIssueContent.useQuery()     + staticPrompt fallback
ImageGenSection → trpc.newsletter.getIssueContent.useQuery()    + staticImageGens fallback
TutorialSection → trpc.newsletter.getIssueContent.useQuery()    + staticTutorials fallback
PodcastSection → trpc.newsletter.getIssueContent.useQuery()     + staticPodcasts fallback
VideoSection   → trpc.newsletter.getIssueContent.useQuery()     + staticVideos fallback
ReadSection    → trpc.newsletter.getIssueContent.useQuery()     + staticReads fallback
PricingSection → statisch (user?.tier beeinflusst CTA)
```

### 1.7 Build & Deployment

**Build-Prozess:**
```
npm run build
├── vite build          → dist/public/ (Frontend Assets)
└── esbuild api/boot.ts → dist/boot.js   (Backend API Bundle)
```

**Start:**
```
npm start  → NODE_ENV=production node dist/boot.js (Port 3000)
```

**Docker:**
- Multi-Stage Build (base → deps → build → production)
- `node:20-alpine`
- Port 3000

---

## 2. Gap-Analyse – Fehlende Features

### 2.1 KI-gestützte Content-Erzeugung (Kernfeature fehlt komplett)

| Feature | Status | Beschreibung |
|---------|--------|--------------|
| **KI-API-Integration** | ❌ Fehlt | Kein Service, der KI-APIs (z.B. Kimi, OpenAI, Claude) aufruft |
| **Web-Scraping / News-Sammeln** | ❌ Fehlt | Kein Modul, das KI-News aus dem Internet sammelt |
| **JSON-Schema für KI-Output** | ❌ Fehlt | Kein definiertes Schema, das die KI zurückgeben muss |
| **JSON-Validierung** | ❌ Fehlt | Keine Zod/Schema-Validierung des KI-Outputs |
| **Retry-Logik** | ❌ Fehlt | Keine Wiederholung bei API-Fehlern |
| **Fallback bei ungültigem JSON** | ❌ Fehlt | Kein Fallback, wenn KI Müll zurückgibt |
| **Content-Hash / Dublettenprüfung** | ❌ Fehlt | Kein Hashing von URLs/Inhalt für Deduplizierung |

### 2.2 ETL-Pipeline (Extract-Transform-Load)

| Feature | Status | Beschreibung |
|---------|--------|--------------|
| **Extract-Modul** | ❌ Fehlt | Kein Modul, das externe Quellen scrapet |
| **Transform-Modul** | ❌ Fehlt | Keine KI-Verarbeitung der Rohdaten |
| **Load-Modul** | ⚠️ Teilweise | DB-Schema existiert, aber kein automatisiertes Insert |
| **Quellen-Tracking** | ❌ Fehlt | Keine `sources`-Tabelle für Feed-URLs |

### 2.3 Scheduler / Cronjobs

| Feature | Status | Beschreibung |
|---------|--------|--------------|
| **Wöchentlicher Cronjob** | ❌ Fehlt | Kein Scheduler für automatische Issue-Erzeugung |
| **Job-Queue** | ❌ Fehlt | Keine Queue für asynchrone Verarbeitung |
| **Job-Status-Tracking** | ❌ Fehlt | Keine `jobs`-Tabelle für Fortschritt/Status |
| **Relevanzbewertung** | ❌ Fehlt | Kein Scoring-Algorithmus für Content |

### 2.4 Suche & Bibliothek

| Feature | Status | Beschreibung |
|---------|--------|--------------|
| **Volltextsuche** | ❌ Fehlt | Keine Suche über Content |
| **Filter (Datum, Tags, Kategorie, Quelle)** | ❌ Fehlt | Keine Filter-API |
| **Content-Hash für Dubletten** | ❌ Fehlt | Keine `hash`-Spalte |
| **Status-Feld** | ❌ Fehlt | Keine `status`-Spalte (draft/published/archived) |

### 2.5 Sicherheit

| Feature | Status | Beschreibung |
|---------|--------|--------------|
| **KI-API-Token-Sicherheit** | ❌ Fehlt | Kein `AI_API_KEY` in `.env`, kein Proxy-Pattern |
| **Rate-Limiting (KI-API)** | ❌ Fehlt | Kein Schutz gegen zu viele KI-Calls |
| **Backend-only KI-Calls** | ⚠️ Sicher | KI-Token ist nur im Backend, Frontend hat keinen Zugriff ✓ |

### 2.6 Admin & Content-Management

| Feature | Status | Beschreibung |
|---------|--------|--------------|
| **Admin-Dashboard** | ❌ Fehlt | Keine Admin-UI zum Erstellen/Verwalten |
| **Issue-Detailseite** | ❌ Fehlt | Keine `/issue/:slug` Route |
| **Content-Archiv** | ❌ Fehlt | Keine Archiv-Übersicht |
| **E-Mail-Versand** | ❌ Fehlt | Subscriber sind in DB, aber kein Mail-Versand |

---

## 3. Implementierungsplan

### Phase 1: Foundation (Woche 1)

**Ziel:** Datenbank-Erweiterungen, neue Tabellen, KI-Service-Grundgerüst

| Task | Datei(en) | Beschreibung |
|------|-----------|--------------|
| 1.1 | `db/schema.ts` | Neue Tabellen: `sources`, `articles`, `jobs`, `content_hashes` |
| 1.2 | `db/migrations/` | Drizzle-Migration für neue Tabellen generieren |
| 1.3 | `.env.example` + `.env` | `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` hinzufügen |
| 1.4 | `api/lib/env.ts` | Neue Env-Variablen laden |
| 1.5 | `api/services/ai-client.ts` | KI-API-Client (Singleton, sicher im Backend) |
| 1.6 | `api/services/json-validator.ts` | JSON-Schema-Validierung mit Zod |

### Phase 2: ETL-Pipeline (Woche 2)

**Ziel:** Scraping → KI-Verarbeitung → Validierung → DB-Speicherung

| Task | Datei(en) | Beschreibung |
|------|-----------|--------------|
| 2.1 | `api/services/scraper.ts` | Web-Scraping-Service (RSS-Feeds, APIs) |
| 2.2 | `api/services/sources.ts` | Source-Management (Hinzufügen/Entfernen von Quellen) |
| 2.3 | `api/services/content-processor.ts` | KI-Prompting + JSON-Extraktion |
| 2.4 | `api/services/dedupe.ts` | Content-Hashing + Dublettenprüfung |
| 2.5 | `api/services/relevance-scorer.ts` | Relevanz-Bewertung (Keyword-Matching, KI-Scoring) |
| 2.6 | `api/services/etl-pipeline.ts` | Orchestrierung: Extract → Transform → Load |

### Phase 3: Scheduler (Woche 3)

**Ziel:** Automatische wöchentliche Ausführung

| Task | Datei(en) | Beschreibung |
|------|-----------|--------------|
| 3.1 | `api/services/scheduler.ts` | Cron-Job-Scheduler (node-cron) |
| 3.2 | `api/jobs/weekly-issue-job.ts` | Wöchentlicher Job: ETL → Issue erstellen → Publish |
| 3.3 | `api/jobs/job-tracker.ts` | Job-Status-Tracking in DB |
| 3.4 | `api/router.ts` | Neue Admin-Routen: Jobs manuell triggern |

### Phase 4: Suche & Bibliothek (Woche 4)

**Ziel:** Volltextsuche + Filter

| Task | Datei(en) | Beschreibung |
|------|-----------|--------------|
| 4.1 | `db/schema.ts` | Fulltext-Index auf `articles` (Titel, Content, Tags) |
| 4.2 | `api/services/search.ts` | Such-Service mit Filter-Logik |
| 4.3 | `api/newsletter-router.ts` | Neue Query: `searchArticles`, `listByCategory`, `listByTag` |
| 4.4 | `src/pages/Search.tsx` | Neue Search-Page |
| 4.5 | `src/sections/SearchSection.tsx` | Such-UI-Komponente |

### Phase 5: Admin-UI (Woche 5)

**Ziel:** Admin-Dashboard für manuelles Content-Management

| Task | Datei(en) | Beschreibung |
|------|-----------|--------------|
| 5.1 | `src/pages/Admin.tsx` | Admin-Dashboard |
| 5.2 | `src/pages/AdminSources.tsx` | Quellen-Verwaltung |
| 5.3 | `src/pages/AdminJobs.tsx` | Job-Status-Übersicht |
| 5.4 | `src/pages/AdminArticles.tsx` | Artikel-Verwaltung (Draft/Publish/Archive) |
| 5.5 | `src/pages/IssueDetail.tsx` | Issue-Detailseite (`/issue/:slug`) |
| 5.6 | `src/pages/Archive.tsx` | Archiv-Übersicht |

### Phase 6: Deployment-Setup (Woche 6)

**Ziel:** Server-Deployment mit PM2/Docker

| Task | Datei(en) | Beschreibung |
|------|-----------|--------------|
| 6.1 | `docker-compose.yml` | MySQL + App-Container |
| 6.2 | `ecosystem.config.js` | PM2-Konfiguration |
| 6.3 | `scripts/deploy.sh` | Deployment-Skript |
| 6.4 | `scripts/backup.sh` | DB-Backup-Skript |
| 6.5 | SSH-Zugang | Mira gibt SSH-Zugang, ich konfiguriere Server |

---

## 4. Neue Dateien, Tabellen, APIs, Services

### 4.1 Neue Datenbank-Tabellen

#### `sources` – Quellen-Verwaltung
```typescript
export const sources = mysqlTable("sources", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  url: text("url").notNull(),           // RSS-Feed-URL oder API-URL
  type: mysqlEnum("type", ["rss", "api", "scrape"]).default("rss").notNull(),
  category: mysqlEnum("category", [
    "news", "tools", "prompts", "tutorials", 
    "podcasts", "videos", "reads", "image_gen"
  ]).default("news").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastFetchedAt: timestamp("last_fetched_at"),
  fetchIntervalMin: int("fetch_interval_min").default(60).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

#### `articles` – Vereinheitlichter Content-Store
```typescript
export const articles = mysqlTable("articles", {
  id: serial("id").primaryKey(),
  issueId: bigint("issue_id", { mode: "number", unsigned: true }),
  sourceId: bigint("source_id", { mode: "number", unsigned: true }).notNull(),
  
  // Content
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),        // Volltext
  summary: text("summary").notNull(),         // Kurzfassung (KI-generiert)
  
  // Kategorisierung
  category: mysqlEnum("category", [
    "news", "tools", "prompts", "tutorials", 
    "podcasts", "videos", "reads", "image_gen"
  ]).notNull(),
  tags: text("tags"),                         // JSON-Array als String
  
  // Quelle
  sourceName: varchar("source_name", { length: 100 }).notNull(),
  sourceUrl: text("source_url").notNull(),    // Original-URL
  
  // Metadaten
  publishedAt: timestamp("published_at"),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
  
  // Hash & Status
  contentHash: varchar("content_hash", { length: 64 }).notNull().unique(), // SHA-256
  status: mysqlEnum("status", [
    "draft", "review", "approved", "rejected", "published", "archived"
  ]).default("draft").notNull(),
  
  // Relevanz
  relevanceScore: int("relevance_score").default(0).notNull(), // 0-100
  
  // KI-Metadaten
  aiModel: varchar("ai_model", { length: 50 }), // Welches KI-Modell verarbeitet hat
  aiProcessedAt: timestamp("ai_processed_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});
```

#### `jobs` – Job-Tracking
```typescript
export const jobs = mysqlTable("jobs", {
  id: serial("id").primaryKey(),
  type: mysqlEnum("type", [
    "weekly_issue", "fetch_sources", "process_content", 
    "send_newsletter", "cleanup"
  ]).notNull(),
  status: mysqlEnum("status", [
    "pending", "running", "completed", "failed", "cancelled"
  ]).default("pending").notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  resultSummary: text("result_summary"),     // JSON-String mit Ergebnissen
  triggeredBy: mysqlEnum("triggered_by", ["cron", "manual", "api"]).default("cron").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### 4.2 Neue API-Routen (tRPC)

#### `ai-router.ts` – KI-gestützte Operations
```typescript
export const aiRouter = createRouter({
  // Admin: KI-gestütztes Scraping triggern
  scrapeAndProcess: adminQuery
    .input(z.object({ sourceIds: z.array(z.number()).optional() }))
    .mutation(async ({ input }) => {
      // 1. Sources laden
      // 2. ETL-Pipeline ausführen
      // 3. Job-Status zurückgeben
    }),

  // Admin: Einzelne URL mit KI verarbeiten
  processUrl: adminQuery
    .input(z.object({ url: z.string().url(), category: z.string() }))
    .mutation(async ({ input }) => {
      // 1. URL scrapen
      // 2. KI-Verarbeitung
      // 3. Validierung
      // 4. DB-Insert
    }),

  // Admin: Job-Status abfragen
  getJobStatus: adminQuery
    .input(z.object({ jobId: z.number() }))
    .query(async ({ input }) => {
      // Job aus DB laden
    }),

  // Admin: Alle Jobs listen
  listJobs: adminQuery.query(async () => {
    // Alle Jobs chronologisch
  }),
});
```

#### Erweiterung `newsletter-router.ts`
```typescript
// Suche (Öffentlich)
searchContent: publicQuery
  .input(z.object({
    query: z.string().min(1),
    category: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    tags: z.array(z.string()).optional(),
    limit: z.number().default(20),
    offset: z.number().default(0),
  }))
  .query(async ({ input }) => {
    // Volltextsuche + Filter
  }),

// Filter (Öffentlich)
listByCategory: publicQuery
  .input(z.object({ category: z.string(), limit: z.number().default(20) }))
  .query(async ({ input }) => {
    // Artikel nach Kategorie
  }),

// Tags (Öffentlich)
listTags: publicQuery.query(async () => {
  // Alle eindeutigen Tags aggregieren
}),

// Artikel-Detail (Öffentlich)
getArticleById: publicQuery
  .input(z.object({ id: z.number() }))
  .query(async ({ input }) => {
    // Einzelner Artikel
  }),
```

#### `sources-router.ts` – Quellen-Verwaltung
```typescript
export const sourcesRouter = createRouter({
  list: adminQuery.query(async () => { /* alle Quellen */ }),
  create: adminQuery.input(/* ... */).mutation(async () => { /* neue Quelle */ }),
  update: adminQuery.input(/* ... */).mutation(async () => { /* Quelle updaten */ }),
  delete: adminQuery.input(/* ... */).mutation(async () => { /* Quelle löschen */ }),
  test: adminQuery.input(/* ... */).query(async () => { /* Quelle testen */ }),
});
```

### 4.3 Neue Services

#### `api/services/ai-client.ts` – KI-API-Client (SICHER)
```typescript
// ⚠️ NUR IM BACKEND. Token niemals ans Frontend geben.

import { env } from "../lib/env";

class AiClient {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    this.apiKey = env.aiApiKey;        // Aus .env, nur Backend
    this.baseUrl = env.aiBaseUrl;      // z.B. https://api.kimi.com
    this.model = env.aiModel;          // z.B. "kimi-k2p5"
  }

  async chatCompletion(prompt: string, systemPrompt?: string): Promise<string> {
    // Retry-Logik: 3 Versuche mit Exponential Backoff
    // Timeout: 30s
    // Headers: Authorization: Bearer {apiKey}
    // Returns: Roher Text-Output der KI
  }

  async structuredOutput<T>(
    prompt: string, 
    schema: z.ZodSchema<T>,
    systemPrompt?: string
  ): Promise<T> {
    // 1. KI aufrufen mit "Du MUSST gültiges JSON zurückgeben"
    // 2. JSON aus Output extrahieren (Regex: /```json\n?([\s\S]*?)\n?```/)
    // 3. Mit Zod validieren
    // 4. Bei Fehler → Retry (max 3x)
    // 5. Bei dauerhaftem Fehler → Fallback (null/Error)
  }
}

export const aiClient = new AiClient();
```

#### `api/services/json-validator.ts` – JSON-Schema-Validierung
```typescript
import { z } from "zod";

// Einheitliches JSON-Schema für KI-Output
export const ArticleOutputSchema = z.object({
  title: z.string().min(5).max(500),
  summary: z.string().min(20).max(2000),
  content: z.string().min(50).max(10000),
  category: z.enum([
    "news", "tools", "prompts", "tutorials", 
    "podcasts", "videos", "reads", "image_gen"
  ]),
  tags: z.array(z.string().min(1).max(50)).max(10),
  sourceName: z.string().min(1).max(100),
  sourceUrl: z.string().url(),
  publishedAt: z.string().datetime().optional(),
  relevanceScore: z.number().int().min(0).max(100).optional(),
});

export type ArticleOutput = z.infer<typeof ArticleOutputSchema>;

export function validateArticleOutput(json: unknown): { 
  success: true; data: ArticleOutput } | { 
  success: false; errors: string[] 
} {
  const result = ArticleOutputSchema.safeParse(json);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { 
    success: false, 
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
  };
}
```

#### `api/services/scraper.ts` – Web-Scraping
```typescript
// RSS-Feed Parsing
// API-Wrapper (z.B. NewsAPI, HackerNews API)
// Cheerio für HTML-Scraping (Fallback)
// User-Agent-Rotation
// Rate-Limiting pro Quelle

interface ScrapedItem {
  title: string;
  url: string;
  content?: string;
  publishedAt?: Date;
  sourceName: string;
}

export async function scrapeSource(source: Source): Promise<ScrapedItem[]> {
  // Typ-basiertes Scraping (RSS / API / Scrape)
  // Returns: Rohe Scraped Items
}
```

#### `api/services/content-processor.ts` – KI-Content-Verarbeitung
```typescript
import { aiClient } from "./ai-client";
import { ArticleOutputSchema } from "./json-validator";

const SYSTEM_PROMPT = `Du bist ein KI-Newsletter-Redakteur. 
Extrahiere aus dem folgenden Artikel die wichtigsten Informationen 
und gib sie als STRENGE JSON zurück. Kein Markdown, kein Fließtext.

Schema:
{
  "title": "string (max 500 chars)",
  "summary": "string (max 2000 chars, deutscher Fließtext)",
  "content": "string (max 10000 chars, vollständiger Artikeltext)",
  "category": "news|tools|prompts|tutorials|podcasts|videos|reads|image_gen",
  "tags": ["string", "string", ...],
  "sourceName": "string",
  "sourceUrl": "string (URL)",
  "publishedAt": "ISO-Date (optional)",
  "relevanceScore": 0-100
}`;

export async function processWithAI(
  scrapedItem: ScrapedItem
): Promise<ArticleOutput | null> {
  // 1. KI-Client aufrufen
  // 2. JSON extrahieren
  // 3. Validieren mit Zod
  // 4. Retry bei Fehler (max 3x)
  // 5. Bei Erfolg: ArticleOutput zurückgeben
  // 6. Bei Fehler: null (wird geloggt, nicht gespeichert)
}
```

#### `api/services/dedupe.ts` – Dublettenprüfung
```typescript
import { createHash } from "crypto";

export function hashContent(url: string, title: string): string {
  // SHA-256 von "url:title"
  return createHash("sha256")
    .update(`${url.trim().toLowerCase()}:${title.trim().toLowerCase()}`)
    .digest("hex");
}

export async function isDuplicate(hash: string): Promise<boolean> {
  // Prüft ob contentHash in DB existiert
}
```

#### `api/services/relevance-scorer.ts` – Relevanzbewertung
```typescript
const KEYWORDS = [
  "AI", "KI", "machine learning", "deep learning", "neural network",
  "LLM", "GPT", "Claude", "OpenAI", "Gemini", "Midjourney", "DALL-E",
  "transformer", "autonomous", "agent", "prompt engineering",
  "fine-tuning", "RAG", "multimodal", "reasoning"
];

export function calculateRelevanceScore(
  title: string, 
  content: string, 
  tags: string[]
): number {
  // Keyword-Dichte * Gewichtung
  // Titel-Treffer: 3x Gewichtung
  // Content-Treffer: 1x Gewichtung
  // Tag-Treffer: 2x Gewichtung
  // Score: 0-100
}
```

#### `api/services/etl-pipeline.ts` – ETL-Orchestrierung
```typescript
export async function runETLPipeline(options?: {
  sourceIds?: number[];
  dryRun?: boolean;
}): Promise<ETLResult> {
  // 1. [Extract] Sources laden → scrapeSource()
  // 2. [Transform] processWithAI() pro Item
  // 3. [Validate] validateArticleOutput()
  // 4. [Dedupe] isDuplicate() + hashContent()
  // 5. [Score] calculateRelevanceScore()
  // 6. [Load] DB-Insert (articles) — nur wenn !dryRun
  // 7. [Log] Job-Status in `jobs`-Tabelle
}
```

#### `api/services/scheduler.ts` – Cronjob-Scheduler
```typescript
import { CronJob } from "cron";

export function startScheduler() {
  // Wöchentlicher Job: Jeden Montag um 06:00 Uhr
  const weeklyJob = new CronJob(
    "0 6 * * 1",  // cron: "At 06:00 on Monday"
    async () => {
      await runWeeklyIssueJob();
    },
    null,
    true,
    "Europe/Berlin"
  );

  // Optional: Täglicher Fetch-Job
  const dailyFetchJob = new CronJob(
    "0 */6 * * *",  // Alle 6 Stunden
    async () => {
      await runETLPipeline();
    }
  );
}

export async function runWeeklyIssueJob(): Promise<void> {
  // 1. Job-Status: "running" in DB
  // 2. ETL-Pipeline ausführen (nur approved Artikel)
  // 3. Neue Issue erstellen (next issueNumber)
  // 4. Artikel der Issue zuordnen (issueId setzen)
  // 5. Issue veröffentlichen (isPublished = true)
  // 6. Newsletter an Subscriber senden (optional)
  // 7. Job-Status: "completed"
}
```

#### `api/services/search.ts` – Such-Service
```typescript
export async function searchArticles(params: SearchParams): Promise<SearchResult> {
  // 1. Volltextsuche mit MySQL MATCH AGAINST
  // 2. Filter anwenden (category, dateFrom, dateTo, tags)
  // 3. Sortierung (Relevanz, Datum)
  // 4. Paginierung (limit, offset)
  // 5. Count für Pagination-Info
}
```

### 4.4 Neue Frontend-Dateien

| Datei | Zweck |
|-------|-------|
| `src/pages/Search.tsx` | Volltextsuche-Page |
| `src/pages/Admin.tsx` | Admin-Dashboard (Overview) |
| `src/pages/AdminSources.tsx` | Quellen CRUD |
| `src/pages/AdminJobs.tsx` | Job-Status-Monitor |
| `src/pages/AdminArticles.tsx` | Artikel-Verwaltung |
| `src/pages/IssueDetail.tsx` | Einzelne Issue (`/issue/:slug`) |
| `src/pages/Archive.tsx` | Alle Issues archiviert |
| `src/sections/SearchSection.tsx` | Such-UI für Landingpage |
| `src/sections/AdminNav.tsx` | Admin-Navigation |
| `src/components/ArticleCard.tsx` | Wiederverwendbare Artikel-Karte |
| `src/components/JobStatusBadge.tsx` | Job-Status-Anzeige |

---

## 5. Einheitliches JSON-Schema + Beispieloutput

### 5.1 Schema-Definition (Zod)

```typescript
import { z } from "zod";

/**
 * Einheitliches JSON-Schema für KI-verarbeitete Content-Artikel.
 * Keine optionalen Felder außer explizit markiert.
 * Die KI MUSS dieses Schema exakt einhalten.
 */
export const UnifiedArticleSchema = z.object({
  // Identifikation
  title: z.string()
    .min(5, "Titel zu kurz (min 5 Zeichen)")
    .max(500, "Titel zu lang (max 500 Zeichen)"),
  
  // Inhalt
  summary: z.string()
    .min(20, "Summary zu kurz (min 20 Zeichen)")
    .max(2000, "Summary zu lang (max 2000 Zeichen)"),
  
  content: z.string()
    .min(50, "Content zu kurz (min 50 Zeichen)")
    .max(10000, "Content zu lang (max 10000 Zeichen)"),
  
  // Kategorisierung
  category: z.enum([
    "news",
    "tools", 
    "prompts",
    "tutorials",
    "podcasts",
    "videos",
    "reads",
    "image_gen"
  ], {
    errorMap: () => ({ message: "Ungültige Kategorie" })
  }),
  
  tags: z.array(
    z.string()
      .min(1, "Tag zu kurz")
      .max(50, "Tag zu lang (max 50 Zeichen)")
      .regex(/^[a-z0-9\-]+$/, "Tags nur lowercase, Zahlen, Bindestriche")
  )
    .min(1, "Mindestens 1 Tag erforderlich")
    .max(10, "Maximal 10 Tags"),
  
  // Quelle (MUSS Originalquelle sein)
  sourceName: z.string()
    .min(1, "Quellenname erforderlich")
    .max(100, "Quellenname zu lang"),
  
  sourceUrl: z.string()
    .url("Ungültige URL"),
  
  // Metadaten (optional)
  publishedAt: z.string()
    .datetime({ message: "Ungültiges Datumsformat (ISO 8601)" })
    .optional(),
  
  // Relevanz (optional, wird auch serverseitig berechnet)
  relevanceScore: z.number()
    .int()
    .min(0)
    .max(100)
    .optional(),
});

export type UnifiedArticle = z.infer<typeof UnifiedArticleSchema>;
```

### 5.2 Beispiel-Output (KI-generiert)

```json
{
  "title": "OpenAI plant AI-Smartphone – Apps sollen durch autonome Agents ersetzt werden",
  "summary": "Laut renommiertem Analysten Ming-Chi Kuo arbeitet OpenAI mit MediaTek, Qualcomm und Luxshare an einem revolutionären Smartphone, das statt traditioneller Apps auf KI-Agents setzt. Das Gerät soll durch natürliche Sprachbefehle gesteuert werden und Aufgaben autonom erledigen. Die Massenproduktion wird frühestens 2028 erwartet.",
  "content": "OpenAI expandiert seine Hardware-Ambitionen massiv. Nach erfolgreicher Zusammenarbeit mit Apple für Siri-Integration plant das Unternehmen nun ein eigenes AI-first Smartphone.\n\nSchlüsselpartner:\n- MediaTek: Entwicklung des custom AI-Chips\n- Qualcomm: Snapdragon-Plattform mit optimiertem NPU\n- Luxshare: Fertigung und Supply Chain\n\nKonzept: Statt App-Grid → Konversationeller Agent, der Aufgaben autonom erledigt. Beispiel: 'Buche einen Flug nach Tokyo und reserviere ein Sushi-Restaurant' → Agent erledigt alles ohne Öffnen einzelner Apps.\n\nMarkteinschätzung: Analysten erwarten 50M+ Einheiten im ersten Jahr bei erfolgreichem Launch. Konkurrenz durch Apple Intelligence und Google Gemini Nano.",
  "category": "news",
  "tags": ["openai", "smartphone", "ai-agents", "hardware", "mediaTek", "qualcomm"],
  "sourceName": "TechCrunch",
  "sourceUrl": "https://techcrunch.com/2026/04/27/openai-could-be-making-a-phone-with-ai-agents-replacing-apps/",
  "publishedAt": "2026-04-27T10:00:00Z",
  "relevanceScore": 95
}
```

### 5.3 Beispiel-Output (Tool-Empfehlung)

```json
{
  "title": "Plurai – Vibe-Train Evals und Guardrails für Enterprise-AI",
  "summary": "Plurai ist ein API-first Tool zur automatischen Evaluierung und Sicherstellung von AI-Outputs. Entwickler können maßgeschneiderte Evals und Guardrails für ihren spezifischen Use Case erstellen und so die Qualität von LLM-Anwendungen messen und verbessern.",
  "content": "Plurai adressiert eines der größten Probleme im Enterprise-AI-Bereich: Wie misst und sichert man die Qualität von LLM-Outputs?\n\nKerneigenschaften:\n1. Custom Evals: Erstelle Evaluierungsmetriken tailored to your use case\n2. Guardrails: Automated checks, die Outputs in Echtzeit validieren\n3. API-first: Nahtlose Integration in bestehende Pipelines\n4. Vibe-Train: Kontinuierliches Training basierend auf Eval-Ergebnissen\n\nUse Cases:\n- Customer Support Bot Quality Assurance\n- Content Generation Consistency Checks\n- RAG Pipeline Performance Monitoring\n- Multi-Model Comparison\n\nBewertung: 96 Upvotes auf ProductHunt. Starker Fokus auf Developer Experience.",
  "category": "tools",
  "tags": ["developer-tools", "ai-evaluation", "llm", "guardrails", "enterprise"],
  "sourceName": "ProductHunt",
  "sourceUrl": "https://www.producthunt.com/products/plurai",
  "publishedAt": "2026-04-29T08:30:00Z",
  "relevanceScore": 88
}
```

### 5.4 Prompt für die KI (System-Prompt)

```
Du bist ein KI-Newsletter-Redakteur mit Spezialisierung auf 
Künstliche Intelligenz und Technologie.

AUFGABE:
Analysiere den folgenden Artikel/Rohinhalt und extrahiere 
die wichtigsten Informationen.

REGELN:
1. Gib NUR gültiges JSON zurück. Kein Markdown, keine Code-Blöcke, kein Fließtext.
2. Das JSON MUSS exakt diesem Schema folgen:
   {
     "title": "string (5-500 chars)",
     "summary": "string (20-2000 chars, deutscher Fließtext)",
     "content": "string (50-10000 chars, vollständiger Inhalt)",
     "category": "news|tools|prompts|tutorials|podcasts|videos|reads|image_gen",
     "tags": ["lowercase", "max-10", "nur-a-z-0-9-und-bindestrich"],
     "sourceName": "string (Original-Quellenname)",
     "sourceUrl": "string (valide URL)",
     "publishedAt": "ISO-8601 Datum (optional)",
     "relevanceScore": 0-100 (optional)
   }
3. Die Ausgabe MUSS parsbares JSON sein.
4. Verwende deutsche Sprache für summary und content.
5. Tags immer lowercase, nur Buchstaben, Zahlen und Bindestriche.
6. sourceName und sourceUrl MÜSSEN die ORIGINALQUELLE sein.
7. relevanceScore: 90-100 = breaking news/must-read, 70-89 = wichtig, 50-69 = interessant, <50 = optional
```

---

## 6. Sichere Token-Architektur

### 6.1 Prinzip: KI-Token NIE im Frontend

```
┌─────────────────────────────────────────┐
│  Browser (React)                        │
│  ─────────────────────────────────────  │
│  • KEIN AI_API_KEY hier!                │
│  • Nur tRPC-Calls zum Backend           │
│  • Cookies für Auth                     │
└──────────────┬──────────────────────────┘
               │ HTTP /api/trpc/*
               ▼
┌─────────────────────────────────────────┐
│  Hono Backend                           │
│  ─────────────────────────────────────  │
│  • AI_API_KEY nur hier verfügbar        │
│  • process.env.AI_API_KEY               │
│  • Niemals an Client senden!            │
│  • Rate-Limiting pro User/IP            │
└──────────────┬──────────────────────────┘
               │ HTTPS / Bearer Token
               ▼
┌─────────────────────────────────────────┐
│  KI-API (Kimi / OpenAI / Claude)        │
│  ─────────────────────────────────────  │
│  • Externer Service                     │
│  • Backend ist Proxy/Client             │
└─────────────────────────────────────────┘
```

### 6.2 Env-Variablen (Backend-Only)

```bash
# ── KI-API (NUR Backend) ──────────────────────────────────────
AI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # NIEMALS exposen!
AI_BASE_URL=https://api.kimi.com/v1              # oder OpenAI, Claude, etc.
AI_MODEL=kimi-k2p5                                 # oder gpt-4, claude-3-opus
AI_MAX_TOKENS=4096
AI_TIMEOUT_MS=30000
```

### 6.3 Rate-Limiting (KI-API-Calls)

```typescript
// api/middleware.ts — Erweiterung
import { RateLimiter } from "./lib/rate-limiter";

const aiRateLimit = new RateLimiter({
  windowMs: 60 * 1000,      // 1 Minute
  maxRequests: 10,          // Max 10 KI-Calls pro Minute
  keyGenerator: (ctx) => ctx.user?.unionId ?? ctx.req.ip,
});

export const aiQuery = adminQuery.use(async (opts) => {
  const allowed = await aiRateLimit.check(opts.ctx);
  if (!allowed) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "KI-Rate-Limit überschritten" });
  }
  return opts.next();
});
```

---

## 7. Integration in bestehendes Projekt

### 7.1 Router-Erweiterung

```typescript
// api/router.ts (bestehende Datei erweitern)
import { aiRouter } from "./ai-router";
import { sourcesRouter } from "./sources-router";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  newsletter: newsletterRouter,
  ai: aiRouter,           // ← NEU
  sources: sourcesRouter, // ← NEU
});
```

### 7.2 Scheduler-Start (boot.ts erweitern)

```typescript
// api/boot.ts (bestehende Datei erweitern)
import { startScheduler } from "./services/scheduler";

if (env.isProduction) {
  // ... bestehender Prod-Code ...
  
  // Scheduler starten
  startScheduler();
  console.log("[Scheduler] Cronjobs aktiviert");
}
```

### 7.3 Frontend-Routing (App.tsx erweitern)

```typescript
// src/App.tsx (bestehende Datei erweitern)
import Search from './pages/Search'
import IssueDetail from './pages/IssueDetail'
import Archive from './pages/Archive'
import Admin from './pages/Admin'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/search" element={<Search />} />           {/* ← NEU */}
      <Route path="/issue/:slug" element={<IssueDetail />} /> {/* ← NEU */}
      <Route path="/archive" element={<Archive />} />         {/* ← NEU */}
      <Route path="/admin" element={<Admin />} />              {/* ← NEU */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
```

### 7.4 Navbar-Erweiterung

```typescript
// src/components/Navbar.tsx — Links ergänzen:
// - "Archiv" → /archive
// - "Suche" → /search
// - "Admin" (nur wenn user.role === "admin") → /admin
```

---

## 8. Zusammenfassung

### Was existiert bereits (keine Änderung nötig)
- ✅ React 19 + Vite + Tailwind + shadcn/ui Frontend
- ✅ Hono + tRPC + Drizzle Backend
- ✅ MySQL-Datenbank mit 11 Tabellen
- ✅ Kimi OAuth 2.0 Authentifizierung
- ✅ Session-Cookie-Management
- ✅ Admin/Auth Middleware
- ✅ Dockerfile + Build-Pipeline
- ✅ Statische Demo-Daten (Issue #1)

### Was fehlt und implementiert werden muss
- ❌ KI-API-Integration (sicher, nur Backend)
- ❌ ETL-Pipeline (Extract → Transform → Load)
- ❌ JSON-Schema + Validierung + Retry + Fallback
- ❌ Content-Hashing + Dublettenprüfung
- ❌ Relevanzbewertung
- ❌ Wöchentlicher Cronjob
- ❌ Job-Tracking
- ❌ Volltextsuche + Filter
- ❌ Quellen-Verwaltung
- ❌ Admin-Dashboard
- ❌ Issue-Detailseite + Archiv
- ❌ Neue DB-Tabellen: `sources`, `articles`, `jobs`

### Implementierungs-Reihenfolge
1. **Foundation:** Neue Tabellen + Env-Variablen + KI-Client
2. **ETL:** Scraper + KI-Processor + Validator + Dedupe + Scorer
3. **Scheduler:** Cronjobs + Job-Tracking
4. **Suche:** Fulltext + Filter
5. **Admin-UI:** Dashboard + Quellen + Artikel
6. **Deployment:** Server-Setup + PM2 + Backup

---

*Dokument erstellt: 29.04.2026*
*Autor: Mira Jr*
*Projekt: AI-Newsletter Uni-Projekt*
