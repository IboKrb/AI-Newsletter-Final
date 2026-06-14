import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExternalLink, Ban, Clock, CheckCircle2, AlertCircle, Info } from "lucide-react";
import {
  RUN_STATUS_STYLES, RUN_STATUS_LABEL, SOURCE_KIND_LABEL, SOURCE_KIND_STYLES, formatDate,
} from "./constants";

const LOG_ICON: Record<string, typeof Info> = {
  info: Info,
  progress: Clock,
  success: CheckCircle2,
  error: AlertCircle,
};
const LOG_COLOR: Record<string, string> = {
  info: "text-slate-500",
  progress: "text-sky-600",
  success: "text-emerald-600",
  error: "text-rose-600",
};

export default function RunDetail({ runId, onClose }: { runId: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const { data: run } = trpc.workflow.getRun.useQuery(
    { id: runId },
    { refetchInterval: (q) => (q.state.data?.status === "running" || q.state.data?.status === "pending" ? 2000 : false) },
  );

  const cancel = trpc.workflow.cancelRun.useMutation({
    onSuccess: () => { toast.success("Lauf abgebrochen"); utils.workflow.getRun.invalidate({ id: runId }); },
    onError: (e) => toast.error(e.message),
  });

  const isActive = run?.status === "running" || run?.status === "pending";

  type RunSource = NonNullable<typeof run>["sources"][number];
  const sourcesByKind: Record<string, RunSource[]> = {};
  for (const s of run?.sources ?? []) {
    (sourcesByKind[s.kind] ??= []).push(s);
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {run?.templateName ?? `Lauf #${runId}`}
            {run && (
              <Badge variant="outline" className={RUN_STATUS_STYLES[run.status] ?? ""}>
                {RUN_STATUS_LABEL[run.status] ?? run.status}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {!run ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Lädt…</p>
        ) : (
          <div className="space-y-5">
            {/* Fortschritt */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Wiederholung {run.repetitionsDone}/{run.repetitionsTotal}
                </span>
                <span className="font-medium">{run.progressPercent}%</span>
              </div>
              <Progress value={run.progressPercent} />
            </div>

            {/* Kennzahlen */}
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {[
                { label: "Gefunden", value: run.articlesFound },
                { label: "Gespeichert", value: run.articlesSaved },
                { label: "Duplikate", value: run.duplicatesSkipped },
                { label: "Dauer", value: run.durationMs ? `${Math.round(run.durationMs / 1000)}s` : "—" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-muted/40 p-3 text-center">
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>Gestartet: {formatDate(run.startedAt)}</span>
              <span>Beendet: {formatDate(run.finishedAt)}</span>
              <span>Ausgelöst: {run.triggeredBy}</span>
            </div>

            {isActive && (
              <Button variant="outline" size="sm" className="text-rose-600" onClick={() => cancel.mutate({ id: runId })}>
                <Ban className="mr-2 h-4 w-4" /> Lauf abbrechen
              </Button>
            )}

            {run.errorMessage && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {run.errorMessage}
              </div>
            )}

            {/* Quellen */}
            <div>
              <h4 className="mb-2 text-sm font-semibold">Genutzte Quellen ({run.sources.length})</h4>
              {run.sources.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch keine Quellen erfasst.</p>
              ) : (
                <div className="space-y-3">
                  {["standard", "rotating", "manual", "discovered"].map((kind) =>
                    sourcesByKind[kind]?.length ? (
                      <div key={kind}>
                        <Badge variant="outline" className={`mb-1.5 ${SOURCE_KIND_STYLES[kind]}`}>
                          {SOURCE_KIND_LABEL[kind]} ({sourcesByKind[kind].length})
                        </Badge>
                        <ul className="space-y-1">
                          {sourcesByKind[kind].map((s) => (
                            <li key={s.id} className="flex items-center gap-1.5 text-sm">
                              <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                              {s.url ? (
                                <a href={s.url} target="_blank" rel="noreferrer" className="truncate hover:text-emerald-600">
                                  {s.name}
                                </a>
                              ) : (
                                <span className="truncate">{s.name}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null,
                  )}
                </div>
              )}
            </div>

            {/* Logs */}
            <div>
              <h4 className="mb-2 text-sm font-semibold">Verlauf</h4>
              <ul className="space-y-1.5">
                {run.logs.map((l) => {
                  const Icon = LOG_ICON[l.level] ?? Info;
                  return (
                    <li key={l.id} className="flex items-start gap-2 text-sm">
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${LOG_COLOR[l.level] ?? ""}`} />
                      <span className="flex-1">{l.message}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatDate(l.createdAt)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
