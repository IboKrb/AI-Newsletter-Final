import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Workflow, History, Globe, CheckCircle2, ArrowRight } from "lucide-react";
import { RUN_STATUS_STYLES, RUN_STATUS_LABEL, formatDate } from "./constants";

export default function OverviewTab({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { data: allArticles } = trpc.newsletter.listArticles.useQuery({ limit: 1, offset: 0 });
  const { data: publishedArticles } = trpc.newsletter.listArticles.useQuery({
    status: "published",
    limit: 1,
    offset: 0,
  });
  const { data: templates } = trpc.workflow.listTemplates.useQuery();
  const { data: runs } = trpc.workflow.listRuns.useQuery({ limit: 5 });
  const { data: sources } = trpc.workflow.listSources.useQuery();

  const stats = [
    {
      label: "Artikel gesamt",
      value: allArticles?.total ?? 0,
      icon: FileText,
      tab: "articles",
      tint: "from-emerald-500 to-teal-500",
    },
    {
      label: "Öffentlich",
      value: publishedArticles?.total ?? 0,
      icon: CheckCircle2,
      tab: "articles",
      tint: "from-teal-500 to-cyan-500",
    },
    {
      label: "Workflows",
      value: templates?.length ?? 0,
      icon: Workflow,
      tab: "workflows",
      tint: "from-cyan-500 to-sky-500",
    },
    {
      label: "Quellen",
      value: sources?.length ?? 0,
      icon: Globe,
      tab: "sources",
      tint: "from-emerald-500 to-green-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Kennzahlen */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.label}
              onClick={() => onNavigate(s.tab)}
              className="card-hover group rounded-2xl border border-border bg-card p-5 text-left shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.tint} text-white shadow-sm`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="mt-3 text-3xl font-bold tracking-tight">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </button>
          );
        })}
      </div>

      {/* Letzte Durchläufe */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-emerald-600" /> Letzte Durchläufe
          </CardTitle>
          <button
            onClick={() => onNavigate("runs")}
            className="link-underline text-sm font-medium text-emerald-600"
          >
            Alle ansehen
          </button>
        </CardHeader>
        <CardContent>
          {!runs || runs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Noch keine Durchläufe. Starte einen Workflow im Tab „Workflows".
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {runs.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.templateName}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {r.articlesSaved} Artikel
                    </span>
                    <Badge
                      variant="outline"
                      className={RUN_STATUS_STYLES[r.status] ?? ""}
                    >
                      {RUN_STATUS_LABEL[r.status] ?? r.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
