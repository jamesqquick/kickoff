import { useState } from "react";
import { toast } from "sonner";
import { actions } from "astro:actions";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Division } from "@/lib/schema";

interface DivisionWithCount extends Division {
  count: number;
}

interface Props {
  tournamentId: string;
  divisions: DivisionWithCount[];
  coachTeams: { id: string; name: string }[];
}

export function RegisterForTournamentForm({ tournamentId, divisions, coachTeams }: Props) {
  const [selectedTeamId, setSelectedTeamId] = useState(coachTeams[0]?.id ?? "");
  const [selectedDivisionId, setSelectedDivisionId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDivisionId) {
      toast.error("Please select a division before submitting.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await actions.tournamentRegistrations.register({
        teamId: selectedTeamId,
        divisionId: selectedDivisionId,
      });
      if (error) {
        toast.error(error.message ?? "Could not submit registration. Try again.");
        return;
      }
      toast.success("Registration submitted — pending admin approval.");
      window.location.href = `/tournaments/${tournamentId}?registered=1`;
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* Team selector — only shown when the coach has more than one team */}
      {coachTeams.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-(--color-foreground) mb-2">
            Which team are you registering?
          </label>
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="w-full rounded-md border border-(--color-border) bg-(--color-background) px-3 py-2 text-sm text-(--color-foreground) focus:outline-none focus:ring-2 focus:ring-(--color-primary) cursor-pointer"
          >
            {coachTeams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Division selector */}
      <div>
        <label className="block text-sm font-medium text-(--color-foreground) mb-3">
          Select a division
        </label>
        <div className="space-y-2">
          {divisions.map((d) => {
            const full = d.maxTeams !== null && d.count >= d.maxTeams;
            const selected = selectedDivisionId === d.id;
            return (
              <label
                key={d.id}
                className={cn(
                  "flex items-center justify-between gap-4 rounded-lg border px-4 py-3 transition-colors",
                  full
                    ? "opacity-50 cursor-not-allowed border-(--color-border)"
                    : selected
                    ? "border-(--color-primary) bg-(--color-primary-subtle) cursor-pointer"
                    : "border-(--color-border) hover:border-(--color-primary) hover:bg-(--color-card-hover) cursor-pointer",
                )}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="division"
                    value={d.id}
                    disabled={full}
                    checked={selected}
                    onChange={() => !full && setSelectedDivisionId(d.id)}
                    className="accent-(--color-primary) cursor-pointer"
                  />
                  <span className="text-sm font-medium text-(--color-foreground)">{d.name}</span>
                </div>
                {d.maxTeams !== null && (
                  <span className={cn(
                    "text-xs shrink-0",
                    full ? "text-red-500 font-medium" : "text-(--color-muted)",
                  )}>
                    {full ? "Full" : `${d.count} / ${d.maxTeams} teams`}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <a
          href={`/tournaments/${tournamentId}`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Cancel
        </a>
        <Button type="submit" disabled={loading || !selectedDivisionId}>
          {loading ? "Submitting…" : "Submit Registration"}
        </Button>
      </div>
    </form>
  );
}
