# ── Dependencies ──────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --prefer-offline --no-audit

# ── Build (Frontend + Server-Bundle) ──────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── Production ────────────────────────────────────────────────────
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Laufzeit-Abhängigkeiten (inkl. drizzle-kit für db:push beim Start)
COPY --from=deps /app/node_modules ./node_modules
# Build-Artefakte: dist/boot.js + dist/public
COPY --from=build /app/dist ./dist
# Für Migrationen (drizzle-kit push) zur Laufzeit benötigt
COPY --from=build /app/db ./db
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY package.json ./

EXPOSE 3000

# Healthcheck für Coolify / Docker
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

# Schema sicherstellen (idempotent, --force = non-interaktiv), dann starten
CMD ["sh", "-c", "npm run db:push && npm start"]
