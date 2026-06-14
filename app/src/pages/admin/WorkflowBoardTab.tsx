import { useEffect, useRef, useState } from "react";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Clock, Globe, Shuffle, Search, ShieldCheck, Tags, ImageIcon, Save, Send,
  Play, Plus, Minus, Maximize, X, Loader2, ExternalLink,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { RUN_STATUS_STYLES, RUN_STATUS_LABEL, SOURCE_KIND_LABEL, formatDate } from "./constants";

// ─── Pipeline-Definition (entspricht der echten Engine) ──────────────────────
type NodeDef = {
  id: string;
  x: number;
  y: number;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  info: string;
  stage: "trigger" | "sources" | "research" | "process" | "save" | "publish";
};

const NODE_W = 184;
const NODE_H = 66;

const NODES: NodeDef[] = [
  { id: "trigger", x: 40, y: 170, title: "Scheduler", subtitle: "wöchentlich / manuell", icon: Clock, stage: "trigger",
    info: "Startet den Workflow – automatisch per Cron (Wochentag & Uhrzeit konfigurierbar) oder manuell über „Starten“." },
  { id: "standard", x: 290, y: 60, title: "Standard-Quellen", subtitle: "5 feste Quellen", icon: Globe, stage: "sources",
    info: "Fünf feste Standardquellen der Kategorie werden bei jedem Lauf durchsucht – das sichert die Grundqualität." },
  { id: "rotating", x: 290, y: 280, title: "Rotierende Quellen", subtitle: "5 wechselnde", icon: Shuffle, stage: "sources",
    info: "Pro Lauf kommen bis zu fünf rotierende Quellen dazu (am längsten nicht genutzt). So entdeckt das System Neues." },
  { id: "research", x: 545, y: 170, title: "Gemini-Recherche", subtitle: "Web-Grounding · N×", icon: Search, stage: "research",
    info: "Google Gemini recherchiert live im Web (Google-Search-Grounding) und liefert Artikel + echte Quellen. Wird je nach Template mehrfach wiederholt." },
  { id: "validate", x: 800, y: 60, title: "Validierung & Dedupe", subtitle: "Schema · Duplikate", icon: ShieldCheck, stage: "process",
    info: "Ergebnisse werden gegen ein Schema geprüft, Duplikate per Inhalts-Hash entfernt und tote Quell-Links durch echte ersetzt." },
  { id: "tagging", x: 800, y: 280, title: "Auto-Tagging", subtitle: "Schlagworte", icon: Tags, stage: "process",
    info: "Automatische Verschlagwortung (z. B. openai, claude-code, pdf) – Basis für die Suche in der Bibliothek." },
  { id: "media", x: 1055, y: 170, title: "Bild & URL-Check", subtitle: "Vorschau", icon: ImageIcon, stage: "process",
    info: "Vorschaubild ermitteln (YouTube-Thumbnail bzw. og:image) und Erreichbarkeit der Quelle prüfen." },
  { id: "save", x: 1310, y: 60, title: "Entwurf speichern", subtitle: "Status: Entwurf", icon: Save, stage: "save",
    info: "Neue Artikel werden als Entwurf gespeichert – inkl. Tags, Vorschaubild und Relevanz-Score." },
  { id: "publish", x: 1310, y: 280, title: "Freigabe → Live", subtitle: "manuell", icon: Send, stage: "publish",
    info: "Nach manueller Freigabe erscheint der Artikel öffentlich auf der Webseite. Der Mensch bleibt im Qualitäts-Gate." },
];

const CONNECTIONS: [string, string][] = [
  ["trigger", "standard"], ["trigger", "rotating"],
  ["standard", "research"], ["rotating", "research"],
  ["research", "validate"], ["research", "tagging"],
  ["validate", "media"], ["tagging", "media"],
  ["media", "save"], ["save", "publish"],
];

type NStatus = "pending" | "running" | "completed" | "failed";

const STATUS_DOT: Record<NStatus, string> = {
  pending: "#cbd5e1", running: "#f59e0b", completed: "#10b981", failed: "#f43f5e",
};

