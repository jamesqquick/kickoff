import { useState, useRef, useEffect } from "react";
import { ChevronDown, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface TournamentItem {
  id: string;
  name: string;
  status: string;
}

interface Props {
  tournaments: TournamentItem[];
  activeTournamentId: string | null;
  /** URL segment for the current section, e.g. "registrations". Empty string = overview. */
  currentSection: string;
}

export function DirectorTournamentSwitcher({ tournaments, activeTournamentId, currentSection }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const active = tournaments.find((t) => t.id === activeTournamentId);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function handleSelect(id: string) {
    setOpen(false);
    if (id === activeTournamentId) return;
    const seg = currentSection ? `/${currentSection}` : "";
    window.location.href = `/director/tournaments/${id}${seg}`;
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-(--color-border-soft) transition-colors cursor-pointer text-sm font-medium text-(--color-foreground) max-w-[280px]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Trophy className="h-3.5 w-3.5 text-(--color-primary) shrink-0" />
        <span className="truncate">{active?.name ?? "Select tournament"}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-(--color-muted) shrink-0 transition-transform duration-150", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute top-full left-0 mt-1 z-50 min-w-[220px] rounded-[10px] border border-(--color-border) bg-(--color-card) shadow-lg overflow-hidden"
        >
          {tournaments.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <p className="text-sm text-(--color-muted) mb-2">No tournaments yet.</p>
              <a href="/director/tournaments/new" className="text-sm text-(--color-primary) hover:underline">
                Create one →
              </a>
            </div>
          ) : (
            <div className="py-1 max-h-64 overflow-y-auto">
              {tournaments.map((t) => (
                <button
                  key={t.id}
                  role="option"
                  aria-selected={t.id === activeTournamentId}
                  onClick={() => handleSelect(t.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer",
                    t.id === activeTournamentId
                      ? "bg-(--color-primary-subtle) text-(--color-primary) font-semibold"
                      : "text-(--color-foreground) hover:bg-(--color-border-soft)",
                  )}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
