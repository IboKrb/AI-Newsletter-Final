import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Image,
  Copy,
  Check,
  Wand2,
  Palette,
  Star,
} from "lucide-react";
import { staticImageGens } from "@/data/staticData";

interface ImageGenType {
  id: number;
  title: string;
  tool: string;
  prompt: string;
  technique: string;
  description: string;
  imageUrl: string | null;
  tips: string | null;
}

export default function ImageGenSection() {
  const { data: issue } = trpc.newsletter.getLatest.useQuery();
  const { data: content } = trpc.newsletter.getIssueContent.useQuery(
    { issueId: issue?.id || 0 },
    { enabled: !!issue?.id }
  );

  const apiImageGens: ImageGenType[] = (content?.imageGens as unknown as ImageGenType[]) || [];
  const imageGens = apiImageGens.length > 0 ? apiImageGens : staticImageGens as unknown as ImageGenType[];
  const [activeIdx, setActiveIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const active = imageGens[activeIdx];

  const copyPrompt = () => {
    if (!active?.prompt) return;
    navigator.clipboard.writeText(active.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!active) return null;

  const tips: string[] = active.tips ? (typeof active.tips === "string" ? JSON.parse(active.tips) : active.tips as unknown as string[]) : [];

  return (
    <section id="imagegen" className="border-t border-border bg-background py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500">
            <Image className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              Bildgenerierung Prompt Training
            </h2>
            <p className="text-sm text-muted-foreground">
              Lerne von den Profis: Wie du mit Midjourney, DALL-E & Stable
              Diffusion bessere Bilder erzeugst
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Image Gallery */}
          <div className="lg:col-span-2">
            <div className="grid gap-4 md:grid-cols-2">
              {imageGens.map((item: ImageGenType, idx: number) => (
                <div
                  key={item.id}
                  className={`cursor-pointer rounded-xl border-2 transition-all overflow-hidden ${
                    idx === activeIdx
                      ? "border-pink-500/50"
                      : "border-border hover:border-border"
                  }`}
                  onClick={() => setActiveIdx(idx)}
                >
                  <div className="relative aspect-video">
                    <img
                      src={item.imageUrl || "/assets/imgen-photography.jpg"}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <Badge className="bg-pink-500/10 text-pink-600 border-pink-500/20 text-[10px]">
                        <Palette className="mr-1 h-2.5 w-2.5" />
                        {item.tool}
                      </Badge>
                      <h4 className="mt-1 text-sm font-semibold text-foreground line-clamp-1">
                        {item.title}
                      </h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Prompt & Tips */}
          <div>
            <Card className="border-border bg-card h-full">
              <CardContent className="p-5">
                <div className="mb-3">
                  <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">
                    <Wand2 className="mr-1 h-2.5 w-2.5" />
                    {active.technique}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {active.description}
                </p>

                <div className="relative rounded-lg bg-background border border-border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-foreground0 uppercase">
                      Prompt
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyPrompt}
                      className="h-6 text-xs text-muted-foreground hover:text-foreground"
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
                  <p className="text-xs text-muted-foreground font-mono leading-relaxed line-clamp-6">
                    {active.prompt}
                  </p>
                </div>

                {tips.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-foreground0 uppercase mb-2 flex items-center gap-1">
                      <Star className="h-3 w-3" /> Pro-Tipps
                    </h4>
                    <ul className="space-y-2">
                      {tips.map((tip, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-muted-foreground"
                        >
                          <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-pink-500/10 text-[8px] font-bold text-pink-600">
                            {i + 1}
                          </span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