type RunData = NonNullable<ReturnType<typeof useRunQuery>["data"]>;

function useRunQuery(id: number | null) {
  return trpc.workflow.getRun.useQuery(
    { id: id ?? 0 },
    {
      enabled: id !== null,
      refetchInterval: (q) =>
        q.state.data?.status === "running" || q.state.data?.status === "pending" ? 2000 : false,
    },
  );
}

function buildStatusMap(run: RunData | null | undefined): Record<string, NStatus> {
  const m: Record<string, NStatus> = {};
  NODES.forEach((n) => (m[n.id] = "pending"));
  if (!run) return m;
  const s = run.status;
  const active = s === "running" || s === "pending";
  const done = s === "completed" || s === "partial";
  const bad = s === "failed" || s === "cancelled";

  // Trigger + Quellen: sobald der Lauf existiert/läuft
  m.trigger = "completed";
  m.standard = run.sources?.some((x) => x.kind === "standard") || done || active ? "completed" : "pending";
  m.rotating = run.sources?.some((x) => x.kind === "rotating") || done ? "completed" : (active ? "completed" : "pending");

  if (done) {
    ["research", "validate", "tagging", "media", "save"].forEach((id) => (m[id] = "completed"));
  } else if (bad) {
    m.research = "failed";
  } else if (active) {
    m.research = "running";
  }
  // publish bleibt "pending" (manueller Schritt)
  return m;
}

// ─── Node-Komponente ─────────────────────────────────────────────────────────
function BoardNode({
  node, status, selected, onClick,
}: { node: NodeDef; status: NStatus; selected: boolean; onClick: () => void }) {
  const Icon = node.icon;
  const ring =
    selected ? "ring-2 ring-emerald-400"
    : status === "running" ? "ring-2 ring-amber-300 animate-pulse"
    : status === "completed" ? "ring-1 ring-emerald-300"
    : status === "failed" ? "ring-1 ring-rose-300"
    : "ring-1 ring-border";
  return (
    <div
      data-node
      onClick={onClick}
      className={`absolute cursor-pointer rounded-xl bg-card shadow-sm transition-all hover:shadow-md ${ring}`}
      style={{ left: node.x, top: node.y, width: NODE_W }}
    >
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
          <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">{node.title}</p>
          <p className="truncate text-[11px] text-muted-foreground">{node.subtitle}</p>
        </div>
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: STATUS_DOT[status], boxShadow: status === "running" ? "0 0 0 3px rgba(245,158,11,.2)" : "none" }}
        />
      </div>
    </div>
  );
}

// ─── Connector-Layer ─────────────────────────────────────────────────────────
function Connectors({ statusMap }: { statusMap: Record<string, NStatus> }) {
  const map = Object.fromEntries(NODES.map((n) => [n.id, n]));
  return (
    <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width="1700" height="500">
      <defs>
        <marker id="wf-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
        <marker id="wf-arr-done" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>
      {CONNECTIONS.map(([from, to]) => {
        const a = map[from], b = map[to];
        if (!a || !b) return null;
        const done = statusMap[from] === "completed" && (statusMap[to] === "completed" || statusMap[to] === "running");
        const x1 = a.x + NODE_W, y1 = a.y + NODE_H / 2;
        const x2 = b.x, y2 = b.y + NODE_H / 2;
        const cx = x1 + (x2 - x1) / 2;
        return (
          <path
            key={`${from}-${to}`}
            d={`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`}
            fill="none"
            stroke={done ? "#10b981" : "#cbd5e1"}
            strokeWidth={done ? 2 : 1.5}
            strokeDasharray={done ? "none" : "5 5"}
            markerEnd={`url(#${done ? "wf-arr-done" : "wf-arr"})`}
          />
        );
      })}
    </svg>
  );
}

