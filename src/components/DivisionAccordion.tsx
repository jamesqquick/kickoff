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
        const approvedTeams = division.teams.filter((t) => t.status === "approved");
        const approvedCount = approvedTeams.length;

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
              {approvedTeams.length === 0 ? (
                <p className="text-sm text-(--color-muted) py-2">No approved teams yet.</p>
              ) : (
                <ul className="space-y-2 pt-1">
                  {approvedTeams.map((team) => (
                    <li
                      key={team.teamId}
                      className="rounded-md bg-(--color-background) px-3 py-2.5 text-sm text-(--color-foreground)"
                    >
                      {team.teamName}
                    </li>
                  ))}
                </ul>
              )}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
