import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus, Play, Pencil, Trash2, Workflow, Repeat, Globe2, Sparkles, Rocket, Star,
} from "lucide-react";
import { CATEGORIES, CATEGORY_LABEL } from "./constants";
import RunDetail from "./RunDetail";

type TemplateForm = {
  id?: number;
  name: string;
  category: string;
  description: string;
  systemPrompt: string;
  userPrompt: string;
  repetitions: number;
  maxArticles: number;
  useGrounding: boolean;
  isActive: boolean;
};

const EMPTY: TemplateForm = {
  name: "", category: "news", description: "",
  systemPrompt: "Du bist ein erfahrener KI-Newsletter-Redakteur. Recherchiere sorgfältig im Web und erfinde niemals Quellen.",
  userPrompt: "Recherchiere die wichtigsten und aktuellsten Inhalte der letzten Woche.",
  repetitions: 3, maxArticles: 10, useGrounding: true, isActive: true,
};

export default function WorkflowsTab({ onGoToRuns }: { onGoToRuns: () => void }) {
  const utils = trpc.useUtils();
  const { data: templates } = trpc.workflow.listTemplates.useQuery();
  const { data: allSources } = trpc.workflow.listSources.useQuery();

  const [edit, setEdit] = useState<TemplateForm | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [runFor, setRunFor] = useState<TemplateForm | null>(null);
  const [extraSources, setExtraSources] = useState<number[]>([]);
  const [openRun, setOpenRun] = useState<number | null>(null);

  const invalidate = () => utils.workflow.listTemplates.invalidate();

  const create = trpc.workflow.createTemplate.useMutation({
    onSuccess: () => { toast.success("Workflow erstellt"); setEdit(null); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const update = trpc.workflow.updateTemplate.useMutation({
    onSuccess: () => { toast.success("Workflow gespeichert"); setEdit(null); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const del = trpc.workflow.deleteTemplate.useMutation({
    onSuccess: () => { toast.success("Workflow gelöscht"); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const startRun = trpc.workflow.startRun.useMutation({
    onSuccess: (r) => {
      toast.success("Durchlauf gestartet");
      setRunFor(null); setExtraSources([]); setOpenRun(r.runId);
      utils.workflow.listRuns.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const startMultiple = trpc.workflow.startMultiple.useMutation({
    onSuccess: (r) => {
      toast.success(`${r.runIds.length} Durchläufe gestartet`);
      setSelected([]); utils.workflow.listRuns.invalidate(); onGoToRuns();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleSel = (id: number) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const saveTemplate = () => {
    if (!edit) return;
    if (!edit.name.trim()) { toast.error("Name erforderlich"); return; }
    const payload = {
      name: edit.name, category: edit.category as never, description: edit.description,
      systemPrompt: edit.systemPrompt, userPrompt: edit.userPrompt,
      repetitions: edit.repetitions, maxArticles: edit.maxArticles,
      useGrounding: edit.useGrounding, isActive: edit.isActive,
    };
    if (edit.id) update.mutate({ id: edit.id, ...payload });
    else create.mutate(payload);
  };

  const runSourcesForCategory = (allSources ?? []).filter((s) => s.category === runFor?.category);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-emerald-600" />
          <h2 className="text-base font-semibold">Workflows</h2>
          <span className="text-sm text-muted-foreground">({templates?.length ?? 0})</span>
        </div>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <Button variant="outline" onClick={() => startMultiple.mutate({ templateIds: selected })} disabled={startMultiple.isPending}>
              <Rocket className="mr-2 h-4 w-4" /> {selected.length} ausgewählte starten
            </Button>
          )}
          <Button className="bg-brand-gradient text-white" onClick={() => setEdit({ ...EMPTY })}>
            <Plus className="mr-2 h-4 w-4" /> Neuer Workflow
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(templates ?? []).map((t) => (
          <Card key={t.id} className="card-hover flex flex-col shadow-sm">
            <CardContent className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex items-start gap-2">
                <Checkbox className="mt-1" checked={selected.includes(t.id)} onCheckedChange={() => toggleSel(t.id)} />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold leading-tight">{t.name}</h3>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline">{CATEGORY_LABEL[t.category]}</Badge>
                <Badge variant="outline" className="gap-1"><Repeat className="h-3 w-3" />{t.repetitions}×</Badge>
                {t.useGrounding && (
                  <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700">
                    <Globe2 className="h-3 w-3" /> Grounding
                  </Badge>
                )}
                {t.isActive ? (
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">aktiv</Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">inaktiv</Badge>
                )}
              </div>

              <div className="mt-auto flex items-center gap-1.5 pt-1">
                <Button
                  size="sm"
                  className="flex-1 bg-brand-gradient text-white"
                  onClick={() => { setRunFor({ ...EMPTY, id: t.id, name: t.name, category: t.category }); setExtraSources([]); }}
                >
                  <Play className="mr-1.5 h-3.5 w-3.5" /> Ausführen
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEdit({
                  id: t.id, name: t.name, category: t.category, description: t.description ?? "",
                  systemPrompt: t.systemPrompt, userPrompt: t.userPrompt, repetitions: t.repetitions,
                  maxArticles: t.maxArticles, useGrounding: t.useGrounding, isActive: t.isActive,
                })}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                  onClick={() => { if (confirm(`Workflow "${t.name}" löschen?`)) del.mutate({ id: t.id }); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Erstellen/Bearbeiten */}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{edit?.id ? "Workflow bearbeiten" : "Neuer Workflow"}</DialogTitle>
            <DialogDescription>Prompts und Konfiguration des Recherche-Workflows.</DialogDescription>
          </DialogHeader>
          {edit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Kategorie</Label>
                  <Select value={edit.category} onValueChange={(v) => setEdit({ ...edit, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Beschreibung</Label>
                <Input value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-emerald-600" /> System-Prompt</Label>
                <Textarea rows={4} value={edit.systemPrompt} onChange={(e) => setEdit({ ...edit, systemPrompt: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>User-Prompt (Recherche-Auftrag)</Label>
                <Textarea rows={4} value={edit.userPrompt} onChange={(e) => setEdit({ ...edit, userPrompt: e.target.value })} />
                <p className="text-xs text-muted-foreground">
                  Die Quellenliste und das JSON-Ausgabeformat werden automatisch ergänzt.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Wiederholungen</Label>
                  <Input type="number" min={1} max={10} value={edit.repetitions}
                    onChange={(e) => setEdit({ ...edit, repetitions: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Max. Artikel / Durchlauf</Label>
                  <Input type="number" min={1} max={50} value={edit.maxArticles}
                    onChange={(e) => setEdit({ ...edit, maxArticles: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-1 items-center justify-between rounded-xl border border-border p-3">
                  <Label className="cursor-pointer text-sm">Web-Grounding</Label>
                  <Switch checked={edit.useGrounding} onCheckedChange={(v) => setEdit({ ...edit, useGrounding: v })} />
                </div>
                <div className="flex flex-1 items-center justify-between rounded-xl border border-border p-3">
                  <Label className="cursor-pointer text-sm">Aktiv (Cron)</Label>
                  <Switch checked={edit.isActive} onCheckedChange={(v) => setEdit({ ...edit, isActive: v })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>Abbrechen</Button>
            <Button className="bg-brand-gradient text-white" onClick={saveTemplate} disabled={create.isPending || update.isPending}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Run-Dialog mit optionalen Extra-Quellen */}
      <Dialog open={!!runFor} onOpenChange={(o) => !o && setRunFor(null)}>
        <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>„{runFor?.name}" ausführen</DialogTitle>
            <DialogDescription>
              Standard-Quellen werden automatisch genutzt. Optional zusätzliche Quellen für diesen Lauf auswählen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {runSourcesForCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Keine Quellen für diese Kategorie. Lege welche im Tab „Quellen" an.
              </p>
            ) : (
              <ul className="max-h-72 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
                {runSourcesForCategory.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50">
                    {s.isStandard ? (
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                        <Star className="mr-1 h-3 w-3" /> Standard
                      </Badge>
                    ) : (
                      <Checkbox
                        checked={extraSources.includes(s.id)}
                        onCheckedChange={() =>
                          setExtraSources((x) => (x.includes(s.id) ? x.filter((i) => i !== s.id) : [...x, s.id]))
                        }
                      />
                    )}
                    <span className="truncate text-sm">{s.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRunFor(null)}>Abbrechen</Button>
            <Button
              className="bg-brand-gradient text-white"
              disabled={startRun.isPending}
              onClick={() => runFor?.id && startRun.mutate({ templateId: runFor.id, extraSourceIds: extraSources })}
            >
              <Play className="mr-2 h-4 w-4" /> Jetzt starten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {openRun !== null && <RunDetail runId={openRun} onClose={() => setOpenRun(null)} />}
    </div>
  );
}
