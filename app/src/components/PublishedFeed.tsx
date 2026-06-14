import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Newspaper, ExternalLink, Calendar, Tag, Inbox } from "lucide-react";

const CATEGORY_LABEL: Record<string, string> = {
  news: "News",
  tools: "Tools",
  prompts: "Prompts",
  tutorials: "Tutorials",
  podcasts: "Podcasts",
  videos: "Videos",
  reads: "Reads",
  image_gen: "Bildgenerierung",
};
const CATEGORY_ORDER = ["news", "tools", "prompts", "tutorials", "podcasts", "videos", "reads", "image_gen"];

function parseTags(tags: string | null): string[] {
  if (!tags) return [];
  try {
    const p = JSON.parse(tags);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

type Article = {
  id: number;
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string | null;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string | Date | null;
};

export default function PublishedFeed() {
  const { data, isLoading } = trpc.newsletter.listPublishedArticles.useQuery({ limit: 100, offset: 0 });
  const [selected, setSelected] = useState<Article | null>(null);

  const articles = (data?.articles ?? []) as unknown as Article[];

  const byCategory = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: articles.filter((a) => a.category === cat),
  })).filter((g) => g.items.length > 0);

  if (isLoading) {
    return <div className="py-20 text-center text-muted-foreground">Lade Artikel…</div>;
  }

  if (articles.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20">
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <Inbox className="mx-auto mb-4 h-12 w-12 text-muted-foreground/60" />
          <h3 className="text-lg font-semibold">Noch keine veröffentlichten Artikel</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Sobald im Admin-Bereich ein Recherche-Workflow läuft und Artikel auf „öffentlich" gestellt
            werden, erscheinen sie hier automatisch.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      {byCategory.map((group) => (
        <section key={group.cat} id={group.cat} className="mb-16 scroll-mt-20">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient">
              <Newspaper className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{CATEGORY_LABEL[group.cat] ?? group.cat}</h2>
              <p className="text-sm text-muted-foreground">{group.items.length} Beiträge</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {group.items.map((a) => {
              const tags = parseTags(a.tags);
              return (
                <Card
                  key={a.id}
                  className="card-hover cursor-pointer"
                  onClick={() => setSelected(a)}
                >
                  <CardHeader className="pb-3">
                    <div className="mb-1.5 flex items-center gap-2">
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                        {CATEGORY_LABEL[a.category] ?? a.category}
                      </Badge>
                      <span className="truncate text-xs text-muted-foreground">{a.sourceName}</span>
                    </div>
                    <CardTitle className="line-clamp-2 text-base">{a.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-3 text-sm text-muted-foreground">{a.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {tags.slice(0, 3).map((t) => (
                        <span key={t} className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                          <Tag className="h-2.5 w-2.5" /> {t}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString("de-DE") : "—"}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ))}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                    {CATEGORY_LABEL[selected.category] ?? selected.category}
                  </Badge>
                  <Badge variant="outline">{selected.sourceName}</Badge>
                </div>
                <DialogTitle className="text-xl">{selected.title}</DialogTitle>
                <DialogDescription>{selected.summary}</DialogDescription>
              </DialogHeader>
              <div className="mt-2 space-y-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{selected.content}</p>
                <div className="flex flex-wrap gap-1">
                  {parseTags(selected.tags).map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      <Tag className="h-2.5 w-2.5" /> {t}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <span className="text-xs text-muted-foreground">
                    <Calendar className="mr-1 inline h-3 w-3" />
                    {selected.publishedAt ? new Date(selected.publishedAt).toLocaleDateString("de-DE") : "—"}
                  </span>
                  <a
                    href={selected.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    <ExternalLink className="h-4 w-4" /> Original lesen
                  </a>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
