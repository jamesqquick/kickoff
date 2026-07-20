import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { delay } from "@/lib/utils";

export function ContinueToRosterButton() {
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    setLoading(true);
    try {
      // TODO: swap for `await actions.teams.register(...)` once Actions are wired up
      await delay(800);
      toast.success("Registration submitted");
    } catch {
      toast.error("Could not submit registration. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="default"
      className="px-5"
      onClick={handleContinue}
      disabled={loading}
    >
      {loading ? "Submitting…" : "Continue to Roster →"}
    </Button>
  );
}
