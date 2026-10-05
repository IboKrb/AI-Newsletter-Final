import { useEffect } from "react";
import { Link } from "react-router";
import { Compass, Check, MousePointerClick, X, ArrowLeft, ArrowRight, Home, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GUIDE_STEPS } from "./guide-steps";

export default function AdminGuide({
  step,
  onStepChange,
  onClose,
}: {
  step: number;
  onStepChange: (step: number) => void;
  onClose: () => void;
}) {
  const current = GUIDE_STEPS[step];
  const Icon = current.icon;
  const isFirst = step === 0;
  const isLast = step === GUIDE_STEPS.length - 1;

  // Tastatur: ← / → blättern, Esc schließt (nicht in Eingabefeldern oder offenen Dialogen)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (document.querySelector("[role='dialog'][data-state='open']")) return;
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && !isLast) onStepChange(step + 1);
      else if (e.key === "ArrowLeft" && !isFirst) onStepChange(step - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, isFirst, isLast, onStepChange, onClose]);

  return (
    <aside
      aria-label="Klick-Guide"
      className="fixed inset-x-4 bottom-4 z-40 animate-slide-up sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[400px]"
    >
      <div className="flex max-h-[75vh] flex-col overflow-hidden rounded-2xl border border-emerald-200 bg-card shadow-2xl shadow-emerald-900/10">
        {/* Kopf */}
        <div className="flex items-center gap-2 bg-brand-gradient px-4 py-2.5 text-white">
          <Compass className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">Klick-Guide</span>
          <span className="text-xs text-white/80">
            Schritt {step + 1} von {GUIDE_STEPS.length}
          </span>
          <button
            onClick={onClose}
            className="ml-auto rounded-md p-1 transition-colors hover:bg-white/20"
            aria-label="Guide schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Inhalt */}
        <div className="space-y-3 overflow-y-auto p-4" key={step}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold leading-tight">{current.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{current.intro}</p>
          <ul className="space-y-2">
            {current.points.map((point) => (
              <li key={point} className="flex gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          {current.tryIt && (
            <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <MousePointerClick className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                <span className="font-semibold">Probier's aus: </span>
                {current.tryIt}
              </p>
            </div>
          )}
          {isLast && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button asChild variant="outline" size="sm">
                <Link to="/">
                  <Home className="mr-1.5 h-4 w-4" /> Startseite
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/library">
                  <Library className="mr-1.5 h-4 w-4" /> Bibliothek
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3 border-t border-border px-4 py-3">
          {/* Fortschritt (auf kleinen Displays reicht die Schrittzahl im Kopf) */}
          <div className="flex flex-1 gap-1.5 max-sm:invisible">
            {GUIDE_STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => onStepChange(i)}
                aria-label={`Schritt ${i + 1}: ${s.title}`}
                className={`h-2 rounded-full transition-all ${
                  i === step ? "w-5 bg-emerald-500" : "w-2 bg-border hover:bg-emerald-200"
                }`}
              />
            ))}
          </div>
          <Button variant="ghost" size="sm" disabled={isFirst} onClick={() => onStepChange(step - 1)}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Zurück
          </Button>
          {isLast ? (
            <Button size="sm" className="bg-brand-gradient text-white" onClick={onClose}>
              Fertig
            </Button>
          ) : (
            <Button size="sm" className="bg-brand-gradient text-white" onClick={() => onStepChange(step + 1)}>
              Weiter <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
