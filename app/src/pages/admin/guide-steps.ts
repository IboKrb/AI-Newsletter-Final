import {
  Sparkles, LayoutDashboard, FileText, Workflow, Network, History, Globe, Settings, PartyPopper,
  type LucideIcon,
} from "lucide-react";
import type { AdminTab } from "./constants";

export type GuideStep = {
  /** Ansicht, die zu diesem Schritt geöffnet wird */
  tab?: AdminTab;
  icon: LucideIcon;
  title: string;
  intro: string;
  points: string[];
  tryIt?: string;
};

export const GUIDE_STEPS: GuideStep[] = [
  {
    tab: "overview",
    icon: Sparkles,
    title: "Willkommen im Redaktions-Dashboard",
    intro:
      "Der AI Newsletter Hub recherchiert jede Woche automatisch KI-Inhalte mit Google Gemini, prüft sie und veröffentlicht sie auf der Website. Hier wird diese Pipeline gesteuert und überwacht – der Guide führt dich in zwei Minuten durch alle Bereiche.",
    points: [
      "Workflows legen fest, was recherchiert wird – Prompts, Quellen, Häufigkeit.",
      "Jeder Durchlauf wird protokolliert: genutzte Quellen, gefundene Artikel, Fehler.",
      "Die Ergebnisse erscheinen als Artikel auf der Startseite und in der Bibliothek.",
    ],
  },
  {
    tab: "overview",
    icon: LayoutDashboard,
    title: "Übersicht",
    intro: "Der Zustand des Systems auf einen Blick.",
    points: [
      "Kennzahlen: alle Artikel, davon öffentlich sichtbare, Anzahl der Workflows und Quellen.",
      "„Letzte Durchläufe“ zeigt die jüngsten Recherche-Läufe mit Status: Fertig, Teilweise oder Fehler.",
      "Jede Kachel ist ein Shortcut in den passenden Bereich.",
    ],
    tryIt: "Klicke auf die Kachel „Öffentlich“ – du landest direkt in der Artikelliste.",
  },
  {
    tab: "articles",
    icon: FileText,
    title: "Artikel",
    intro:
      "Hier landen alle Beiträge, die die KI recherchiert hat – mit Zusammenfassung, Volltext, Tags, Originalquelle und Vorschaubild.",
    points: [
      "Suche nach Titeln und filtere nach Status oder Kategorie.",
      "Lebenszyklus: Entwurf (privat) → Veröffentlicht → nach 7 Tagen automatisch archiviert. Archivierte Artikel bleiben in der Bibliothek durchsuchbar.",
      "Per Mehrfachauswahl lassen sich viele Artikel auf einmal veröffentlichen, privat schalten oder löschen.",
    ],
    tryIt: "Filtere nach dem Status „Entwurf (privat)“ – diese Beiträge warten noch auf ihre Freigabe.",
  },
  {
    tab: "workflows",
    icon: Workflow,
    title: "Workflows",
    intro: "Ein Workflow ist ein Recherche-Auftrag an die KI – hier gibt es einen pro Kategorie (News, Tools, Prompts …).",
    points: [
      "System- und User-Prompt bestimmen Rolle, Thema und Qualitätsanspruch der Recherche.",
      "Pro Workflow einstellbar: Wiederholungen, maximale Artikelzahl, Web-Grounding (Live-Websuche) und ob Ergebnisse direkt veröffentlicht oder als Entwurf gespeichert werden.",
      "Aktive Workflows laufen automatisch nach Wochenplan. „Ausführen“ startet sofort – mehrere Läufe werden nacheinander abgearbeitet, um API-Limits zu schonen.",
    ],
    tryIt: "Klicke bei einem Workflow auf das Stift-Symbol, um seine Prompts anzusehen.",
  },
  {
    tab: "board",
    icon: Network,
    title: "Board",
    intro: "Die Pipeline als Ablaufdiagramm, ähnlich wie in n8n. Jeder Knoten ist ein echter Verarbeitungsschritt der Engine.",
    points: [
      "Scheduler → Standard- und rotierende Quellen → Gemini-Recherche mit Web-Grounding.",
      "Danach: Validierung & Dublettenprüfung, Auto-Tagging, Bild- und Link-Check, Speichern und Freigabe.",
      "Links wählst du einen Durchlauf – die Knoten zeigen dann dessen Status (grün = erledigt, rot = Fehler).",
    ],
    tryIt: "Klicke auf den Knoten „Gemini-Recherche“. Mit dem Mausrad zoomen, mit gedrückter Maustaste verschieben.",
  },
  {
    tab: "runs",
    icon: History,
    title: "Durchläufe",
    intro: "Das Protokoll jeder Ausführung – laufende Workflows aktualisieren sich hier live.",
    points: [
      "Pro Lauf: Status, gefundene und gespeicherte Artikel, übersprungene Duplikate und Dauer.",
      "In der Detailansicht stehen alle genutzten Quellen: Standard, rotierend und die von Gemini neu entdeckten Web-Quellen.",
      "Fehler bleiben nachvollziehbar – etwa ein API-Ratenlimit (429), nach dem die nächste Wiederholung trotzdem Ergebnisse lieferte (Status „Teilweise“).",
    ],
    tryIt: "Öffne den Lauf „Tutorials“ und sieh dir im Verlauf an, wie das System mit dem Ratenlimit umgeht.",
  },
  {
    tab: "sources",
    icon: Globe,
    title: "Quellen",
    intro: "Die Websites, die die KI bei der Recherche gezielt durchsuchen soll.",
    points: [
      "Standard-Quellen (bis zu 5 pro Kategorie) werden bei jedem Lauf genutzt und sichern die Grundqualität.",
      "Alle anderen bilden einen Rotations-Pool: Pro Lauf kommen bis zu 5 hinzu, die am längsten nicht genutzt wurden.",
      "Quellen, aus denen Artikel stammen, landen automatisch im Pool – das System erweitert sein Quellennetz selbst.",
    ],
    tryIt: "Filtere nach einer Kategorie und vergleiche Standard- und Pool-Quellen.",
  },
  {
    tab: "settings",
    icon: Settings,
    title: "Einstellungen",
    intro: "Konfiguration der KI-Anbindung und des automatischen Wochenlaufs.",
    points: [
      "Gemini-API-Key (wird nur maskiert angezeigt), Modellauswahl und „Verbindung testen“.",
      "Web-Grounding schaltet die Live-Google-Suche zu; der Test-Modus liefert Beispieldaten ohne API-Key.",
      "Wochenplan: Wochentag und Uhrzeit, zu der alle aktiven Workflows automatisch laufen (Zeitzone Europe/Berlin).",
    ],
    tryIt: "Sieh unter „Automatischer Wochenlauf“ nach, wann die nächste Recherche geplant ist.",
  },
  {
    icon: PartyPopper,
    title: "Geschafft!",
    intro: "Das war der Rundgang durch das Dashboard. Jetzt lohnt sich der Blick auf das Ergebnis aus Lesersicht:",
    points: [
      "Startseite: die aktuelle Ausgabe, gruppiert nach Kategorien.",
      "Bibliothek: Volltextsuche sowie Kategorie- und Tag-Filter über alle Artikel inklusive Archiv.",
      "Technik: React + TypeScript, tRPC & Hono, PostgreSQL mit Drizzle ORM, Google Gemini API, Docker/Coolify.",
    ],
  },
];

/** Der Guide-Schritt, der eine Ansicht erklärt (der Willkommens-Schritt zählt nicht). */
export function guideStepFor(tab: AdminTab): number {
  const i = GUIDE_STEPS.findIndex((s, idx) => idx > 0 && s.tab === tab);
  return i === -1 ? 0 : i;
}
