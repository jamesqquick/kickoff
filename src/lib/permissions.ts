// Shared authorization helpers.
// No HTTP, no Astro context — pure functions over AppUser.
import type { AppUser } from "@/lib/auth";

/** True when the user is the platform superuser. */
export function isAdmin(user: AppUser): boolean {
  return user.role === "admin";
}

/** True when the user can act as a coach (own + manage teams, register teams). */
export function isCoach(user: AppUser): boolean {
  return user.isCoach || isAdmin(user);
}

/** True when the user can act as a tournament director globally. */
export function isDirector(user: AppUser): boolean {
  return user.isDirector || isAdmin(user);
}

/**
 * True when the user can manage a specific tournament.
 * Requires the caller to have already resolved ownership/manager status
 * via TournamentRepository.isOwnerOrManager().
 *
 * Use pattern:
 *   const managed = await repo.isOwnerOrManager(tournamentId, user.id);
 *   if (!canManageTournament(user, managed)) throw new ForbiddenError(...)
 */
export function canManageTournament(user: AppUser, isOwnerOrManager: boolean): boolean {
  return (user.isDirector && isOwnerOrManager) || isAdmin(user);
}

/**
 * True when the user can add/remove managers or generate/revoke invite links
 * for a specific tournament. Restricted to the tournament *owner* (created_by)
 * or a platform admin — co-managers cannot add further managers.
 */
export function canManageManagersFor(user: AppUser, isOwner: boolean): boolean {
  return (user.isDirector && isOwner) || isAdmin(user);
}
