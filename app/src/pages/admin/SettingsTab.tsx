import { useEffect, useState } from "react";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KeyRound, Save, Plug, CheckCircle2, XCircle, Sparkles, CalendarClock } from "lucide-react";

const WEEKDAYS = [
  { value: 1, label: "Montag" },
  { value: 2, label: "Dienstag" },
  { value: 3, label: "Mittwoch" },
  { value: 4, label: "Donnerstag" },
  { value: 5, label: "Freitag" },
  { value: 6, label: "Samstag" },
  { value: 0, label: "Sonntag" },
];

// Auswählbare Gemini-Modelle (alle mit Google-Search-Grounding nutzbar).
const MODEL_OPTIONS = [
  { value: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite — empfohlen (hohes Tageslimit)" },
  { value: "gemini-3.5-flash", label: "Gemini 3.5 Flash" },
  { value: "gemini-3-flash", label: "Gemini 3 Flash" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro (stärker, niedrigeres Limit)" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite" },
];
const CUSTOM_MODEL = "__custom__";

export default function SettingsTab() {
  const utils = trpc.useUtils();
  const { data: settings } = trpc.workflow.getSettings.useQuery();

  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [grounding, setGrounding] = useState(true);
  const [testMode, setTestMode] = useState(false);
  const [cronEnabled, setCronEnabled] = useState(true);
  const [cronDay, setCronDay] = useState(1);
  const [cronHour, setCronHour] = useState(6);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (settings) {
      setModel(settings.model || "gemini-3.1-flash-lite");
      setGrounding(settings.grounding);
      setTestMode(settings.testMode);
      setCronEnabled(settings.cronEnabled);
      setCronDay(settings.cronDay);
      setCronHour(settings.cronHour);
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
    <div className="space-y-6">
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
            <Select
              value={MODEL_OPTIONS.some((m) => m.value === model) ? model : CUSTOM_MODEL}
              onValueChange={(v) => setModel(v === CUSTOM_MODEL ? "" : v)}
            >
              <SelectTrigger id="model">
                <SelectValue placeholder="Modell wählen" />
              </SelectTrigger>
              <SelectContent>
                {MODEL_OPTIONS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
                <SelectItem value={CUSTOM_MODEL}>Benutzerdefiniert…</SelectItem>
              </SelectContent>
            </Select>
            {!MODEL_OPTIONS.some((m) => m.value === model) && (
              <Input
                placeholder="z.B. gemini-3.1-flash-lite"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            )}
            <p className="text-xs text-muted-foreground">
              Empfohlen: <code>gemini-3.1-flash-lite</code>. Bei Unbekannt → „Benutzerdefiniert" + exakte ID aus Google AI Studio.
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

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-4 w-4 text-emerald-600" /> Automatischer Wochenlauf
          </CardTitle>
          <CardDescription>
            Führt automatisch alle aktiven Workflows einmal pro Woche aus (Zeitzone Europe/Berlin).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4">
            <div>
              <p className="text-sm font-medium">Wöchentlich automatisch ausführen</p>
              <p className="text-xs text-muted-foreground">
                Aktiviert den geplanten Lauf. Manuelle Läufe sind jederzeit zusätzlich möglich.
              </p>
            </div>
            <Switch checked={cronEnabled} onCheckedChange={setCronEnabled} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Wochentag</Label>
              <Select value={String(cronDay)} onValueChange={(v) => setCronDay(Number(v))} disabled={!cronEnabled}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WEEKDAYS.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Uhrzeit (Stunde, 0–23)</Label>
              <Input
                type="number"
                min={0}
                max={23}
                value={cronHour}
                disabled={!cronEnabled}
                onChange={(e) => setCronHour(Math.min(23, Math.max(0, Number(e.target.value))))}
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {cronEnabled
              ? `Geplant: jeden ${WEEKDAYS.find((d) => d.value === cronDay)?.label} um ${String(cronHour).padStart(2, "0")}:00 Uhr.`
              : "Automatische Läufe sind deaktiviert."}
          </p>

          <Button
            className="bg-brand-gradient text-white"
            disabled={update.isPending}
            onClick={() => update.mutate({ cronEnabled, cronDay, cronHour })}
          >
            <Save className="mr-2 h-4 w-4" /> Planung speichern
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
