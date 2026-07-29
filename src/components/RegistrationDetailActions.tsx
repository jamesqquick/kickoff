import { useState } from "react";
import { RegistrationStatusButton } from "@/components/RegistrationStatusButton";
import { MarkPaidButton } from "@/components/MarkPaidButton";
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

  return (
    <div className="space-y-6">
      {/* Status */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-(--color-muted) mb-3">
          Registration Status
        </p>
        <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold mb-4", STATUS_COLORS[status])}>
          {STATUS_LABELS[status]}
        </span>
        <div className="flex flex-wrap gap-2 mt-3">
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
          <div className="border-t border-(--color-border)" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-(--color-muted) mb-3">
              Payment
            </p>
            <MarkPaidButton
              registrationId={registrationId}
              initialPaidAt={initialPaidAt}
              initialPaidNote={initialPaidNote}
            />
          </div>
        </>
      )}
    </div>
  );
}
