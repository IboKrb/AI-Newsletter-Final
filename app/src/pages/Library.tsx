import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Library as LibraryIcon,
  Search,
  ExternalLink,
  Calendar,
  Tag,
  ArrowLeft,
  ArrowRight,
  Filter,
  X,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";

const CATEGORIES = [
  { value: "news", label: "News", color: "bg-blue-500/10 text-blue-600" },
  { value: "tools", label: "Tools", color: "bg-emerald-500/10 text-emerald-600" },
  { value: "prompts", label: "Prompts", color: "bg-emerald-500/10 text-emerald-600" },
  { value: "tutorials", label: "Tutorials", color: "bg-amber-500/10 text-amber-600" },
  { value: "podcasts", label: "Podcasts", color: "bg-rose-500/10 text-rose-600" },
  { value: "videos", label: "Videos", color: "bg-cyan-500/10 text-cyan-600" },
  { value: "reads", label: "Reads", color: "bg-slate-500/10 text-muted-foreground" },
  { value: "image_gen", label: "Image Gen", color: "bg-teal-500/10 text-teal-600" },
] as const;

export default function Library() {
  const { user, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [page, setPage] = useState(0);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  const limit = 12;

  // Veröffentlichte Artikel (Default-Ansicht)
  const { data: publishedData, isLoading: publishedLoading } =
    trpc.newsletter.listPublishedArticles.useQuery({
      category: selectedCategory !== "all" ? (selectedCategory as never) || undefined : undefined,
      limit,
      offset: page * limit,
    });

  // Suche (nur wenn aktiv)
  const { data: searchResults, isLoading: searchLoading } =
    trpc.newsletter.searchArticles.useQuery(
      {
        query: searchQuery,
        category: selectedCategory !== "all" ? (selectedCategory as never) || undefined : undefined,
        tags: selectedTag !== "all" ? (selectedTag ? [selectedTag] : undefined) : undefined,
        limit,
        offset: page * limit,
      },
      { enabled: searchQuery.length > 0 }
    );

  // Kategorie-Liste (wenn keine Suche aber Kategorie gewählt)
  const { data: categoryResults } = trpc.newsletter.listByCategory.useQuery(
    { category: selectedCategory !== "all" ? (selectedCategory as any) : undefined, limit, offset: page * limit },
    { enabled: !searchQuery && selectedCategory !== "all" && selectedCategory.length > 0 && !publishedData }
  );

  // Alle Tags
  const { data: allTags } = trpc.newsletter.listTags.useQuery();

  const articles = searchResults?.articles ?? publishedData?.articles ?? categoryResults?.articles ?? [];
  const total = searchResults?.total ?? publishedData?.total ?? categoryResults?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const hasFilters = searchQuery || selectedCategory || selectedTag;
  const isDataLoading = searchLoading || publishedLoading;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar user={user} isLoading={isLoading} />

      <main className="mx-auto max-w-7xl px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
              <LibraryIcon className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Bibliothek</h1>
              <p className="text-sm text-muted-foreground">
                Durchsuche alle AI-Newsletter-Artikel nach Stichwort, Kategorie, Datum oder Tags
              </p>
            </div>
          </div>
        </div>

        {/* Such- und Filter-Bereich */}
        <Card className="mb-8 border-border bg-card">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              {/* Suchfeld */}
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                  Suche
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground0" />
                  <Input
                    placeholder="Stichwort, Titel, Inhalt..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                    className="border-border bg-card pl-10 text-foreground placeholder:text-foreground0 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Kategorie-Filter */}
              <div className="w-full md:w-48">
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                  Kategorie
                </label>
                <Select
                  value={selectedCategory}
                  onValueChange={(v) => { setSelectedCategory(v); setPage(0); }}
                >
                  <SelectTrigger className="border-border bg-card text-foreground">
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-card">
                    <SelectItem value="all">Alle Kategorien</SelectItem>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tag-Filter */}
              <div className="w-full md:w-48">
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                  Tag
                </label>
                <Select
                  value={selectedTag}
                  onValueChange={(v) => { setSelectedTag(v); setPage(0); }}
                >
                  <SelectTrigger className="border-border bg-card text-foreground">
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-card">
                    <SelectItem value="all">Alle Tags</SelectItem>
                    {allTags?.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filter zurücksetzen */}
              {hasFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("");
                    setSelectedTag("");
                    setPage(0);
                  }}
                  className="border-border text-muted-foreground hover:bg-muted"
                >
                  <X className="mr-1 h-4 w-4" />
                  Zurücksetzen
                </Button>
              )}
            </div>

            {/* Aktive Filter als Badges */}
            {hasFilters && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Filter className="h-4 w-4 text-foreground0" />
                {searchQuery && (
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
                    Suche: {searchQuery}
                  </Badge>
                )}
                {selectedCategory && (
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                    {CATEGORIES.find((c) => c.value === selectedCategory)?.label}
                  </Badge>
                )}
                {selectedTag && (
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
                    Tag: {selectedTag}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ergebnisse */}
        {isDataLoading ? (
          <div className="py-20 text-center text-muted-foreground">Lade Artikel...</div>
        ) : articles.length === 0 ? (
          <div className="py-20 text-center">
            <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold text-foreground">Keine Artikel gefunden</h3>
            <p className="text-muted-foreground">
              Passe deine Such- oder Filter-Kriterien an.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              {total} Artikel gefunden
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => {
                const cat = CATEGORIES.find((c) => c.value === article.category);
                const tags = article.tags ? JSON.parse(article.tags) as string[] : [];
                return (
                  <Card
                    key={article.id}
                    className="group cursor-pointer border-border bg-card transition-all hover:border-border hover:bg-muted"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <CardHeader className="pb-3">
                      <div className="mb-2 flex items-center gap-2">
                        {cat && (
                          <Badge className={`border-0 ${cat.color}`}>
                            {cat.label}
                          </Badge>
                        )}
                        <span className="text-xs text-foreground0">
                          {article.sourceName}
                        </span>
                      </div>
                      <CardTitle className="line-clamp-2 text-base font-semibold text-foreground">
                        {article.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {article.summary}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {tags.slice(0, 3).map((tag: string) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="border-border text-xs text-foreground0"
                          >
                            <Tag className="mr-1 h-2.5 w-2.5" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-foreground0">
                        <Calendar className="h-3 w-3" />
                        {article.publishedAt
                          ? new Date(article.publishedAt).toLocaleDateString("de-DE")
                          : "—"}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Paginierung */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                  className="border-border text-muted-foreground hover:bg-muted"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Zurück
                </Button>
                <span className="text-sm text-muted-foreground">
                  Seite {page + 1} von {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                  className="border-border text-muted-foreground hover:bg-muted"
                >
                  Weiter
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Artikel-Detail Dialog */}
      <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto border-border bg-card text-foreground">
          {selectedArticle && (
            <>
              <DialogHeader>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {(() => {
                    const cat = CATEGORIES.find((c) => c.value === selectedArticle.category);
                    return cat ? (
                      <Badge className={`border-0 ${cat.color}`}>{cat.label}</Badge>
                    ) : null;
                  })()}
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    {selectedArticle.sourceName}
                  </Badge>
                </div>
                <DialogTitle className="text-xl text-foreground">
                  {selectedArticle.title}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {selectedArticle.summary}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                <div className="prose max-w-none text-sm text-muted-foreground">
                  {selectedArticle.content}
                </div>

                {selectedArticle.tags && (
                  <div className="flex flex-wrap gap-1">
                    {(JSON.parse(selectedArticle.tags) as string[]).map((tag: string) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="border-border text-foreground0"
                      >
                        <Tag className="mr-1 h-2.5 w-2.5" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div className="text-xs text-foreground0">
                    <Calendar className="mr-1 inline h-3 w-3" />
                    {selectedArticle.publishedAt
                      ? new Date(selectedArticle.publishedAt).toLocaleDateString("de-DE")
                      : "—"}
                  </div>
                  <a
                    href={selectedArticle.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Original lesen
                  </a>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
