import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/providers/trpc";
import {
  Check,
  X,
  Crown,
  Zap,
  Lock,
  Sparkles,
  ArrowRight,
  Mail,
} from "lucide-react";

const freeFeatures = [
  "Wöchentliche AI News (5 Quellen)",
  "Top 3 Tool-Empfehlungen",
  "1 Prompt der Woche",
  "1 AI Tutorial (Basis)",
  "Newsletter per E-Mail",
];

const premiumFeatures = [
  "Alle Free-Features",
  "Alle Tool-Empfehlungen (Top 10+)",
  "Exklusive Prompt-Sammlung",
  "Bildgenerierung Prompt Training",
  "Alle Tutorials & Deep Dives",
  "Podcast & Video Empfehlungen",
  "Read of the Week (alle Artikel)",
  "Archiv-Zugriff (alle Ausgaben)",
  "Premium-Community Discord",
];

export default function PricingSection({
  userTier,
}: {
  userTier: string;
}) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const subscribe = trpc.newsletter.subscribe.useMutation();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    await subscribe.mutateAsync({ email, tier: "premium" });
    setSubscribed(true);
    setEmail("");
  };

  return (
    <section id="pricing" className="border-t border-border py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 text-center">
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 mb-3">
            <Crown className="mr-1 h-3 w-3" /> Free vs. Premium
          </Badge>
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">
            Wähle dein Paket
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Kostenlos starten – oder Premium für den vollen AI-Intelligence-Stack
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Free Plan */}
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-foreground">Free</h3>
                <p className="text-sm text-muted-foreground">Für Einsteiger</p>
                <div className="mt-3 text-3xl font-extrabold text-foreground">
                  €0
                  <span className="text-sm font-normal text-foreground0">
                    /Monat
                  </span>
                </div>
              </div>

              <ul className="space-y-3">
                {freeFeatures.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                    {feature}
                  </li>
                ))}
                {premiumFeatures.slice(1).map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    {feature}
                  </li>
                ))}
              </ul>

              <form
                onSubmit={handleSubscribe}
                className="mt-6 flex gap-2"
              >
                <Input
                  type="email"
                  placeholder="E-Mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 border-border bg-background text-foreground placeholder:text-muted-foreground"
                />
                <Button
                  type="submit"
                  disabled={subscribe.isPending || subscribed}
                  className="h-10 bg-muted text-foreground hover:bg-slate-700"
                >
                  {subscribed ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                </Button>
              </form>
              {subscribed && (
                <p className="mt-2 text-xs text-emerald-600">
                  Danke für dein Abo!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="relative border-emerald-500/30 bg-gradient-to-b from-white to-emerald-950/20 lg:col-span-2">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-foreground border-0">
                <Sparkles className="mr-1 h-3 w-3" /> Empfohlen
              </Badge>
            </div>
            <CardContent className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Premium</h3>
                  <p className="text-sm text-muted-foreground">Für AI-Professionals</p>
                  <div className="mt-3 text-3xl font-extrabold text-foreground">
                    €9.90
                    <span className="text-sm font-normal text-foreground0">
                      /Monat
                    </span>
                  </div>
                </div>
                {userTier === "premium" && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    <Crown className="mr-1 h-3 w-3" /> Aktiv
                  </Badge>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {premiumFeatures.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-muted-foreground list-none"
                  >
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                    {feature}
                  </li>
                ))}
              </div>

              <Button
                className="mt-6 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-foreground hover:from-emerald-500 hover:to-teal-500"
                disabled={userTier === "premium"}
              >
                {userTier === "premium" ? (
                  <>
                    <Lock className="mr-2 h-4 w-4" /> Bereits Premium
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" /> Premium starten
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="mt-3 text-center text-xs text-foreground0">
                Jederzeit kündbar. 14 Tage Geld-zurück-Garantie.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
