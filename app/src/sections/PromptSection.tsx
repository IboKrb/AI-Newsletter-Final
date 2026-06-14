import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Copy,
  Check,
  Terminal,
  Tag,
  Lightbulb,
} from "lucide-react";
import { staticPrompt } from "@/data/staticData";

interface PromptType {
  id: number;
  title: string;
  prompt: string;
  description: string;
  useCase: string;
  model: string;
  exampleOutput: string | null;
  tags: string | null;
}

export default function PromptSection() {
  const { data: issue } = trpc.newsletter.getLatest.useQuery();
  const { data: content } = trpc.newsletter.getIssueContent.useQuery(
    { issueId: issue?.id || 0 },
    { enabled: !!issue?.id }
  );

  const apiPrompt: PromptType | undefined = (content?.prompts as unknown as PromptType[])?.[0];
  const prompt = apiPrompt || staticPrompt as unknown as PromptType;
  const [copied, setCopied] = useState(false);

  const copyPrompt = () => {
    if (!prompt?.prompt) return;
    navigator.clipboard.writeText(prompt.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!prompt) return null;

  const tags: string[] = prompt?.tags ? (typeof prompt.tags === "string" ? JSON.parse(prompt.tags) : prompt.tags as unknown as string[]) : [];

  return (
    <section id="prompts" className="border-t border-border py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
            <MessageSquare className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              Prompt Empfehlung der Woche
            </h2>
            <p className="text-sm text-muted-foreground">
              Ein handgepickter, optimierter Prompt für maximale Ergebnisse
            </p>
          </div>
        </div>

        <Card className="border-border bg-gradient-to-br from-white to-white">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    <Lightbulb className="mr-1 h-3 w-3" />
                    {prompt.useCase}
                  </Badge>
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    <Terminal className="mr-1 h-3 w-3" />
                    {prompt.model}
                  </Badge>
                </div>

                <h3 className="text-xl font-bold text-foreground mb-2">
                  {prompt.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {prompt.description}
                </p>

                <div className="relative rounded-xl bg-background border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-foreground0 uppercase tracking-wider">
                      Prompt
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyPrompt}
                      className="h-7 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {copied ? (
                        <>
                          <Check className="mr-1 h-3 w-3 text-emerald-600" /> Kopiert
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 h-3 w-3" /> Kopieren
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-mono leading-relaxed overflow-auto max-h-60">
                    {prompt.prompt}
                  </pre>
                </div>

                {tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="border-border text-muted-foreground text-[10px]"
                      >
                        <Tag className="mr-1 h-2.5 w-2.5" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {prompt.exampleOutput && (
                <div className="md:w-80 flex-shrink-0">
                  <div className="rounded-xl bg-background border border-border p-4">
                    <span className="text-xs font-medium text-foreground0 uppercase tracking-wider">
                      Beispiel-Output
                    </span>
                    <div className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {prompt.exampleOutput}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
