import { eq, and } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db";
import { tournamentRegistrations, teams, divisions, tournaments } from "@/lib/schema";
import type { TournamentRegistration, NewTournamentRegistration, RegistrationStatus } from "@/lib/schema";

export interface RegistrationWithDetails extends TournamentRegistration {
  teamName: string;
  teamColor: string;
  teamShortName: string | null;
  divisionName: string;
  /** Present on all listByTeam results; null on listByTournament (tournament is already known). */
  tournamentName: string | null;
  // paidAt and paidNote are inherited from TournamentRegistration via schema inference.
  // Explicitly listed here for documentation clarity.
}

export class TournamentRegistrationRepository {
  constructor(private readonly db: AppDatabase) {}

  async listByTournament(tournamentId: string): Promise<RegistrationWithDetails[]> {
    const rows = await this.db
      .select({
        id: tournamentRegistrations.id,
        teamId: tournamentRegistrations.teamId,
        divisionId: tournamentRegistrations.divisionId,
        tournamentId: tournamentRegistrations.tournamentId,
        status: tournamentRegistrations.status,
        registeredAt: tournamentRegistrations.registeredAt,
        notes: tournamentRegistrations.notes,
        paidAt: tournamentRegistrations.paidAt,
        paidNote: tournamentRegistrations.paidNote,
        createdAt: tournamentRegistrations.createdAt,
        updatedAt: tournamentRegistrations.updatedAt,
        teamName: teams.name,
        teamColor: teams.color,
        teamShortName: teams.shortName,
        divisionName: divisions.name,
        tournamentName: tournaments.name,
      })
      .from(tournamentRegistrations)
      .innerJoin(teams, eq(tournamentRegistrations.teamId, teams.id))
      .innerJoin(divisions, eq(tournamentRegistrations.divisionId, divisions.id))
      .innerJoin(tournaments, eq(tournamentRegistrations.tournamentId, tournaments.id))
      .where(eq(tournamentRegistrations.tournamentId, tournamentId))
      .all();
    return rows;
  }

  async listByTournamentAndStatus(
    tournamentId: string,
    status: RegistrationStatus,
  ): Promise<RegistrationWithDetails[]> {
    const rows = await this.db
      .select({
        id: tournamentRegistrations.id,
        teamId: tournamentRegistrations.teamId,
        divisionId: tournamentRegistrations.divisionId,
        tournamentId: tournamentRegistrations.tournamentId,
        status: tournamentRegistrations.status,
        registeredAt: tournamentRegistrations.registeredAt,
        notes: tournamentRegistrations.notes,
        paidAt: tournamentRegistrations.paidAt,
        paidNote: tournamentRegistrations.paidNote,
        createdAt: tournamentRegistrations.createdAt,
        updatedAt: tournamentRegistrations.updatedAt,
        teamName: teams.name,
        teamColor: teams.color,
        teamShortName: teams.shortName,
        divisionName: divisions.name,
        tournamentName: tournaments.name,
      })
      .from(tournamentRegistrations)
      .innerJoin(teams, eq(tournamentRegistrations.teamId, teams.id))
      .innerJoin(divisions, eq(tournamentRegistrations.divisionId, divisions.id))
      .innerJoin(tournaments, eq(tournamentRegistrations.tournamentId, tournaments.id))
      .where(
        and(
          eq(tournamentRegistrations.tournamentId, tournamentId),
          eq(tournamentRegistrations.status, status),
        ),
      )
      .all();
    return rows;
  }

  /** Returns all registrations for a team, joined with tournament and division names. */
  async listByTeam(teamId: string): Promise<RegistrationWithDetails[]> {
    const rows = await this.db
      .select({
        id: tournamentRegistrations.id,
        teamId: tournamentRegistrations.teamId,
        divisionId: tournamentRegistrations.divisionId,
        tournamentId: tournamentRegistrations.tournamentId,
        status: tournamentRegistrations.status,
        registeredAt: tournamentRegistrations.registeredAt,
        notes: tournamentRegistrations.notes,
        paidAt: tournamentRegistrations.paidAt,
        paidNote: tournamentRegistrations.paidNote,
        createdAt: tournamentRegistrations.createdAt,
        updatedAt: tournamentRegistrations.updatedAt,
        teamName: teams.name,
        teamColor: teams.color,
        teamShortName: teams.shortName,
        divisionName: divisions.name,
        tournamentName: tournaments.name,
      })
      .from(tournamentRegistrations)
      .innerJoin(teams, eq(tournamentRegistrations.teamId, teams.id))
      .innerJoin(divisions, eq(tournamentRegistrations.divisionId, divisions.id))
      .innerJoin(tournaments, eq(tournamentRegistrations.tournamentId, tournaments.id))
      .where(eq(tournamentRegistrations.teamId, teamId))
      .all();
    return rows;
  }

  async findByTeamAndTournament(
    teamId: string,
    tournamentId: string,
  ): Promise<TournamentRegistration | undefined> {
    const results = await this.db
      .select()
      .from(tournamentRegistrations)
      .where(
        and(
          eq(tournamentRegistrations.teamId, teamId),
          eq(tournamentRegistrations.tournamentId, tournamentId),
        ),
      )
      .limit(1);
    return results[0];
  }

  async findById(id: string): Promise<TournamentRegistration | undefined> {
    const results = await this.db
      .select()
      .from(tournamentRegistrations)
      .where(eq(tournamentRegistrations.id, id))
      .limit(1);
    return results[0];
  }

  async countByDivision(divisionId: string): Promise<number> {
    const rows = await this.db
      .select({ id: tournamentRegistrations.id })
      .from(tournamentRegistrations)
      .where(eq(tournamentRegistrations.divisionId, divisionId))
      .all();
    return rows.length;
  }

  async insert(row: NewTournamentRegistration): Promise<TournamentRegistration> {
    const results = await this.db
      .insert(tournamentRegistrations)
      .values(row)
      .returning();
    return results[0];
  }

  async updateStatus(
    id: string,
    status: RegistrationStatus,
    notes?: string,
  ): Promise<TournamentRegistration> {
    const results = await this.db
      .update(tournamentRegistrations)
      .set({ status, notes: notes ?? null, updatedAt: Date.now() })
      .where(eq(tournamentRegistrations.id, id))
      .returning();
    return results[0];
  }

  async updatePaymentStatus(
    id: string,
    paidAt: number | null,
    paidNote: string | null,
  ): Promise<TournamentRegistration> {
    const results = await this.db
      .update(tournamentRegistrations)
      .set({ paidAt, paidNote, updatedAt: Date.now() })
      .where(eq(tournamentRegistrations.id, id))
      .returning();
    return results[0];
  }
}
