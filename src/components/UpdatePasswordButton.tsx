import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { delay } from "@/lib/utils";

/**
 * Reads the sibling password inputs (rendered as Astro FormFields) by name and
 * validates them before simulating a submit. Kept as a button-only island so the
 * form markup stays server-rendered Astro.
 */
export function UpdatePasswordButton() {
  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    const next = document.querySelector<HTMLInputElement>(
      'input[name="newPassword"]'
    );
    const confirm = document.querySelector<HTMLInputElement>(
      'input[name="confirmPassword"]'
    );

    if (!next?.value || !confirm?.value) {
      toast.error("Enter and confirm your new password.");
      return;
    }
    if (next.value !== confirm.value) {
      toast.error("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      // TODO: swap for `await actions.profile.updatePassword(...)` once Actions exist
      await delay(800);
      toast.success("Password updated");
    } catch {
      toast.error("Could not update password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      className="h-8 px-3"
      onClick={handleUpdate}
      disabled={loading}
    >
      {loading ? "Updating…" : "Update password"}
    </Button>
  );
}
