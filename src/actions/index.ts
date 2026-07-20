import { teams } from "./teams";
import { players } from "./players";
import { profile } from "./profile";

// All Astro Actions are registered here.
// Add new action namespaces alongside `teams` as features grow.
export const server = {
  teams,
  players,
  profile,
};
