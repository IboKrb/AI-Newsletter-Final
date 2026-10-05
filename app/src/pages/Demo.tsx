import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/providers/trpc";

/**
 * Direktlink für Besucher (z. B. aus einer Bewerbung): meldet als Demo-Gast an
 * und leitet ins Dashboard weiter – ohne Passwort, nur Lesezugriff.
 */
export default function Demo() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const started = useRef(false);

  const demoLogin = trpc.auth.demoLogin.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate("/admin", { replace: true });
    },
  });

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    demoLogin.mutate();
  }, [demoLogin]);

  if (demoLogin.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="max-w-md text-center shadow-sm">
          <CardHeader>
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
            <CardTitle>Demo nicht verfügbar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{demoLogin.error.message}</p>
            <Button asChild className="w-full bg-brand-gradient text-white">
              <Link to="/">Zur Startseite</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      <p className="text-sm text-muted-foreground">Demo-Dashboard wird geladen…</p>
    </div>
  );
}
