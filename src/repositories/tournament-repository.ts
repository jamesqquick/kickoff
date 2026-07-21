import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db";
import { tournaments } from "@/lib/schema";
import type { NewTournament, Tournament } from "@/lib/schema";

export class TournamentRepository {
  constructor(private readonly db: AppDatabase) {}

  async list(): Promise<Tournament[]> {
    return this.db.select().from(tournaments).all();
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
    fields: Partial<Pick<Tournament, "name" | "slug" | "status" | "startDate" | "endDate">>,
  ): Promise<Tournament> {
    const results = await this.db
      .update(tournaments)
      .set({ ...fields, updatedAt: Date.now() })
      .where(eq(tournaments.id, id))
      .returning();
    return results[0];
  }
}
