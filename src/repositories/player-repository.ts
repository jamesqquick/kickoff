import { eq, sql } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db";
import { players } from "@/lib/schema";
import type { NewPlayer, Player } from "@/lib/schema";

// PlayerRepository — all database access for the players table.
// No business logic, no HTTP, no Astro context.
// Receives a typed Drizzle instance via constructor injection.
export class PlayerRepository {
  constructor(private readonly db: AppDatabase) {}

  async list(): Promise<Player[]> {
    return this.db.select().from(players).all();
  }

  async findById(id: string): Promise<Player | undefined> {
    const results = await this.db
      .select()
      .from(players)
      .where(eq(players.id, id))
      .limit(1);
    return results[0];
  }

  async findByUserId(userId: string): Promise<Player | undefined> {
    const results = await this.db
      .select()
      .from(players)
      .where(eq(players.userId, userId))
      .limit(1);
    return results[0];
  }

  async insert(row: NewPlayer): Promise<Player> {
    const results = await this.db.insert(players).values(row).returning();
    return results[0];
  }

  // Joins players with the Better Auth user table to enrich rows with
  // profile data (name, image). Uses a raw SQL query via db.$client since
  // the user table is owned by Better Auth and not in the Drizzle schema.
  async listWithProfile(): Promise<PlayerProfile[]> {
    const result = await this.db.$client
      .prepare(
        `SELECT p.id, p.user_id AS userId, p.created_at AS createdAt, p.updated_at AS updatedAt,
                u.name, u.image
         FROM players p
         JOIN user u ON u.id = p.user_id`,
      )
      .all<PlayerProfile>();
    return result.results;
  }

  async findByIdWithProfile(id: string): Promise<PlayerProfile | undefined> {
    const result = await this.db.$client
      .prepare(
        `SELECT p.id, p.user_id AS userId, p.created_at AS createdAt, p.updated_at AS updatedAt,
                u.name, u.image
         FROM players p
         JOIN user u ON u.id = p.user_id
         WHERE p.id = ?`,
      )
      .bind(id)
      .first<PlayerProfile>();
    return result ?? undefined;
  }
}

// Player row enriched with the user profile from the Better Auth user table.
// Used by pages for display; never persisted.
export interface PlayerProfile extends Player {
  name: string;
  image: string | null;
}
