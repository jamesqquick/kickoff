import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db";
import { profiles } from "@/lib/schema";
import type { NewProfile, Profile } from "@/lib/schema";

// ProfileRepository — all database access for the profiles table.
// No business logic, no HTTP, no Astro context.
// Receives a typed Drizzle instance via constructor injection.
export class ProfileRepository {
  constructor(private readonly db: AppDatabase) {}

  async findByUserId(userId: string): Promise<Profile | undefined> {
    const rows = await this.db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);
    return rows[0];
  }

  // Insert or update — keyed on the unique userId constraint.
  async upsert(row: NewProfile): Promise<Profile> {
    const rows = await this.db
      .insert(profiles)
      .values(row)
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          phone: row.phone,
          dateOfBirth: row.dateOfBirth,
          addressStreet: row.addressStreet,
          addressApt: row.addressApt,
          addressCity: row.addressCity,
          addressState: row.addressState,
          addressZip: row.addressZip,
          addressCountry: row.addressCountry,
          updatedAt: row.updatedAt,
        },
      })
      .returning();
    return rows[0];
  }
}
