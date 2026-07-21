import { eq } from "drizzle-orm";
import type { TeamStatus } from "@/lib/schema";
import type { AppDatabase } from "@/lib/db";
import { teams } from "@/lib/schema";
import type { NewTeam, Team } from "@/lib/schema";

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

  async listApproved(): Promise<Team[]> {
    return this.db
      .select()
      .from(teams)
      .where(eq(teams.status, "approved" as TeamStatus));
  }

  async listPending(): Promise<Team[]> {
    return this.db
      .select()
      .from(teams)
      .where(eq(teams.status, "pending" as TeamStatus));
  }

  async updateStatus(id: string, status: TeamStatus): Promise<Team> {
    const results = await this.db
      .update(teams)
      .set({ status, updatedAt: Date.now() })
      .where(eq(teams.id, id))
      .returning();
    return results[0];
  }

  async update(id: string, fields: { name: string; city: string; division: string; color: string }): Promise<Team> {
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
