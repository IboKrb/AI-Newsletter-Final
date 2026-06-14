import { useState } from "react";
import { Newspaper } from "lucide-react";

/**
 * Artikel-Vorschaubild mit Platzhalter (Marken-Verlauf) als Fallback,
 * wenn kein Bild vorhanden ist oder es nicht lädt.
 */
export default function ArticleThumb({
  src,
  alt,
  className = "",
  iconClassName = "h-8 w-8",
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  iconClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100 ${className}`}
        aria-hidden="true"
      >
        <Newspaper className={`text-emerald-600/40 ${iconClassName}`} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt ?? ""}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
