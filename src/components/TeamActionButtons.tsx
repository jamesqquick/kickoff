import { useState } from "react";
import { Check, X, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { actions } from "astro:actions";
import { Button } from "@/components/ui/button";
import type { TeamStatus } from "@/lib/schema";

interface TeamActionButtonsProps {
  teamId: string;
  teamName: string;
  action: "approve" | "reject" | "unreject";
  onSuccess: (newStatus: TeamStatus) => void;
}

export function TeamActionButtons({ teamId, teamName, action, onSuccess }: TeamActionButtonsProps) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const isApprove = action === "approve";
  const isUnreject = action === "unreject";

  async function handleClick() {
    setLoading(true);
    try {
      let error: { message?: string } | undefined;

      if (isApprove) {
        ({ error } = await actions.teams.approve({ id: teamId }));
      } else if (isUnreject) {
        ({ error } = await actions.teams.unreject({ id: teamId }));
      } else {
        ({ error } = await actions.teams.reject({ id: teamId }));
      }

      if (error) {
        toast.error(error.message ?? "Something went wrong. Please try again.");
        return;
      }

      const newStatus: TeamStatus = isApprove ? "approved" : isUnreject ? "pending" : "rejected";

      if (isApprove) {
        toast.success(`${teamName} approved`);
      } else if (isUnreject) {
        toast.success(`${teamName} re-opened`);
      } else {
        toast.success(`${teamName} rejected`);
      }

      setDone(true);
      onSuccess(newStatus);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const icon = loading
    ? "…"
    : isApprove
      ? <Check className="h-3.5 w-3.5 shrink-0" />
      : isUnreject
        ? <RotateCcw className="h-3.5 w-3.5 shrink-0" />
        : <X className="h-3.5 w-3.5 shrink-0" />;

  const label = isApprove ? "Approve" : isUnreject ? "Re-open" : "Reject";

  return (
    <Button
      variant={isApprove ? "default" : "outline"}
      className="h-7 px-2 xl:px-3 text-xs shrink-0"
      onClick={handleClick}
      disabled={loading || done}
      title={label}
    >
      {icon}
      {!loading && <span className="hidden xl:inline">{label}</span>}
    </Button>
  );
}
