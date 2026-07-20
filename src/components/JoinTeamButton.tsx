import { useState } from "react";
import { toast } from "sonner";
import { actions } from "astro:actions";
import { Button } from "@/components/ui/button";

type JoinStatus = "none" | "pending" | "approved";

interface Props {
  teamId: string;
  // Resolved server-side and passed as a prop so the island knows its
  // initial state without a client-side fetch on mount.
  initialStatus: JoinStatus;
}

export function JoinTeamButton({ teamId, initialStatus }: Props) {
  const [status, setStatus] = useState<JoinStatus>(initialStatus);
  const [loading, setLoading] = useState(false);

  if (status === "approved") {
    return (
      <Button disabled variant="outline">
        You&apos;re on this team
      </Button>
    );
  }

  if (status === "pending") {
    return (
      <Button disabled variant="outline">
        Request Pending
      </Button>
    );
  }

  async function handleJoin() {
    setLoading(true);
    try {
      const { error } = await actions.playerTeams.requestJoin({ teamId });
      if (error) throw error;
      setStatus("pending");
      toast.success("Join request sent. Awaiting coach approval.");
    } catch {
      toast.error("Could not send request. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleJoin} disabled={loading}>
      {loading ? "Sending…" : "Request to Join"}
    </Button>
  );
}
