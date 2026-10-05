import { useState } from "react";
import { Link } from "react-router";
import {
  Shield,
  LayoutDashboard,
  FileText,
  Workflow,
  Network,
  History,
  Globe,
  Settings,
  ArrowLeft,
  AlertTriangle,
  Eye,
  Compass,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Paths, isDemoUser } from "@contracts/constants";

import OverviewTab from "./admin/OverviewTab";
import ArticlesTab from "./admin/ArticlesTab";
import WorkflowsTab from "./admin/WorkflowsTab";
import WorkflowBoardTab from "./admin/WorkflowBoardTab";
import RunsTab from "./admin/RunsTab";
import SourcesTab from "./admin/SourcesTab";
import SettingsTab from "./admin/SettingsTab";
import AdminGuide from "./admin/AdminGuide";
import { GUIDE_STEPS, guideStepFor } from "./admin/guide-steps";
import type { AdminTab as Tab } from "./admin/constants";

const GUIDE_SEEN_KEY = "admin-guide-seen";

function readGuideSeen(): boolean {
  try {
    return localStorage.getItem(GUIDE_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

const TABS: { id: Tab; label: string; icon: typeof FileText }[] = [
  { id: "overview", label: "Übersicht", icon: LayoutDashboard },
  { id: "articles", label: "Artikel", icon: FileText },
  { id: "workflows", label: "Workflows", icon: Workflow },
  { id: "board", label: "Board", icon: Network },
  { id: "runs", label: "Durchläufe", icon: History },
  { id: "sources", label: "Quellen", icon: Globe },
  { id: "settings", label: "Einstellungen", icon: Settings },
];

export default function Admin() {
  const { user, isLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const isDemo = isDemoUser(user);

  // Klick-Guide: Demo-Besucher bekommen ihn beim ersten Besuch automatisch angezeigt
  const [guideStep, setGuideStep] = useState<number | null>(null);
  const [autoGuide, setAutoGuide] = useState(() => !readGuideSeen());
  const activeGuideStep = guideStep ?? (isDemo && autoGuide ? 0 : null);

  const showGuideStep = (step: number) => {
    setGuideStep(step);
    const target = GUIDE_STEPS[step].tab;
    if (target) setTab(target);
  };
  const closeGuide = () => {
    setGuideStep(null);
    setAutoGuide(false);
    try {
      localStorage.setItem(GUIDE_SEEN_KEY, "1");
    } catch {
      /* Speicher nicht verfügbar – Guide erscheint dann ggf. erneut */
    }
  };
  // Tabwechsel bei offenem Guide springt zum passenden Guide-Schritt
  const openTab = (next: Tab) => {
    setTab(next);
    if (activeGuideStep !== null) setGuideStep(guideStepFor(next));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (user?.role !== "admin" && !isDemo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="max-w-md text-center shadow-sm">
          <CardHeader>
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
            <CardTitle>Zugriff verweigert</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Diese Seite ist nur für Admins zugänglich.</p>
            <Button asChild className="w-full bg-brand-gradient text-white">
              <Link to="/login">Zum Login</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to={Paths.demo}>
                <Eye className="mr-2 h-4 w-4" /> Demo ansehen
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar user={user} isLoading={isLoading} />

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient shadow-md shadow-emerald-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Recherche-Workflows, Artikel & Quellen verwalten
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="bg-brand-gradient text-white" onClick={() => showGuideStep(0)}>
              <Compass className="mr-1 h-4 w-4" /> Klick-Guide starten
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/">
                <ArrowLeft className="mr-1 h-4 w-4" /> Zur Seite
              </Link>
            </Button>
          </div>
        </div>

        {isDemo && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <Eye className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              <span className="font-semibold">Demo-Modus:</span> Du siehst das echte Dashboard mit
              Lesezugriff – Artikel, Workflows, Board, Durchläufe, Quellen und Einstellungen. Speichern,
              Löschen und das Starten von Workflows sind deaktiviert.{" "}
              <button onClick={() => showGuideStep(0)} className="font-semibold underline underline-offset-2">
                Klick-Guide starten
              </button>
            </p>
          </div>
        )}

        {/* Tab-Navigation */}
        <div className="mb-6 flex flex-wrap gap-1.5 rounded-2xl border border-border bg-card/60 p-1.5 shadow-sm backdrop-blur">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => openTab(t.id)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${
                  active
                    ? "bg-brand-gradient text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                } ${active && activeGuideStep !== null ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-card" : ""}`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
          <button
            onClick={() => showGuideStep(guideStepFor(tab))}
            className="ml-auto flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50"
          >
            <HelpCircle className="h-4 w-4" /> Was passiert hier?
          </button>
        </div>

        {/* Tab-Inhalt */}
        <div className="animate-fade-in">
          {tab === "overview" && <OverviewTab onNavigate={(t) => openTab(t as Tab)} />}
          {tab === "articles" && <ArticlesTab />}
          {tab === "workflows" && <WorkflowsTab onGoToRuns={() => setTab("runs")} />}
          {tab === "board" && <WorkflowBoardTab />}
          {tab === "runs" && <RunsTab />}
          {tab === "sources" && <SourcesTab />}
          {tab === "settings" && <SettingsTab />}
        </div>
      </main>

      <Footer />

      {activeGuideStep !== null && (
        <AdminGuide step={activeGuideStep} onStepChange={showGuideStep} onClose={closeGuide} />
      )}
    </div>
  );
}
