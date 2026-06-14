import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, ChevronRight, Loader2 } from "lucide-react";
import { RUN_STATUS_STYLES, RUN_STATUS_LABEL, CATEGORY_LABEL, formatDate } from "./constants";
import RunDetail from "./RunDetail";

export default function RunsTab() {
  const [openRun, setOpenRun] = useState<number | null>(null);

  const { data: runs, isLoading } = trpc.workflow.listRuns.useQuery(
    { limit: 100 },
    {
      refetchInterval: (q) =>
        (q.state.data ?? []).some((r) => r.status === "running" || r.status === "pending") ? 2500 : false,
    },
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-emerald-600" />
        <h2 className="text-base font-semibold">Durchläufe / Verlauf</h2>
        <span className="text-sm text-muted-foreground">({runs?.length ?? 0})</span>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Lädt…</p>
          ) : !runs || runs.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Noch keine Durchläufe. Starte einen Workflow im Tab „Workflows".
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {runs.map((r) => {
                const active = r.status === "running" || r.status === "pending";
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => setOpenRun(r.id)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                    >
                      <span className="font-mono text-xs text-muted-foreground">#{r.id}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{r.templateName}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                      </div>
                      <Badge variant="outline" className="hidden sm:inline-flex">
                        {CATEGORY_LABEL[r.category]}
                      </Badge>
                      <span className="hidden w-28 text-xs text-muted-foreground md:block">
                        {r.articlesSaved} Artikel · {r.repetitionsDone}/{r.repetitionsTotal}×
                      </span>
                      <Badge variant="outline" className={RUN_STATUS_STYLES[r.status] ?? ""}>
                        {active && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                        {RUN_STATUS_LABEL[r.status] ?? r.status}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {openRun !== null && <RunDetail runId={openRun} onClose={() => setOpenRun(null)} />}
    </div>
  );
}
