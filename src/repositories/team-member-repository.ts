import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db";
import { teamMembers } from "@/lib/schema";
import type { TeamMember } from "@/lib/schema";

// TeamMemberRepository — all database access for the team_members table.
// No business logic, no HTTP, no Astro context.
// Receives a typed Drizzle instance via constructor injection.
export class TeamMemberRepository {
  constructor(private readonly db: AppDatabase) {}

  // User self-requests to join — status starts as 'pending'.
  async requestJoin(userId: string, teamId: string): Promise<TeamMember> {
    const now = Date.now();
    const results = await this.db
      .insert(teamMembers)
      .values({
        id: crypto.randomUUID(),
        userId,
        teamId,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return results[0];
  }

  // Team owner / admin adds a user directly — status is 'approved'.
  async add(
    userId: string,
    teamId: string,
    jerseyNumber?: number,
  ): Promise<TeamMember> {
    const now = Date.now();
    const results = await this.db
      .insert(teamMembers)
      .values({
        id: crypto.randomUUID(),
        userId,
        teamId,
        jerseyNumber: jerseyNumber ?? null,
        status: "approved",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return results[0];
  }

  // Bulk-insert imported roster rows. Rows without an existing account get status = 'pending_signup'.
  // Rows where the email matches an existing account get status = 'approved' and userId set.
  async bulkInsertImported(
    rows: {
      teamId: string;
      email: string;
      displayName: string;
      jerseyNumber: number | null;
      dateOfBirth: string | null;
      phone: string | null;
      playerId: string | null;
      userId: string | null;    // non-null when email matched an existing account
    }[],
  ): Promise<number> {
    if (rows.length === 0) return 0;
    const now = Date.now();
    let inserted = 0;
    // Insert one row at a time — D1 multi-row insert + RETURNING can be unreliable
    // and a single constraint violation would abort the whole batch.
    // Individual inserts skip duplicate rows gracefully.
    for (const r of rows) {
      try {
        await this.db.insert(teamMembers).values({
          id: crypto.randomUUID(),
          teamId: r.teamId,
          email: r.email,
          displayName: r.displayName,
          userId: r.userId ?? null,
          jerseyNumber: r.jerseyNumber,
          dateOfBirth: r.dateOfBirth,
          phone: r.phone,
          playerId: r.playerId,
          status: (r.userId ? "approved" : "pending_signup") as TeamMember["status"],
          createdAt: now,
          updatedAt: now,
        });
        inserted++;
      } catch (err) {
        // Skip rows that violate unique constraints (e.g. already on team).
        // D1 wraps the real SQLite error in err.cause, so check both levels.
        const msg = [
          err instanceof Error ? err.message : String(err),
          err instanceof Error && err.cause instanceof Error ? err.cause.message : "",
        ].join(" ");
        if (msg.includes("UNIQUE") || msg.includes("unique")) continue;
        throw err;
      }
    }
    return inserted;
  }

  // Claim all pending_signup rows for a given email when the user signs in/up.
  // Sets userId and flips status to 'approved'. Returns the number of rows claimed.
  async claimByEmail(email: string, userId: string): Promise<number> {
    const pending = await this.db
      .select({ id: teamMembers.id })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.email, email),
          eq(teamMembers.status, "pending_signup"),
        ),
      );

    if (pending.length === 0) return 0;

    const now = Date.now();
    await Promise.all(
      pending.map((row) =>
        this.db
          .update(teamMembers)
          .set({ userId, status: "approved", updatedAt: now })
          .where(eq(teamMembers.id, row.id)),
      ),
    );
    return pending.length;
  }

  async remove(userId: string, teamId: string): Promise<void> {
    await this.db
      .delete(teamMembers)
      .where(
        and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)),
      );
  }

  // Approved roster for a team — LEFT JOINs user table so pending_signup rows (no userId) are included.
  // Uses raw SQL because the Better Auth `user` table is not in the Drizzle schema.
  async listByTeam(teamId: string): Promise<TeamMemberWithUser[]> {
    const result = await this.db.$client
      .prepare(
        `SELECT tm.id, tm.user_id AS userId, tm.team_id AS teamId,
                tm.email, tm.display_name AS displayName,
                tm.jersey_number AS jerseyNumber, tm.status,
                tm.date_of_birth AS dateOfBirth, tm.phone, tm.player_id AS playerId,
                tm.created_at AS createdAt, tm.updated_at AS updatedAt,
                u.name AS userName, u.image AS userImage
         FROM team_members tm
         LEFT JOIN user u ON u.id = tm.user_id
         WHERE tm.team_id = ? AND tm.status IN ('approved', 'pending_signup')
         ORDER BY tm.status ASC, tm.created_at ASC`,
      )
      .bind(teamId)
      .all<TeamMemberWithUser>();
    return result.results;
  }

  // All team_members rows for a user across all statuses — JOINs teams table.
  async listByUser(userId: string): Promise<TeamMemberWithTeam[]> {
    const result = await this.db.$client
      .prepare(
        `SELECT tm.id, tm.user_id AS userId, tm.team_id AS teamId,
                tm.email, tm.display_name AS displayName,
                tm.jersey_number AS jerseyNumber, tm.status,
                tm.date_of_birth AS dateOfBirth, tm.phone, tm.player_id AS playerId,
                tm.created_at AS createdAt, tm.updated_at AS updatedAt,
                t.name AS teamName, t.city AS teamCity
         FROM team_members tm
         JOIN teams t ON t.id = tm.team_id
         WHERE tm.user_id = ?
         ORDER BY tm.created_at DESC`,
      )
      .bind(userId)
      .all<TeamMemberWithTeam>();
    return result.results;
  }

  // Pending join requests (self-requested) for a team — always have userId.
  async listPendingByTeam(teamId: string): Promise<TeamMemberWithUser[]> {
    const result = await this.db.$client
      .prepare(
        `SELECT tm.id, tm.user_id AS userId, tm.team_id AS teamId,
                tm.email, tm.display_name AS displayName,
                tm.jersey_number AS jerseyNumber, tm.status,
                tm.date_of_birth AS dateOfBirth, tm.phone, tm.player_id AS playerId,
                tm.created_at AS createdAt, tm.updated_at AS updatedAt,
                u.name AS userName, u.image AS userImage
         FROM team_members tm
         JOIN user u ON u.id = tm.user_id
         WHERE tm.team_id = ? AND tm.status = 'pending'
         ORDER BY tm.created_at ASC`,
      )
      .bind(teamId)
      .all<TeamMemberWithUser>();
    return result.results;
  }

  async updateStatus(
    userId: string,
    teamId: string,
    status: "approved" | "rejected",
  ): Promise<TeamMember> {
    const results = await this.db
      .update(teamMembers)
      .set({ status, updatedAt: Date.now() })
      .where(
        and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)),
      )
      .returning();
    return results[0];
  }

  // Count of confirmed teams for a user: all coached teams UNION approved memberships.
  // Used by the sidebar badge. UNION deduplicates if a coach is also a member row.
  async countConfirmedForUser(userId: string): Promise<number> {
    const result = await this.db.$client
      .prepare(
        `SELECT COUNT(*) AS cnt FROM (
           SELECT t.id FROM teams t WHERE t.coach_id = ?
           UNION
           SELECT tm.team_id FROM team_members tm
           WHERE tm.user_id = ? AND tm.status = 'approved'
         ) sub`,
      )
      .bind(userId, userId)
      .first<{ cnt: number }>();
    return result?.cnt ?? 0;
  }

  async findByUserAndTeam(
    userId: string,
    teamId: string,
  ): Promise<TeamMember | null> {
    const results = await this.db
      .select()
      .from(teamMembers)
      .where(
        and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)),
      )
      .limit(1);
    return results[0] ?? null;
  }

  // Returns a lowercase email Set covering every member of a team — both imported rows
  // (email column) and account-based members (email from the Better Auth user table).
  // Used by the import service to detect duplicates before inserting.
  async listExistingEmails(teamId: string): Promise<Set<string>> {
    const result = await this.db.$client
      .prepare(
        `SELECT LOWER(COALESCE(tm.email, u.email)) AS email
         FROM team_members tm
         LEFT JOIN user u ON u.id = tm.user_id
         WHERE tm.team_id = ?
           AND (tm.email IS NOT NULL OR u.email IS NOT NULL)`,
      )
      .bind(teamId)
      .all<{ email: string }>();
    return new Set(result.results.map((r) => r.email).filter(Boolean));
  }

  async updateJerseyNumber(
    memberId: string,
    jerseyNumber: number | null,
  ): Promise<void> {
    await this.db
      .update(teamMembers)
      .set({ jerseyNumber, updatedAt: Date.now() })
      .where(eq(teamMembers.id, memberId));
  }

  // Single member row with user data LEFT JOINed — works for both account and imported members.
  async findByIdWithUser(memberId: string): Promise<TeamMemberWithUser | null> {
    const result = await this.db.$client
      .prepare(
        `SELECT tm.id, tm.user_id AS userId, tm.team_id AS teamId,
                tm.email, tm.display_name AS displayName,
                tm.jersey_number AS jerseyNumber, tm.status,
                tm.date_of_birth AS dateOfBirth, tm.phone, tm.player_id AS playerId,
                tm.created_at AS createdAt, tm.updated_at AS updatedAt,
                u.name AS userName, u.image AS userImage
         FROM team_members tm
         LEFT JOIN user u ON u.id = tm.user_id
         WHERE tm.id = ?`,
      )
      .bind(memberId)
      .first<TeamMemberWithUser>();
    return result ?? null;
  }

  async findByEmailAndTeam(
    email: string,
    teamId: string,
  ): Promise<TeamMember | null> {
    const results = await this.db
      .select()
      .from(teamMembers)
      .where(
        and(eq(teamMembers.email, email), eq(teamMembers.teamId, teamId)),
      )
      .limit(1);
    return results[0] ?? null;
  }
}

// TeamMember row enriched with user profile data from the Better Auth user table.
// userName and userImage are null for pending_signup rows (no account yet).
// Use displayName as the fallback for pending_signup rows.
export interface TeamMemberWithUser extends TeamMember {
  userName: string | null;
  userImage: string | null;
}

// TeamMember row enriched with team data. Used by profile / my-teams views.
export interface TeamMemberWithTeam extends TeamMember {
  teamName: string;
  teamCity: string;
}
