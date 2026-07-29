import { useState } from "react";
import { toast } from "sonner";
import { actions } from "astro:actions";
import { Button } from "@/components/ui/button";

interface Props {
  registrationId: string;
  initialPaidAt: number | null;
  initialPaidNote: string | null;
}

function formatPaidDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function MarkPaidButton({ registrationId, initialPaidAt, initialPaidNote }: Props) {
  const [paidAt, setPaidAt] = useState<number | null>(initialPaidAt);
  const [paidNote, setPaidNote] = useState<string | null>(initialPaidNote);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleMarkPaid() {
    setLoading(true);
    try {
      const { data, error } = await actions.tournamentRegistrations.markPaid({
        registrationId,
        note: note.trim() || undefined,
      });
      if (error) {
        toast.error(error.message ?? "Could not mark as paid.");
        return;
      }
      setPaidAt(data.paidAt ?? Date.now());
      setPaidNote(note.trim() || null);
      setOpen(false);
      setNote("");
      toast.success("Registration marked as paid.");
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkUnpaid() {
    setLoading(true);
    try {
      const { error } = await actions.tournamentRegistrations.markUnpaid({ registrationId });
      if (error) {
        toast.error(error.message ?? "Could not undo payment.");
        return;
      }
      setPaidAt(null);
      setPaidNote(null);
      toast.success("Payment marking removed.");
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Paid state ─────────────────────────────────────────────────────────────
  if (paidAt !== null) {
    return (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
            Paid {formatPaidDate(paidAt)}
          </span>
          <button
            onClick={handleMarkUnpaid}
            disabled={loading}
            className="text-xs text-(--color-muted) hover:text-(--color-foreground) underline cursor-pointer disabled:opacity-50"
          >
            Undo
          </button>
        </div>
        {paidNote && (
          <p
            className="text-xs text-(--color-muted) truncate max-w-[180px]"
            title={paidNote}
          >
            {paidNote}
          </p>
        )}
      </div>
    );
  }

  // ── Unpaid / form closed ───────────────────────────────────────────────────
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-(--color-primary) hover:underline cursor-pointer"
      >
        Mark as paid
      </button>
    );
  }

  // ── Inline note form ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-2 min-w-[200px]">
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional) — e.g. Venmo #1234"
        className="w-full rounded border border-(--color-border) bg-(--color-input) px-2 py-1 text-xs"
        maxLength={500}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleMarkPaid();
          if (e.key === "Escape") { setOpen(false); setNote(""); }
        }}
      />
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleMarkPaid} disabled={loading} className="text-xs h-7">
          {loading ? "Saving…" : "Confirm"}
        </Button>
        <button
          onClick={() => { setOpen(false); setNote(""); }}
          className="text-xs text-(--color-muted) hover:text-(--color-foreground) cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
