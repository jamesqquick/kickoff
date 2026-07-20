import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { delay } from "@/lib/utils";

interface TeamActionButtonsProps {
  teamName: string;
  action: "approve" | "review";
}

export function TeamActionButtons({ teamName, action }: TeamActionButtonsProps) {
  const [loading, setLoading] = useState(false);

  const isApprove = action === "approve";

  async function handleClick() {
    setLoading(true);
    try {
      // TODO: swap for `await actions.teams.approve(...)` / `.markForReview(...)`
      await delay(800);
      if (isApprove) {
        toast.success(`${teamName} approved`);
      } else {
        toast.success(`${teamName} marked for review`);
      }
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
      disabled={loading}
    >
      {loading ? "…" : isApprove ? "Approve" : "Review"}
    </Button>
  );
}
