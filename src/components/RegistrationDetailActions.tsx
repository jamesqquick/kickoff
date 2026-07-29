import { useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { actions } from "astro:actions";
import { RegistrationStatusButton } from "@/components/RegistrationStatusButton";
import { SectionSeparator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { RegistrationStatus } from "@/lib/schema";

const STATUS_LABELS: Record<RegistrationStatus, string> = {
  pending:    "Pending review",
  approved:   "Approved",
  waitlisted: "Waitlisted",
  rejected:   "Not accepted",
};

const STATUS_COLORS: Record<RegistrationStatus, string> = {
  pending:    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  approved:   "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  waitlisted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  rejected:   "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

function formatPaidDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface Props {
  registrationId: string;
  initialStatus: RegistrationStatus;
  initialPaidAt: number | null;
  initialPaidNote: string | null;
  hasFee: boolean;
}

export function RegistrationDetailActions({
  registrationId,
  initialStatus,
  initialPaidAt,
  initialPaidNote,
  hasFee,
}: Props) {
  const [status, setStatus] = useState<RegistrationStatus>(initialStatus);
  const [paidAt, setPaidAt] = useState<number | null>(initialPaidAt);
  const [paidNote, setPaidNote] = useState<string | null>(initialPaidNote);
  const [note, setNote] = useState(initialPaidNote ?? "");
  const [loading, setLoading] = useState<"paid" | "unpaid" | null>(null);

  async function handleMarkPaid() {
    setLoading("paid");
    try {
      const { data, error } = await actions.tournamentRegistrations.markPaid({
        registrationId,
        note: note.trim() || undefined,
      });
      if (error) { toast.error(error.message ?? "Could not mark as paid."); return; }
      setPaidAt(data.paidAt ?? Date.now());
      setPaidNote(note.trim() || null);
      toast.success("Marked as paid.");
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(null);
    }
  }

  async function handleMarkUnpaid() {
    setLoading("unpaid");
    try {
      const { error } = await actions.tournamentRegistrations.markUnpaid({ registrationId });
      if (error) { toast.error(error.message ?? "Could not mark as unpaid."); return; }
      setPaidAt(null);
      setPaidNote(null);
      setNote("");
      toast.success("Marked as unpaid.");
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">

      {/* Registration status */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-(--color-muted) mb-3">
          Registration Status
        </p>
        <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold mb-3", STATUS_COLORS[status])}>
          {STATUS_LABELS[status]}
        </span>
        <div className="flex flex-wrap gap-2">
          <RegistrationStatusButton
            registrationId={registrationId}
            currentStatus={status}
            onSuccess={setStatus}
          />
        </div>
      </div>

      {/* Payment */}
      {hasFee && (
        <>
          <SectionSeparator />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-(--color-muted) mb-3">
              Payment
            </p>

            {/* Current payment status */}
            <span className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold mb-3",
              paidAt
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
            )}>
              {paidAt ? `Paid ${formatPaidDate(paidAt)}` : "Unpaid"}
            </span>

            {/* Note field */}
            <div className="my-3">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note (optional) — e.g. Venmo #1234"
                className="w-full rounded-md border border-(--color-border) bg-(--color-input) px-3 py-1.5 text-xs"
                maxLength={500}
              />
            </div>

            {/* Action buttons — always visible, match RegistrationStatusButton style */}
            <TooltipProvider delayDuration={300}>
              <div className="flex flex-wrap gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      disabled={loading !== null}
                      onClick={handleMarkPaid}
                      className="h-7 px-2 xl:px-3 text-xs shrink-0 gap-1 cursor-pointer"
                    >
                      {loading === "paid" ? "…" : <Check className="h-3.5 w-3.5 shrink-0" />}
                      <span className="hidden xl:inline">Mark as Paid</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Mark as paid</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loading !== null}
                      onClick={handleMarkUnpaid}
                      className="h-7 px-2 xl:px-3 text-xs shrink-0 gap-1 cursor-pointer"
                    >
                      {loading === "unpaid" ? "…" : <X className="h-3.5 w-3.5 shrink-0" />}
                      <span className="hidden xl:inline">Mark as Unpaid</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Mark as unpaid</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>

            {/* Confirmed note display */}
            {paidAt && paidNote && (
              <p className="text-xs text-(--color-muted) mt-2">{paidNote}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
