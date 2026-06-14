export const CATEGORIES = [
  { value: "news", label: "News" },
  { value: "tools", label: "Tools" },
  { value: "prompts", label: "Prompts" },
  { value: "tutorials", label: "Tutorials" },
  { value: "podcasts", label: "Podcasts" },
  { value: "videos", label: "Videos" },
  { value: "reads", label: "Reads" },
  { value: "image_gen", label: "Image Gen" },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label]),
);

export const ARTICLE_STATUS = [
  { value: "draft", label: "Entwurf (privat)" },
  { value: "review", label: "Review" },
  { value: "approved", label: "Freigegeben" },
  { value: "published", label: "Veröffentlicht (öffentlich)" },
  { value: "archived", label: "Archiviert" },
] as const;

export const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  review: "bg-amber-100 text-amber-700 border-amber-200",
  approved: "bg-teal-100 text-teal-700 border-teal-200",
  published: "bg-emerald-100 text-emerald-700 border-emerald-200",
  archived: "bg-rose-100 text-rose-700 border-rose-200",
};

export const RUN_STATUS_STYLES: Record<string, string> = {
  pending: "bg-slate-100 text-slate-600 border-slate-200",
  running: "bg-sky-100 text-sky-700 border-sky-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  partial: "bg-amber-100 text-amber-700 border-amber-200",
  failed: "bg-rose-100 text-rose-700 border-rose-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
};

export const RUN_STATUS_LABEL: Record<string, string> = {
  pending: "Wartet",
  running: "Läuft",
  completed: "Fertig",
  partial: "Teilweise",
  failed: "Fehler",
  cancelled: "Abgebrochen",
};

export const SOURCE_KIND_LABEL: Record<string, string> = {
  standard: "Standard",
  rotating: "Rotierend",
  discovered: "Entdeckt",
  manual: "Manuell",
};

export const SOURCE_KIND_STYLES: Record<string, string> = {
  standard: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rotating: "bg-teal-100 text-teal-700 border-teal-200",
  discovered: "bg-sky-100 text-sky-700 border-sky-200",
  manual: "bg-violet-100 text-violet-700 border-violet-200",
};

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function parseTags(tags: string | null | undefined): string[] {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
