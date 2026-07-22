import type { TeamMemberWithUser } from "@/repositories/team-member-repository";
import { badgeVariants } from "@/components/ui/badge";

interface Props {
  members: TeamMemberWithUser[];
  isOwnerOrAdmin?: boolean;
}

const joinedFormat = (ts: number) =>
  new Date(ts).toLocaleDateString("en-US", { month: "short", year: "numeric" });

export function RosterTable({ members, isOwnerOrAdmin = false }: Props) {
  if (members.length === 0) {
    return (
      <div className="px-6 py-8 text-center text-sm text-(--color-muted)">
        No members on the roster yet.
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-(--color-border)">
          <th className="text-left text-xs font-semibold uppercase tracking-wider text-(--color-muted-fg) px-5 py-3">
            Name
          </th>
          <th className="hidden sm:table-cell text-left text-xs font-semibold uppercase tracking-wider text-(--color-muted-fg) px-5 py-3">
            #
          </th>
          <th className="hidden sm:table-cell text-left text-xs font-semibold uppercase tracking-wider text-(--color-muted-fg) px-5 py-3">
            Status
          </th>
          <th className="hidden sm:table-cell text-left text-xs font-semibold uppercase tracking-wider text-(--color-muted-fg) px-5 py-3">
            Joined
          </th>
        </tr>
      </thead>
      <tbody>
        {members.map((member) => {
          // Pending signup rows have no account — fall back to displayName / email.
          const isPendingSignup = member.status === "pending_signup";
          const displayName = member.userName ?? member.displayName ?? member.email ?? "Unknown";
          const initials = displayName.slice(0, 2).toUpperCase();

          return (
            <tr
              key={member.id}
              className="border-b border-(--color-border-soft) last:border-0 hover:bg-(--color-background) transition-colors"
            >
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  {/* Avatar — no image for pending_signup rows */}
                  {member.userImage ? (
                    <img
                      src={member.userImage}
                      alt={displayName}
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-(--color-primary) flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {initials}
                    </div>
                  )}

                  {/* Name — link only for real accounts */}
                  {isOwnerOrAdmin && member.userId ? (
                    <div>
                      <a
                        href={`/users/${member.userId}`}
                        className="font-medium text-sm text-(--color-foreground) hover:text-(--color-primary) hover:underline"
                      >
                        {displayName}
                      </a>
                      {member.email && (
                        <p className="text-xs text-(--color-muted)">{member.email}</p>
                      )}
                    </div>
                  ) : isPendingSignup ? (
                    <div>
                      <span className="font-medium text-sm text-(--color-foreground)">
                        {displayName}
                      </span>
                      {member.email && (
                        <p className="text-xs text-(--color-muted)">{member.email}</p>
                      )}
                    </div>
                  ) : (
                    <span className="font-medium text-sm text-(--color-foreground)">
                      {displayName}
                    </span>
                  )}
                </div>
              </td>

              <td className="hidden sm:table-cell px-5 py-3.5 text-sm text-(--color-muted)">
                {member.jerseyNumber ?? "—"}
              </td>

              <td className="hidden sm:table-cell px-5 py-3.5">
                {isPendingSignup && (
                  <span className={badgeVariants({ variant: "warning" })}>
                    Pending signup
                  </span>
                )}
              </td>

              <td className="hidden sm:table-cell px-5 py-3.5 text-sm text-(--color-muted)">
                {joinedFormat(member.createdAt)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
