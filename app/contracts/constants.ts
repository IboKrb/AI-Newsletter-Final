export const Session = {
  cookieName: "session_sid",
  maxAgeMs: 365 * 24 * 60 * 60 * 1000,
} as const;

export const ErrorMessages = {
  unauthenticated: "Authentication required",
  insufficientRole: "Insufficient permissions",
  demoReadOnly: "Demo-Modus: Nur Lesezugriff – Änderungen sind deaktiviert.",
} as const;

export const Paths = {
  login: "/login",
  demo: "/demo",
} as const;

// Öffentlicher Demo-Zugang: sieht das Admin-Dashboard, darf aber nichts ändern.
export const Demo = {
  username: "demo",
  displayName: "Demo-Gast",
} as const;

export function isDemoUser(user: { username: string; role: string } | null | undefined): boolean {
  return !!user && user.role !== "admin" && user.username === Demo.username;
}
