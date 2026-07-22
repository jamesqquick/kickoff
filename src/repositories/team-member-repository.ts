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
  ): Promise<TeamMember[]> {
    if (rows.length === 0) return [];
    const now = Date.now();
    const values = rows.map((r) => ({
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
    }));
    // D1 batch: insert in one round-trip
    return await this.db.insert(teamMembers).values(values).returning();
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
                t.name AS teamName, t.city AS teamCity,
                t.status AS teamStatus
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

  // Count of confirmed teams for a user: approved coached teams UNION approved memberships.
  // Used by the sidebar badge. UNION deduplicates if a coach is also a member row.
  async countConfirmedForUser(userId: string): Promise<number> {
    const result = await this.db.$client
      .prepare(
        `SELECT COUNT(*) AS cnt FROM (
           SELECT t.id FROM teams t WHERE t.coach_id = ? AND t.status = 'approved'
           UNION
           SELECT tm.team_id FROM team_members tm
           JOIN teams t ON t.id = tm.team_id
           WHERE tm.user_id = ? AND tm.status = 'approved' AND t.status = 'approved'
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
  teamStatus: string;
}
