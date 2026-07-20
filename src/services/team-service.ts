import type { AppUser } from "@/lib/auth";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { getDb } from "@/lib/db";
import { TeamRepository } from "@/repositories/team-repository";
import type { Team } from "@/lib/schema";

// Roles permitted to create a team.
const TEAM_CREATE_ROLES = new Set(["admin", "coach"]);

export interface CreateTeamInput {
  name: string;
  city: string;
  division: string;
}

// TeamService — all business logic for teams.
// No HTTP, no Astro context. Receives currentUser for authorization checks.
export class TeamService {
  constructor(private readonly teams: TeamRepository) {}

  async listTeams(): Promise<Team[]> {
    return this.teams.list();
  }

  async getTeam(id: string): Promise<Team> {
    const team = await this.teams.findById(id);
    if (!team) {
      throw new NotFoundError("Team", id);
    }
    return team;
  }

  async createTeam(input: CreateTeamInput, currentUser: AppUser): Promise<Team> {
    if (!TEAM_CREATE_ROLES.has(currentUser.role)) {
      throw new ForbiddenError("createTeam");
    }

    const now = Date.now();
    const id = crypto.randomUUID();

    return this.teams.insert({
      id,
      name: input.name,
      city: input.city,
      division: input.division,
      coachId: currentUser.id,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  }
}

// DI factory — wire the service with its dependencies.
// Pages and actions call this; never instantiate TeamService directly.
export function makeTeamService(): TeamService {
  return new TeamService(new TeamRepository(getDb()));
}
