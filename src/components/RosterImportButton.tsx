import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RosterImportModal } from "@/components/RosterImportModal";

interface Props {
  teamId: string;
  onImported?: (count: number) => void;
}

export function RosterImportButton({ teamId, onImported }: Props) {
  const [open, setOpen] = useState(false);

  function handleImported(count: number) {
    onImported?.(count);
    // Reload the page so the new roster entries appear.
    // A full reload is simplest here since roster state lives in the Astro page.
    window.location.reload();
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="cursor-pointer">
        ↑ Import Roster
      </Button>

      {open && (
        <RosterImportModal
          teamId={teamId}
          onImported={handleImported}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
