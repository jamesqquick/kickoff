import { useState } from "react";
import { toast } from "sonner";
import { actions } from "astro:actions";
import { Button } from "@/components/ui/button";

interface Props {
  name: string;
  city: string;
  division: string;
}

export function RegisterTeamButton({ name, city, division }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const { data, error } = await actions.teams.create({ name, city, division });
      if (error) {
        toast.error(error.message ?? "Could not register team. Try again.");
        return;
      }
      toast.success("Team registered! Redirecting to your team…");
      window.location.href = `/teams/${data.id}`;
    } catch {
      toast.error("Could not register team. Try again.");
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading}>
      {loading ? "Registering…" : "Register Team"}
    </Button>
  );
}
