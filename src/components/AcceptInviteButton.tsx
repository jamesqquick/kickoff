import { useState } from "react";
import { toast } from "sonner";
import { actions } from "astro:actions";
import { Button } from "@/components/ui/button";

interface Props {
  token: string;
  tournamentName: string;
}

export function AcceptInviteButton({ token, tournamentName }: Props) {
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);

  async function handleAccept() {
    setLoading(true);
    try {
      const { data, error } = await actions.tournamentManagers.acceptInvite({ token });
      if (error) {
        toast.error(error.message ?? "Could not accept invite. It may have already been used.");
        return;
      }
      setAccepted(true);
      toast.success(`You're now a manager of ${tournamentName}.`);
      // Redirect to the tournament overview after a short delay
      setTimeout(() => {
        window.location.href = `/director/tournaments/${data.tournamentId}`;
      }, 1500);
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (accepted) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-emerald-600 font-medium">
          ✓ Invite accepted. Redirecting…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleAccept}
        disabled={loading}
        className="w-full cursor-pointer"
      >
        {loading ? "Accepting…" : "Accept invitation →"}
      </Button>
      <a
        href="/dashboard"
        className="block text-sm text-(--color-muted) hover:text-(--color-foreground) transition-colors cursor-pointer"
      >
        Not now, go to dashboard
      </a>
    </div>
  );
}
