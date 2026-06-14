import { createHash } from "crypto";
import { eq } from "drizzle-orm";
import { getDb } from "../queries/connection";
import * as schema from "@db/schema";

/**
 * Erzeugt einen SHA-256 Hash aus URL + Titel für Dublettenprüfung.
 */
export function hashContent(url: string, title: string): string {
  return createHash("sha256")
    .update(`${url.trim().toLowerCase()}:${title.trim().toLowerCase()}`)
    .digest("hex");
}

/**
 * Prüft ob ein Artikel mit diesem Hash bereits existiert.
 */
export async function isDuplicate(hash: string): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select({ id: schema.articles.id })
    .from(schema.articles)
    .where(eq(schema.articles.contentHash, hash))
    .limit(1);
  return rows.length > 0;
}
