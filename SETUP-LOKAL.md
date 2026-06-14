# 🚀 AI Newsletter Hub — Lokales Setup (Ohne Docker)

## ✅ Voraussetzungen

1. **Node.js 20+** — [Download](https://nodejs.org/)
2. **PostgreSQL 16+** — [Download](https://www.postgresql.org/download/)
3. **Git** (optional)

---

## 📦 Schritt 1: PostgreSQL installieren

### Windows

1. Lade PostgreSQL 16 herunter: https://www.postgresql.org/download/windows/
2. Installiere mit dem Installer (Stack Builder ist optional)
3. Merke dir das **Postgres-Passwort**, das du vergeben hast!
4. Öffne **pgAdmin 4** oder die **SQL Shell (psql)**

### Datenbank + User erstellen

Öffne psql (SQL Shell) und führe aus:

```sql
-- User erstellen
CREATE USER newsletter WITH PASSWORD 'newsletter_secret';

-- Datenbank erstellen
CREATE DATABASE newsletter OWNER newsletter;

-- Rechte geben
GRANT ALL PRIVILEGES ON DATABASE newsletter TO newsletter;
```

### Alternative: PostgreSQL als Windows Service

PostgreSQL läuft nach der Installation automatisch als Windows Service. Du kannst es über `services.msc` verwalten.

---

## 📁 Schritt 2: Projekt einrichten

```bash
# In den app-Ordner wechseln
cd app

# Dependencies installieren
npm install

# .env anpassen (siehe unten)
```

---

## ⚙️ Schritt 3: .env konfigurieren

Die `.env` liegt im `app/` Ordner. Wichtige Werte:

```env
# PostgreSQL (lokal auf deinem PC)
POSTGRES_USER=newsletter
POSTGRES_PASSWORD=newsletter_secret
POSTGRES_DB=newsletter

# Verbindungs-URL (localhost statt Docker-Container)
DATABASE_URL=postgresql://newsletter:newsletter_secret@localhost:5432/newsletter

# 🔑 Wichtig: Dein KI-API Key!
AI_API_KEY=dein-google-gemini-api-key-hier
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
AI_MODEL=gemini-1.5-pro

# Admin Passwort für Login
ADMIN_PASSWORD=dein-geheimes-admin-passwort

# Session Secret (mindestens 32 Zeichen)
SESSION_SECRET=irgendein-sehr-langer-zufälliger-text-1234567890
```

### 🔑 API Key besorgen (Google Gemini — kostenlos!)

1. Gehe zu https://aistudio.google.com/app/apikey
2. Melde dich mit Google an
3. Klicke "Create API Key"
4. Kopiere den Key in `AI_API_KEY=` in deiner `.env`

---

## 🗄️ Schritt 4: Datenbank-Schema anlegen

```bash
# Im app/ Ordner:
npm run db:push
```

Das erstellt alle Tabellen (users, articles, jobs, etc.) in deiner PostgreSQL-DB.

---

## 🚀 Schritt 5: Dev-Server starten

```bash
# Im app/ Ordner:
npm run dev
```

Die App läuft dann auf **http://localhost:3000**

---

## 🔐 Admin Login

1. Gehe zu http://localhost:3000/login
2. Login als Admin:
   - **Username:** `admin`
   - **Password:** Das Passwort aus `ADMIN_PASSWORD` in der `.env`
3. Danach auf http://localhost:3000/admin gehen

---

## 📋 Verfügbare npm Scripts

| Script | Befehl | Was es macht |
|--------|--------|--------------|
| Dev | `npm run dev` | Startet den Dev-Server (Vite + Hono) |
| Build | `npm run build` | Baut für Production |
| DB Push | `npm run db:push` | Schema in DB pushen |
| DB Studio | `npm run db:studio` | Drizzle Studio (DB Browser) |
| Lint | `npm run lint` | ESLint Check |
| Test | `npm run test` | Vitest Tests |

---

## 🛠️ Fehlerbehebung

### "Connection refused" zu PostgreSQL
- Stelle sicher, dass PostgreSQL läuft: `services.msc` → PostgreSQL → Status "Running"
- Prüfe den Port: Standard ist 5432

### "AI API configuration missing"
- `AI_API_KEY` in `.env` ist leer oder ungültig
- Besorge einen kostenlosen Key bei Google AI Studio

### "Port 3000 already in use"
- `taskkill /F /IM node.exe` (Windows)
- Oder: `npm run dev -- --port 3001`

### "Module not found" Fehler
- `npm install` nochmal ausführen
- Node.js Version prüfen: `node --version` (muss 20+ sein)

---

## 📦 Projektstruktur

```
app/
├── api/                    # Backend (tRPC + Hono)
│   ├── router.ts           # Main Router
│   ├── newsletter-router.ts # Newsletter API
│   ├── auth-router.ts      # Auth API
│   ├── services/
│   │   ├── scheduler.ts    # KI-Recherche Logik
│   │   ├── ai-client.ts    # KI-API Client
│   │   └── ...
│   └── ...
├── db/
│   ├── schema.ts           # Datenbank-Schema
│   └── migrations/         # Drizzle Migrations
├── src/
│   ├── pages/
│   │   ├── Admin.tsx       # Admin Dashboard
│   │   ├── Home.tsx        # Landing Page
│   │   ├── Login.tsx       # Login Page
│   │   └── Library.tsx     # Public Library
│   ├── components/         # UI Components
│   └── ...
├── .env                    # Umgebungsvariablen
├── package.json
└── README.md
```

---

## 🎉 Fertig!

Öffne http://localhost:3000 und teste:
- **Landing Page** → Newsletter anzeigen
- **/login** → Admin einloggen
- **/admin** → Artikel verwalten + KI-Recherche triggern
- **/library** → Public Artikel-Suche

Viel Erfolg! 🚀
