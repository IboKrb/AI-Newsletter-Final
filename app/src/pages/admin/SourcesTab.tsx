import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, Globe, Star, ExternalLink, Pencil } from "lucide-react";
import { CATEGORIES, CATEGORY_LABEL, formatDate } from "./constants";

type SourceForm = {
  id?: number;
  name: string;
  url: string;
  category: string;
  isStandard: boolean;
};

const EMPTY: SourceForm = { name: "", url: "", category: "news", isStandard: false };

export default function SourcesTab() {
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState<string>("all");
  const [dialog, setDialog] = useState<SourceForm | null>(null);

  const { data: sources } = trpc.workflow.listSources.useQuery(
    filter !== "all" ? { category: filter as never } : undefined,
  );

  const invalidate = () => utils.workflow.listSources.invalidate();

  const add = trpc.workflow.addSource.useMutation({
    onSuccess: () => { toast.success("Quelle hinzugefügt"); setDialog(null); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const update = trpc.workflow.updateSource.useMutation({
    onSuccess: () => { toast.success("Quelle gespeichert"); setDialog(null); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const del = trpc.workflow.deleteSource.useMutation({
    onSuccess: () => { toast.success("Quelle gelöscht"); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const setStd = trpc.workflow.setSourceStandard.useMutation({
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const save = () => {
    if (!dialog) return;
    if (!dialog.name.trim() || !dialog.url.trim()) {
      toast.error("Name und URL erforderlich");
      return;
    }
    if (dialog.id) {
      update.mutate({ id: dialog.id, name: dialog.name, url: dialog.url, category: dialog.category as never, isStandard: dialog.isStandard });
    } else {
      add.mutate({ name: dialog.name, url: dialog.url, category: dialog.category as never, isStandard: dialog.isStandard });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Kategorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">{sources?.length ?? 0} Quellen</p>
        </div>
        <Button className="bg-brand-gradient text-white" onClick={() => setDialog({ ...EMPTY, category: filter !== "all" ? filter : "news" })}>
          <Plus className="mr-2 h-4 w-4" /> Quelle hinzufügen
        </Button>
      </div>

      <p className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <Star className="mr-1 inline h-3.5 w-3.5 text-emerald-600" />
        <strong>Standard-Quellen</strong> werden bei jedem Durchlauf durchsucht. Übrige Quellen
        bilden den Rotations-Pool — pro Lauf werden bis zu 5 davon (am längsten nicht genutzt) ergänzt.
      </p>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {!sources || sources.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Keine Quellen.</p>
          ) : (
            <ul className="divide-y divide-border">
              {sources.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{s.name}</span>
                      {s.isStandard && (
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                          <Star className="mr-1 h-3 w-3" /> Standard
                        </Badge>
                      )}
                      <Badge variant="outline">{CATEGORY_LABEL[s.category]}</Badge>
                    </div>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 truncate text-xs text-muted-foreground hover:text-emerald-600"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" /> {s.url}
                    </a>
                  </div>
                  <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                    zuletzt: {s.lastUsedAt ? formatDate(s.lastUsedAt) : "nie"}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    <Switch
                      checked={s.isStandard}
                      onCheckedChange={(v) => setStd.mutate({ id: s.id, isStandard: v })}
                      title="Als Standard markieren"
                    />
                    <Button variant="ghost" size="icon" onClick={() => setDialog({ id: s.id, name: s.name, url: s.url, category: s.category, isStandard: s.isStandard })}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                      onClick={() => { if (confirm(`Quelle "${s.name}" löschen?`)) del.mutate({ id: s.id }); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog?.id ? "Quelle bearbeiten" : "Quelle hinzufügen"}</DialogTitle>
          </DialogHeader>
          {dialog && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={dialog.name} onChange={(e) => setDialog({ ...dialog, name: e.target.value })} placeholder="z.B. TechCrunch AI" />
              </div>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input value={dialog.url} onChange={(e) => setDialog({ ...dialog, url: e.target.value })} placeholder="https://…" />
              </div>
              <div className="space-y-2">
                <Label>Kategorie</Label>
                <Select value={dialog.category} onValueChange={(v) => setDialog({ ...dialog, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <Label className="cursor-pointer">Als Standard-Quelle</Label>
                <Switch checked={dialog.isStandard} onCheckedChange={(v) => setDialog({ ...dialog, isStandard: v })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Abbrechen</Button>
            <Button className="bg-brand-gradient text-white" onClick={save} disabled={add.isPending || update.isPending}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
