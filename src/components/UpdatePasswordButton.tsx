import { useState } from "react";
import { toast } from "sonner";
import { actions } from "astro:actions";
import { Button } from "@/components/ui/button";

/**
 * Reads the sibling password inputs (rendered as Astro FormFields) by name and
 * submits them to the profile.updatePassword action.
 */
export function UpdatePasswordButton() {
  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    const get = (name: string) =>
      document.querySelector<HTMLInputElement>(`input[name="${name}"]`)?.value ?? "";

    const currentPassword = get("currentPassword");
    const newPassword = get("newPassword");
    const confirmPassword = get("confirmPassword");

    // Client-side early validation — server validates too.
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await actions.profile.updatePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (error) {
        toast.error(error.message ?? "Could not update password. Try again.");
        return;
      }
      toast.success("Password updated");
      // Clear fields on success.
      ["currentPassword", "newPassword", "confirmPassword"].forEach((name) => {
        const el = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
        if (el) el.value = "";
      });
    } catch {
      toast.error("Could not update password. Try again.");
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
