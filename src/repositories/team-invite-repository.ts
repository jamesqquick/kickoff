import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db";
import { teamInvites } from "@/lib/schema";
import type { TeamInvite, NewTeamInvite } from "@/lib/schema";

// TeamInviteRepository — all database access for the team_invites table.
// No business logic, no HTTP, no Astro context.
// Receives a typed Drizzle instance via constructor injection.
export class TeamInviteRepository {
  constructor(private readonly db: AppDatabase) {}

  // Find an active invite by its token. Returns null for missing or revoked tokens.
  async findByToken(token: string): Promise<TeamInvite | null> {
    const results = await this.db
      .select()
      .from(teamInvites)
      .where(and(eq(teamInvites.token, token), eq(teamInvites.isActive, 1)))
      .limit(1);
    return results[0] ?? null;
  }

  // Find the currently active invite for a team. Returns null if none exists.
  async findActiveByTeam(teamId: string): Promise<TeamInvite | null> {
    const results = await this.db
      .select()
      .from(teamInvites)
      .where(and(eq(teamInvites.teamId, teamId), eq(teamInvites.isActive, 1)))
      .limit(1);
    return results[0] ?? null;
  }

  async insert(row: NewTeamInvite): Promise<TeamInvite> {
    const results = await this.db.insert(teamInvites).values(row).returning();
    return results[0];
  }

  // Revoke all active invites for a team (called before generating a fresh token).
  async deactivateByTeam(teamId: string): Promise<void> {
    await this.db
      .update(teamInvites)
      .set({ isActive: 0, updatedAt: Date.now() })
      .where(and(eq(teamInvites.teamId, teamId), eq(teamInvites.isActive, 1)));
  }
}
