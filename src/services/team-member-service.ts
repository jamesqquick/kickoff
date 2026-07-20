import type { AppUser } from "@/lib/auth";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { getDb } from "@/lib/db";
import { TeamMemberRepository } from "@/repositories/team-member-repository";
import { TeamRepository } from "@/repositories/team-repository";
import type { TeamMember } from "@/lib/schema";
import type {
  TeamMemberWithUser,
  TeamMemberWithTeam,
} from "@/repositories/team-member-repository";

// TeamMemberService — all business logic for the team_members join table.
// No HTTP, no Astro context. Receives currentUser for authorization checks.
// Team ownership (teams.coach_id === user.id) determines management permissions.
export class TeamMemberService {
  constructor(
    private readonly members: TeamMemberRepository,
    private readonly teams: TeamRepository,
  ) {}

  // Any authenticated user can request to join an approved team,
  // except the team owner (self-join would create a conflict of interest).
  async requestJoin(teamId: string, currentUser: AppUser): Promise<TeamMember> {
    const team = await this.teams.findById(teamId);
    if (!team) {
      throw new NotFoundError("Team", teamId);
    }
    if (team.status !== "approved") {
      throw new ValidationError("teamId", "Cannot join a team that is not approved");
    }
    if (team.coachId === currentUser.id) {
      throw new ForbiddenError("Team owners cannot request to join their own team");
    }

    const existing = await this.members.findByUserAndTeam(currentUser.id, teamId);
    if (existing) {
      throw new ValidationError("teamId", "You already have a pending or active membership for this team");
    }

    return this.members.requestJoin(currentUser.id, teamId);
  }

  // Team owner or admin can add a user directly (status = approved).
  async addMember(
    userId: string,
    teamId: string,
    currentUser: AppUser,
    jerseyNumber?: number,
  ): Promise<TeamMember> {
    const team = await this.teams.findById(teamId);
    if (!team) {
      throw new NotFoundError("Team", teamId);
    }
    if (currentUser.role !== "admin" && team.coachId !== currentUser.id) {
      throw new ForbiddenError("addMember");
    }

    const existing = await this.members.findByUserAndTeam(userId, teamId);
    if (existing) {
      throw new ValidationError("userId", "User already has a membership for this team");
    }

    return this.members.add(userId, teamId, jerseyNumber);
  }

  // Team owner or admin can remove a member.
  async removeMember(
    userId: string,
    teamId: string,
    currentUser: AppUser,
  ): Promise<void> {
    const team = await this.teams.findById(teamId);
    if (!team) {
      throw new NotFoundError("Team", teamId);
    }
    if (currentUser.role !== "admin" && team.coachId !== currentUser.id) {
      throw new ForbiddenError("removeMember");
    }

    await this.members.remove(userId, teamId);
  }

  // Team owner or admin can approve a pending join request.
  async approveRequest(
    userId: string,
    teamId: string,
    currentUser: AppUser,
  ): Promise<TeamMember> {
    const team = await this.teams.findById(teamId);
    if (!team) throw new NotFoundError("Team", teamId);

    if (currentUser.role !== "admin" && team.coachId !== currentUser.id) {
      throw new ForbiddenError("approveRequest");
    }

    const existing = await this.members.findByUserAndTeam(userId, teamId);
    if (!existing) throw new NotFoundError("JoinRequest", `${userId}:${teamId}`);

    return this.members.updateStatus(userId, teamId, "approved");
  }

  // Team owner or admin can deny a pending join request.
  async denyRequest(
    userId: string,
    teamId: string,
    currentUser: AppUser,
  ): Promise<void> {
    const team = await this.teams.findById(teamId);
    if (!team) throw new NotFoundError("Team", teamId);

    if (currentUser.role !== "admin" && team.coachId !== currentUser.id) {
      throw new ForbiddenError("denyRequest");
    }

    const existing = await this.members.findByUserAndTeam(userId, teamId);
    if (!existing) throw new NotFoundError("JoinRequest", `${userId}:${teamId}`);

    // Set to rejected so the user can see the outcome on their profile.
    await this.members.updateStatus(userId, teamId, "rejected");
  }

  // Pending join requests for a team — team owner / admin only.
  async listPendingByTeam(
    teamId: string,
    currentUser: AppUser,
  ): Promise<TeamMemberWithUser[]> {
    const team = await this.teams.findById(teamId);
    if (!team) throw new NotFoundError("Team", teamId);

    if (currentUser.role !== "admin" && team.coachId !== currentUser.id) {
      throw new ForbiddenError("listPendingByTeam");
    }

    return this.members.listPendingByTeam(teamId);
  }

  // Approved roster for a team. Public — no auth required.
  async listByTeam(teamId: string): Promise<TeamMemberWithUser[]> {
    const team = await this.teams.findById(teamId);
    if (!team) {
      throw new NotFoundError("Team", teamId);
    }
    return this.members.listByTeam(teamId);
  }

  // All team memberships for a user across all statuses. Public.
  async listByUser(userId: string): Promise<TeamMemberWithTeam[]> {
    return this.members.listByUser(userId);
  }
}

// DI factory — wire the service with its dependencies.
// Pages and actions call this; never instantiate TeamMemberService directly.
export function makeTeamMemberService(): TeamMemberService {
  const db = getDb();
  return new TeamMemberService(
    new TeamMemberRepository(db),
    new TeamRepository(db),
  );
}
