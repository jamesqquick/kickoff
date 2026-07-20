import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db";
import { playerTeams } from "@/lib/schema";
import type { PlayerTeam } from "@/lib/schema";

// PlayerTeamRepository — all database access for the player_teams table.
// No business logic, no HTTP, no Astro context.
// Receives a typed Drizzle instance via constructor injection.
export class PlayerTeamRepository {
  constructor(private readonly db: AppDatabase) {}

  // Player self-requests to join — status starts as 'pending'.
  async requestJoin(playerId: string, teamId: string): Promise<PlayerTeam> {
    const now = Date.now();
    const results = await this.db
      .insert(playerTeams)
      .values({
        id: crypto.randomUUID(),
        playerId,
        teamId,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return results[0];
  }

  // Coach / admin adds a player directly — status is 'approved'.
  async addPlayer(
    playerId: string,
    teamId: string,
    jerseyNumber?: number,
  ): Promise<PlayerTeam> {
    const now = Date.now();
    const results = await this.db
      .insert(playerTeams)
      .values({
        id: crypto.randomUUID(),
        playerId,
        teamId,
        jerseyNumber: jerseyNumber ?? null,
        status: "approved",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return results[0];
  }

  async removePlayer(playerId: string, teamId: string): Promise<void> {
    await this.db
      .delete(playerTeams)
      .where(
        and(eq(playerTeams.playerId, playerId), eq(playerTeams.teamId, teamId)),
      );
  }

  // Approved roster for a team — JOINs user table for player name/image.
  // Uses raw SQL because the Better Auth `user` table is not in the Drizzle schema.
  async listByTeam(teamId: string): Promise<PlayerTeamWithProfile[]> {
    const result = await this.db.$client
      .prepare(
        `SELECT pt.id, pt.player_id AS playerId, pt.team_id AS teamId,
                pt.jersey_number AS jerseyNumber, pt.status,
                pt.created_at AS createdAt, pt.updated_at AS updatedAt,
                u.name AS playerName, u.image AS playerImage
         FROM player_teams pt
         JOIN players p ON p.id = pt.player_id
         JOIN user u ON u.id = p.user_id
         WHERE pt.team_id = ? AND pt.status = 'approved'
         ORDER BY pt.created_at ASC`,
      )
      .bind(teamId)
      .all<PlayerTeamWithProfile>();
    return result.results;
  }

  // All player_team rows for a player across all statuses — JOINs teams table.
  async listByPlayer(playerId: string): Promise<PlayerTeamWithTeam[]> {
    const result = await this.db.$client
      .prepare(
        `SELECT pt.id, pt.player_id AS playerId, pt.team_id AS teamId,
                pt.jersey_number AS jerseyNumber, pt.status,
                pt.created_at AS createdAt, pt.updated_at AS updatedAt,
                t.name AS teamName, t.city AS teamCity,
                t.division AS teamDivision, t.status AS teamStatus
         FROM player_teams pt
         JOIN teams t ON t.id = pt.team_id
         WHERE pt.player_id = ?
         ORDER BY pt.created_at DESC`,
      )
      .bind(playerId)
      .all<PlayerTeamWithTeam>();
    return result.results;
  }

  // Pending join requests for a team — same JOIN as listByTeam but status = 'pending'.
  async listPendingByTeam(teamId: string): Promise<PlayerTeamWithProfile[]> {
    const result = await this.db.$client
      .prepare(
        `SELECT pt.id, pt.player_id AS playerId, pt.team_id AS teamId,
                pt.jersey_number AS jerseyNumber, pt.status,
                pt.created_at AS createdAt, pt.updated_at AS updatedAt,
                u.name AS playerName, u.image AS playerImage
         FROM player_teams pt
         JOIN players p ON p.id = pt.player_id
         JOIN user u ON u.id = p.user_id
         WHERE pt.team_id = ? AND pt.status = 'pending'
         ORDER BY pt.created_at ASC`,
      )
      .bind(teamId)
      .all<PlayerTeamWithProfile>();
    return result.results;
  }

  async updateStatus(
    playerId: string,
    teamId: string,
    status: "approved" | "rejected",
  ): Promise<PlayerTeam> {
    const results = await this.db
      .update(playerTeams)
      .set({ status, updatedAt: Date.now() })
      .where(
        and(eq(playerTeams.playerId, playerId), eq(playerTeams.teamId, teamId)),
      )
      .returning();
    return results[0];
  }

  async findByPlayerAndTeam(
    playerId: string,
    teamId: string,
  ): Promise<PlayerTeam | null> {
    const results = await this.db
      .select()
      .from(playerTeams)
      .where(
        and(eq(playerTeams.playerId, playerId), eq(playerTeams.teamId, teamId)),
      )
      .limit(1);
    return results[0] ?? null;
  }
}

// PlayerTeam row enriched with player profile data from the Better Auth user table.
// Used by team roster views.
export interface PlayerTeamWithProfile extends PlayerTeam {
  playerName: string;
  playerImage: string | null;
}

// PlayerTeam row enriched with team data. Used by player/profile views.
export interface PlayerTeamWithTeam extends PlayerTeam {
  teamName: string;
  teamCity: string;
  teamDivision: string;
  teamStatus: string;
}
