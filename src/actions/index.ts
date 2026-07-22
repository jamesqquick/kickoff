import { teams } from "./teams";
import { profile } from "./profile";
import { teamMembers } from "./team-members";
import { tournaments } from "./tournaments";
import { divisions } from "./divisions";
import { tournamentRegistrations } from "./tournament-registrations";

// All Astro Actions are registered here.
// Add new action namespaces alongside `teams` as features grow.
export const server = {
  teams,
  profile,
  teamMembers,
  tournaments,
  divisions,
  tournamentRegistrations,
};
