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
  /** Tournament fee in cents; null = no fee. Lets list views show payment state without a second fetch. */
  registrationFee: number | null;
  // paidAt and paidNote are inherited from TournamentRegistration via schema inference.
}

/**
 * Shared column projection for every "with details" query. Kept in one place so
 * the joined shape stays consistent across list/find methods.
 */
const REGISTRATION_DETAIL_COLUMNS = {
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
  registrationFee: tournaments.registrationFee,
} as const;

export class TournamentRegistrationRepository {
  constructor(private readonly db: AppDatabase) {}

  /** Base SELECT + joins shared by every "with details" query. Callers append `.where(...)`. */
  private detailsQuery() {
    return this.db
      .select(REGISTRATION_DETAIL_COLUMNS)
      .from(tournamentRegistrations)
      .innerJoin(teams, eq(tournamentRegistrations.teamId, teams.id))
      .innerJoin(divisions, eq(tournamentRegistrations.divisionId, divisions.id))
      .innerJoin(tournaments, eq(tournamentRegistrations.tournamentId, tournaments.id));
  }

  async listByTournament(tournamentId: string): Promise<RegistrationWithDetails[]> {
    return this.detailsQuery()
      .where(eq(tournamentRegistrations.tournamentId, tournamentId))
      .all();
  }

  async listByTournamentAndStatus(
    tournamentId: string,
    status: RegistrationStatus,
  ): Promise<RegistrationWithDetails[]> {
    return this.detailsQuery()
      .where(
        and(
          eq(tournamentRegistrations.tournamentId, tournamentId),
          eq(tournamentRegistrations.status, status),
        ),
      )
      .all();
  }

  /** Returns all registrations for a team, joined with tournament and division names. */
  async listByTeam(teamId: string): Promise<RegistrationWithDetails[]> {
    return this.detailsQuery()
      .where(eq(tournamentRegistrations.teamId, teamId))
      .all();
  }

  async findByIdWithDetails(id: string): Promise<RegistrationWithDetails | undefined> {
    const results = await this.detailsQuery()
      .where(eq(tournamentRegistrations.id, id))
      .limit(1);
    return results[0];
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
