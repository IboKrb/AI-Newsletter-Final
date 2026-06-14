import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Clock,
  Play,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { staticTutorials } from "@/data/staticData";

const difficultyColors: Record<string, string> = {
  beginner: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  intermediate: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  advanced: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

interface TutorialType {
  id: number;
  title: string;
  description: string;
  tool: string;
  difficulty: string;
  content: string;
  videoUrl: string | null;
  imageUrl: string | null;
  estimatedTime: string | null;
}

export default function TutorialSection() {
  const { data: issue } = trpc.newsletter.getLatest.useQuery();
  const { data: content } = trpc.newsletter.getIssueContent.useQuery(
    { issueId: issue?.id || 0 },
    { enabled: !!issue?.id }
  );

  const apiTutorials: TutorialType[] = (content?.tutorials as unknown as TutorialType[]) || [];
  const tutorials = apiTutorials.length > 0 ? apiTutorials : staticTutorials as unknown as TutorialType[];

  return (
    <section id="tutorial" className="border-t border-border py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500">
            <GraduationCap className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              AI Tutorial der Woche
            </h2>
            <p className="text-sm text-muted-foreground">
              Deep Dive in ein AI-Tool oder Konzept – von Anfänger bis Experte
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {tutorials.map((tutorial: TutorialType) => (
            <Card
              key={tutorial.id}
              className="overflow-hidden border-border bg-card transition-all hover:border-border"
            >
              <div className="relative aspect-video">
                <img
                  src={tutorial.imageUrl || "/assets/tutorial-claude.jpg"}
                  alt={tutorial.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2">
                    <Badge className={difficultyColors[tutorial.difficulty] || difficultyColors.intermediate}>
                      {tutorial.difficulty}
                    </Badge>
                    <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">
                      <Clock className="mr-1 h-2.5 w-2.5" />
                      {tutorial.estimatedTime}
                    </Badge>
                  </div>
                </div>
                {tutorial.videoUrl && (
                  <a
                    href={tutorial.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20"
                  >
                    <Play className="h-4 w-4 text-foreground fill-white" />
                  </a>
                )}
              </div>

              <CardContent className="p-5">
                <div className="mb-2 text-xs font-medium text-foreground0">
                  {tutorial.tool}
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  {tutorial.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {tutorial.description}
                </p>

                <div className="mt-4 rounded-lg bg-background border border-border p-3 max-h-40 overflow-auto">
                  <div className="prose prose-sm max-w-none">
                    {tutorial.content.split("\n").map((line: string, i: number) => {
                      if (line.startsWith("## ")) {
                        return (
                          <h4 key={i} className="text-sm font-bold text-foreground mt-2 mb-1">
                            {line.replace("## ", "")}
                          </h4>
                        );
                      }
                      if (line.startsWith("### ")) {
                        return (
                          <h5 key={i} className="text-xs font-semibold text-muted-foreground mt-2 mb-1">
                            {line.replace("### ", "")}
                          </h5>
                        );
                      }
                      if (line.startsWith("- ")) {
                        return (
                          <li key={i} className="text-xs text-muted-foreground ml-4">
                            {line.replace("- ", "")}
                          </li>
                        );
                      }
                      return line ? (
                        <p key={i} className="text-xs text-muted-foreground my-1">
                          {line}
                        </p>
                      ) : null;
                    })}
                  </div>
                </div>

                {tutorial.videoUrl && (
                  <a
                    href={tutorial.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Video-Tutorial ansehen
                    <ChevronRight className="h-3 w-3" />
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
