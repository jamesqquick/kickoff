import { useState } from "react";
import { toast } from "sonner";
import { actions } from "astro:actions";
import { Button } from "@/components/ui/button";
import type { TournamentManager, TournamentManagerInvite } from "@/lib/schema";

interface ManagerWithUser extends TournamentManager {
  name: string;
  email: string;
}

interface Props {
  tournamentId: string;
  isOwner: boolean;
  initialManagers: ManagerWithUser[];
  initialInvites: TournamentManagerInvite[];
  baseUrl: string;
}

function formatExpiry(expiresAt: number): string {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Expires < 1h";
  if (hours < 24) return `Expires in ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Expires in ${days}d`;
}

// ── Remove Manager Confirmation ────────────────────────────────────────────

function RemoveManagerConfirm({
  manager,
  onCancel,
  onConfirm,
  loading,
}: {
  manager: ManagerWithUser;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-xl border border-(--color-border) bg-(--color-card) p-6 shadow-xl mx-4">
        <h3 className="text-base font-semibold text-(--color-foreground) mb-2">
          Remove {manager.name}?
        </h3>
        <div className="text-sm text-(--color-muted) space-y-2 mb-5">
          <p>
            This removes their access to manage this tournament. Their Tournament Director
            capability is not affected — they keep that globally.
          </p>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={loading} className="cursor-pointer">
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading} className="cursor-pointer">
            {loading ? "Removing…" : "Remove"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Revoke Invite Confirmation ─────────────────────────────────────────────

function RevokeInviteConfirm({
  onCancel,
  onConfirm,
  loading,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-xl border border-(--color-border) bg-(--color-card) p-6 shadow-xl mx-4">
        <h3 className="text-base font-semibold text-(--color-foreground) mb-2">Revoke invite link?</h3>
        <div className="text-sm text-(--color-muted) mb-5">
          <p>Anyone with this link will no longer be able to accept it. You can generate a new link.</p>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={loading} className="cursor-pointer">
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading} className="cursor-pointer">
            {loading ? "Revoking…" : "Revoke"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────

export function ManagersPanel({
  tournamentId,
  isOwner,
  initialManagers,
  initialInvites,
  baseUrl,
}: Props) {
  const [managers, setManagers] = useState<ManagerWithUser[]>(initialManagers);
  const [invites, setInvites] = useState<TournamentManagerInvite[]>(initialInvites);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<ManagerWithUser | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null); // invite id
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  async function handleGenerateInvite() {
    setGeneratingInvite(true);
    try {
      const { data, error } = await actions.tournamentManagers.generateInvite({ tournamentId });
      if (error) {
        toast.error(error.message ?? "Could not generate invite link.");
        return;
      }
      setInvites((prev) => [data, ...prev]);
      toast.success("Invite link generated.");
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setGeneratingInvite(false);
    }
  }

  async function handleRemoveConfirm() {
    if (!removeTarget) return;
    setRemoveLoading(true);
    try {
      const { error } = await actions.tournamentManagers.removeManager({
        tournamentId,
        userId: removeTarget.userId,
      });
      if (error) {
        toast.error(error.message ?? "Could not remove manager.");
        return;
      }
      setManagers((prev) => prev.filter((m) => m.userId !== removeTarget.userId));
      toast.success(`${removeTarget.name} removed as manager.`);
      setRemoveTarget(null);
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setRemoveLoading(false);
    }
  }

  async function handleRevokeConfirm() {
    if (!revokeTarget) return;
    setRevokeLoading(true);
    try {
      const { error } = await actions.tournamentManagers.revokeInvite({ inviteId: revokeTarget });
      if (error) {
        toast.error(error.message ?? "Could not revoke invite.");
        return;
      }
      setInvites((prev) => prev.filter((i) => i.id !== revokeTarget));
      toast.success("Invite link revoked.");
      setRevokeTarget(null);
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setRevokeLoading(false);
    }
  }

  function copyLink(token: string) {
    const url = `${baseUrl}/director/join/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedToken(token);
      toast.success("Invite link copied to clipboard.");
      setTimeout(() => setCopiedToken(null), 2000);
    });
  }

  const pendingInvites = invites.filter((i) => i.acceptedAt === null && Date.now() <= i.expiresAt);

  return (
    <div className="space-y-6">
      {/* ── Current Managers ── */}
      <div className="rounded-xl border border-(--color-border) bg-(--color-card) overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-(--color-border)">
          <div>
            <h3 className="text-sm font-semibold text-(--color-foreground)">Current Managers</h3>
            <p className="text-xs text-(--color-muted) mt-0.5">
              These users can manage registrations and divisions for this tournament.
            </p>
          </div>
          {isOwner && (
            <Button
              size="sm"
              onClick={handleGenerateInvite}
              disabled={generatingInvite}
              className="cursor-pointer shrink-0"
            >
              {generatingInvite ? "Generating…" : "+ Generate invite link"}
            </Button>
          )}
        </div>

        {managers.length === 0 ? (
          <p className="text-sm text-(--color-muted) px-5 py-6 text-center">
            No co-managers yet.{" "}
            {isOwner && (
              <button
                onClick={handleGenerateInvite}
                disabled={generatingInvite}
                className="text-(--color-primary) hover:underline cursor-pointer"
              >
                Generate an invite link
              </button>
            )}{" "}
            to add one.
          </p>
        ) : (
          <ul>
            {managers.map((m) => (
              <li
                key={m.userId}
                className="flex items-center justify-between px-5 py-3 border-b border-(--color-border-soft) last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-(--color-foreground) truncate">{m.name}</p>
                  <p className="text-xs text-(--color-muted) truncate">{m.email}</p>
                </div>
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer shrink-0 ml-3"
                    onClick={() => setRemoveTarget(m)}
                  >
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Pending Invites ── */}
      {isOwner && (
        <div className="rounded-xl border border-(--color-border) bg-(--color-card) overflow-hidden">
          <div className="px-5 py-4 border-b border-(--color-border)">
            <h3 className="text-sm font-semibold text-(--color-foreground)">Pending Invite Links</h3>
            <p className="text-xs text-(--color-muted) mt-0.5">
              Single-use links, valid for 48 hours. Share the link — anyone who opens it and signs in
              becomes a manager.
            </p>
          </div>

          {pendingInvites.length === 0 ? (
            <p className="text-sm text-(--color-muted) px-5 py-6 text-center">No pending invites.</p>
          ) : (
            <ul>
              {pendingInvites.map((invite) => {
                const link = `${baseUrl}/director/join/${invite.token}`;
                return (
                  <li
                    key={invite.id}
                    className="flex items-center justify-between gap-3 px-5 py-3 border-b border-(--color-border-soft) last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-(--color-muted) truncate">{link}</p>
                      <p className="text-xs text-(--color-muted) mt-0.5">{formatExpiry(invite.expiresAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        onClick={() => copyLink(invite.token)}
                      >
                        {copiedToken === invite.token ? "Copied!" : "Copy"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                        onClick={() => setRevokeTarget(invite.id)}
                      >
                        Revoke
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* ── Overlay confirmations ── */}
      {removeTarget && (
        <RemoveManagerConfirm
          manager={removeTarget}
          onCancel={() => setRemoveTarget(null)}
          onConfirm={handleRemoveConfirm}
          loading={removeLoading}
        />
      )}
      {revokeTarget && (
        <RevokeInviteConfirm
          onCancel={() => setRevokeTarget(null)}
          onConfirm={handleRevokeConfirm}
          loading={revokeLoading}
        />
      )}
    </div>
  );
}
