import { useState } from "react";
import { cn } from "@/lib/utils";
import { badgeVariants } from "@/components/ui/badge";
import { TeamActionButtons } from "@/components/TeamActionButtons";
import type { TeamStatus } from "@/lib/schema";

interface Props {
  teamId: string;
  teamName: string;
  initialStatus: TeamStatus;
}

function statusVariant(status: TeamStatus): "warning" | "success" | "destructive" {
  if (status === "approved") return "success";
  if (status === "rejected") return "destructive";
  return "warning";
}

function statusLabel(status: TeamStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function AdminTeamActions({ teamId, teamName, initialStatus }: Props) {
  const [status, setStatus] = useState<TeamStatus>(initialStatus);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className={cn(badgeVariants({ variant: statusVariant(status) }))}>
        ● {statusLabel(status)}
      </span>
      {status === "pending" && (
        <>
          <TeamActionButtons
            teamId={teamId}
            teamName={teamName}
            action="approve"
            onSuccess={setStatus}
          />
          <TeamActionButtons
            teamId={teamId}
            teamName={teamName}
            action="reject"
            onSuccess={setStatus}
          />
        </>
      )}
      {status === "rejected" && (
        <TeamActionButtons
          teamId={teamId}
          teamName={teamName}
          action="unreject"
          onSuccess={setStatus}
        />
      )}
    </div>
  );
}
