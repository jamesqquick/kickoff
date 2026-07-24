import { teams } from "./teams";
import { profile } from "./profile";
import { teamMembers } from "./team-members";
import { teamInvites } from "./team-invites";
import { tournaments } from "./tournaments";
import { divisions } from "./divisions";
import { tournamentRegistrations } from "./tournament-registrations";
import { rosterImport } from "./roster-import";
import { tournamentManagers } from "./tournament-managers";
import { settings } from "./settings";

// All Astro Actions are registered here.
// Add new action namespaces alongside `teams` as features grow.
export const server = {
  teams,
  profile,
  teamMembers,
  teamInvites,
  tournaments,
  divisions,
  tournamentRegistrations,
  rosterImport,
  tournamentManagers,
  settings,
};
