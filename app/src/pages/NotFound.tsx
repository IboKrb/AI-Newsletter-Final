import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm text-center shadow-sm">
        <CardHeader>
          <CardTitle className="text-5xl font-extrabold text-brand-gradient">404</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Diese Seite wurde nicht gefunden.</p>
          <Button asChild className="w-full bg-brand-gradient text-white">
            <Link to="/">Zurück zur Startseite</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
