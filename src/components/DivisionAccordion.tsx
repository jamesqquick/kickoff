import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import type { Division } from "@/lib/schema";

interface RegisteredTeam {
  teamId: string;
  teamName: string;
  status: "approved" | "pending" | "waitlisted" | "rejected";
}

interface DivisionWithTeams extends Division {
  count: number;
  teams: RegisteredTeam[];
}

interface Props {
  divisions: DivisionWithTeams[];
}

const STATUS_BADGE: Record<RegisteredTeam["status"], { label: string; class: string }> = {
  approved:   { label: "Approved",   class: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  pending:    { label: "Pending",    class: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  waitlisted: { label: "Waitlisted", class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  rejected:   { label: "Rejected",   class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
};

export function DivisionAccordion({ divisions }: Props) {
  if (divisions.length === 0) {
    return (
      <p className="text-sm text-(--color-muted) text-center py-8">
        No divisions have been set up for this tournament yet.
      </p>
    );
  }

  return (
    <Accordion type="multiple" className="rounded-lg border border-(--color-border)">
      {divisions.map((division) => {
        const full = division.maxTeams !== null && division.count >= division.maxTeams;
        const approvedCount = division.teams.filter((t) => t.status === "approved").length;

        return (
          <AccordionItem key={division.id} value={division.id}>
            <AccordionTrigger>
              <div className="flex items-center justify-between gap-4 flex-1 mr-3">
                <span className="font-medium text-(--color-foreground)">{division.name}</span>
                <div className="flex items-center gap-3 shrink-0">
                  {division.maxTeams !== null && (
                    <span className={cn(
                      "text-xs",
                      full ? "text-red-500 font-medium" : "text-(--color-muted)",
                    )}>
                      {full ? "Full" : `${approvedCount} / ${division.maxTeams} teams`}
                    </span>
                  )}
                  {division.maxTeams === null && approvedCount > 0 && (
                    <span className="text-xs text-(--color-muted)">
                      {approvedCount} {approvedCount === 1 ? "team" : "teams"}
                    </span>
                  )}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {division.teams.length === 0 ? (
                <p className="text-sm text-(--color-muted) py-2">No teams registered yet.</p>
              ) : (
                <ul className="space-y-2">
                  {division.teams.map((team) => {
                    const badge = STATUS_BADGE[team.status];
                    return (
                      <li
                        key={team.teamId}
                        className="flex items-center justify-between gap-3 rounded-md bg-(--color-background) px-3 py-2"
                      >
                        <span className="text-sm text-(--color-foreground)">{team.teamName}</span>
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0",
                          badge.class,
                        )}>
                          {badge.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
