import { useState } from "react";
import { toast } from "sonner";
import { actions } from "astro:actions";
import { Button } from "@/components/ui/button";

export function RegisterTeamButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    const getText = (name: string) =>
      ((document.querySelector(`[name="${name}"]`) as HTMLInputElement | null)?.value ?? "").trim();
    // Prefer a checked radio; fall back to a hidden/text input (used while the
    // division picker is not yet implemented).
    const name = getText("name");
    const city = getText("city");
    const color = getText("color");
    const shortName = getText("shortName") || undefined;

    if (!name) {
      toast.error("Team name is required.");
      return;
    }
    if (!city) {
      toast.error("Home city is required.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await actions.teams.create({ name, city, color, shortName });
      if (error) {
        toast.error(error.message ?? "Could not create team. Try again.");
        return;
      }
      toast.success("Team created! Redirecting to your team…");
      window.location.href = `/teams/${data.id}`;
    } catch {
      toast.error("Could not create team. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading}>
      {loading ? "Creating…" : "Create Team"}
    </Button>
  );
}
