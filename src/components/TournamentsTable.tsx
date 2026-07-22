import { useState } from "react";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { cn, getTournamentStatus, tournamentStatusClass, tournamentStatusLabel } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { FilterTabs } from "@/components/ui/FilterTabs";
import type { FilterTab } from "@/components/ui/FilterTabs";
import { DeleteTournamentButton } from "@/components/DeleteTournamentButton";
import type { Tournament } from "@/lib/schema";

// Card styles kept inline to avoid an Astro import inside a React island.
const cardClass = "rounded-xl border border-(--color-border) bg-(--color-card)";

type TournamentStatus = "upcoming" | "active" | "past";
type StatusFilter = "all" | TournamentStatus;

const TABS: FilterTab<StatusFilter>[] = [
  { label: "Upcoming", value: "upcoming" },
  { label: "All",      value: "all"      },
  { label: "Active",   value: "active"   },
  { label: "Past",     value: "past"     },
];

function readTabFromUrl(): StatusFilter {
  if (typeof window === "undefined") return "upcoming";
  const s = new URLSearchParams(window.location.search).get("status");
  return s === "all" || s === "active" || s === "past" ? s : "upcoming";
}

function formatDates(t: Tournament): string {
  if (t.startDate && t.endDate) return `${t.startDate} – ${t.endDate}`;
  if (t.startDate) return `From ${t.startDate}`;
  return "—";
}

interface Props {
  tournaments: Tournament[];
}

export function TournamentsTable({ tournaments: initialTournaments }: Props) {
  const [tournaments] = useState<Tournament[]>(initialTournaments);
  const [activeTab, setActiveTab] = useState<StatusFilter>(readTabFromUrl);

  function statusOf(t: Tournament): TournamentStatus {
    return getTournamentStatus(t) as TournamentStatus;
  }

  const filtered =
    activeTab === "all"
      ? tournaments
      : tournaments.filter((t) => statusOf(t) === activeTab);

  function countFor(value: StatusFilter) {
    return value === "all"
      ? tournaments.length
      : tournaments.filter((t) => statusOf(t) === value).length;
  }

  function handleTabChange(tab: StatusFilter) {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    if (tab === "upcoming") {
      url.searchParams.delete("status");
    } else {
      url.searchParams.set("status", tab);
    }
    window.history.pushState({}, "", url);
  }

  return (
    <div>
      <FilterTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        countFor={countFor}
      />

      {filtered.length === 0 ? (
        <div className={cn(cardClass, "p-12 text-center")}>
          <p className="text-(--color-muted) text-sm">
            No {activeTab === "all" ? "" : activeTab} tournaments.
          </p>
        </div>
      ) : (
        <div className={cn(cardClass, "overflow-x-auto")}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-(--color-border)">
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-(--color-muted-fg) px-5 py-3">Name</th>
                <th className="hidden sm:table-cell text-left text-xs font-semibold uppercase tracking-wider text-(--color-muted-fg) px-5 py-3">Status</th>
                <th className="hidden md:table-cell text-left text-xs font-semibold uppercase tracking-wider text-(--color-muted-fg) px-5 py-3">Dates</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-(--color-muted-fg)">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const status = statusOf(t);
                return (
                  <tr
                    key={t.id}
                    className="border-b border-(--color-border-soft) last:border-0 hover:bg-(--color-background) transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-sm text-(--color-foreground)">{t.name}</span>
                      <p className="text-xs text-(--color-muted) sm:hidden mt-0.5">
                        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", tournamentStatusClass(status))}>
                          {tournamentStatusLabel(status)}
                        </span>
                      </p>
                    </td>
                    <td className="hidden sm:table-cell px-5 py-3.5">
                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", tournamentStatusClass(status))}>
                        {tournamentStatusLabel(status)}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-5 py-3.5 text-sm text-(--color-muted)">
                      {formatDates(t)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/tournaments/${t.id}`}
                          className={cn(buttonVariants({ variant: "outline" }), "h-7 px-2 xl:px-3 text-xs shrink-0 gap-1")}
                          title="View tournament"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          <span className="hidden xl:inline">View</span>
                        </a>
                        <a
                          href={`/admin/tournaments/${t.id}/edit`}
                          className={cn(buttonVariants({ variant: "outline" }), "h-7 px-2 xl:px-3 text-xs shrink-0 gap-1")}
                          title="Edit tournament"
                        >
                          <Pencil className="h-3.5 w-3.5 shrink-0" />
                          <span className="hidden xl:inline">Edit</span>
                        </a>
                        {status !== "active" && (
                          <DeleteTournamentButton
                            tournamentId={t.id}
                            tournamentName={t.name}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
