import type { AppUser } from "@/lib/auth";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { getDb } from "@/lib/db";
import { TeamRepository } from "@/repositories/team-repository";
import type { TeamWithCoach } from "@/repositories/team-repository";
import type { Team } from "@/lib/schema";

export interface CreateTeamInput {
  name: string;
  city: string;
  division: string;
  color: string;
}

// TeamService — all business logic for teams.
// No HTTP, no Astro context. Receives currentUser for authorization checks.
export class TeamService {
  constructor(private readonly teams: TeamRepository) {}

  async listTeams(): Promise<TeamWithCoach[]> {
    return this.teams.listAllWithCoach();
  }

  async listApprovedTeams(): Promise<Team[]> {
    return this.teams.listApproved();
  }

  async listPendingTeams(): Promise<Team[]> {
    return this.teams.listPending();
  }

  async getTeam(id: string): Promise<TeamWithCoach> {
    const team = await this.teams.findByIdWithCoach(id);
    if (!team) {
      throw new NotFoundError("Team", id);
    }
    return team;
  }

  async createTeam(input: CreateTeamInput, currentUser: AppUser): Promise<Team> {
    const now = Date.now();
    const id = crypto.randomUUID();

    return this.teams.insert({
      id,
      name: input.name,
      city: input.city,
      division: input.division,
      color: input.color || "emerald",
      coachId: currentUser.id,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  }

  async updateTeam(
    id: string,
    input: { name: string; city: string; division: string; color: string },
    currentUser: AppUser,
  ): Promise<Team> {
    const team = await this.teams.findById(id);
    if (!team) {
      throw new NotFoundError("Team", id);
    }
    if (currentUser.role !== "admin" && team.coachId !== currentUser.id) {
      throw new ForbiddenError("edit this team");
    }
    if (!input.name.trim()) {
      throw new ValidationError("name", "Team name is required");
    }
    return this.teams.update(id, {
      name: input.name.trim(),
      city: input.city.trim(),
      division: input.division.trim(),
      color: input.color || "emerald",
    });
  }

  async approveTeam(id: string, currentUser: AppUser): Promise<Team> {
    if (currentUser.role !== "admin") {
      throw new ForbiddenError("approve teams");
    }
    const team = await this.teams.findById(id);
    if (!team) {
      throw new NotFoundError("Team", id);
    }
    return this.teams.updateStatus(id, "approved");
  }

  async rejectTeam(id: string, currentUser: AppUser): Promise<Team> {
    if (currentUser.role !== "admin") {
      throw new ForbiddenError("reject teams");
    }
    const team = await this.teams.findById(id);
    if (!team) {
      throw new NotFoundError("Team", id);
    }
    return this.teams.updateStatus(id, "rejected");
  }

  async unRejectTeam(id: string, currentUser: AppUser): Promise<Team> {
    if (currentUser.role !== "admin") {
      throw new ForbiddenError("un-reject teams");
    }
    const team = await this.teams.findById(id);
    if (!team) {
      throw new NotFoundError("Team", id);
    }
    return this.teams.updateStatus(id, "pending");
  }
}

// DI factory — wire the service with its dependencies.
// Pages and actions call this; never instantiate TeamService directly.
export function makeTeamService(): TeamService {
  return new TeamService(new TeamRepository(getDb()));
}
