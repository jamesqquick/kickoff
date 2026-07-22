import { useState } from "react";
import { toast } from "sonner";
import { actions } from "astro:actions";
import { Button } from "@/components/ui/button";
import type { RegistrationStatus } from "@/lib/schema";

interface Props {
  registrationId: string;
  currentStatus: RegistrationStatus;
  onSuccess: (newStatus: RegistrationStatus) => void;
}

const STATUS_ACTIONS: { label: string; value: RegistrationStatus; variant: "default" | "outline" | "destructive" }[] = [
  { label: "Approve",   value: "approved",   variant: "default"     },
  { label: "Waitlist",  value: "waitlisted", variant: "outline"     },
  { label: "Reject",    value: "rejected",   variant: "destructive" },
];

export function RegistrationStatusButton({ registrationId, currentStatus, onSuccess }: Props) {
  const [loading, setLoading] = useState<RegistrationStatus | null>(null);

  async function handleStatusChange(status: RegistrationStatus) {
    setLoading(status);
    try {
      const { error } = await actions.tournamentRegistrations.updateStatus({
        registrationId,
        status,
      });
      if (error) {
        toast.error(error.message ?? "Could not update status.");
        return;
      }
      onSuccess(status);
      toast.success(`Registration ${status}.`);
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(null);
    }
  }

  const available = STATUS_ACTIONS.filter((a) => a.value !== currentStatus);

  return (
    <div className="flex gap-1.5">
      {available.map(({ label, value, variant }) => (
        <Button
          key={value}
          variant={variant}
          size="sm"
          disabled={loading !== null}
          onClick={() => handleStatusChange(value)}
          className="h-7 px-2 text-xs cursor-pointer"
        >
          {loading === value ? "…" : label}
        </Button>
      ))}
    </div>
  );
}
