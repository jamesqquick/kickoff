import { useState, useRef, useEffect } from "react";
import { ChevronDown, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TournamentStatus } from "@/lib/utils";

interface TournamentItem {
  id: string;
  name: string;
  status: TournamentStatus;
}

interface Props {
  tournaments: TournamentItem[];
  activeTournamentId: string | null;
  currentSection: string;
}

const STATUS_LABELS: Record<TournamentStatus, string> = {
  active: "Active",
  upcoming: "Upcoming",
  past: "Past",
};

export function TournamentSwitcher({
  tournaments,
  activeTournamentId,
  currentSection,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeTournament = tournaments.find((t) => t.id === activeTournamentId);

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function handleSelect(id: string) {
    if (id === activeTournamentId) {
      setOpen(false);
      return;
    }
    const seg = currentSection === "overview" ? "" : `/${currentSection}`;
    window.location.href = `/admin/tournaments/${id}${seg}`;
  }

  const grouped: Record<TournamentStatus, TournamentItem[]> = {
    active: tournaments.filter((t) => t.status === "active"),
    upcoming: tournaments.filter((t) => t.status === "upcoming"),
    past: tournaments.filter((t) => t.status === "past"),
  };

  return (
    <div ref={ref} className="relative mb-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] border border-(--color-border) bg-(--color-card) hover:bg-(--color-border-soft) transition-colors cursor-pointer text-left"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Trophy className="h-3.5 w-3.5 text-(--color-primary) shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-(--color-muted) leading-none mb-0.5">
            Tournament
          </p>
          <p className="text-sm font-semibold text-(--color-foreground) truncate">
            {activeTournament?.name ?? "Select tournament"}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-(--color-muted) shrink-0 transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 z-50 rounded-[10px] border border-(--color-border) bg-(--color-card) shadow-lg overflow-hidden"
        >
          {tournaments.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <p className="text-sm text-(--color-muted) mb-2">No tournaments yet.</p>
              <a
                href="/admin/tournaments/new"
                className="text-sm text-(--color-primary) hover:underline"
              >
                Create one →
              </a>
            </div>
          ) : (
            <div className="py-1 max-h-64 overflow-y-auto">
              {(["active", "upcoming", "past"] as const).map((status) => {
                const items = grouped[status];
                if (items.length === 0) return null;
                return (
                  <div key={status}>
                    <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-(--color-muted)">
                      {STATUS_LABELS[status]}
                    </p>
                    {items.map((t) => (
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
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
