import type { AppUser } from "@/lib/auth";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { getDb } from "@/lib/db";
import { TeamInviteRepository } from "@/repositories/team-invite-repository";
import { TeamMemberRepository } from "@/repositories/team-member-repository";
import { TeamRepository } from "@/repositories/team-repository";
import type { TeamInvite } from "@/lib/schema";
import type { TeamWithCoach } from "@/repositories/team-repository";

export interface InviteWithTeam {
  invite: TeamInvite;
  team: TeamWithCoach;
}

// TeamInviteService — business logic for team invite links.
// No HTTP, no Astro context. Receives currentUser for authorization checks.
export class TeamInviteService {
  constructor(
    private readonly invites: TeamInviteRepository,
    private readonly teams: TeamRepository,
    private readonly members: TeamMemberRepository,
  ) {}

  // Returns the active invite for a team, creating one if none exists.
  // Only the team coach or an admin may call this.
  async getOrCreate(teamId: string, currentUser: AppUser): Promise<TeamInvite> {
    const team = await this.teams.findById(teamId);
    if (!team) throw new NotFoundError("Team", teamId);
    if (currentUser.role !== "admin" && team.coachId !== currentUser.id) {
      throw new ForbiddenError("manage team invites");
    }

    const existing = await this.invites.findActiveByTeam(teamId);
    if (existing) return existing;

    return this.invites.insert({
      id: crypto.randomUUID(),
      teamId,
      token: generateToken(),
      createdBy: currentUser.id,
      isActive: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  // Revoke the current invite and issue a fresh token.
  // Only the team coach or an admin may call this.
  async regenerate(teamId: string, currentUser: AppUser): Promise<TeamInvite> {
    const team = await this.teams.findById(teamId);
    if (!team) throw new NotFoundError("Team", teamId);
    if (currentUser.role !== "admin" && team.coachId !== currentUser.id) {
      throw new ForbiddenError("manage team invites");
    }

    await this.invites.deactivateByTeam(teamId);
    return this.invites.insert({
      id: crypto.randomUUID(),
      teamId,
      token: generateToken(),
      createdBy: currentUser.id,
      isActive: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  // Resolve an invite token to its team — no auth required.
  // Used by the public join landing page to display team info.
  async resolveToken(token: string): Promise<InviteWithTeam> {
    const invite = await this.invites.findByToken(token);
    if (!invite) throw new NotFoundError("Invite", token);

    const team = await this.teams.findByIdWithCoach(invite.teamId);
    if (!team) throw new NotFoundError("Invite", token);

    return { invite, team };
  }

  // A player joins via an invite link — auto-approved, bypassing the pending flow.
  // The coach chose to share the link, so that IS the approval.
  // Idempotent: already-approved members are silently skipped.
  // Rejected or pending members are upgraded to approved.
  async joinViaToken(token: string, currentUser: AppUser): Promise<{ teamId: string }> {
    const { team } = await this.resolveToken(token);

    if (team.coachId === currentUser.id) {
      throw new ForbiddenError("join your own team via invite");
    }

    const existing = await this.members.findByUserAndTeam(currentUser.id, team.id);
    if (existing) {
      if (existing.status !== "approved") {
        await this.members.updateStatus(currentUser.id, team.id, "approved");
      }
      return { teamId: team.id };
    }

    await this.members.add(currentUser.id, team.id);
    return { teamId: team.id };
  }
}

// 18 random bytes → 24-char base64url string (no padding, URL-safe).
function generateToken(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

// DI factory — wire the service with its dependencies.
export function makeTeamInviteService(): TeamInviteService {
  const db = getDb();
  return new TeamInviteService(
    new TeamInviteRepository(db),
    new TeamRepository(db),
    new TeamMemberRepository(db),
  );
}
