import { useState } from "react";
import { toast } from "sonner";
import { actions } from "astro:actions";
import { Button } from "@/components/ui/button";

interface CreateProps {
  mode: "create";
  tournamentId?: never;
  /** Base path for the post-create redirect. Defaults to "/admin/tournaments". */
  redirectBase?: string;
}

interface EditProps {
  mode: "edit";
  tournamentId: string;
  redirectBase?: string;
}

type Props = CreateProps | EditProps;

function get(name: string): string {
  return ((document.querySelector(`[name="${name}"]`) as HTMLInputElement | null)?.value ?? "").trim();
}

export function SaveTournamentButton({ mode, tournamentId, redirectBase = "/admin/tournaments" }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    const name = get("name");
    const startDate = get("startDate") || null;
    const endDate = get("endDate") || null;
    const registrationDeadline = get("registrationDeadline") || null;
    const location = get("location") || null;
    const description = get("description") || null;

    if (!name) {
      toast.error("Tournament name is required.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "create") {
        const { data, error } = await actions.tournaments.create({
          name,
          startDate,
          endDate,
          registrationDeadline,
          location,
          description,
        });
        if (error) {
          toast.error(error.message ?? "Could not create tournament. Try again.");
          return;
        }
        toast.success("Tournament created. Add divisions below.");
        window.location.href = `${redirectBase}/${data.id}/edit`;
      } else {
        const { error } = await actions.tournaments.update({
          id: tournamentId,
          name,
          startDate,
          endDate,
          registrationDeadline,
          location,
          description,
        });
        if (error) {
          toast.error(error.message ?? "Could not save changes. Try again.");
          return;
        }
        toast.success("Tournament updated.");
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
