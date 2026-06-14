import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/providers/trpc";
import { Zap, ArrowRight, Sparkles, Globe, TrendingUp, BookOpen } from "lucide-react";
import { staticIssue } from "@/data/staticData";

export default function HeroSection() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const subscribe = trpc.newsletter.subscribe.useMutation();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    await subscribe.mutateAsync({ email, tier: "free" });
    setSubscribed(true);
    setEmail("");
  };

  const { data: issue } = trpc.newsletter.getLatest.useQuery();
  const activeIssue = issue || staticIssue;

  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* dezente Akzent-Glows */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-10 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 md:py-28">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div className="animate-slide-up">
            <Badge variant="outline" className="mb-4 border-emerald-200 bg-emerald-50 text-emerald-700">
              <Sparkles className="mr-1 h-3 w-3" />
              Issue #{activeIssue?.issueNumber || 1} – Juni 2026
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
              Dein <span className="text-brand-gradient">AI Newsletter</span> der Woche
            </h1>
            <p className="mt-4 max-w-lg text-lg text-muted-foreground">
              {activeIssue?.summary ||
                "Curated KI-News aus 5 führenden Quellen, Tool-Empfehlungen, Prompts, Tutorials und mehr – komplett automatisiert recherchiert."}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {[
                { icon: Globe, label: "5 News-Quellen" },
                { icon: TrendingUp, label: "ProductHunt Tools" },
                { icon: Zap, label: "Prompt der Woche" },
                { icon: BookOpen, label: "Deep Dive Tutorials" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-sm"
                >
                  <item.icon className="h-3 w-3 text-emerald-600" />
                  {item.label}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubscribe} className="mt-8 flex max-w-md gap-2">
              <Input
                type="email"
                placeholder="Deine E-Mail-Adresse"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
              />
              <Button
                type="submit"
                disabled={subscribe.isPending || subscribed}
                className="h-12 bg-brand-gradient px-6 text-white transition-transform hover:scale-[1.02]"
              >
                {subscribed ? "Abonniert!" : (<>Abonnieren <ArrowRight className="ml-1 h-4 w-4" /></>)}
              </Button>
            </form>
            {subscribed && (
              <p className="mt-2 text-sm text-emerald-600">
                Danke! Du erhältst ab jetzt den wöchentlichen AI Newsletter.
              </p>
            )}
          </div>

          <div className="relative hidden animate-fade-in md:block">
            <div className="relative rounded-2xl border border-border bg-card/80 p-6 shadow-xl shadow-emerald-500/5 backdrop-blur">
              <div className="flex items-center gap-2 border-b border-border pb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-gradient">
                  <Zap className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm font-semibold">Diese Woche im Überblick</span>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  "OpenAI plant AI-Smartphone",
                  "Google Workspace AI Upgrade",
                  "DeepSeek-V4: Frontier zum Bruchteil",
                  "MIT: 10 Things That Matter in AI",
                  "Microsoft/OpenAI Deal beendet",
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3 transition-colors hover:border-emerald-200"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                      {i + 1}
                    </span>
                    <span className="text-sm text-foreground/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
