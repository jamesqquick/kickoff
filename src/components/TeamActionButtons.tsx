import { useState } from "react";
import { toast } from "sonner";
import { actions } from "astro:actions";
import { Button } from "@/components/ui/button";

interface TeamActionButtonsProps {
  teamId: string;
  teamName: string;
  action: "approve" | "reject";
}

export function TeamActionButtons({ teamId, teamName, action }: TeamActionButtonsProps) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const isApprove = action === "approve";

  async function handleClick() {
    setLoading(true);
    try {
      const { error } = isApprove
        ? await actions.teams.approve({ id: teamId })
        : await actions.teams.reject({ id: teamId });

      if (error) {
        toast.error(error.message ?? "Something went wrong. Please try again.");
        return;
      }

      toast.success(isApprove ? `${teamName} approved` : `${teamName} rejected`);
      setDone(true);
      // Reload so the row disappears from the pending list.
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={isApprove ? "default" : "outline"}
      className="h-7 px-3 text-xs shrink-0"
      onClick={handleClick}
      disabled={loading || done}
    >
      {loading ? "…" : isApprove ? "Approve" : "Reject"}
    </Button>
  );
}
