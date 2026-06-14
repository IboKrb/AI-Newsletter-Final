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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";

import OverviewTab from "./admin/OverviewTab";
import ArticlesTab from "./admin/ArticlesTab";
import WorkflowsTab from "./admin/WorkflowsTab";
import WorkflowBoardTab from "./admin/WorkflowBoardTab";
import RunsTab from "./admin/RunsTab";
import SourcesTab from "./admin/SourcesTab";
import SettingsTab from "./admin/SettingsTab";

type Tab = "overview" | "articles" | "workflows" | "board" | "runs" | "sources" | "settings";

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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (user?.role !== "admin") {
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
          <Button asChild variant="outline" size="sm">
            <Link to="/">
              <ArrowLeft className="mr-1 h-4 w-4" /> Zur Seite
            </Link>
          </Button>
        </div>

        {/* Tab-Navigation */}
        <div className="mb-6 flex flex-wrap gap-1.5 rounded-2xl border border-border bg-card/60 p-1.5 shadow-sm backdrop-blur">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${
                  active
                    ? "bg-brand-gradient text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab-Inhalt */}
        <div className="animate-fade-in">
          {tab === "overview" && <OverviewTab onNavigate={(t) => setTab(t as Tab)} />}
          {tab === "articles" && <ArticlesTab />}
          {tab === "workflows" && <WorkflowsTab onGoToRuns={() => setTab("runs")} />}
          {tab === "board" && <WorkflowBoardTab />}
          {tab === "runs" && <RunsTab />}
          {tab === "sources" && <SourcesTab />}
          {tab === "settings" && <SettingsTab />}
        </div>
      </main>

      <Footer />
    </div>
  );
}
