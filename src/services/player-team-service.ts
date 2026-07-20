import type { AppUser } from "@/lib/auth";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { getDb } from "@/lib/db";
import { PlayerTeamRepository } from "@/repositories/player-team-repository";
import { PlayerRepository } from "@/repositories/player-repository";
import { TeamRepository } from "@/repositories/team-repository";
import type { PlayerTeam } from "@/lib/schema";
import type {
  PlayerTeamWithProfile,
  PlayerTeamWithTeam,
} from "@/repositories/player-team-repository";

// PlayerTeamService — all business logic for the player_teams join table.
// No HTTP, no Astro context. Receives currentUser for authorization checks.
export class PlayerTeamService {
  constructor(
    private readonly playerTeams: PlayerTeamRepository,
    private readonly players: PlayerRepository,
    private readonly teams: TeamRepository,
  ) {}

  // Any authenticated user can request to join an approved team.
  // Resolves the caller's player record via their userId.
  async requestJoin(teamId: string, currentUser: AppUser): Promise<PlayerTeam> {
    const team = await this.teams.findById(teamId);
    if (!team) {
      throw new NotFoundError("Team", teamId);
    }
    if (team.status !== "approved") {
      throw new ValidationError("teamId", "Cannot join a team that is not approved");
    }

    const player = await this.players.findByUserId(currentUser.id);
    if (!player) {
      throw new NotFoundError("Player", currentUser.id);
    }

    const existing = await this.playerTeams.findByPlayerAndTeam(player.id, teamId);
    if (existing) {
      throw new ValidationError("teamId", "You already have a pending or active membership for this team");
    }

    return this.playerTeams.requestJoin(player.id, teamId);
  }

  // Coach of the team or admin can add a player directly (status = approved).
  async addPlayer(
    playerId: string,
    teamId: string,
    currentUser: AppUser,
    jerseyNumber?: number,
  ): Promise<PlayerTeam> {
    const team = await this.teams.findById(teamId);
    if (!team) {
      throw new NotFoundError("Team", teamId);
    }

    if (currentUser.role !== "admin" && team.coachId !== currentUser.id) {
      throw new ForbiddenError("addPlayer");
    }

    const player = await this.players.findById(playerId);
    if (!player) {
      throw new NotFoundError("Player", playerId);
    }

    const existing = await this.playerTeams.findByPlayerAndTeam(playerId, teamId);
    if (existing) {
      throw new ValidationError("playerId", "Player already has a membership for this team");
    }

    return this.playerTeams.addPlayer(playerId, teamId, jerseyNumber);
  }

  // Coach of the team or admin can remove a player.
  async removePlayer(
    playerId: string,
    teamId: string,
    currentUser: AppUser,
  ): Promise<void> {
    const team = await this.teams.findById(teamId);
    if (!team) {
      throw new NotFoundError("Team", teamId);
    }

    if (currentUser.role !== "admin" && team.coachId !== currentUser.id) {
      throw new ForbiddenError("removePlayer");
    }

    await this.playerTeams.removePlayer(playerId, teamId);
  }

  // Returns the approved roster for a team. Public — no auth required.
  async listByTeam(teamId: string): Promise<PlayerTeamWithProfile[]> {
    const team = await this.teams.findById(teamId);
    if (!team) {
      throw new NotFoundError("Team", teamId);
    }
    return this.playerTeams.listByTeam(teamId);
  }

  // Returns all team memberships for a player across all statuses. Public.
  async listByPlayer(playerId: string): Promise<PlayerTeamWithTeam[]> {
    const player = await this.players.findById(playerId);
    if (!player) {
      throw new NotFoundError("Player", playerId);
    }
    return this.playerTeams.listByPlayer(playerId);
  }
}

// DI factory — wire the service with its dependencies.
// Pages and actions call this; never instantiate PlayerTeamService directly.
export function makePlayerTeamService(): PlayerTeamService {
  const db = getDb();
  return new PlayerTeamService(
    new PlayerTeamRepository(db),
    new PlayerRepository(db),
    new TeamRepository(db),
  );
}
