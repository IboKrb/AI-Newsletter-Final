import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Newspaper,
  ExternalLink,
  TrendingUp,
  FlaskConical,
  Box,
  Landmark,
  Rocket,
  Lightbulb,
} from "lucide-react";
import { staticNews } from "@/data/staticData";

interface NewsItemType {
  id: number;
  headline: string;
  summary: string;
  sourceName: string;
  sourceUrl: string | null;
  category: string;
  imageUrl: string | null;
  publishedAt: Date;
  createdAt: Date;
}

const categoryConfig: Record<
  string,
  { icon: typeof TrendingUp; color: string; bg: string }
> = {
  industry: { icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-500/10" },
  research: {
    icon: FlaskConical,
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
  },
  product: { icon: Box, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  policy: { icon: Landmark, color: "text-amber-600", bg: "bg-amber-500/10" },
  funding: { icon: Rocket, color: "text-rose-600", bg: "bg-rose-500/10" },
  breakthrough: {
    icon: Lightbulb,
    color: "text-cyan-600",
    bg: "bg-cyan-500/10",
  },
};

export default function NewsSection() {
  const { data: issue } = trpc.newsletter.getLatest.useQuery();
  const { data: content } = trpc.newsletter.getIssueContent.useQuery(
    { issueId: issue?.id || 0 },
    { enabled: !!issue?.id }
  );
  const [selectedNews, setSelectedNews] = useState<NewsItemType | null>(null);

  const apiNews: NewsItemType[] = (content?.news as unknown as NewsItemType[]) || [];
  const news = apiNews.length > 0 ? apiNews : staticNews as unknown as NewsItemType[];

  return (
    <section id="news" className="py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
            <Newspaper className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              Latest AI News
            </h2>
            <p className="text-sm text-muted-foreground">
              Curated aus 5 Quellen: TechCrunch, The Verge, MIT Technology Review,
              VentureBeat & Ars Technica
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {news.map((item: NewsItemType) => {
            const cat = categoryConfig[item.category] || categoryConfig.industry;
            return (
              <Card
                key={item.id}
                className="group cursor-pointer border-border bg-card transition-all hover:border-border hover:bg-muted"
                onClick={() => setSelectedNews(item)}
              >
                <div className="relative h-40 overflow-hidden rounded-t-lg">
                  <img
                    src={item.imageUrl || "/assets/hero-ai-newsletter.jpg"}
                    alt={item.headline}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent" />
                  <Badge
                    className={`absolute left-3 top-3 border-0 ${cat.bg} ${cat.color}`}
                  >
                    <cat.icon className="mr-1 h-3 w-3" />
                    {item.category}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <div className="mb-2 text-xs font-medium text-foreground0">
                    {item.sourceName}
                  </div>
                  <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
                    {item.headline}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                    {item.summary}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Dialog open={!!selectedNews} onOpenChange={() => setSelectedNews(null)}>
          <DialogContent className="max-w-lg border-border bg-card text-foreground">
            <DialogHeader>
              <div className="mb-2 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-border text-muted-foreground"
                >
                  {selectedNews?.sourceName}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-border text-muted-foreground"
                >
                  {selectedNews?.category}
                </Badge>
              </div>
              <DialogTitle className="text-lg text-foreground">
                {selectedNews?.headline}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {selectedNews?.summary}
              </DialogDescription>
            </DialogHeader>
            {selectedNews?.sourceUrl && (
              <a
                href={selectedNews.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
              >
                <ExternalLink className="h-4 w-4" />
                Original-Artikel lesen
              </a>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
