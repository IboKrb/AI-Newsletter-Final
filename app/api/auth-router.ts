import * as cookie from "cookie";
import { z } from "zod";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { signSessionToken } from "./auth/session";
import { verifyPassword } from "./auth/password";
import { findUserByUsername, upsertUser } from "./queries/users";
import { env } from "./lib/env";

export const authRouter = createRouter({
  me: authedQuery.query((opts) => opts.ctx.user),
  
  login: publicQuery
    .input(z.object({ username: z.string(), password: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { username, password } = input;
        
        console.log("🔐 Login Versuch:", { username, adminPasswordSet: !!env.adminPassword });
        
        // Prüfe ob ADMIN_PASSWORD gesetzt ist
        if (!env.adminPassword) {
          console.error("❌ ADMIN_PASSWORD nicht gesetzt!");
          throw new Error("Server nicht konfiguriert — ADMIN_PASSWORD fehlt in .env");
        }
        
        // Verify password against env ADMIN_PASSWORD
        const passwordValid = verifyPassword(password);
        console.log("🔐 Passwort prüfen:", { valid: passwordValid });
        
        if (!passwordValid) {
          throw new Error("Ungültige Zugangsdaten");
        }
        
        // Find or create admin user
        let user;
        try {
          user = await findUserByUsername(username);
        } catch (dbError) {
          console.error("❌ DB Fehler beim Login:", dbError);
          throw new Error(
            "Datenbank-Fehler: Die 'users' Tabelle existiert nicht. " +
            "Bitte führe 'npm run db:push' aus um die Tabellen zu erstellen."
          );
        }
        
        console.log("👤 User gefunden:", { user: user ? `ID ${user.id}` : "nein" });
        
        if (!user) {
          console.log("👤 Erstelle neuen User...");
          try {
            await upsertUser({
              username,
              passwordHash: password,
              name: "Admin",
              role: "admin",
            });
            user = await findUserByUsername(username);
            console.log("👤 User erstellt:", { user: user ? `ID ${user.id}` : "FEHLER" });
          } catch (dbError) {
            console.error("❌ DB Fehler beim User erstellen:", dbError);
            throw new Error(
              "Datenbank-Fehler: Konnte User nicht erstellen. " +
              "Bitte führe 'npm run db:push' aus."
            );
          }
        }
        
        if (!user) {
          throw new Error("User konnte nicht erstellt werden");
        }
        
        const token = await signSessionToken({
          userId: user.id,
          username: user.username,
          role: user.role,
        });
        console.log("🔑 Token erstellt");
        
        const opts = getSessionCookieOptions(ctx.req.headers);
        ctx.resHeaders.append(
          "set-cookie",
          cookie.serialize(Session.cookieName, token, {
            httpOnly: opts.httpOnly,
            path: opts.path,
            sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
            secure: opts.secure,
            maxAge: Session.maxAgeMs / 1000,
          }),
        );
        console.log("🍪 Cookie gesetzt");
        
        return { success: true, user: { id: user.id, username: user.username, name: user.name, role: user.role } };
      } catch (error) {
        console.error("❌ Login Fehler:", error);
        const message = error instanceof Error ? error.message : "Unbekannter Server-Fehler";
        throw new Error(`Login fehlgeschlagen: ${message}`);
      }
    }),
  
  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    return { success: true };
  }),
});
