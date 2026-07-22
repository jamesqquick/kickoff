import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { actions } from "astro:actions";
import { Button } from "@/components/ui/button";

interface Props {
  tournamentId: string;
  tournamentName: string;
}

export function DeleteTournamentButton({ tournamentId, tournamentName }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const { error } = await actions.tournaments.delete({ id: tournamentId });
      if (error) {
        toast.error(error.message ?? "Could not delete tournament.");
        setOpen(false);
        return;
      }
      toast.success("Tournament deleted.");
      window.location.href = "/admin/tournaments";
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        className="h-7 px-2 xl:px-3 text-xs shrink-0 gap-1 cursor-pointer"
        onClick={() => setOpen(true)}
        title="Delete tournament"
      >
        <Trash2 className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden xl:inline">Delete</span>
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl border border-(--color-border) bg-(--color-card) p-6 shadow-xl mx-4">
            <h3 className="text-base font-semibold text-(--color-foreground) mb-2">
              Delete "{tournamentName}"?
            </h3>
            <div className="text-sm text-(--color-muted) space-y-2 mb-5">
              <p>
                This will permanently delete the tournament and all of its divisions and
                team registrations. This cannot be undone.
              </p>
              <p className="rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2 text-red-800 dark:text-red-300">
                Any teams registered in this tournament will lose their registration records.
                Consider notifying them before proceeding.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
                className="cursor-pointer"
              >
                {loading ? "Deleting…" : "Delete Tournament"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
