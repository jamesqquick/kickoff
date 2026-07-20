import { teams } from "./teams";
import { profile } from "./profile";
import { teamMembers } from "./team-members";

// All Astro Actions are registered here.
// Add new action namespaces alongside `teams` as features grow.
export const server = {
  teams,
  profile,
  teamMembers,
};
