# AI Newsletter Hub – Cook Book

> **Projekt:** KI-gestützter Newsletter für AI-News
> **Autor:** Miraiki
> **Kurs:** [Kursname einfügen]
> **Semester:** 5. Semester
> **Letzte Aktualisierung:** 30.04.2026

---

## Inhaltsverzeichnis

1. [Zielsetzung](#1-zielsetzung)
2. [Problemstellung](#2-problemstellung)
3. [Lösungsansatz](#3-lösungsansatz)
4. [Systemarchitektur](#4-systemarchitektur)
5. [Technologie-Stack](#5-technologie-stack)
6. [Setup-Anleitung](#6-setup-anleitung)
7. [Umgebungsvariablen](#7-umgebungsvariablen)
8. [Datenbank-Schema](#8-datenbank-schema)
9. [API-Endpunkte](#9-api-endpunkte)
10. [KI-Integration](#10-ki-integration)
11. [Deployment](#11-deployment)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Zielsetzung

Das Ziel des Projekts ist die Entwicklung einer **automatisierten KI-Newsletter-Plattform**, die:

- **Wöchentlich** aktuelle KI-News, Tools, Tutorials, Prompts, Podcasts, Videos und Reads recherchiert
- Die recherchierten Inhalte **mit einer KI verarbeitet** und in ein strukturiertes JSON-Format bringt
- Die verarbeiteten Inhalte in einer **Datenbank speichert** und auf einer modernen Web-Oberfläche anzeigt
- Eine **Bibliotheksfunktion** bietet, um alle bisherigen Artikel durchsuchbar zu machen
- Ein **Admin-Dashboard** zur Verfügung stellt, um Artikel zu verwalten und KI-Recherchen manuell zu triggern

### Kernziele:
| # | Ziel | Status |
|---|------|--------|
| 1 | Automatisierte KI-Recherche (wöchentlich) | ✅ |
| 2 | Strukturierte Datenspeicherung (JSON-Schema) | ✅ |
| 3 | Volltextsuche + Filter in der Bibliothek | ✅ |
| 4 | Admin-Verwaltung (Artikel-CRUD, Job-Monitoring) | ✅ |
| 5 | OAuth-Authentifizierung (Kimi) | ✅ |
| 6 | Mobile-responsive UI | ✅ |

---

## 2. Problemstellung

### Herausforderungen im KI-News-Bereich:

**Problem 1: Informationsüberflutung**
> Die KI-Branche entwickelt sich rasant. Jeden Tag erscheinen neue Tools, Modelle, Forschungsergebnisse und Ankündigungen. Es ist nahezu unmöglich, manuell alle relevanten Quellen zu verfolgen.

**Problem 2: Fehlende Struktur**
> Rohdaten aus verschiedenen Quellen (RSS-Feeds, Twitter, Reddit, Tech-Blogs) sind unstrukturiert. Es fehlt eine einheitliche Kategorisierung, Tagging und Zusammenfassung.

**Problem 3: Keine zentrale Wissensdatenbank**
> Viele Newsletter-Plattformen zeigen nur aktuelle Inhalte. Ältere Artikel sind nicht durchsuchbar oder archiviert.

**Problem 4: Manuelle Pflege**
> Traditionelle Newsletter-Plattformen erfordern manuelles Copy-Paste von Inhalten. Das ist zeitaufwändig und fehleranfällig.

---

## 3. Lösungsansatz

### Lösung für Problem 1: KI-gestützte Recherche
- Eine **KI-API** (Kimi) recherchiert eigenständig aktuelle KI-News im Internet
- Zwei-Durchlauf-Strategie:
  - **Erster Durchlauf:** KI sucht eigenständig nach Quellen
  - **Zweiter Durchlauf:** KI berücksichtigt bereits verwendete Quellen und sucht zusätzlich nach neuen

### Lösung für Problem 2: Einheitliches JSON-Schema
- Definiertes **Zod-Schema** für KI-Output:
  ```json
  {
    "title": "...",
    "summary": "...",
    "content": "...",
    "category": "news|tools|prompts|...",
    "tags": ["tag1", "tag2", "tag3", "tag4"],
    "sourceName": "TechCrunch",
    "sourceUrl": "https://...",
    "publishedAt": "2026-04-29T10:00:00Z",
    "relevanceScore": 95
  }
  ```
- **Validierung:** Jedes KI-Output wird gegen das Schema geprüft
- **Retry-Logik:** Bei ungültigem JSON werden maximal 3 Versuche unternommen

### Lösung für Problem 3: Bibliotheksfunktion
- **Volltextsuche** über Titel, Summary und Content
- **Filter** nach Kategorie, Tag, Datum und Quelle
- **Paginierung** für große Datenmengen

### Lösung für Problem 4: Automatisierung
- **Wöchentlicher Cronjob:** Jeden Montag um 06:00 Uhr automatische Recherche
- **Job-Tracking:** Fortschritt und Ergebnisse werden in der DB protokolliert
- **Dublettenprüfung:** SHA-256-Hash verhindert doppelte Artikel

---

## 4. Systemarchitektur

```
┌─────────────────────────────────────────────────┐
│  Nutzer (Browser)                                │
│  ─────────────────────────────────────────────  │
│  • React 19 Frontend                            │
│  • Tailwind CSS + shadcn/ui                     │
│  • tRPC Client (TanStack Query)                  │
│  • 3 Pages: Home, Library, Admin                │
└────────────────┬────────────────────────────────┘
                 │ HTTP /api/trpc/*
                 ▼
┌─────────────────────────────────────────────────┐
│  Hono Backend (Node.js)                          │
│  ─────────────────────────────────────────────    │
│  • tRPC Router (publicQuery / adminQuery)        │
│  • Kimi OAuth 2.0 Auth                           │
│  • KI-Client (nur Backend!)                      │
│  • Cronjob-Scheduler                             │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  MySQL 8 Datenbank                               │
│  ─────────────────────────────────────────────   │
│  • 14 Tabellen (Users, Issues, Articles, ...)   │
│  • Drizzle ORM (Planetscale-Mode)                │
└─────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Kimi KI-API                                     │
│  ─────────────────────────────────────────────   │
│  • Web-Search über Prompts                       │
│  • Strukturiertes JSON-Output                    │
│  • Retry + Validierung                           │
└─────────────────────────────────────────────────┘
```

---

## 5. Technologie-Stack

| Layer | Technologie | Version | Zweck |
|-------|-------------|---------|-------|
| **Frontend** | React | 19.2.0 | UI-Framework |
| **Frontend** | TypeScript | 5.9.3 | Typsicherheit |
| **Frontend** | Vite | 7.2.4 | Build-Tool |
| **Frontend** | Tailwind CSS | 3.4.19 | Styling |
| **Frontend** | shadcn/ui | — | UI-Komponenten |
| **Frontend** | React Router | 7.6.1 | Routing |
| **Backend** | Hono | 4.8.3 | Web-Server |
| **Backend** | tRPC | 11.8.1 | API-Router |
| **Backend** | Drizzle ORM | 0.45.1 | Datenbank-Abstraktion |
| **Datenbank** | MySQL | 8.0 | Datenbank |
| **Auth** | Kimi OAuth | 2.0 | Authentifizierung |
| **KI** | Kimi API | k2p5 | Recherche + Verarbeitung |
| **Scheduler** | node-cron | — | Cronjobs |
| **Docker** | Node.js Alpine | 20 | Container |

---

## 6. Setup-Anleitung

### Voraussetzungen
- Node.js ≥ 20.x
- MySQL 8.x (lokal oder Cloud)
- Git
- Kimi-Account (für OAuth + API)

### Schritt 1: Repository klonen
```bash
git clone https://github.com/[dein-username]/ai-newsletter.git
cd ai-newsletter/app
```

### Schritt 2: Abhängigkeiten installieren
```bash
npm install
```

### Schritt 3: Umgebungsvariablen konfigurieren
```bash
cp .env.example .env
# .env mit Editor öffnen und ausfüllen
```

Siehe Abschnitt [7. Umgebungsvariablen](#7-umgebungsvariablen).

### Schritt 4: Datenbank-Migrationen ausführen
```bash
npm run db:generate
npm run db:migrate
```

### Schritt 5: Entwicklungsserver starten
```bash
npm run dev
# → http://localhost:3000
```

### Schritt 6: Production-Build testen
```bash
npm run build
npm start
# → http://localhost:3000
```

---

## 7. Umgebungsvariablen

Erstelle eine `.env`-Datei im Root-Verzeichnis (`app/`):

```bash
# ── Backend ─────────────────────────────────────────────────────
APP_ID=                   # Kimi OAuth Application ID
APP_SECRET=               # Kimi OAuth Application Secret

# ── Datenbank ───────────────────────────────────────────────────
DATABASE_URL=             # MySQL Connection String
                          # Format: mysql://user:pass@host:port/db

# ── Frontend (exposed via Vite) ────────────────────────────────
VITE_KIMI_AUTH_URL=       # Kimi OAuth Server URL
                          # z.B. https://auth.kimi.com
VITE_APP_ID=              # OAuth Application ID

# ── Backend (Auth) ─────────────────────────────────────────────
KIMI_AUTH_URL=            # Kimi OAuth Server URL (Backend)
KIMI_OPEN_URL=            # Kimi Open Platform URL
                          # z.B. https://open.kimi.com

# ── Admin Role ──────────────────────────────────────────────────
OWNER_UNION_ID=           # Deine Kimi Union ID (wird automatisch zu Admin)

# ── AI API (nur Backend, niemals exposen!) ─────────────────────
AI_API_KEY=               # Kimi API Key (z.B. sk-xxxxxxxx)
AI_BASE_URL=              # Kimi API Base URL
                          # z.B. https://api.kimi.com/v1
AI_MODEL=                 # Modell-Name
                          # z.B. kimi-k2p5
```

### Wichtige Hinweise:
- **AI_API_KEY** darf **nie** im Frontend verwendet werden
- **OWNER_UNION_ID** erhält automatisch Admin-Rechte
- In Production: `.env` via Docker-Secrets oder Hosting-Provider verwalten

---

## 8. Datenbank-Schema

### Überblick der Tabellen

| Tabelle | Zweck | Zeilen (ca.) |
|---------|-------|---------------|
| `users` | OAuth-User (Kimi), Rollen, Tiers | 1-1000 |
| `newsletter_issues` | Newsletter-Ausgaben | 1-52/Jahr |
| `news_items` | KI-News-Artikel (Legacy) | — |
| `tool_recommendations` | Tool-Empfehlungen (Legacy) | — |
| `prompt_recommendations` | Prompt-Empfehlungen (Legacy) | — |
| `tutorials` | Tutorials (Legacy) | — |
| `podcasts` | Podcasts (Legacy) | — |
| `videos` | Videos (Legacy) | — |
| `reads` | Reads (Legacy) | — |
| `image_gen_trainings` | Image-Gen (Legacy) | — |
| `subscribers` | E-Mail-Abonnenten | 0-10000 |
| **sources** | Recherche-Quellen | 10-100 |
| **articles** | Vereinheitlichter Content | 100-5000 |
| **jobs** | Cronjob-Tracking | 10-100 |

### Neue Tabellen (KI-gestützte Recherche)

#### `articles` – Vereinheitlichter Content-Store
```sql
CREATE TABLE articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  issue_id BIGINT UNSIGNED,
  source_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT NOT NULL,
  category ENUM('news','tools','prompts','tutorials','podcasts','videos','reads','image_gen') NOT NULL,
  tags TEXT,
  source_name VARCHAR(100) NOT NULL,
  source_url TEXT NOT NULL,
  published_at TIMESTAMP,
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  content_hash VARCHAR(64) NOT NULL UNIQUE,
  status ENUM('draft','review','approved','published','archived') DEFAULT 'draft',
  relevance_score INT DEFAULT 0,
  ai_model VARCHAR(50),
  ai_processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### `sources` – Quellen-Tracking
```sql
CREATE TABLE sources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  type ENUM('rss','api','website') DEFAULT 'website',
  category ENUM('news','tools','prompts','tutorials','podcasts','videos','reads','image_gen') DEFAULT 'news',
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `jobs` – Job-Tracking
```sql
CREATE TABLE jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('weekly_issue','fetch_sources','process_content','send_newsletter','cleanup') NOT NULL,
  status ENUM('pending','running','completed','failed','cancelled') DEFAULT 'pending',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  result_summary TEXT,
  triggered_by ENUM('cron','manual','api') DEFAULT 'cron',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 9. API-Endpunkte

### Auth Router (`auth.`)
| Endpunkt | Auth | Beschreibung |
|----------|------|--------------|
| `auth.me` | ✅ | Aktuellen User zurückgeben |
| `auth.logout` | ✅ | Session-Cookie löschen |

### Newsletter Router – Öffentlich
| Endpunkt | Input | Output |
|----------|-------|--------|
| `getLatest` | — | Aktuellste veröffentlichte Issue |
| `getBySlug` | `{ slug }` | Issue nach Slug |
| `listIssues` | — | Alle veröffentlichten Issues |
| `getIssueContent` | `{ issueId }` | Vollständiger Inhalt |
| `subscribe` | `{ email, name?, tier? }` | E-Mail-Abonnement |
| **searchArticles** | `{ query, category?, tags?, dateFrom?, dateTo? }` | Volltextsuche |
| **listByCategory** | `{ category }` | Artikel nach Kategorie |
| **listTags** | — | Alle eindeutigen Tags |
| **getArticle** | `{ id }` | Einzelner Artikel |

### Newsletter Router – Admin
| Endpunkt | Input | Beschreibung |
|----------|-------|--------------|
| `createIssue` | `{ issueNumber, title, slug }` | Issue erstellen |
| `publishIssue` | `{ issueId }` | Issue veröffentlichen |
| `addNews` / `addTool` / ... | Kategorie-spezifisch | Content hinzufügen |
| **triggerAiResearch** | `{ isFirstRun? }` | KI-Recherche starten |
| **listArticles** | `{ status?, category? }` | Artikel filtern |
| **updateArticle** | `{ id, title?, content?, status? }` | Artikel bearbeiten |
| **deleteArticle** | `{ id }` | Artikel löschen |
| **assignArticlesToIssue** | `{ articleIds[], issueId }` | Zu Issue zuordnen |
| **listJobs** | `{ limit?, status? }` | Jobs anzeigen |
| **getJob** | `{ id }` | Job-Details |

---

## 10. KI-Integration

### Sicherheit
> **Wichtig:** Der KI-API-Token (`AI_API_KEY`) wird **ausschließlich im Backend** verwendet. Das Frontend hat keinen Zugriff auf den Token.

### Architektur
```
Frontend (React) → tRPC → Backend (Hono) → Kimi API
                        ↑
                   AI_API_KEY (aus .env)
```

### Ablauf einer KI-Recherche

1. **Cronjob triggert** (oder Admin klickt "Recherche starten")
2. **System prüft:** Gibt es bereits Quellen in der DB?
   - **Ja:** Zweiter Durchlauf (bekannte + neue Quellen)
   - **Nein:** Erster Durchlauf (eigenständige Recherche)
3. **KI-Call:** Kimi API mit strukturiertem Prompt
4. **JSON-Extraktion:** Aus KI-Output validen JSON parsen
5. **Validierung:** Zod-Schema prüft Struktur (min. 4 Tags, valide URLs, etc.)
6. **Dublettenprüfung:** SHA-256-Hash prüft ob Artikel bereits existiert
7. **Speicherung:** Artikel in `articles`-Tabelle speichern
8. **Quellen-Tracking:** Neue Quellen in `sources`-Tabelle speichern
9. **Job-Status:** Ergebnis in `jobs`-Tabelle protokollieren

### Prompt-Strategie

**Erster Durchlauf:**
```
"Recherchiere aktuelle KI-News aus dem Internet. 
Gib NUR JSON zurück. Mindestens 10 Artikel, 4+ Tags pro Artikel."
```

**Zweiter Durchlauf:**
```
"Bisherige Quellen: [Liste]. Prüfe auf Updates. 
Suche auch nach neuen Quellen. Gib NUR JSON zurück."
```

---

## 11. Deployment

### Option A: Docker (empfohlen)

```bash
# Image bauen
docker build -t ai-newsletter .

# Container starten (mit .env)
docker run -p 3000:3000 --env-file .env ai-newsletter
```

### Option B: Manuell auf Server

```bash
# 1. Code pullen
git pull origin main

# 2. Dependencies
npm ci

# 3. Build
npm run build

# 4. Start
npm start
# → Port 3000

# 5. PM2 (für Production)
npm install -g pm2
pm2 start dist/boot.js --name ai-newsletter
pm2 save
pm2 startup
```

### Option C: Docker Compose (mit MySQL)

Erstelle `docker-compose.yml`:
```yaml
version: '3.8'
services:
  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: newsletter
    volumes:
      - mysql_data:/var/lib/mysql
  app:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      - db

---

## 13. Workflow-System (Neu — Phasen-basierter KI-Recherche-Workflow)

> **Stand:** Mai 2026
> **Ziel:** Granularere, transparente und besser kontrollierbare KI-Recherche

---

### 13.1 Warum ein neues Workflow-System?

Das alte System nutzte **2 riesige Durchläufe** (First Run + Second Run), die ALLE Kategorien auf einmal abdeckten. Das hatte folgende Probleme:

| Problem | Auswirkung |
|---------|------------|
| **KI wird überfordert** | Zu viele Themen gleichzeitig → oberflächliche Ergebnisse |
| **Keine Transparenz** | Man sieht nicht, bei welchem Schritt die KI gerade ist |
| **Schwer debuggbar** | Wenn etwas fehlschlägt, weiß man nicht wo |
| **Keine Feinsteuerung** | Man kann nicht einzelne Themen neu starten |
| **Prompts zu groß** | Kontext-Limit wird schnell erreicht |

**Lösung:** Jedes Thema wird in **5 Phasen** mit **kleinen, spezialisierten Steps** aufgeteilt.

---

### 13.2 Aufbau: Thema → Phasen → Sub-Steps

**Beispiel: "Latest AI News"**

```
Thema: "Latest AI News"
│
├─ Phase 1: RECHERCHE (3 Steps)
│  ├─ Step 1.1: Initial Research
│  │           └─ 3 Standard-Quellen: TechCrunch, The Verge, MIT Technology Review
│  │           └─ Ziel: 5-10 Artikel finden
│  │           └─ Prompt-Fokus: Neue Modelle, Funding, Industry Moves, Policy, Research
│  │
│  ├─ Step 1.2: Quellen-Erweiterung
│  │           └─ Neue Quellen finden: Blogs, Reddit, HN, ArXiv, GitHub
│  │           └─ Ziel: 3+ neue Quellen, 3+ neue Artikel
│  │           └─ Bewertung: Quellen-Verlässlichkeit (1-100)
│  │
│  └─ Step 1.3: Vertiefung
│              └─ Top 5 Artikel vertiefen
│              └─ Mehr Details, verwandte Artikel, Zitate
│              └─ Ziel: Content auf 300-1000 Wörter erweitern
│
├─ Phase 2: SAMMELN & ANALYSE (2 Steps)
│  ├─ Step 2.1: Ergebnisse zusammentragen
│  │           └─ Alle Artikel aus Phase 1 sammeln
│  │           └─ Dubletten entfernen (gleicher Inhalt, andere Quelle)
│  │           └─ RelevanceScore aktualisieren
│  │
│  └─ Step 2.2: Analyse & Bewertung
│              └─ Top-Themen identifizieren
│              └─ Aktivste Player ermitteln
│              └─ Trend-Richtung: Steigend/Fallend/Neutral
│
├─ Phase 3: OPTIMIERUNG (3 Steps)
│  ├─ Step 3.1: Tags generieren & optimieren
│  │           └─ Konsistente Tags (lowercase, Bindestrich)
│  │           └─ Generische Tags entfernen ("ai", "technology")
│  │           └─ Spezifische Tags hinzufügen (Firmen, Modelle, Konzepte)
│  │
│  ├─ Step 3.2: Kürzen & Fokussieren
│  │           └─ Summary: 50-100 Wörter
│  │           └─ Content: 200-500 Wörter
│  │           └─ Maximal 8 Artikel pro Thema
│  │
│  └─ Step 3.3: Priorisierung
│              └─ Top 5 Artikel für Newsletter wählen
│              └─ Reihenfolge: Breaking → Wichtig → Interessant
│              └─ Begründung pro Platzierung
│
├─ Phase 4: FINALISIERUNG (1 Step)
│  └─ Step 4.1: Speicherung
│              └─ Artikel in DB speichern (status: approved)
│              └─ Issue zuordnen (falls vorhanden)
│
└─ Phase 5: VALIDIERUNG (1 Step)
   └─ Step 5.1: Qualitäts-Check
               └─ Deduplizierung (Content-Hash prüfen)
               └─ URL-Validierung
               └─ Tag-Konsistenz prüfen
               └─ RelevanceScore-Plausibilität
```

**Das gleiche Schema gilt für ALLE 8 Themen:**
1. Latest AI News
2. Tool Recommendations
3. Prompt Recommendations
4. Tutorial Research
5. Podcast Research
6. Video Research
7. Read/Article Research
8. Image Gen Training

---

### 13.3 Begründung für die Phasen-Struktur

#### Phase 1: RECHERCHE (3 Steps)
**Warum 3 Steps statt 1?**
- **Step 1.1** sichert konsistente Basis (immer dieselben 3 Quellen)
- **Step 1.2** findet neue Quellen → verhindert Filterblase
- **Step 1.3** vertieft → höhere Qualität statt nur Oberfläche

#### Phase 2: SAMMELN & ANALYSE (2 Steps)
**Warum zusammentragen UND analysieren?**
- **Step 2.1** entfernt Dubletten → saubere Datenbasis
- **Step 2.2** gibt Kontext → Was bedeutet das für die Branche?

#### Phase 3: OPTIMIERUNG (3 Steps)
**Warum 3 Optimierungs-Steps?**
- **Step 3.1** Tags = bessere Suchbarkeit später
- **Step 3.2** Kürzen = Leser bleiben dran (nicht überfordert)
- **Step 3.3** Priorisierung = Nur das Beste landet im Newsletter

#### Phase 4+5: FINALISIERUNG & VALIDIERUNG
**Warum getrennt?**
- **Phase 4** speichert → irreversible Aktion
- **Phase 5** prüft → Fehler werden vor Veröffentlichung gefangen

---

### 13.4 Prompt-Struktur pro Step

Jeder Step hat **2 Prompts**:

| Prompt | Zweck | Inhalt |
|--------|-------|--------|
| **System-Prompt** | Rolle & Regeln definieren | "Du bist ein KI-News-Redakteur..." |
| **User-Prompt** | Konkrete Aufgabe | "Recherchiere aktuelle KI-News für KW 18..." |

**JSON-Schema für jeden Step:**
```json
{
  "articles": [
    {
      "title": "string (5-500 chars)",
      "summary": "string (deutscher Fließtext)",
      "content": "string (ausführlicher Inhalt)",
      "category": "news|tools|prompts|tutorials|podcasts|videos|reads|image_gen",
      "tags": ["string"],
      "sourceName": "string (Original-Quelle)",
      "sourceUrl": "string (valide URL)",
      "publishedAt": "ISO-8601",
      "relevanceScore": 0-100
    }
  ]
}
```

**Regeln für alle Prompts:**
1. **NUR JSON** — Kein Markdown, kein Fließtext
2. **Deutsche Sprache** für summary und content
3. **Tags**: lowercase, konkret, 3-10 Stück
4. **RelevanceScore**: 90-100 = Breaking, 70-89 = Wichtig, 50-69 = Interessant
5. **Quellen**: Original-Quelle mit valider URL

---

### 13.5 Datenbank-Schema (Workflow-Tabellen)

#### `workflows`
```sql
id SERIAL PRIMARY KEY
issue_id INTEGER              -- Zuordnung zu Newsletter-Ausgabe
theme VARCHAR(50)              -- z.B. "news", "tools"
status VARCHAR(20)           -- pending|running|completed|failed|partial
current_phase VARCHAR(50)    -- Aktuelle Phase
current_step VARCHAR(50)     -- Aktueller Step
progress_percent INTEGER     -- 0-100
total_steps INTEGER           -- Gesamtanzahl Steps
started_at TIMESTAMP
completed_at TIMESTAMP
error_message TEXT
created_at TIMESTAMP
```

#### `workflow_steps`
```sql
id SERIAL PRIMARY KEY
workflow_id INTEGER REFERENCES workflows(id)
phase_key VARCHAR(50)        -- z.B. "phase_1_research"
phase_name VARCHAR(100)      -- "Phase 1: Recherche"
step_key VARCHAR(50)         -- z.B. "step_1_1"
step_name VARCHAR(100)      -- "Initial Research"
step_number INTEGER
parent_step_id INTEGER       -- Für Sub-Steps
status VARCHAR(20)           -- pending|running|completed|failed|skipped

-- Prompts
system_prompt TEXT
user_prompt TEXT

-- KI-Output
ai_model VARCHAR(50)
ai_output TEXT               -- Rohes KI-Output
ai_output_parsed TEXT        -- Geparstes JSON

-- Ergebnisse
articles_found INTEGER
articles_saved INTEGER
sources_used TEXT            -- JSON: [{"name":"...","url":"..."}]

-- Metriken
started_at TIMESTAMP
completed_at TIMESTAMP
duration_ms INTEGER          -- Laufzeit
error_message TEXT
created_at TIMESTAMP
```

#### `workflow_step_logs`
```sql
id SERIAL PRIMARY KEY
step_id INTEGER REFERENCES workflow_steps(id)
log_type VARCHAR(20)         -- start|progress|complete|error
message TEXT
metadata TEXT                -- JSON: Zusätzliche Daten
created_at TIMESTAMP
```

---

### 13.6 API-Endpunkte (Workflow)

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `newsletter.startWorkflow` | mutation | Workflow für Thema starten |
| `newsletter.getWorkflow` | query | Workflow mit allen Steps laden |
| `newsletter.executeWorkflowStep` | mutation | Einzelnen Step ausführen |
| `newsletter.retryWorkflowStep` | mutation | Fehlgeschlagenen Step wiederholen |
| `newsletter.skipWorkflowStep` | mutation | Step überspringen |
| `newsletter.listWorkflows` | query | Alle Workflows listen |
| `newsletter.cancelWorkflow` | mutation | Workflow abbrechen |
| `newsletter.getWorkflowStepLogs` | query | Step-Logs laden |

#### Test-Mode
Wenn `TEST_MODE=true` in `.env`: Der Workflow läuft mit Mock-Daten (keine echte API).
Das ist nützlich für:
- Lokale Entwicklung ohne Internet
- UI-Testing
- Demo-Zwecke


---

### 13.7 Admin UI: Workflow-Monitor

**Ansicht:**
```
┌─────────────────────────────────────────────────────────┐
│  🤖 Workflow #42 — Latest AI News                        │
│  Status: 🔄 RUNNING  ████████░░ 40% (4/10 Steps)        │
│  Phase 2/5: SAMMELN & ANALYSE  Step 2.1/2                 │
│  Laufzeit: 3m 45s                                       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Phase 1: RECHERCHE ✅ (3/3 Steps)              │    │
│  │ ├─ Step 1.1 Initial Research       ✅ 45s      │    │
│  │ ├─ Step 1.2 Quellen-Erweiterung    ✅ 1m 12s   │    │
│  │ └─ Step 1.3 Vertiefung            ✅ 38s       │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Phase 2: SAMMELN & ANALYSE 🔄 (1/2 Steps)      │    │
│  │ ├─ Step 2.1 Ergebnisse sammeln    🔄 Läuft...  │    │
│  │ │   Prompt: "Sammle alle Recherche..."         │    │
│  │ │   Artikel bisher: 12                          │    │
│  │ └─ Step 2.2 Analyse             ⏳ Wartet     │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  [🔁 Phase wiederholen] [⏭️ Phase überspringen]           │
│  [📋 Alle Prompts anzeigen] [🛑 Workflow stoppen]       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Step-Detail (onClick):**
- Verwendeter System-Prompt (vollständig)
- Verwendeter User-Prompt (vollständig)
- KI-Output (gekürzt, expandierbar)
- Gefundene Artikel (Liste)
- Laufzeit, Modell, Fehler (falls vorhanden)
- Actions: 🔁 Wiederholen, ⏭️ Überspringen

---

### 13.8 Umsetzungs-Plan

| Phase | Was | Zeit |
|-------|-----|------|
| A | Foundation: Bugfixes, DB-Tabellen, Step-Config-System | ~7h |
| B | Workflow-Engine: startWorkflow, executeStep, Phase 1 Prompts | ~14h |
| C | Admin Workflow-Monitor: Phasen-Boxen, Step-Details, Live-Updates | ~10h |
| D | Admin Artikel-Übersicht: Tabelle, Suche, Bearbeiten, Löschen | ~7h |
| E | Prompts Phase 2-5: Sammeln, Analyse, Tags, Kürzen, Priorisierung | ~10h |
| F | Bibliothek: Datum-Filter, Tag-Filter, Pagination | ~4h |
| G | Testing: Dry-Run, Error Handling, Logging | ~6h |
| **Gesamt** | | **~58h (~4 Wochen)** |

---

### 13.9 Dateien (Workflow-System)

**Neue Files:**
```
api/services/
├── step-configs.ts        # Step-Definitions + Prompts
├── workflow-engine.ts     # Workflow-Logik
└── step-executor.ts       # Einzelnen Step ausführen
```

**Erweiterte Files:**
```
db/schema.ts               # + workflows, + workflow_steps, + workflow_step_logs
api/newsletter-router.ts   # + workflow Endpunkte
src/pages/Admin.tsx        # + Workflow-Monitor Tab
```

---

*Dokumentation erstellt: Mai 2026 — Mira Jr*

```

Starten:
```bash
docker-compose up -d
```

---

## 12. Troubleshooting

### Problem: `Missing required environment variable`
**Lösung:** `.env`-Datei prüfen, alle Variablen ausfüllen. In Production müssen alle Werte gesetzt sein.

### Problem: `Database connection failed`
**Lösung:** 
- MySQL läuft? (`mysql -u root -p`)
- DATABASE_URL Format prüfen: `mysql://user:pass@localhost:3306/dbname`
- Firewall / Port 3306 offen?

### Problem: KI-Call schlägt fehl
**Lösung:**
- `AI_API_KEY` gültig? (Test via `curl`)
- `AI_BASE_URL` korrekt? (`https://api.kimi.com/v1`)
- Rate-Limit erreicht? (Warte 1 Minute)

### Problem: Build schlägt fehl
**Lösung:**
```bash
rm -rf node_modules dist
npm install
npm run build
```

### Problem: Admin-Zugriff verweigert
**Lösung:** `OWNER_UNION_ID` in `.env` muss deine Kimi Union ID sein. Nach Login automatisch Admin.

---

## Anhang A: Projektstruktur

```
ai-newsletter/
├── app/
│   ├── api/              # Backend (Hono + tRPC)
│   │   ├── services/     # KI-Client, Validator, Scheduler
│   │   ├── router.ts       # tRPC-Router
│   │   └── boot.ts         # Server-Entry
│   ├── db/               # Drizzle Schema + Migrations
│   ├── src/              # Frontend (React)
│   │   ├── pages/          # Home, Library, Admin, Login
│   │   ├── sections/       # Landingpage-Sections
│   │   └── components/     # UI-Komponenten
│   ├── public/           # Statische Assets
│   ├── .env.example      # Env-Template
│   ├── Dockerfile        # Docker-Build
│   └── package.json      # Dependencies
├── docs/                 # Dokumentation
└── README.md             # Projekt-README
```

## Anhang B: Feature-Matrix

| Feature | Status |
|---------|--------|
| OAuth-Login (Kimi) | ✅ |
| KI-gestützte Recherche (wöchentlich) | ✅ |
| JSON-Schema + Validierung | ✅ |
| Dublettenprüfung (SHA-256) | ✅ |
| Admin-Dashboard | ✅ |
| Bibliothek (Suche + Filter) | ✅ |
| Artikel-Verwaltung (CRUD) | ✅ |
| Job-Monitoring | ✅ |
| E-Mail-Versand | ❌ |
| Premium-Tier-Gating | ❌ |
| PWA / Offline | ❌ |

---

*Cook Book erstellt am 30.04.2026*
*Autor: Miraiki*
*Projekt: AI Newsletter Hub – Uni-Projekt*
