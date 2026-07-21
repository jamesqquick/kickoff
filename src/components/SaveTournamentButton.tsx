import { useState } from "react";
import { toast } from "sonner";
import { actions } from "astro:actions";
import { Button } from "@/components/ui/button";

interface CreateProps {
  mode: "create";
  tournamentId?: never;
}

interface EditProps {
  mode: "edit";
  tournamentId: string;
}

type Props = CreateProps | EditProps;

function get(name: string): string {
  return ((document.querySelector(`[name="${name}"]`) as HTMLInputElement | null)?.value ?? "").trim();
}

export function SaveTournamentButton({ mode, tournamentId }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    const name = get("name");
    const startDate = get("startDate") || null;
    const endDate = get("endDate") || null;

    if (!name) {
      toast.error("Tournament name is required.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "create") {
        const { error } = await actions.tournaments.create({ name, startDate, endDate });
        if (error) {
          toast.error(error.message ?? "Could not create tournament. Try again.");
          return;
        }
        toast.success("Tournament created.");
        window.location.href = "/admin/tournaments";
      } else {
        const status = get("status") as "draft" | "active" | "completed" | "";
        const { error } = await actions.tournaments.update({
          id: tournamentId,
          name,
          startDate,
          endDate,
          status: status || undefined,
        });
        if (error) {
          toast.error(error.message ?? "Could not save changes. Try again.");
          return;
        }
        toast.success("Tournament updated.");
        window.location.href = "/admin/tournaments";
      }
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleSave} disabled={loading}>
      {loading ? "Saving…" : mode === "create" ? "Create Tournament" : "Save Changes"}
    </Button>
  );
}
