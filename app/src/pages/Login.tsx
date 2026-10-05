import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Newspaper, Eye } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Paths } from "@contracts/constants";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => navigate("/admin"),
    onError: (err) => setError(err.message || "Login fehlgeschlagen"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-md shadow-emerald-500/20">
            <Newspaper className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold">AI Newsletter Hub</span>
        </Link>
        <Card className="shadow-lg shadow-emerald-500/5">
          <CardHeader className="text-center">
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>Melde dich an, um Workflows & Artikel zu verwalten.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Benutzername</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Passwort</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              {error && <p className="text-sm text-rose-600">{error}</p>}
              <Button className="w-full bg-brand-gradient text-white" size="lg" type="submit" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Anmelden…" : "Anmelden"}
              </Button>
            </form>
            <div className="mt-6 border-t border-border pt-5 text-center">
              <p className="mb-3 text-sm text-muted-foreground">Kein Zugang? Schau dir das Dashboard als Gast an.</p>
              <Button asChild variant="outline" className="w-full">
                <Link to={Paths.demo}>
                  <Eye className="mr-2 h-4 w-4" /> Demo ansehen (nur Lesen)
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
