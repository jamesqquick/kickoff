import { useState } from "react";
import { toast } from "sonner";
import { actions } from "astro:actions";
import { Button } from "@/components/ui/button";
import type { TeamMemberWithUser } from "@/repositories/team-member-repository";

interface Props {
  userId: string;
  teamId: string;
  userName: string;
  userImage: string | null;
  requestedAt: number;
  onApproved: (member: TeamMemberWithUser) => void;
  onResolved: () => void;
}

type RowState = "pending" | "approved" | "denied" | "loading-approve" | "loading-deny";

export function PendingRequestActions({
  userId,
  teamId,
  userName,
  userImage,
  requestedAt,
  onApproved,
  onResolved,
}: Props) {
  const [state, setState] = useState<RowState>("pending");

  const requestedDate = new Date(requestedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  async function handleApprove() {
    setState("loading-approve");
    try {
      const { data, error } = await actions.teamMembers.approveRequest({ userId, teamId });
      if (error) throw error;
      setState("approved");
      toast.success(`${userName} added to the roster.`);
      onApproved({ ...data, userName, userImage });
      onResolved();
    } catch {
      setState("pending");
      toast.error("Could not approve. Try again.");
    }
  }

  async function handleDeny() {
    setState("loading-deny");
    try {
      const { error } = await actions.teamMembers.denyRequest({ userId, teamId });
      if (error) throw error;
      setState("denied");
      toast.success(`Request from ${userName} denied.`);
      onResolved();
    } catch {
      setState("pending");
      toast.error("Could not deny. Try again.");
    }
  }

  // Approved rows disappear entirely — the member now appears in the roster.
  if (state === "approved") return null;

  // Denied rows fade in place as brief confirmation before the section collapses.
  if (state === "denied") {
    return (
      <div className="flex items-center justify-between gap-3 px-5 py-3 opacity-40">
        <span className="text-sm text-(--color-muted)">Denied — {userName}</span>
      </div>
    );
  }

  const busy = state === "loading-approve" || state === "loading-deny";

  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-(--color-border-soft) last:border-0">
      {/* Avatar */}
      <div className="shrink-0">
        {userImage ? (
          <img
            src={userImage}
            alt={userName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-(--color-primary) flex items-center justify-center text-white text-xs font-bold">
            {userName.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name + date */}
      <div className="flex-1 min-w-0">
        <a
          href={`/users/${userId}`}
          className="text-sm font-medium text-(--color-foreground) hover:text-(--color-primary) hover:underline truncate block"
        >
          {userName}
        </a>
        <p className="text-xs text-(--color-muted)">Requested {requestedDate}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 shrink-0">
        <Button
          size="sm"
          variant="default"
          onClick={handleApprove}
          disabled={busy}
        >
          {state === "loading-approve" ? "Approving…" : "Approve"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDeny}
          disabled={busy}
        >
          {state === "loading-deny" ? "Denying…" : "Deny"}
        </Button>
      </div>
    </div>
  );
}
