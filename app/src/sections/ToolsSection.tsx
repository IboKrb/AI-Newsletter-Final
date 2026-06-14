import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wrench,
  ExternalLink,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { staticTools } from "@/data/staticData";

interface ToolType {
  id: number;
  name: string;
  description: string;
  category: string;
  url: string | null;
  imageUrl: string | null;
  voteCount: number | null;
  isNew: boolean;
}

export default function ToolsSection() {
  const { data: issue } = trpc.newsletter.getLatest.useQuery();
  const { data: content } = trpc.newsletter.getIssueContent.useQuery(
    { issueId: issue?.id || 0 },
    { enabled: !!issue?.id }
  );

  const apiTools: ToolType[] = (content?.tools as unknown as ToolType[]) || [];
  const tools = apiTools.length > 0 ? apiTools : staticTools as unknown as ToolType[];

  return (
    <section id="tools" className="border-t border-border bg-background py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
            <Wrench className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              Tool Recommendations
            </h2>
            <p className="text-sm text-muted-foreground">
              Die besten neuen AI-Tools von ProductHunt – diese Woche für dich
              getestet und bewertet
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool: ToolType) => (
            <Card
              key={tool.id}
              className="group border-border bg-card transition-all hover:border-border hover:bg-muted"
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
                    <img
                      src={tool.imageUrl || "/assets/tools-hero.jpg"}
                      alt={tool.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground truncate">
                        {tool.name}
                      </h3>
                      {tool.isNew && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                          <Sparkles className="mr-1 h-2.5 w-2.5" /> New
                        </Badge>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className="mt-1 border-border text-muted-foreground text-[10px]"
                    >
                      {tool.category}
                    </Badge>
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                      {tool.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-foreground0">
                    <ArrowUpRight className="h-3 w-3" />
                    {tool.voteCount || 0} Votes
                  </div>
                  {tool.url && (
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-border text-muted-foreground hover:bg-muted hover:text-foreground text-xs"
                      >
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Ansehen
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
