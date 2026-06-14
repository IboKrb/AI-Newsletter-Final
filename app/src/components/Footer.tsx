import { Newspaper, Github, Twitter, Youtube, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient">
                <Newspaper className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold">AI Newsletter Hub</span>
            </div>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Dein wöchentlicher AI-Newsletter mit curated News aus 5 führenden Quellen,
              Tool-Empfehlungen, Prompts, Tutorials und mehr.
            </p>
            <div className="mt-4 flex gap-3">
              {[Twitter, Github, Youtube, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="rounded-lg border border-border bg-card p-2 text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-600"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Content</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="#news" className="transition-colors hover:text-emerald-600">Latest News</a></li>
              <li><a href="#tools" className="transition-colors hover:text-emerald-600">Tool Recommendations</a></li>
              <li><a href="#prompts" className="transition-colors hover:text-emerald-600">Prompt of the Week</a></li>
              <li><a href="#tutorial" className="transition-colors hover:text-emerald-600">AI Tutorials</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Legal</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="transition-colors hover:text-emerald-600">Impressum</a></li>
              <li><a href="#" className="transition-colors hover:text-emerald-600">Datenschutz</a></li>
              <li><a href="#" className="transition-colors hover:text-emerald-600">AGB</a></li>
              <li><a href="#" className="transition-colors hover:text-emerald-600">Kontakt</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © 2026 AI Newsletter Hub. Alle Rechte vorbehalten. Automatisiert recherchiert aus
          TechCrunch, The Verge, MIT Technology Review, VentureBeat & Ars Technica.
        </div>
      </div>
    </footer>
  );
}
