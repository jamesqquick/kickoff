import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { delay } from "@/lib/utils";

export function SaveProfileButton() {
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      // TODO: swap for `await actions.profile.save(...)` once Actions are wired up
      await delay(800);
      toast.success("Profile saved");
    } catch {
      toast.error("Could not save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="default"
      className="h-9 px-4"
      onClick={handleSave}
      disabled={loading}
    >
      {loading ? "Saving…" : "Save Changes"}
    </Button>
  );
}
