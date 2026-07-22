import { useState } from "react";
import { Check, Clock, X } from "lucide-react";
import { toast } from "sonner";
import { actions } from "astro:actions";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { RegistrationStatus } from "@/lib/schema";

interface Props {
  registrationId: string;
  currentStatus: RegistrationStatus;
  onSuccess: (newStatus: RegistrationStatus) => void;
}

const STATUS_ACTIONS: {
  label: string;
  tooltip: string;
  value: RegistrationStatus;
  variant: "default" | "outline" | "destructive";
  Icon: React.ElementType;
}[] = [
  { label: "Approve",  tooltip: "Approve registration",        value: "approved",   variant: "default",     Icon: Check },
  { label: "Waitlist", tooltip: "Move to waitlist",            value: "waitlisted", variant: "outline",     Icon: Clock },
  { label: "Reject",   tooltip: "Reject registration",         value: "rejected",   variant: "destructive", Icon: X     },
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
    <TooltipProvider delayDuration={300}>
      {available.map(({ label, tooltip, value, variant, Icon }) => (
        <Tooltip key={value}>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size="sm"
              disabled={loading !== null}
              onClick={() => handleStatusChange(value)}
              className="h-7 px-2 xl:px-3 text-xs shrink-0 gap-1 cursor-pointer"
            >
              {loading === value
                ? "…"
                : <Icon className="h-3.5 w-3.5 shrink-0" />}
              <span className="hidden xl:inline">{label}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      ))}
    </TooltipProvider>
  );
}
