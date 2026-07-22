import type { AppUser } from "@/lib/auth";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { getDb } from "@/lib/db";
import { TeamRepository } from "@/repositories/team-repository";
import type { TeamWithCoach } from "@/repositories/team-repository";
import type { Team } from "@/lib/schema";

export interface CreateTeamInput {
  name: string;
  city: string;
  color: string;
  shortName?: string;
}

// TeamService — all business logic for teams.
// No HTTP, no Astro context. Receives currentUser for authorization checks.
export class TeamService {
  constructor(private readonly teams: TeamRepository) {}

  async listTeams(): Promise<TeamWithCoach[]> {
    return this.teams.listAllWithCoach();
  }

  // Returns all teams the user coaches for the My Teams page.
  async listByCoach(userId: string): Promise<Team[]> {
    return this.teams.listByCoach(userId);
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
      color: input.color || "emerald",
      shortName: input.shortName?.trim().toUpperCase() || null,
      coachId: currentUser.id,
      createdAt: now,
      updatedAt: now,
    });
  }

  async updateTeam(
    id: string,
    input: { name: string; city: string; color: string; shortName?: string },
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
      color: input.color || "emerald",
      shortName: input.shortName?.trim().toUpperCase() || null,
    });
  }
}

// DI factory — wire the service with its dependencies.
// Pages and actions call this; never instantiate TeamService directly.
export function makeTeamService(): TeamService {
  return new TeamService(new TeamRepository(getDb()));
}
