import { useState } from "react";
import { toast } from "sonner";
import { actions } from "astro:actions";
import { Button } from "@/components/ui/button";

export function SaveProfileButton() {
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    const get = (name: string) => {
      const el = document.querySelector(`[name="${name}"]`);
      return ((el as HTMLInputElement | null)?.value ?? "").trim();
    };

    setLoading(true);
    try {
      const { error } = await actions.profile.save({
        firstName: get("firstName"),
        lastName: get("lastName"),
        phone: get("phone") || undefined,
        dateOfBirth: get("dateOfBirth") || undefined,
        addressStreet: get("addressStreet") || undefined,
        addressApt: get("addressApt") || undefined,
        addressCity: get("addressCity") || undefined,
        addressState: get("addressState") || undefined,
        addressZip: get("addressZip") || undefined,
        addressCountry: get("addressCountry") || undefined,
      });
      if (error) {
        toast.error(error.message ?? "Could not save profile. Try again.");
        return;
      }
      toast.success("Profile saved");
    } catch {
      toast.error("Could not save profile. Try again.");
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
