import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db";
import { divisions } from "@/lib/schema";
import type { Division, NewDivision } from "@/lib/schema";

export class DivisionRepository {
  constructor(private readonly db: AppDatabase) {}

  async listByTournament(tournamentId: string): Promise<Division[]> {
    return this.db
      .select()
      .from(divisions)
      .where(eq(divisions.tournamentId, tournamentId))
      .all();
  }

  async findById(id: string): Promise<Division | undefined> {
    const results = await this.db
      .select()
      .from(divisions)
      .where(eq(divisions.id, id))
      .limit(1);
    return results[0];
  }

  async insert(row: NewDivision): Promise<Division> {
    const results = await this.db.insert(divisions).values(row).returning();
    return results[0];
  }

  async update(
    id: string,
    fields: Partial<Pick<Division, "name" | "maxTeams">>,
  ): Promise<Division> {
    const results = await this.db
      .update(divisions)
      .set({ ...fields, updatedAt: Date.now() })
      .where(eq(divisions.id, id))
      .returning();
    return results[0];
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(divisions).where(eq(divisions.id, id));
  }
}
