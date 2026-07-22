import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { cn, teamColorGradient, teamStatusClass } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { FilterTabs } from "@/components/ui/FilterTabs";
import type { FilterTab } from "@/components/ui/FilterTabs";
import { TeamCrest } from "@/components/TeamCrest";
import { TeamActionButtons } from "@/components/TeamActionButtons";
import type { TeamStatus } from "@/lib/schema";
import type { TeamWithCoach } from "@/repositories/team-repository";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

const TABS: FilterTab<StatusFilter>[] = [
  { label: "Pending",  value: "pending"  },
  { label: "All",      value: "all"      },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

function readTabFromUrl(): StatusFilter {
  if (typeof window === "undefined") return "pending";
  const status = new URLSearchParams(window.location.search).get("status");
  return status === "all" || status === "approved" || status === "rejected"
    ? status
    : "pending";
}

interface Props {
  teams: TeamWithCoach[];
}

export function TeamsTable({ teams: initialTeams }: Props) {
  const [teams, setTeams] = useState<TeamWithCoach[]>(initialTeams);
  const [activeTab, setActiveTab] = useState<StatusFilter>(readTabFromUrl);

  // Keep URL in sync when tab changes so the link is bookmarkable
  // and a hard refresh lands on the correct tab.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (activeTab === "pending") {
      url.searchParams.delete("status");
    } else {
      url.searchParams.set("status", activeTab);
    }
    window.history.pushState({}, "", url);
  }, [activeTab]);

  const filteredTeams =
    activeTab === "all"
      ? teams
      : teams.filter((t) => t.status === activeTab);

  function countFor(status: StatusFilter) {
    return status === "all" ? teams.length : teams.filter((t) => t.status === status).length;
  }

  function handleActionSuccess(teamId: string, newStatus: TeamStatus) {
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, status: newStatus } : t)),
    );
  }

  return (
    <div>
      <FilterTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        countFor={countFor}
      />

      {filteredTeams.length === 0 ? (
        <div className="rounded-xl border border-(--color-border) bg-(--color-card) p-12 text-center">
          <p className="text-(--color-muted) text-sm">
            No {activeTab === "all" ? "" : activeTab} teams.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-(--color-border) bg-(--color-card)">
          <table className="w-full">
            <thead>
              <tr className="border-b border-(--color-border)">
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-(--color-muted-fg) px-5 py-3">
                  Team
                </th>
                <th className="hidden md:table-cell text-left text-xs font-semibold uppercase tracking-wider text-(--color-muted-fg) px-5 py-3">
                  City
                </th>
                {activeTab === "pending" && (
                  <th className="hidden sm:table-cell text-left text-xs font-semibold uppercase tracking-wider text-(--color-muted-fg) px-5 py-3">
                    Coach
                  </th>
                )}
                {activeTab === "all" && (
                  <th className="hidden md:table-cell text-left text-xs font-semibold uppercase tracking-wider text-(--color-muted-fg) px-5 py-3">
                    Status
                  </th>
                )}
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-(--color-muted-fg)">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTeams.map((team) => (
                <tr
                  key={team.id}
                  className="border-b border-(--color-border-soft) last:border-0 hover:bg-(--color-background) transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:block">
                         <TeamCrest
                           initials={team.shortName ?? team.name.slice(0, 2).toUpperCase()}
                           gradient={teamColorGradient(team.color)}
                           size="md"
                         />
                      </div>
                      <div>
                        <a
                          href={`/admin/teams/${team.id}`}
                          className="font-semibold text-sm text-(--color-foreground) hover:text-(--color-primary) transition-colors"
                        >
                          {team.name}
                        </a>
                        <p className="text-xs text-(--color-muted) md:hidden">
                          {team.city}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-5 py-3.5 text-sm text-(--color-muted)">
                    {team.city}
                  </td>
                  {activeTab === "pending" && (
                    <td className="hidden sm:table-cell px-5 py-3.5 text-sm text-(--color-muted)">
                      {team.coachName}
                    </td>
                  )}
                  {activeTab === "all" && (
                    <td className="hidden md:table-cell px-5 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          teamStatusClass(team.status),
                        )}
                      >
                        {team.status.charAt(0).toUpperCase() + team.status.slice(1)}
                      </span>
                    </td>
                  )}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      {team.status === "pending" && (
                        <>
                          <a
                            href={`/admin/teams/${team.id}`}
                            className={cn(buttonVariants({ variant: "outline" }), "h-7 px-2 xl:px-3 text-xs shrink-0 gap-1")}
                            title="View team"
                          >
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                            <span className="hidden xl:inline">View</span>
                          </a>
                          <TeamActionButtons
                            teamId={team.id}
                            teamName={team.name}
                            action="approve"
                            onSuccess={(newStatus) => handleActionSuccess(team.id, newStatus)}
                          />
                          <TeamActionButtons
                            teamId={team.id}
                            teamName={team.name}
                            action="reject"
                            onSuccess={(newStatus) => handleActionSuccess(team.id, newStatus)}
                          />
                        </>
                      )}
                      {team.status === "rejected" && (
                        <TeamActionButtons
                          teamId={team.id}
                          teamName={team.name}
                          action="unreject"
                          onSuccess={(newStatus) => handleActionSuccess(team.id, newStatus)}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
