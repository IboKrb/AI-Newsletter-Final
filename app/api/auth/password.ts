import { env } from "../lib/env";

// Simple password comparison (in production use bcrypt)
export function verifyPassword(password: string): boolean {
  return password === env.adminPassword;
}

export function hashPassword(password: string): string {
  // In production, use bcrypt or argon2
  // For now, we store plaintext comparison against env var
  return password;
}
