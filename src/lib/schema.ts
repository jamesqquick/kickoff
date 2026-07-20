import { int, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
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

// players — thin domain anchor. Profile data (name, image) lives in the
// Better Auth `user` table, not here. One row per user account.
export const players = sqliteTable("players", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(), // FK → user.id (enforced at app level)
  createdAt: int("created_at").notNull(),
  updatedAt: int("updated_at").notNull(),
});

export type Player = InferSelectModel<typeof players>;
export type NewPlayer = InferInsertModel<typeof players>;

// playerTeams — stub for the future roster slice. No service or actions yet;
// the table exists so FKs between players and teams stay in Drizzle-owned tables.
export const playerTeams = sqliteTable(
  "player_teams",
  {
    id: text("id").primaryKey(),
    playerId: text("player_id").notNull(), // FK → players.id
    teamId: text("team_id").notNull(), // FK → teams.id
    createdAt: int("created_at").notNull(),
    updatedAt: int("updated_at").notNull(),
  },
  (t) => [unique().on(t.playerId, t.teamId)],
);

export type PlayerTeam = InferSelectModel<typeof playerTeams>;
export type NewPlayerTeam = InferInsertModel<typeof playerTeams>;

// profiles — extended player contact info, 1:1 with the Better Auth user.
// Stored separately so auth and domain data stay in distinct tables.
export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(), // FK → user.id (enforced at app level)
  phone: text("phone"),
  dateOfBirth: text("date_of_birth"), // ISO date string YYYY-MM-DD, nullable
  addressStreet: text("address_street"),
  addressApt: text("address_apt"),
  addressCity: text("address_city"),
  addressState: text("address_state"),
  addressZip: text("address_zip"),
  addressCountry: text("address_country"),
  createdAt: int("created_at").notNull(),
  updatedAt: int("updated_at").notNull(),
});

export type Profile = InferSelectModel<typeof profiles>;
export type NewProfile = InferInsertModel<typeof profiles>;
