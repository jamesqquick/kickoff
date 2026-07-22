import { useState } from "react";
import { toast } from "sonner";
import { actions } from "astro:actions";
import { Button } from "@/components/ui/button";
import type { Division, Team } from "@/lib/schema";

interface Props {
  division: Division;
  coachTeams: Pick<Team, "id" | "name" | "status">[];
  // ID of the team already registered in this tournament, if any.
  registeredTeamId: string | null;
}

export function RegisterForTournamentButton({ division, coachTeams, registeredTeamId }: Props) {
  const eligibleTeams = coachTeams.filter((t) => t.status === "approved");
  const [selectedTeamId, setSelectedTeamId] = useState(eligibleTeams[0]?.id ?? "");
  const [loading, setLoading] = useState(false);

  // Already registered in this tournament (any division).
  if (registeredTeamId !== null) {
    return (
      <span className="text-xs text-(--color-muted) italic">
        {coachTeams.find((t) => t.id === registeredTeamId)?.name ?? "Your team"} is registered
      </span>
    );
  }

  if (eligibleTeams.length === 0) {
    return (
      <span className="text-xs text-(--color-muted) italic">
        No approved teams to register
      </span>
    );
  }

  async function handleRegister() {
    if (!selectedTeamId) {
      toast.error("Select a team to register.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await actions.tournamentRegistrations.register({
        teamId: selectedTeamId,
        divisionId: division.id,
      });
      if (error) {
        toast.error(error.message ?? "Could not register. Try again.");
        return;
      }
      toast.success("Registration submitted! Pending admin approval.");
      // Reload the page to reflect updated state.
      window.location.reload();
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {eligibleTeams.length > 1 && (
        <select
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(e.target.value)}
          className="rounded-md border border-(--color-border) bg-(--color-background) px-3 py-1.5 text-sm text-(--color-foreground) focus:outline-none focus:ring-2 focus:ring-(--color-primary) cursor-pointer"
        >
          {eligibleTeams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      )}
      <Button size="sm" onClick={handleRegister} disabled={loading} className="cursor-pointer">
        {loading ? "Registering…" : `Register${eligibleTeams.length === 1 ? ` ${eligibleTeams[0].name}` : ""}`}
      </Button>
    </div>
  );
}
