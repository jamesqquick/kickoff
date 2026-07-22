import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db";
import { teams } from "@/lib/schema";
import type { NewTeam, Team } from "@/lib/schema";

// Team row enriched with the coach's display name from the Better Auth user table.
// The user table is intentionally absent from the Drizzle schema; we use raw SQL.
export interface TeamWithCoach extends Team {
  coachName: string;
}

// TeamRepository — all database access for the teams table.
// No business logic, no HTTP, no Astro context.
// Receives a typed Drizzle instance via constructor injection.
export class TeamRepository {
  constructor(private readonly db: AppDatabase) {}

  async list(): Promise<Team[]> {
    return this.db.select().from(teams).all();
  }

  async findById(id: string): Promise<Team | undefined> {
    const results = await this.db
      .select()
      .from(teams)
      .where(eq(teams.id, id))
      .limit(1);
    return results[0];
  }

  // JOINs the Better Auth `user` table (not in Drizzle schema) to resolve the coach's name.
  // Uses the same raw SQL pattern as TeamMemberRepository.listByTeam.
  async findByIdWithCoach(id: string): Promise<TeamWithCoach | undefined> {
    const result = await this.db.$client
      .prepare(
        `SELECT t.id, t.name, t.city, t.coach_id AS coachId,
                t.color, t.short_name AS shortName,
                t.created_at AS createdAt, t.updated_at AS updatedAt,
                u.name AS coachName
         FROM teams t
         JOIN user u ON u.id = t.coach_id
         WHERE t.id = ?
         LIMIT 1`,
      )
      .bind(id)
      .all<TeamWithCoach>();
    return result.results[0];
  }

  // JOINs the Better Auth `user` table for all teams to resolve each coach's name.
  // Uses the same raw SQL pattern as findByIdWithCoach.
  async listAllWithCoach(): Promise<TeamWithCoach[]> {
    const result = await this.db.$client
      .prepare(
        `SELECT t.id, t.name, t.city, t.coach_id AS coachId,
                t.color, t.short_name AS shortName,
                t.created_at AS createdAt, t.updated_at AS updatedAt,
                u.name AS coachName
         FROM teams t
         JOIN user u ON u.id = t.coach_id`,
      )
      .all<TeamWithCoach>();
    return result.results;
  }

  // All teams where the given user is the coach.
  // Used by My Teams to show the coach their own teams.
  async listByCoach(userId: string): Promise<Team[]> {
    return this.db
      .select()
      .from(teams)
      .where(eq(teams.coachId, userId));
  }

  async update(id: string, fields: { name: string; city: string; color: string; shortName?: string | null }): Promise<Team> {
    const results = await this.db
      .update(teams)
      .set({ ...fields, updatedAt: Date.now() })
      .where(eq(teams.id, id))
      .returning();
    return results[0];
  }

  async insert(row: NewTeam): Promise<Team> {
    const results = await this.db.insert(teams).values(row).returning();
    return results[0];
  }
}
