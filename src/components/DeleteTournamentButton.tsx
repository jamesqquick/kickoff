import { useState } from "react";
import { toast } from "sonner";
import { actions } from "astro:actions";
import { Button } from "@/components/ui/button";

interface Props {
  tournamentId: string;
  tournamentName: string;
}

export function DeleteTournamentButton({ tournamentId, tournamentName }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-red-600">Delete &ldquo;{tournamentName}&rdquo;?</span>
        <Button
          variant="destructive"
          size="sm"
          className="h-7 px-3 text-xs"
          onClick={async () => {
            setLoading(true);
            try {
              const { error } = await actions.tournaments.delete({ id: tournamentId });
              if (error) {
                toast.error(error.message ?? "Could not delete tournament.");
                setConfirming(false);
                return;
              }
              toast.success("Tournament deleted.");
              window.location.href = "/admin/tournaments";
            } catch {
              toast.error("Something went wrong. Try again.");
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
        >
          {loading ? "Deleting…" : "Yes, delete"}
        </Button>
        <Button variant="outline" size="sm" className="h-7 px-3 text-xs" onClick={() => setConfirming(false)} disabled={loading}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button variant="destructive" size="sm" className="h-7 px-3 text-xs" onClick={() => setConfirming(true)}>
      Delete
    </Button>
  );
}
