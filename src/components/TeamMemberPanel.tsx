import { useState } from "react";
import { badgeVariants } from "@/components/ui/badge";
import { PendingRequestActions } from "@/components/PendingRequestActions";
import { RosterTable } from "@/components/RosterTable";
import type { TeamMemberWithUser } from "@/repositories/team-member-repository";

interface Props {
  initialRoster: TeamMemberWithUser[];
  pendingRequests: TeamMemberWithUser[];
  isOwnerOrAdmin: boolean;
}

export function TeamMemberPanel({
  initialRoster,
  pendingRequests,
  isOwnerOrAdmin,
}: Props) {
  const [roster, setRoster] = useState<TeamMemberWithUser[]>(initialRoster);
  const [pendingCount, setPendingCount] = useState(pendingRequests.length);

  function handleMemberApproved(member: TeamMemberWithUser) {
    setRoster((prev) => [...prev, member]);
  }

  function handleResolved() {
    setPendingCount((prev) => prev - 1);
  }

  return (
    <>
      {/* Pending join requests — owner/admin only; hides once all are resolved */}
      {isOwnerOrAdmin && pendingRequests.length > 0 && pendingCount > 0 && (
        <div className="rounded-xl border border-(--color-border) bg-(--color-card) mb-5">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-(--color-border)">
            <h3 className="font-display font-semibold text-(--color-foreground)">
              Join Requests
            </h3>
            <span className={badgeVariants({ variant: "warning" })}>
              {pendingCount} pending
            </span>
          </div>
          <div>
            {pendingRequests.map((req) => (
              <PendingRequestActions
                key={req.userId}
                userId={req.userId}
                teamId={req.teamId}
                userName={req.userName}
                userImage={req.userImage}
                requestedAt={req.createdAt}
                onApproved={handleMemberApproved}
                onResolved={handleResolved}
              />
            ))}
          </div>
        </div>
      )}

      {/* Roster table */}
      <div className="rounded-xl border border-(--color-border) bg-(--color-card)">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-4 gap-3 border-b border-(--color-border)">
          <h3 className="font-display font-semibold text-(--color-foreground)">
            Roster{" "}
            <span className="font-normal text-sm text-(--color-muted) ml-1">
              {roster.length} member{roster.length !== 1 ? "s" : ""}
            </span>
          </h3>
        </div>
        <RosterTable members={roster} isOwnerOrAdmin={isOwnerOrAdmin} />
      </div>
    </>
  );
}
