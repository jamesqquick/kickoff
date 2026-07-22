import { useState } from "react";
import { toast } from "sonner";
import { actions } from "astro:actions";
import { Button } from "@/components/ui/button";

interface Props {
  teamId: string;
  // Full invite URL resolved server-side (avoids an extra round-trip on mount).
  initialInviteUrl: string;
}

export function InviteLinkPanel({ teamId, initialInviteUrl }: Props) {
  const [inviteUrl, setInviteUrl] = useState(initialInviteUrl);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Could not copy. Select the link and copy it manually.");
    }
  }

  async function handleRegenerate() {
    setLoading(true);
    try {
      const { data, error } = await actions.teamInvites.regenerate({ teamId });
      if (error) throw error;
      const newUrl = `${window.location.origin}/join/${data!.token}`;
      setInviteUrl(newUrl);
      toast.success("New invite link generated. The old link is now invalid.");
    } catch {
      toast.error("Could not regenerate link. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-card) mb-5">
      <div className="px-4 sm:px-6 py-4 border-b border-(--color-border)">
        <h3 className="font-display font-semibold text-(--color-foreground)">Invite Link</h3>
        <p className="text-sm text-(--color-muted) mt-0.5">
          Share this link with players. They'll be added to the roster instantly — no approval needed.
        </p>
      </div>
      <div className="px-4 sm:px-6 py-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={inviteUrl}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="flex-1 min-w-0 rounded-md border border-(--color-border) bg-(--color-background) px-3 py-2 text-sm text-(--color-muted) font-mono cursor-text focus:outline-none focus:ring-2 focus:ring-(--color-primary)/30"
          />
          <Button
            variant="outline"
            className="shrink-0"
            onClick={handleCopy}
          >
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-(--color-muted)">
            Players who open this link are automatically approved.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-(--color-muted) shrink-0 cursor-pointer"
            onClick={handleRegenerate}
            disabled={loading}
          >
            {loading ? "Generating…" : "Regenerate link"}
          </Button>
        </div>
      </div>
    </div>
  );
}
