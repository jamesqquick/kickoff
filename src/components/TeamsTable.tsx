import { ExternalLink } from "lucide-react";
import { cn, teamColorGradient } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { TeamCrest } from "@/components/TeamCrest";
import type { TeamWithCoach } from "@/repositories/team-repository";

interface Props {
  teams: TeamWithCoach[];
}

export function TeamsTable({ teams }: Props) {
  if (teams.length === 0) {
    return (
      <div className="rounded-xl border border-(--color-border) bg-(--color-card) p-12 text-center">
        <p className="text-(--color-muted) text-sm">No teams yet.</p>
      </div>
    );
  }

  return (
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
            <th className="hidden sm:table-cell text-left text-xs font-semibold uppercase tracking-wider text-(--color-muted-fg) px-5 py-3">
              Coach
            </th>
            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-(--color-muted-fg)">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => (
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
              <td className="hidden sm:table-cell px-5 py-3.5 text-sm text-(--color-muted)">
                {team.coachName}
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center justify-end gap-2">
                  <a
                    href={`/admin/teams/${team.id}`}
                    className={cn(buttonVariants({ variant: "outline" }), "h-7 px-2 xl:px-3 text-xs shrink-0 gap-1")}
                    title="View team"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    <span className="hidden xl:inline">View</span>
                  </a>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
