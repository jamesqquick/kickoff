import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

// App-owned tables only. Better Auth owns `user`, `session`, `account`,
// `verification` — those are managed via kysely-d1 and must NOT appear here
// or drizzle-kit will attempt to diff/drop them.

export const teams = sqliteTable("teams", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  division: text("division").notNull(),
  coachId: text("coach_id").notNull(), // FK → user.id (enforced at app level)
  status: text("status", { enum: ["pending", "approved", "rejected"] })
    .notNull()
    .default("pending"),
  createdAt: int("created_at").notNull(),
  updatedAt: int("updated_at").notNull(),
});

// Row types — single source of truth for domain types derived from the schema.
// Never duplicate these as manual TypeScript interfaces.
export type Team = InferSelectModel<typeof teams>;
export type NewTeam = InferInsertModel<typeof teams>;
export type TeamStatus = Team["status"];
