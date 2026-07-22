import { useState, useRef } from "react";
import { toast } from "sonner";
import { actions } from "astro:actions";
import type { TeamMemberWithUser } from "@/repositories/team-member-repository";

interface Props {
  teamId: string;
  members: TeamMemberWithUser[];
  isOwnerOrAdmin?: boolean;
}

const joinedFormat = (ts: number) =>
  new Date(ts).toLocaleDateString("en-US", { month: "short", year: "numeric" });

// Inline editable jersey number cell. Owners click to edit; everyone else sees plain text.
function JerseyCell({
  memberId,
  teamId,
  initial,
}: {
  memberId: string;
  teamId: string;
  initial: number | null;
}) {
  const [value, setValue] = useState<number | null>(initial);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEditing() {
    setDraft(value != null ? String(value) : "");
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function cancel() {
    setEditing(false);
  }

  async function save() {
    const trimmed = draft.trim();
    const next = trimmed === "" ? null : parseInt(trimmed, 10);

    if (trimmed !== "" && (isNaN(next!) || next! < 0)) {
      toast.error("Jersey number must be a positive number.");
      inputRef.current?.select();
      return;
    }

    // No change — just close
    if (next === value) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setEditing(false);
    try {
      const { error } = await actions.teamMembers.updateJerseyNumber({
        memberId,
        teamId,
        jerseyNumber: next,
      });
      if (error) throw error;
      setValue(next);
      toast.success("Jersey number updated.");
    } catch {
      toast.error("Could not save. Try again.");
      setValue(value); // revert
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min={0}
        max={999}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") cancel();
        }}
        className="w-14 rounded border border-(--color-primary) bg-(--color-card) px-1.5 py-0.5 text-sm text-(--color-foreground) text-center focus:outline-none"
        autoFocus
      />
    );
  }

  return (
    <button
      onClick={startEditing}
      disabled={saving}
      title="Click to edit"
      className="min-w-[2rem] rounded px-1.5 py-0.5 text-sm text-(--color-muted) hover:bg-(--color-border-soft) hover:text-(--color-foreground) transition-colors cursor-pointer text-left disabled:opacity-40"
    >
      {saving ? "…" : (value ?? "—")}
    </button>
  );
}

export function RosterTable({ teamId, members, isOwnerOrAdmin = false }: Props) {
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
            Joined
          </th>
        </tr>
      </thead>
      <tbody>
        {members.map((member) => {
          const displayName = member.userName ?? member.displayName ?? member.email ?? "Unknown";
          const initials = displayName.slice(0, 2).toUpperCase();

          return (
            <tr
              key={member.id}
              className="border-b border-(--color-border-soft) last:border-0 hover:bg-(--color-background) transition-colors"
            >
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
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
                  ) : (
                    <div>
                      <span className="font-medium text-sm text-(--color-foreground)">
                        {displayName}
                      </span>
                      {member.email && !member.userId && (
                        <p className="text-xs text-(--color-muted)">{member.email}</p>
                      )}
                    </div>
                  )}
                </div>
              </td>

              <td className="hidden sm:table-cell px-5 py-3.5">
                {isOwnerOrAdmin ? (
                  <JerseyCell
                    memberId={member.id}
                    teamId={teamId}
                    initial={member.jerseyNumber}
                  />
                ) : (
                  <span className="text-sm text-(--color-muted)">
                    {member.jerseyNumber ?? "—"}
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
