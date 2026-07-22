import { useEffect } from "react";
import { toast } from "sonner";

interface Props {
  teamName: string;
}

// Fires a welcome toast once on mount when the user has just joined via invite link.
// Mounted on the team detail page when ?joined=1 is present in the URL.
export function WelcomeBanner({ teamName }: Props) {
  useEffect(() => {
    toast.success(`Welcome to ${teamName}! You've been added to the roster.`);
  }, []);

  return null;
}
