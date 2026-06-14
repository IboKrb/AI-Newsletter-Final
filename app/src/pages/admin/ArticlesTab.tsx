import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Search, Plus, Trash2, Pencil, Eye, EyeOff, Globe, Tag,
} from "lucide-react";
import {
  CATEGORIES, CATEGORY_LABEL, ARTICLE_STATUS, STATUS_STYLES, formatDate, parseTags,
} from "./constants";
import ArticleThumb from "@/components/ArticleThumb";

type ArticleForm = {
  id?: number;
  title: string;
  summary: string;
  content: string;
  category: string;
  status: string;
  sourceName: string;
  sourceUrl: string;
  tags: string;
  relevanceScore: number;
};

const EMPTY: ArticleForm = {
  title: "", summary: "", content: "", category: "news", status: "draft",
  sourceName: "", sourceUrl: "", tags: "", relevanceScore: 50,
};

export default function ArticlesTab() {
  const utils = trpc.useUtils();
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [dialog, setDialog] = useState<ArticleForm | null>(null);

  const { data, isLoading } = trpc.newsletter.listArticles.useQuery({
    status: status !== "all" ? (status as never) : undefined,
    category: category !== "all" ? (category as never) : undefined,
    search: search || undefined,
    limit: 100,
    offset: 0,
  });

  const articles = data?.articles ?? [];
  const invalidate = () => utils.newsletter.listArticles.invalidate();

  const create = trpc.newsletter.createArticle.useMutation({
    onSuccess: () => { toast.success("Artikel angelegt"); setDialog(null); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const update = trpc.newsletter.updateArticle.useMutation({
    onSuccess: () => { toast.success("Artikel gespeichert"); setDialog(null); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const del = trpc.newsletter.deleteArticle.useMutation({
    onSuccess: () => { toast.success("Gelöscht"); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const setVis = trpc.newsletter.setArticleVisibility.useMutation({
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(e.message),
  });
  const bulkDel = trpc.newsletter.bulkDeleteArticles.useMutation({
    onSuccess: (r) => { toast.success(`${r.deleted} gelöscht`); setSelected([]); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const bulkVis = trpc.newsletter.bulkSetVisibility.useMutation({
    onSuccess: (r) => { toast.success(`${r.updated} aktualisiert`); setSelected([]); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const allChecked = articles.length > 0 && selected.length === articles.length;
  const toggleAll = () => setSelected(allChecked ? [] : articles.map((a) => a.id));
  const toggle = (id: number) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const save = () => {
    if (!dialog) return;
    const tags = dialog.tags.split(",").map((t) => t.trim()).filter(Boolean);
    if (dialog.id) {
      update.mutate({
        id: dialog.id, title: dialog.title, summary: dialog.summary, content: dialog.content,
        category: dialog.category as never, status: dialog.status as never,
        tags: JSON.stringify(tags), relevanceScore: dialog.relevanceScore,
      });
    } else {
      if (!dialog.sourceUrl.trim()) { toast.error("Quellen-URL erforderlich"); return; }
      create.mutate({
        title: dialog.title, summary: dialog.summary, content: dialog.content,
        category: dialog.category as never, status: dialog.status as never,
        sourceName: dialog.sourceName || "Manuell", sourceUrl: dialog.sourceUrl,
        tags, relevanceScore: dialog.relevanceScore,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Filterleiste */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Titel suchen…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            {ARTICLE_STATUS.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Kategorie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Kategorien</SelectItem>
            {CATEGORIES.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
          </SelectContent>
        </Select>
        <Button className="bg-brand-gradient text-white" onClick={() => setDialog({ ...EMPTY })}>
          <Plus className="mr-2 h-4 w-4" /> Neu
        </Button>
      </div>

      {/* Bulk-Aktionen */}
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm">
          <span className="font-medium text-emerald-800">{selected.length} ausgewählt</span>
          <div className="flex-1" />
          <Button size="sm" variant="outline" onClick={() => bulkVis.mutate({ ids: selected, isPublic: true })}>
            <Eye className="mr-1 h-3.5 w-3.5" /> Öffentlich
          </Button>
          <Button size="sm" variant="outline" onClick={() => bulkVis.mutate({ ids: selected, isPublic: false })}>
            <EyeOff className="mr-1 h-3.5 w-3.5" /> Privat
          </Button>
          <Button size="sm" variant="outline" className="text-rose-600"
            onClick={() => { if (confirm(`${selected.length} Artikel löschen?`)) bulkDel.mutate({ ids: selected }); }}>
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Löschen
          </Button>
        </div>
      )}

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {/* Kopf */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Checkbox checked={allChecked} onCheckedChange={toggleAll} />
            <span className="flex-1">Titel</span>
            <span className="hidden w-24 md:block">Kategorie</span>
            <span className="hidden w-28 sm:block">Status</span>
            <span className="hidden w-28 lg:block">Datum</span>
            <span className="w-24 text-right">Aktionen</span>
          </div>

          {isLoading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Lädt…</p>
          ) : articles.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Keine Artikel gefunden.</p>
          ) : (
            <ul className="divide-y divide-border">
              {articles.map((a) => {
                const isPublic = a.status === "published";
                return (
                  <li key={a.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
                    <Checkbox checked={selected.includes(a.id)} onCheckedChange={() => toggle(a.id)} />
                    <ArticleThumb
                      src={(a as { imageUrl?: string | null }).imageUrl}
                      alt=""
                      className="hidden h-9 w-14 shrink-0 rounded-md sm:block"
                      iconClassName="h-4 w-4"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.title}</p>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Globe className="h-3 w-3" /> {a.sourceName}
                        {parseTags(a.tags).slice(0, 2).map((t) => (
                          <span key={t} className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5">
                            <Tag className="h-2.5 w-2.5" />{t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="hidden w-24 md:block">
                      <Badge variant="outline" className="text-xs">{CATEGORY_LABEL[a.category]}</Badge>
                    </span>
                    <span className="hidden w-28 sm:block">
                      <Badge variant="outline" className={`text-xs ${STATUS_STYLES[a.status] ?? ""}`}>{a.status}</Badge>
                    </span>
                    <span className="hidden w-28 text-xs text-muted-foreground lg:block">
                      {formatDate(a.publishedAt)}
                    </span>
                    <div className="flex w-24 justify-end gap-0.5">
                      <Button variant="ghost" size="icon" title={isPublic ? "Auf privat setzen" : "Öffentlich schalten"}
                        onClick={() => setVis.mutate({ id: a.id, isPublic: !isPublic })}>
                        {isPublic ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDialog({
                        id: a.id, title: a.title, summary: a.summary, content: a.content,
                        category: a.category, status: a.status, sourceName: a.sourceName,
                        sourceUrl: a.sourceUrl, tags: parseTags(a.tags).join(", "),
                        relevanceScore: a.relevanceScore,
                      })}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                        onClick={() => { if (confirm("Artikel löschen?")) del.mutate({ id: a.id }); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
      {data && <p className="text-xs text-muted-foreground">{data.total} Artikel insgesamt (max. 100 angezeigt)</p>}

      {/* Anlegen/Bearbeiten-Dialog */}
      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialog?.id ? "Artikel bearbeiten" : "Neuer Artikel"}</DialogTitle>
          </DialogHeader>
          {dialog && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Titel</Label>
                <Input value={dialog.title} onChange={(e) => setDialog({ ...dialog, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Zusammenfassung</Label>
                <Textarea rows={2} value={dialog.summary} onChange={(e) => setDialog({ ...dialog, summary: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Inhalt</Label>
                <Textarea rows={6} value={dialog.content} onChange={(e) => setDialog({ ...dialog, content: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kategorie</Label>
                  <Select value={dialog.category} onValueChange={(v) => setDialog({ ...dialog, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={dialog.status} onValueChange={(v) => setDialog({ ...dialog, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ARTICLE_STATUS.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quellenname</Label>
                  <Input value={dialog.sourceName} onChange={(e) => setDialog({ ...dialog, sourceName: e.target.value })} placeholder="z.B. TechCrunch" />
                </div>
                <div className="space-y-2">
                  <Label>Quellen-URL</Label>
                  <Input value={dialog.sourceUrl} onChange={(e) => setDialog({ ...dialog, sourceUrl: e.target.value })} placeholder="https://…" disabled={!!dialog.id} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tags (kommagetrennt)</Label>
                <Input value={dialog.tags} onChange={(e) => setDialog({ ...dialog, tags: e.target.value })} placeholder="openai, llm, agent" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Abbrechen</Button>
            <Button className="bg-brand-gradient text-white" onClick={save} disabled={create.isPending || update.isPending}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
