# 🚀 Deployment auf Coolify

Diese App wird als **ein** Docker-Compose-Stack (App + PostgreSQL) deployed.

## Voraussetzungen
- Eine laufende [Coolify](https://coolify.io)-Instanz
- Dieses Projekt in einem Git-Repository (GitHub/GitLab/Gitea)

---

## 1. Repository vorbereiten
Stelle sicher, dass die folgenden Dateien im Repo-Root liegen (sind enthalten):
- `docker-compose.yml` — App + PostgreSQL
- `app/Dockerfile` — Build der App
- `.env.example` — Vorlage der Umgebungsvariablen

Push das Projekt in dein Git-Repository.

---

## 2. Neue Resource in Coolify anlegen
1. **+ New Resource → Docker Compose** (Compose-basiertes Deployment).
2. Verbinde dein Git-Repository und wähle den Branch.
3. **Compose file**: `docker-compose.yml` (Root).
4. Build Pack: *Docker Compose*.

---

## 3. Environment Variables setzen
Trage unter **Environment Variables** mindestens ein (siehe `.env.example`):

| Variable | Beispiel / Hinweis |
|----------|--------------------|
| `POSTGRES_USER` | `newsletter` |
| `POSTGRES_PASSWORD` | **sicheres Passwort** |
| `POSTGRES_DB` | `newsletter` |
| `ADMIN_PASSWORD` | **dein Admin-Login-Passwort** |
| `SESSION_SECRET` | langer Zufallsstring (≥ 32 Zeichen) |
| `AI_API_KEY` | *optional* — besser später in der UI eintragen |
| `AI_MODEL` | `gemini-2.5-flash` |
| `TEST_MODE` | `false` (oder `true` zum Ausprobieren ohne Key) |

> Der **Gemini-Token muss nicht hier** gesetzt werden — du kannst ihn nach dem
> Deploy bequem im Admin-Bereich unter **Einstellungen** eingeben.

---

## 4. Domain & Port
- Die App lauscht auf **Port 3000**.
- Weise in Coolify deine Domain dem **`app`**-Service (Port 3000) zu.
- Healthcheck-Endpoint: **`/health`** (liefert `{ "ok": true }`).

---

## 5. Persistenz
Die Datenbank nutzt das Named Volume **`postgres_data`** — bleibt über Redeploys
erhalten. (In Coolify als Persistent Storage sichtbar.)

---

## 6. Deploy
1. **Deploy** klicken.
2. Beim ersten Start führt der App-Container automatisch `npm run db:push` aus
   (legt alle Tabellen an) und seedet Default-Workflows + Standard-Quellen.
3. Logs prüfen: „Server running on http://0.0.0.0:3000/".

---

## 7. Erste Schritte nach dem Deploy
1. Öffne `https://deine-domain` → Landing Page.
2. **Login**: `https://deine-domain/login` → Benutzer `admin`, Passwort = `ADMIN_PASSWORD`.
3. **Admin → Einstellungen**: Gemini-API-Key eintragen
   ([hier kostenlos holen](https://aistudio.google.com/app/apikey)),
   „Verbindung testen", speichern. `TEST_MODE` ausschalten.
4. **Admin → Workflows**: einen Workflow „Ausführen" → unter **Durchläufe**
   den Live-Status, genutzte Quellen und Ergebnisse verfolgen.
5. **Admin → Artikel**: Ergebnisse prüfen, bearbeiten und auf „öffentlich" stellen.
6. Öffentliche Artikel erscheinen in der **Bibliothek** (Such-/Tag-Filter).

---

## Updates / Redeploy
Push auf den verbundenen Branch → Coolify baut neu. `db:push` ist idempotent;
Schema-Änderungen werden automatisch angewendet.

## Lokal testen (optional)
```bash
cp .env.example .env   # Werte anpassen
docker compose up --build
# App: http://localhost:3000   ·   Health: http://localhost:3000/health
```
