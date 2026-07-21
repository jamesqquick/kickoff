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
    const getField = (name: string) =>
      ((document.querySelector(`[name="${name}"]:checked`) as HTMLInputElement | null)?.value ?? "").trim() ||
      getText(name);

    const name = getText("name");
    const city = getText("city");
    const division = getField("division");
    const color = getText("color");

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
      const { data, error } = await actions.teams.create({ name, city, division, color });
      if (error) {
        toast.error(error.message ?? "Could not register team. Try again.");
        return;
      }
      toast.success("Team registered! Redirecting to your team…");
      window.location.href = `/teams/${data.id}`;
    } catch {
      toast.error("Could not register team. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading}>
      {loading ? "Registering…" : "Register Team"}
    </Button>
  );
}
