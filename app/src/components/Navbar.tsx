import { Link, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { Zap, Menu, X, Newspaper, Library, Shield, LogOut, Eye } from "lucide-react";
import { useState } from "react";
import type { User } from "@db/schema";
import { Paths, isDemoUser } from "@contracts/constants";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar({
  user,
  isLoading,
}: {
  user: Omit<User, "passwordHash"> | null;
  isLoading: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const { logout } = useAuth();
  const isDemo = isDemoUser(user);
  const canSeeDashboard = user?.role === "admin" || isDemo;

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  const navLink = "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground link-underline";

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient shadow-sm shadow-emerald-500/20">
            <Newspaper className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">AI Newsletter Hub</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link to="/" className={`${navLink} ${isHome ? "text-foreground" : ""}`}>
            Startseite
          </Link>
          {isHome &&
            [
              { label: "News", id: "news" },
              { label: "Tools", id: "tools" },
              { label: "Prompts", id: "prompts" },
              { label: "Tutorials", id: "tutorials" },
              { label: "Podcasts", id: "podcasts" },
              { label: "Reads", id: "reads" },
            ].map((item) => (
              <button key={item.id} onClick={() => scrollTo(item.id)} className={navLink}>
                {item.label}
              </button>
            ))}
          <Link to="/library" className={`flex items-center gap-1.5 ${navLink}`}>
            <Library className="h-4 w-4" /> Bibliothek
          </Link>
          {canSeeDashboard && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700 link-underline"
            >
              <Shield className="h-4 w-4" /> {isDemo ? "Dashboard" : "Admin"}
            </Link>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isDemo && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
              <Eye className="h-3 w-3" /> Demo · nur Lesen
            </span>
          )}
          {!isLoading &&
            (user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{user.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
                >
                  <LogOut className="mr-1 h-3 w-3" /> Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to={Paths.demo}>
                  <Button size="sm" className="bg-brand-gradient text-white">
                    <Eye className="mr-1 h-3 w-3" /> Live-Demo
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    <Zap className="mr-1 h-3 w-3" /> Login
                  </Button>
                </Link>
              </div>
            ))}
        </div>

        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link to="/" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>
              Startseite
            </Link>
            {isHome &&
              [
                { label: "News", id: "news" },
                { label: "Tools", id: "tools" },
                { label: "Prompts", id: "prompts" },
                { label: "Tutorials", id: "tutorials" },
                { label: "Podcasts", id: "podcasts" },
                { label: "Reads", id: "reads" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className="text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </button>
              ))}
            <Link
              to="/library"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              <Library className="h-4 w-4" /> Bibliothek
            </Link>
            {canSeeDashboard && (
              <Link
                to="/admin"
                className="flex items-center gap-2 text-sm font-medium text-emerald-600"
                onClick={() => setMobileOpen(false)}
              >
                <Shield className="h-4 w-4" /> {isDemo ? "Dashboard" : "Admin"}
              </Link>
            )}
            {user ? (
              <Button
                variant="outline"
                onClick={() => { logout(); setMobileOpen(false); }}
                className="mt-2 w-full hover:bg-rose-50 hover:text-rose-600"
              >
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            ) : (
              <div className="mt-2 flex flex-col gap-2">
                <Link to={Paths.demo} onClick={() => setMobileOpen(false)}>
                  <Button className="w-full bg-brand-gradient text-white">
                    <Eye className="mr-2 h-4 w-4" /> Live-Demo ansehen
                  </Button>
                </Link>
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full">Login</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
