import { eq, or, and, like, asc, desc, gt, lte, lt, isNull, gte } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db";
import {
  tournaments,
  tournamentManagers,
  tournamentManagerInvites,
} from "@/lib/schema";
import type {
  NewTournament,
  Tournament,
  TournamentManager,
  NewTournamentManager,
  TournamentManagerInvite,
  NewTournamentManagerInvite,
} from "@/lib/schema";

export class TournamentRepository {
  constructor(private readonly db: AppDatabase) {}

  // ── Tournaments ──────────────────────────────────────────────────────────

  /**
   * List tournaments with optional text search and status filter.
   *
   * @param query  - Filters by LIKE %query% on name and location (server-side).
   * @param status - Filters to a single status bucket derived from start/end dates:
   *                   upcoming: startDate IS NULL OR startDate > today
   *                   active:   startDate <= today AND (endDate IS NULL OR endDate >= today)
   *                   past:     endDate < today (endDate must be set)
   *                 Omit (or pass undefined) to return all statuses.
   *
   * Sort order: past results sort DESC (most-recently-ended first); everything
   * else sorts ASC (nearest upcoming first). When returning all statuses the
   * caller is responsible for reversing the past slice if a DESC order is needed
   * within that section — see TournamentService.listTournaments.
   */
  async list({
    query,
    status,
  }: { query?: string; status?: string } = {}): Promise<Tournament[]> {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Build WHERE conditions array.
    const conditions = [];

    if (query) {
      conditions.push(
        or(
          like(tournaments.name, `%${query}%`),
          like(tournaments.location, `%${query}%`),
        ),
      );
    }

    if (status === "upcoming") {
      // startDate IS NULL (TBD) or startDate is in the future.
      conditions.push(or(isNull(tournaments.startDate), gt(tournaments.startDate, today)));
    } else if (status === "active") {
      // startDate <= today AND (endDate IS NULL OR endDate >= today)
      conditions.push(
        and(
          lte(tournaments.startDate, today),
          or(isNull(tournaments.endDate), gte(tournaments.endDate, today)),
        ),
      );
    } else if (status === "past") {
      // endDate is set and in the past.
      conditions.push(lt(tournaments.endDate, today));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Past results sort DESC (most recently ended at top); all others sort ASC.
    const orderBy = status === "past" ? desc(tournaments.startDate) : asc(tournaments.startDate);

    const baseQuery = this.db.select().from(tournaments);
    const filteredQuery = whereClause ? baseQuery.where(whereClause) : baseQuery;
    return filteredQuery.orderBy(orderBy).all();
  }

  /**
   * All tournaments visible to a director: those they created OR are a manager of.
   * Returns deduped results (a TD who is also a manager of their own tournament only
   * appears once because of the UNIQUE constraint on managers).
   */
  async listForDirector(userId: string): Promise<Tournament[]> {
    // Union: owned tournaments + tournaments where the user is a manager
    const owned = await this.db
      .select()
      .from(tournaments)
      .where(eq(tournaments.createdBy, userId));

    const managed = await this.db
      .select({ tournament: tournaments })
      .from(tournamentManagers)
      .innerJoin(tournaments, eq(tournamentManagers.tournamentId, tournaments.id))
      .where(eq(tournamentManagers.userId, userId))
      .all()
      .then((rows) => rows.map((r) => r.tournament));

    // Deduplicate by id (owner may also appear in managers if they were added)
    const seen = new Set<string>();
    const result: Tournament[] = [];
    for (const t of [...owned, ...managed]) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        result.push(t);
      }
    }
    return result;
  }

  async findById(id: string): Promise<Tournament | undefined> {
    const results = await this.db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, id))
      .limit(1);
    return results[0];
  }

  async findBySlug(slug: string): Promise<Tournament | undefined> {
    const results = await this.db
      .select()
      .from(tournaments)
      .where(eq(tournaments.slug, slug))
      .limit(1);
    return results[0];
  }

  async insert(row: NewTournament): Promise<Tournament> {
    const results = await this.db.insert(tournaments).values(row).returning();
    return results[0];
  }

  async update(
    id: string,
    fields: Partial<
      Pick<
        Tournament,
        | "name"
        | "slug"
        | "startDate"
        | "endDate"
        | "registrationDeadline"
        | "location"
        | "description"
      >
    >,
  ): Promise<Tournament> {
    const results = await this.db
      .update(tournaments)
      .set({ ...fields, updatedAt: Date.now() })
      .where(eq(tournaments.id, id))
      .returning();
    return results[0];
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(tournaments).where(eq(tournaments.id, id));
  }

  // ── Ownership & manager access ────────────────────────────────────────────

  /**
   * Returns true if the user is the tournament owner (created_by) OR has a row
   * in tournament_managers for (tournamentId, userId).
   * Used to gate director-level operations on a specific tournament.
   */
  async isOwnerOrManager(tournamentId: string, userId: string): Promise<boolean> {
    // Check ownership first (cheap, single column)
    const tournament = await this.db
      .select({ createdBy: tournaments.createdBy })
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId))
      .limit(1)
      .then((r) => r[0]);

    if (!tournament) return false;
    if (tournament.createdBy === userId) return true;

    // Check manager table
    const managerRow = await this.db
      .select({ id: tournamentManagers.id })
      .from(tournamentManagers)
      .where(
        and(
          eq(tournamentManagers.tournamentId, tournamentId),
          eq(tournamentManagers.userId, userId),
        ),
      )
      .limit(1)
      .then((r) => r[0]);

    return !!managerRow;
  }

  /**
   * Returns true if the user is the tournament owner (created_by === userId).
   * Used to gate manager add/remove and invite generate/revoke.
   */
  async isOwner(tournamentId: string, userId: string): Promise<boolean> {
    const row = await this.db
      .select({ createdBy: tournaments.createdBy })
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId))
      .limit(1)
      .then((r) => r[0]);
    return row?.createdBy === userId;
  }

  // ── Managers ──────────────────────────────────────────────────────────────

  async listManagers(tournamentId: string): Promise<TournamentManager[]> {
    return this.db
      .select()
      .from(tournamentManagers)
      .where(eq(tournamentManagers.tournamentId, tournamentId))
      .all();
  }

  async addManager(row: NewTournamentManager): Promise<TournamentManager> {
    const results = await this.db
      .insert(tournamentManagers)
      .values(row)
      .returning();
    return results[0];
  }

  async removeManager(tournamentId: string, userId: string): Promise<void> {
    await this.db
      .delete(tournamentManagers)
      .where(
        and(
          eq(tournamentManagers.tournamentId, tournamentId),
          eq(tournamentManagers.userId, userId),
        ),
      );
  }

  async findManager(
    tournamentId: string,
    userId: string,
  ): Promise<TournamentManager | undefined> {
    return this.db
      .select()
      .from(tournamentManagers)
      .where(
        and(
          eq(tournamentManagers.tournamentId, tournamentId),
          eq(tournamentManagers.userId, userId),
        ),
      )
      .limit(1)
      .then((r) => r[0]);
  }

  // ── Invites ───────────────────────────────────────────────────────────────

  async listInvites(tournamentId: string): Promise<TournamentManagerInvite[]> {
    return this.db
      .select()
      .from(tournamentManagerInvites)
      .where(eq(tournamentManagerInvites.tournamentId, tournamentId))
      .all();
  }

  async createInvite(row: NewTournamentManagerInvite): Promise<TournamentManagerInvite> {
    const results = await this.db
      .insert(tournamentManagerInvites)
      .values(row)
      .returning();
    return results[0];
  }

  async findInviteByToken(token: string): Promise<TournamentManagerInvite | undefined> {
    return this.db
      .select()
      .from(tournamentManagerInvites)
      .where(eq(tournamentManagerInvites.token, token))
      .limit(1)
      .then((r) => r[0]);
  }

  async acceptInvite(id: string): Promise<TournamentManagerInvite> {
    const results = await this.db
      .update(tournamentManagerInvites)
      .set({ acceptedAt: Date.now() })
      .where(eq(tournamentManagerInvites.id, id))
      .returning();
    return results[0];
  }

  async revokeInvite(id: string): Promise<void> {
    await this.db
      .delete(tournamentManagerInvites)
      .where(eq(tournamentManagerInvites.id, id));
  }

  /** Count of tournaments owned by this user. Used by the settings guard. */
  async countOwnedByUser(userId: string): Promise<number> {
    const rows = await this.db
      .select({ id: tournaments.id })
      .from(tournaments)
      .where(eq(tournaments.createdBy, userId));
    return rows.length;
  }
}
