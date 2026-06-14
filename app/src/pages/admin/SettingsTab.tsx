import { useEffect, useState } from "react";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { KeyRound, Save, Plug, CheckCircle2, XCircle, Sparkles } from "lucide-react";

export default function SettingsTab() {
  const utils = trpc.useUtils();
  const { data: settings } = trpc.workflow.getSettings.useQuery();

  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [grounding, setGrounding] = useState(true);
  const [testMode, setTestMode] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (settings) {
      setModel(settings.model || "gemini-2.5-flash");
      setGrounding(settings.grounding);
      setTestMode(settings.testMode);
    }
  }, [settings]);

  const update = trpc.workflow.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Einstellungen gespeichert");
      setApiKey("");
      utils.workflow.getSettings.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const test = trpc.workflow.testConnection.useMutation({
    onSuccess: (r) => {
      setTestResult({ ok: r.ok, msg: r.ok ? r.sample || "OK" : r.error || "Fehler" });
      r.ok ? toast.success("Verbindung erfolgreich") : toast.error("Verbindung fehlgeschlagen");
    },
    onError: (e) => {
      setTestResult({ ok: false, msg: e.message });
      toast.error(e.message);
    },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="shadow-sm lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-emerald-600" /> KI-Verbindung (Gemini)
          </CardTitle>
          <CardDescription>
            Trage deinen Google-Gemini-API-Key ein. Free-Tier reicht — mit aktivem Web-Grounding
            recherchiert Gemini echte Quellen aus dem Internet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="apikey">Gemini API-Key</Label>
            <Input
              id="apikey"
              type="password"
              placeholder={settings?.hasApiKey ? `Gespeichert: ${settings.apiKeyMasked}` : "AIza…"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Key holen:{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 underline"
              >
                aistudio.google.com/app/apikey
              </a>
              . Wird verschlüsselt in der Datenbank gespeichert.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Modell</Label>
            <Input
              id="model"
              placeholder="gemini-2.5-flash"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Empfohlen für Free-Tier + Grounding: <code>gemini-2.5-flash</code>
            </p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4">
            <div>
              <p className="text-sm font-medium">Web-Grounding (Google Search)</p>
              <p className="text-xs text-muted-foreground">
                Lässt Gemini live im Web recherchieren und echte Quellen liefern.
              </p>
            </div>
            <Switch checked={grounding} onCheckedChange={setGrounding} />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4">
            <div>
              <p className="text-sm font-medium">Test-Modus (Mock-Daten)</p>
              <p className="text-xs text-muted-foreground">
                Ohne echten API-Key testen — liefert Beispiel-Artikel pro Kategorie.
              </p>
            </div>
            <Switch checked={testMode} onCheckedChange={setTestMode} />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              className="bg-brand-gradient text-white"
              disabled={update.isPending}
              onClick={() => update.mutate({ apiKey: apiKey || undefined, model, grounding, testMode })}
            >
              <Save className="mr-2 h-4 w-4" /> Speichern
            </Button>
            <Button variant="outline" disabled={test.isPending} onClick={() => test.mutate()}>
              <Plug className="mr-2 h-4 w-4" />
              {test.isPending ? "Teste…" : "Verbindung testen"}
            </Button>
          </div>

          {testResult && (
            <div
              className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
                testResult.ok
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span className="break-words">{testResult.msg}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="h-fit shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-emerald-600" /> Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">API-Key</span>
            {settings?.hasApiKey ? (
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                {settings.apiKeyMasked}
              </Badge>
            ) : (
              <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
                fehlt
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Modell</span>
            <span className="font-medium">{settings?.model || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Grounding</span>
            <span className="font-medium">{settings?.grounding ? "an" : "aus"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Test-Modus</span>
            <span className="font-medium">{settings?.testMode ? "an" : "aus"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
