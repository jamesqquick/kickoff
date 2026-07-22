import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { actions } from "astro:actions";
import { Button } from "@/components/ui/button";
import type { Division } from "@/lib/schema";

interface Props {
  tournamentId: string;
  initialDivisions: Division[];
}

export function DivisionManager({ tournamentId, initialDivisions }: Props) {
  const [divisions, setDivisions] = useState<Division[]>(initialDivisions);
  const [newName, setNewName] = useState("");
  const [newMaxTeams, setNewMaxTeams] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // The division to confirm deletion of, plus its registration count from the server.
  const [confirmDelete, setConfirmDelete] = useState<{
    division: Division;
    registrationCount: number;
  } | null>(null);

  async function handleAdd() {
    if (!newName.trim()) {
      toast.error("Division name is required.");
      return;
    }
    setAdding(true);
    try {
      const maxTeams = newMaxTeams ? parseInt(newMaxTeams, 10) : null;
      const { data, error } = await actions.divisions.create({
        tournamentId,
        name: newName.trim(),
        maxTeams: Number.isNaN(maxTeams) ? null : maxTeams,
      });
      if (error) {
        toast.error(error.message ?? "Could not add division.");
        return;
      }
      setDivisions((prev) => [...prev, data]);
      setNewName("");
      setNewMaxTeams("");
      toast.success(`Division "${data.name}" added.`);
    } catch {
      toast.error("Could not add division. Try again.");
    } finally {
      setAdding(false);
    }
  }

  async function handleDeleteRequest(division: Division) {
    // Fetch live registration count before showing the confirmation dialog.
    setDeletingId(division.id);
    try {
      const { data, error } = await actions.divisions.getRegistrationCount({ id: division.id });
      const count = error ? 0 : (data ?? 0);
      setConfirmDelete({ division, registrationCount: count });
    } catch {
      setConfirmDelete({ division, registrationCount: 0 });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    const { division } = confirmDelete;
    setDeletingId(division.id);
    try {
      const { error } = await actions.divisions.delete({ id: division.id });
      if (error) {
        toast.error(error.message ?? "Could not delete division.");
        return;
      }
      setDivisions((prev) => prev.filter((d) => d.id !== division.id));
      toast.success(`Division "${division.name}" deleted.`);
    } catch {
      toast.error("Could not delete division. Try again.");
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  }

  return (
    <div>
      {/* Existing divisions */}
      {divisions.length === 0 ? (
        <p className="text-sm text-(--color-muted) mb-4">No divisions yet. Add one below.</p>
      ) : (
        <ul className="mb-4 divide-y divide-(--color-border-soft) rounded-lg border border-(--color-border)">
          {divisions.map((d) => (
            <li key={d.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <span className="text-sm font-medium text-(--color-foreground)">{d.name}</span>
                {d.maxTeams !== null && (
                  <span className="ml-2 text-xs text-(--color-muted)">
                    max {d.maxTeams} teams
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDeleteRequest(d)}
                disabled={deletingId === d.id}
                className="text-(--color-muted) hover:text-red-500 transition-colors cursor-pointer disabled:opacity-40"
                title="Delete division"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add division form */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium text-(--color-muted) mb-1">
            Division name
          </label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder='e.g. "U12 Boys Competitive"'
            className="w-full rounded-md border border-(--color-border) bg-(--color-background) px-3 py-2 text-sm text-(--color-foreground) placeholder:text-(--color-muted) focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
          />
        </div>
        <div className="w-28">
          <label className="block text-xs font-medium text-(--color-muted) mb-1">
            Max teams
          </label>
          <input
            type="number"
            min={1}
            value={newMaxTeams}
            onChange={(e) => setNewMaxTeams(e.target.value)}
            placeholder="∞"
            className="w-full rounded-md border border-(--color-border) bg-(--color-background) px-3 py-2 text-sm text-(--color-foreground) placeholder:text-(--color-muted) focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
          />
        </div>
        <Button onClick={handleAdd} disabled={adding} variant="outline" className="shrink-0">
          <Plus className="h-4 w-4 mr-1" />
          {adding ? "Adding…" : "Add"}
        </Button>
      </div>

      {/* Confirmation dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl border border-(--color-border) bg-(--color-card) p-6 shadow-xl mx-4">
            <h3 className="text-base font-semibold text-(--color-foreground) mb-2">
              Delete "{confirmDelete.division.name}"?
            </h3>
            <div className="text-sm text-(--color-muted) space-y-2 mb-5">
              <p>This will permanently delete the division and cannot be undone.</p>
              {confirmDelete.registrationCount > 0 && (
                <p className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2 text-amber-800 dark:text-amber-300">
                  <strong>{confirmDelete.registrationCount} team{confirmDelete.registrationCount !== 1 ? "s are" : " is"} registered</strong>{" "}
                  in this division. Their registrations will also be deleted. You may want to notify them before proceeding.
                </p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setConfirmDelete(null)}
                disabled={deletingId !== null}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deletingId !== null}
              >
                {deletingId !== null ? "Deleting…" : "Delete Division"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