// ─── Detail-Panel ────────────────────────────────────────────────────────────
function NodeDetail({ node, run, onClose }: { node: NodeDef; run: RunData | null | undefined; onClose: () => void }) {
  const sources = run?.sources ?? [];
  return (
    <div className="flex w-72 shrink-0 flex-col border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <node.icon className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-semibold">{node.title}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
        <p className="text-muted-foreground">{node.info}</p>

        {node.stage === "sources" && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {node.id === "standard" ? "Standard-Quellen" : "Rotierende / entdeckte Quellen"}
            </p>
            {sources.length === 0 ? (
              <p className="text-xs text-muted-foreground">Noch keine Quellen erfasst.</p>
            ) : (
              <ul className="space-y-1">
                {sources
                  .filter((s) => (node.id === "standard" ? s.kind === "standard" : s.kind !== "standard"))
                  .slice(0, 12)
                  .map((s) => (
                    <li key={s.id} className="flex items-center gap-1.5 text-xs">
                      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span className="truncate">{s.name}</span>
                      <Badge variant="outline" className="ml-auto shrink-0 text-[10px]">{SOURCE_KIND_LABEL[s.kind]}</Badge>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}

        {node.stage === "research" && run && (
          <div className="space-y-1 text-xs">
            <Row label="Wiederholungen" value={`${run.repetitionsDone}/${run.repetitionsTotal}`} />
            <Row label="Gefunden" value={String(run.articlesFound)} />
            <Row label="Fortschritt" value={`${run.progressPercent}%`} />
          </div>
        )}

        {node.stage === "save" && run && (
          <div className="space-y-1 text-xs">
            <Row label="Gespeichert" value={String(run.articlesSaved)} />
            <Row label="Duplikate" value={String(run.duplicatesSkipped)} />
          </div>
        )}

        {node.stage === "research" && run?.logs?.length ? (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Verlauf</p>
            <ul className="space-y-1">
              {run.logs.slice(0, 8).map((l) => (
                <li key={l.id} className="text-xs text-muted-foreground">• {l.message}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

// ─── Haupt-Tab ───────────────────────────────────────────────────────────────
export default function WorkflowBoardTab() {
  const utils = trpc.useUtils();
  const { data: templates } = trpc.workflow.listTemplates.useQuery();
  const { data: runs } = trpc.workflow.listRuns.useQuery(
    { limit: 40 },
    { refetchInterval: (q) => ((q.state.data ?? []).some((r) => r.status === "running" || r.status === "pending") ? 3000 : false) },
  );

  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string>("");
  const [scale, setScale] = useState(0.8);
  const [pan, setPan] = useState({ x: 20, y: 20 });
  const panning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 });

  const { data: run } = useRunQuery(selectedRunId);

  // ersten Run / erstes Template automatisch wählen
  useEffect(() => {
    if (selectedRunId === null && runs && runs.length > 0) setSelectedRunId(runs[0].id);
  }, [runs, selectedRunId]);
  useEffect(() => {
    if (!templateId && templates && templates.length > 0) setTemplateId(String(templates[0].id));
  }, [templates, templateId]);

  const statusMap = buildStatusMap(run);

  const startRun = trpc.workflow.startRun.useMutation({
    onSuccess: (r) => {
      toast.success("Durchlauf gestartet");
      setSelectedRunId(r.runId);
      utils.workflow.listRuns.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const cancelRun = trpc.workflow.cancelRun.useMutation({
    onSuccess: () => { toast.success("Abgebrochen"); utils.workflow.getRun.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  // Pan
  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-node]") || (e.target as HTMLElement).closest("[data-control]")) return;
    panning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!panning.current) return;
      setPan({ x: panStart.current.px + (e.clientX - panStart.current.x), y: panStart.current.py + (e.clientY - panStart.current.y) });
    };
    const up = () => (panning.current = false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, []);
  const onWheel = (e: React.WheelEvent) => setScale((s) => Math.max(0.4, Math.min(1.6, s * (e.deltaY < 0 ? 1.1 : 0.9))));

  const selectedNode = NODES.find((n) => n.id === selectedNodeId) ?? null;
  const anyActive = run?.status === "running" || run?.status === "pending";

  return (
    <div className="flex h-[640px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Sidebar: Läufe */}
      <div className="flex w-56 shrink-0 flex-col border-r border-border">
        <div className="border-b border-border px-3 py-2.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Durchläufe</p>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {(!runs || runs.length === 0) && (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">Noch keine Durchläufe.</p>
          )}
          {runs?.map((r) => {
            const act = r.id === selectedRunId;
            const running = r.status === "running" || r.status === "pending";
            return (
              <button
                key={r.id}
                onClick={() => { setSelectedRunId(r.id); setSelectedNodeId(null); }}
                className={`w-full rounded-lg border px-2.5 py-2 text-left transition-colors ${act ? "border-emerald-300 bg-emerald-50" : "border-transparent hover:bg-muted"}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-xs font-medium">{r.templateName}</span>
                  {running && <Loader2 className="h-3 w-3 shrink-0 animate-spin text-amber-500" />}
                </div>
                <div className="mt-0.5 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{formatDate(r.createdAt)}</span>
                  <Badge variant="outline" className={`text-[10px] ${RUN_STATUS_STYLES[r.status] ?? ""}`}>
                    {RUN_STATUS_LABEL[r.status] ?? r.status}
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>
        {/* Starten */}
        <div className="space-y-2 border-t border-border p-3" data-control>
          <Select value={templateId} onValueChange={setTemplateId}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Workflow wählen" /></SelectTrigger>
            <SelectContent>
              {templates?.map((t) => (<SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Button
            className="w-full bg-brand-gradient text-white"
            size="sm"
            disabled={!templateId || startRun.isPending}
            onClick={() => startRun.mutate({ templateId: Number(templateId) })}
          >
            <Play className="mr-1.5 h-3.5 w-3.5" /> Workflow starten
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="relative flex-1 overflow-hidden"
        style={{ background: "hsl(var(--muted) / 0.35)", backgroundImage: "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)", backgroundSize: "22px 22px", cursor: "grab" }}
        onMouseDown={onMouseDown}
        onWheel={onWheel}
      >
        {/* Toolbar */}
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2" data-control>
          {run ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card/90 px-3 py-1.5 text-xs shadow-sm backdrop-blur">
              <span className="font-medium">{run.templateName}</span>
              <span className="text-muted-foreground">#{run.id}</span>
              <Badge variant="outline" className={RUN_STATUS_STYLES[run.status] ?? ""}>
                {RUN_STATUS_LABEL[run.status] ?? run.status}
              </Badge>
              <span className="text-muted-foreground">{run.progressPercent}%</span>
              {anyActive && (
                <Button variant="ghost" size="sm" className="h-6 px-2 text-rose-600" onClick={() => cancelRun.mutate({ id: run.id })}>
                  Abbrechen
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
              Wähle links einen Durchlauf oder starte einen neuen.
            </div>
          )}
        </div>

        {/* Zoom */}
        <div className="absolute bottom-3 right-3 z-10 flex gap-1" data-control>
          {[
            { i: Plus, a: () => setScale((s) => Math.min(1.6, s * 1.15)) },
            { i: Minus, a: () => setScale((s) => Math.max(0.4, s * 0.87)) },
            { i: Maximize, a: () => { setScale(0.8); setPan({ x: 20, y: 20 }); } },
          ].map(({ i: I, a }, k) => (
            <button key={k} onClick={a} className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground shadow-sm hover:bg-muted">
              <I className="h-4 w-4" />
            </button>
          ))}
        </div>

        {/* transformierter Inhalt */}
        <div className="absolute" style={{ transformOrigin: "0 0", transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}>
          <Connectors statusMap={statusMap} />
          {NODES.map((n) => (
            <BoardNode
              key={n.id}
              node={n}
              status={statusMap[n.id] ?? "pending"}
              selected={selectedNodeId === n.id}
              onClick={() => setSelectedNodeId((p) => (p === n.id ? null : n.id))}
            />
          ))}
        </div>
      </div>

      {/* Detail */}
      {selectedNode && <NodeDetail node={selectedNode} run={run} onClose={() => setSelectedNodeId(null)} />}
    </div>
  );
}
