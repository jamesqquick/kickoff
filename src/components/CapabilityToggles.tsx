import { useState } from "react";
import { toast } from "sonner";
import { actions } from "astro:actions";
import { Button } from "@/components/ui/button";

interface Props {
  initialIsCoach: boolean;
  initialIsDirector: boolean;
  isAdmin: boolean;
}

export function CapabilityToggles({ initialIsCoach, initialIsDirector, isAdmin }: Props) {
  const [isCoach, setIsCoach] = useState(initialIsCoach);
  const [isDirector, setIsDirector] = useState(initialIsDirector);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!isAdmin && !isCoach && !isDirector) {
      toast.error("At least one capability must remain enabled.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await actions.settings.updateCapabilities({ isCoach, isDirector });
      if (error) {
        toast.error(error.message ?? "Could not update capabilities. Try again.");
        return;
      }
      toast.success("Capabilities updated. Refresh to see nav changes.");
    } catch {
      toast.error("Could not update capabilities. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const changed = isCoach !== initialIsCoach || isDirector !== initialIsDirector;

  return (
    <div className="space-y-3">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isCoach}
          onChange={(e) => setIsCoach(e.target.checked)}
          className="w-4 h-4 accent-(--color-primary) mt-0.5 shrink-0 cursor-pointer"
          disabled={loading}
        />
        <span className="text-sm text-(--color-foreground) leading-snug">
          <strong>Coach / Team Manager</strong>
          <span className="block text-(--color-muted)">
            Create and manage teams, register for tournaments
          </span>
        </span>
      </label>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isDirector}
          onChange={(e) => setIsDirector(e.target.checked)}
          className="w-4 h-4 accent-(--color-primary) mt-0.5 shrink-0 cursor-pointer"
          disabled={loading}
        />
        <span className="text-sm text-(--color-foreground) leading-snug">
          <strong>Tournament Director</strong>
          <span className="block text-(--color-muted)">
            Create and run tournaments, manage registrations and divisions
          </span>
        </span>
      </label>

      {!isAdmin && !isCoach && !isDirector && (
        <p className="text-xs text-red-600">
          At least one capability must remain enabled.
        </p>
      )}

      <Button
        onClick={handleSave}
        disabled={loading || !changed || (!isAdmin && !isCoach && !isDirector)}
        size="sm"
      >
        {loading ? "Saving…" : "Save capabilities"}
      </Button>
    </div>
  );
}
