# AI Newsletter – Uni-Projekt

> **Status:** MVP in Entwicklung | **Klausur:** TBD | **Letztes Update:** 29.04.2026

Eine vollstack KI-Newsletter-Plattform mit React-Frontend, tRPC-API, MySQL-Datenbank und Kimi-OAuth-Authentifizierung. Die App zeigt wöchentlich kuratierte KI-News, Tool-Empfehlungen, Prompts, Tutorials, Podcasts, Videos und Reads in einer modernen, dunklen UI.

---

## 📋 Inhaltsverzeichnis

1. [Tech Stack](#-tech-stack)
2. [Architektur](#-architektur)
3. [Datenbank-Schema](#-datenbank-schema)
4. [API-Endpunkte](#-api-endpunkte)
5. [Authentifizierung](#-authentifizierung)
6. [Frontend-Struktur](#-frontend-struktur)
7. [Statische Daten (Issue #1)](#-statische-daten-issue-1)
8. [Environment Variablen](#-environment-variablen)
9. [Build & Deployment](#-build--deployment)
10. [Offene Features & TODOs](#-offene-features--todos)
11. [Projekt-Status](#-projekt-status)

---

## 🛠 Tech Stack

| Layer | Technologie |
|-------|-------------|
| **Frontend** | React 19, TypeScript, Vite 7, Tailwind CSS 3.4, shadcn/ui |
| **Backend** | Hono 4, tRPC 11, Drizzle ORM 0.45 |
| **Datenbank** | MySQL 8 (via mysql2) |
| **Auth** | Kimi OAuth 2.0 (OpenID Connect / JWT) |
| **State** | TanStack Query (React Query) + tRPC Client |
| **Build** | Vite (Frontend) + esbuild (API) → `dist/` |
| **Container** | Docker (node:20-alpine, Multi-Stage) |
| **Tests** | Vitest |

---

## 🏗 Architektur

```
┌─────────────────────────────────────────┐
│  Browser (React 19 + Vite)              │
│  ─────────────────────────────────────  │
│  • React Router 7 (SPA-Routing)         │
│  • tRPC Client + TanStack Query         │
│  • shadcn/ui Komponenten (40+)          │
│  • Tailwind CSS + Custom Theme          │
└──────────────┬──────────────────────────┘
               │ HTTP / Fetch
               ▼
┌─────────────────────────────────────────┐
│  Hono Server (Node.js)                  │
│  ─────────────────────────────────────  │
│  • /api/trpc/* → tRPC Request Handler   │
│  • /api/oauth/callback → Kimi OAuth     │
│  • Session Cookies (httpOnly, secure)   │
│  • Body-Limit: 50 MB                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  tRPC Router                            │
│  ─────────────────────────────────────  │
│  • auth router (me, logout)               │
│  • newsletter router (CRUD + Queries)   │
│  • Middleware: public / auth / admin    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Drizzle ORM + MySQL 8                  │
│  ─────────────────────────────────────  │
│  • 11 Tabellen (siehe Schema)           │
│  • Migrationen via drizzle-kit          │
└─────────────────────────────────────────┘
```

---

## 🗄 Datenbank-Schema

### Tabellen-Übersicht

| Tabelle | Zweck |
|---------|-------|
| `users` | OAuth-User (Kimi), Rollen, Tiers |
| `newsletter_issues` | Ausgaben (#1, #2, ...) mit Publish-Status |
| `news_items` | News-Artikel pro Issue |
| `tool_recommendations` | AI-Tool-Empfehlungen (ProductHunt) |
| `prompt_recommendations` | Prompt der Woche |
| `tutorials` | Deep-Dive Tutorials |
| `podcasts` | Podcast-Empfehlungen |
| `videos` | YouTube-Video-Empfehlungen |
| `reads` | Read of the Week (Artikel) |
| `image_gen_trainings` | Image-Gen Prompt-Training |
| `subscribers` | E-Mail-Abonnenten (Newsletter) |

### Wichtige Felder

**users**
- `unionId` (unique) – Kimi-User-ID
- `role`: `user` | `admin`
- `tier`: `free` | `premium`
- `name`, `email`, `avatar`

**newsletter_issues**
- `issueNumber` (unique), `slug` (unique)
- `isPublished` (boolean)
- `tier`: `free` | `premium` | `both`
- `summary`

**news_items**
- `category`: `industry` | `research` | `product` | `policy` | `funding` | `breakthrough`
- `sourceName`, `sourceUrl`, `imageUrl`

---

## 🔌 API-Endpunkte (tRPC)

### Auth Router (`auth.`)
| Procedure | Auth | Beschreibung |
|-----------|------|--------------|
| `auth.me` | ✅ Authed | Aktuellen User zurückgeben |
| `auth.logout` | ✅ Authed | Session-Cookie löschen |

### Newsletter Router (`newsletter.`)

**Öffentlich (publicQuery):**
| Procedure | Input | Output |
|-----------|-------|--------|
| `getLatest` | – | Aktuellste veröffentlichte Issue |
| `getBySlug` | `{ slug: string }` | Issue nach Slug |
| `listIssues` | – | Alle veröffentlichten Issues |
| `getIssueContent` | `{ issueId: number }` | Vollständiger Inhalt (News, Tools, Prompts, Tutorials, Podcasts, Videos, Reads, ImageGens) |
| `subscribe` | `{ email, name?, tier? }` | E-Mail-Abonnement |

**Admin (adminQuery):**
| Procedure | Input |
|-----------|-------|
| `createIssue` | `{ issueNumber, title, slug, summary?, tier? }` |
| `publishIssue` | `{ issueId: number }` |
| `addNews` | `{ issueId, headline, summary, sourceName, sourceUrl, category?, imageUrl? }` |
| `addTool` | `{ issueId, name, description, category, url, imageUrl?, voteCount? }` |
| `addPrompt` | `{ issueId, title, prompt, description, useCase, model?, exampleOutput?, tags? }` |
| `addTutorial` | `{ issueId, title, description, tool, difficulty?, content, videoUrl?, imageUrl?, estimatedTime? }` |
| `addPodcast` | `{ issueId, title, host, description, episodeTitle?, duration?, spotifyUrl?, appleUrl?, youtubeUrl?, imageUrl? }` |
| `addVideo` | `{ issueId, title, creator, description, youtubeUrl, thumbnailUrl?, duration? }` |
| `addRead` | `{ issueId, title, author, description, url, source, readTime?, imageUrl? }` |
| `addImageGen` | `{ issueId, title, tool?, prompt, technique, description, imageUrl?, tips? }` |

---

## 🔐 Authentifizierung

**OAuth 2.0 Flow (Kimi / OpenID Connect):**
1. Nutzer klickt "Login" → Redirect zu Kimi OAuth
2. Kimi fragt Berechtigungen → Redirect zurück mit `code`
3. Backend tauscht `code` gegen `access_token` + `refresh_token`
4. `access_token` wird gegen Kimi JWKS verifiziert
5. User-Profil wird von Kimi Open Platform geholt
6. User wird in DB angelegt/aktualisiert (`upsertUser`)
7. Eigenes Session-JWT wird signiert und als **httpOnly Cookie** gesetzt

**Session-Cookie:**
- Name: `kimi_sid`
- Max-Age: 365 Tage
- httpOnly, secure, sameSite=lax/none

**Rollen:**
- `OWNER_UNION_ID` in `.env` → dieser User bekommt automatisch `role: "admin"`
- Alle anderen: `role: "user"`

**Middleware-Chain:**
```
publicQuery → keine Auth nötig
authedQuery → publicQuery + requireAuth (Session valid)
adminQuery  → authedQuery + requireRole("admin")
```

---

## 🎨 Frontend-Struktur

### Pages (`src/pages/`)
| Page | Route | Status |
|------|-------|--------|
| `Home` | `/` | ✅ Mit tRPC + statischen Daten |
| `Login` | `/login` | ✅ Kimi OAuth Redirect |
| `NotFound` | `*` | ✅ |

### Sections (`src/sections/`)
Die Home-Page besteht aus 10 Sections (von oben nach unten):

| # | Section | Datenquelle |
|---|---------|-------------|
| 1 | **HeroSection** | tRPC `getLatest` (Fallback: `staticIssue`) |
| 2 | **NewsSection** | tRPC `getIssueContent` → news (Fallback: `staticNews`) |
| 3 | **ToolsSection** | tRPC `getIssueContent` → tools (Fallback: `staticTools`) |
| 4 | **PromptSection** | tRPC `getIssueContent` → prompts (Fallback: `staticPrompt`) |
| 5 | **ImageGenSection** | tRPC `getIssueContent` → imageGens (Fallback: `staticImageGens`) |
| 6 | **TutorialSection** | tRPC `getIssueContent` → tutorials (Fallback: `staticTutorials`) |
| 7 | **PodcastSection** | tRPC `getIssueContent` → podcasts (Fallback: `staticPodcasts`) |
| 8 | **VideoSection** | tRPC `getIssueContent` → videos (Fallback: `staticVideos`) |
| 9 | **ReadSection** | tRPC `getIssueContent` → reads (Fallback: `staticReads`) |
| 10 | **PricingSection** | Statisch + `user?.tier` |

> **Pattern:** Alle Sections fragen zuerst die API ab. Falls die DB leer ist, werden statische Demo-Daten aus `staticData.ts` angezeigt.

### Komponenten (`src/components/`)
- **Navbar** – Logo, Navigation, User-Avatar, Login/Logout
- **Footer** – Links, Copyright
- **AuthLayout** / **AuthLayoutSkeleton** – Auth-Status-Wrapper
- **ui/** – 40+ shadcn/ui Komponenten (Button, Card, Dialog, Input, Badge, etc.)

### Hooks (`src/hooks/`)
| Hook | Zweck |
|------|-------|
| `useAuth` | User-Session, Login-Status, Logout, Redirect |
| `use-mobile` | Mobile-Breakpoint-Detection |

### Providers (`src/providers/`)
- **trpc.tsx** – tRPC-Client + TanStack Query-Client Setup

---

## 📦 Statische Daten (Issue #1)

Damit die App auch ohne DB funktioniert, sind Demo-Daten in `src/data/staticData.ts` hinterlegt:

### Issue #1 – April 2026
**Titel:** "AI Newsletter #1 – OpenAI Hardware, Google Workspace AI & DeepSeek-V4"

**News (7 Artikel):**
1. OpenAI plant AI-Smartphone (TechCrunch)
2. Google Workspace AI Upgrade (TechCrunch)
3. DeepMind-Veteran sammelt 1,1 Mrd. (TechCrunch)
4. AI-Monetarisierung Squeeze (The Verge)
5. MIT: 10 Things That Matter in AI (MIT Technology Review)
6. DeepSeek-V4 Frontier-Leistung (VentureBeat)
7. Microsoft & OpenAI beenden Exklusiv-Deal (Ars Technica / VentureBeat)

**Tools (5 Empfehlungen):**
- Plurai, KarmaBox, CodeHealth MCP Server, Netlify Database, Devin for Terminal

**Prompt der Woche:**
- "Der 'World-Class Expert' Prompt für komplexe Analysen"

**Tutorial:**
- Claude Projects: Custom Workspace & Knowledge Base Guide

**Podcasts:**
- Latent Space, TWIML AI Podcast

**Videos:**
- Claude Projects Guide, Claude Code Tutorial

**Reads (3 Artikel):**
- MIT 10 Things, VentureBeat Research Trends, GPT-Image Prompts

**Image Gen (2 Trainings):**
- Photography Approach (Midjourney), Fantasy World Builder (Midjourney)

---

## 🔧 Environment Variablen

Kopiere `.env.example` nach `.env` und fülle aus:

```bash
# ── Backend ─────────────────────────────────────────────────────
APP_ID=                   # Application ID (für Kimi OAuth)
APP_SECRET=               # Application secret (JWT signing)

# ── Datenbank ───────────────────────────────────────────────────
DATABASE_URL=             # MySQL connection string
                          # Format: mysql://user:pass@host:port/db

# ── Frontend (exposed via Vite) ───────────────────────────────
VITE_KIMI_AUTH_URL=       # Kimi OAuth server URL
                          # z.B. https://auth.kimi.com
VITE_APP_ID=              # OAuth application ID

# ── Backend (Auth) ─────────────────────────────────────────────
KIMI_AUTH_URL=            # Kimi OAuth server URL (backend)
KIMI_OPEN_URL=            # Kimi Open Platform URL
                          # z.B. https://open.kimi.com

# ── Admin Role ──────────────────────────────────────────────────
OWNER_UNION_ID=           # Union ID des App-Erstellers
                          # Dieser User wird automatisch zu admin
```

---

## 🚀 Build & Deployment

### Lokale Entwicklung
```bash
# 1. Abhängigkeiten installieren
npm install

# 2. .env konfigurieren (siehe oben)
cp .env.example .env
# ... editieren

# 3. Datenbank-Migrationen
npm run db:generate
npm run db:migrate

# 4. Dev-Server starten
npm run dev
# → http://localhost:3000
```

### Build für Production
```bash
npm run build
```
Dies erzeugt:
- `dist/public/` – Vite-Frontend (statische Dateien)
- `dist/boot.js` – esbuild-Bundle der API (Hono + tRPC)

### Start Production
```bash
npm start
# → NODE_ENV=production node dist/boot.js
# → Port: 3000 (oder PORT env)
```

### Docker
```bash
# Multi-Stage Build
docker build -t ai-newsletter .
docker run -p 3000:3000 --env-file .env ai-newsletter
```

**Dockerfile-Stages:**
1. `base` – node:20-alpine + WORKDIR
2. `deps` – npm ci (mit Cache)
3. `build` – npm run build
4. `production` – nur dist/ + node_modules + .env

---

## ✅ Offene Features & TODOs

### Noch fehlend (bekannt):
- [ ] **Admin-Dashboard** – UI zum Erstellen/Verwalten von Issues
- [ ] **Issue-Detailseite** – `/issue/:slug` für einzelne Ausgaben
- [ ] **Archiv-Seite** – Alle veröffentlichten Issues auflisten
- [ ] **Newsletter-E-Mail-Versand** – Aktuell nur DB-Speicherung, kein Mail-Versand
- [ ] **Premium-Tier-Gating** – `tier` Feld existiert, aber keine Content-Sperre
- [ ] **User-Profil-Seite** – `/profile` mit Abo-Verwaltung
- [ ] **SEO / Meta-Tags** – Dynamische OpenGraph-Tags pro Issue
- [ ] **Sitemap + RSS-Feed** – Für Suchmaschinen + RSS-Reader
- [ ] **Search / Filter** – News/Tool-Suche innerhalb eines Issues
- [ ] **Voting-System** – `voteCount` existiert, aber keine Vote-UI
- [ ] **Image-Upload** – Aktuell nur statische Assets (`/public/assets/`)
- [ ] **Tests erweitern** – Vitest ist konfiguriert, aber nur Boilerplate
- [ ] **CI/CD Pipeline** – GitHub Actions / Docker-Build automatisch

### Verbesserungen (Nice-to-have):
- [ ] Dark/Light Mode Toggle
- [ ] PWA (Service Worker)
- [ ] Analytics (Plausible / Umami)
- [ ] Rate-Limiting für öffentliche API
- [ ] E-Mail-Verifizierung für Subscriber
- [ ] Passwortlose Authentifizierung (Magic Link)

---

## 📊 Projekt-Status

| Bereich | Status | Notiz |
|---------|--------|-------|
| Datenbank-Schema | ✅ Fertig | 11 Tabellen, vollständig |
| tRPC API | ✅ Fertig | Alle CRUD + Queries |
| Auth (Kimi OAuth) | ✅ Fertig | Login, Logout, Sessions |
| Frontend-Layout | ✅ Fertig | 10 Sections, responsive |
| Statische Daten | ✅ Fertig | Issue #1 komplett |
| Admin-Dashboard | ❌ Fehlt | Wichtigste Lücke |
| Issue-Detailseite | ❌ Fehlt | `/issue/:slug` |
| E-Mail-Versand | ❌ Fehlt | Nur DB-Speicherung |
| Premium-Gating | ❌ Fehlt | Feld existiert, keine Logik |
| Docker-Build | ✅ Fertig | Multi-Stage Dockerfile |
| Tests | ⚠️ Minimal | Vitest konfiguriert |
| Deployment | ❌ Offen | Warte auf Server-SSH |

---

## 📝 Zusätzliche Notizen

**Build-Output-Struktur:**
```
dist/
├── public/           # Vite-Frontend (index.html, JS, CSS, Assets)
├── boot.js           # Hono/tRPC API (Node.js ESM)
└── (node_modules)    # Nur Production-Deps
```

**Alias-Resolution (Vite):**
| Alias | Pfad |
|-------|------|
| `@/` | `./src/` |
| `@contracts/` | `./contracts/` |
| `@db/` | `./db/` |
| `db/` | `./db/` |

**Session-Token (JWT):**
- Signiert mit `APP_SECRET`
- Payload: `{ unionId, clientId }`
- Verifiziert via `jose` (EdDSA/ES256)

**Kimi-Integration:**
- OAuth: `https://auth.kimi.com/api/oauth/authorize`
- Token: `https://auth.kimi.com/api/oauth/token`
- JWKS: `https://auth.kimi.com/api/.well-known/jwks.json`
- Open Platform: `https://open.kimi.com`

---

*Dokumentation erstellt von Mira Jr am 29.04.2026*
