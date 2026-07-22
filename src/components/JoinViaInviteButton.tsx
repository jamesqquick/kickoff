import { useState } from "react";
import { toast } from "sonner";
import { actions } from "astro:actions";
import { Button } from "@/components/ui/button";

type JoinStatus = "none" | "pending" | "approved";

interface Props {
  token: string;
  teamId: string;
  // Resolved server-side so the island has the right initial state without a fetch.
  initialStatus: JoinStatus;
}

export function JoinViaInviteButton({ token, teamId, initialStatus }: Props) {
  const [status, setStatus] = useState<JoinStatus>(initialStatus);
  const [loading, setLoading] = useState(false);

  if (status === "approved") {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-lg bg-(--color-ok-soft,oklch(0.95 0.05 145)) px-4 py-3 text-center text-sm font-medium text-(--color-ok,oklch(0.5 0.15 145))">
          You've joined the team!
        </div>
        <a
          href={`/teams/${teamId}`}
          className="inline-flex items-center justify-center w-full h-11 rounded-md bg-(--color-primary) text-white font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Go to team page →
        </a>
      </div>
    );
  }

  async function handleJoin() {
    setLoading(true);
    try {
      const { data, error } = await actions.teamInvites.join({ token });
      if (error) throw error;
      setStatus("approved");
      toast.success("You've joined the team!");
    } catch {
      toast.error("Could not join. The link may have expired. Ask your coach for a new one.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleJoin}
      disabled={loading}
      size="xl"
      className="w-full"
    >
      {loading ? "Joining…" : "Join team →"}
    </Button>
  );
}
