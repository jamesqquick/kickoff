import { useState } from "react";
import { toast } from "sonner";
import { actions } from "astro:actions";
import { Button } from "@/components/ui/button";

interface Props {
  teamId: string;
}

export function SaveTeamButton({ teamId }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    const get = (name: string) =>
      ((document.querySelector(`[name="${name}"]`) as HTMLInputElement | null)?.value ?? "").trim();

    const name = get("name");
    const city = get("city");
    const color = get("color");
    const shortName = get("shortName") || undefined;

    if (!name) {
      toast.error("Team name is required.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await actions.teams.update({ id: teamId, name, city, color, shortName });
      if (error) {
        toast.error(error.message ?? "Could not save changes. Try again.");
        return;
      }
      toast.success("Team updated.");
      window.location.href = `/teams/${teamId}`;
    } catch {
      toast.error("Could not save changes. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleSave} disabled={loading}>
      {loading ? "Saving…" : "Save Changes"}
    </Button>
  );
}
