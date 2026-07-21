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
  color: text("color").notNull().default("emerald"), // crest color key, e.g. "emerald"
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

// teamMembers — join table linking users directly to teams.
// Replaces the old players + player_teams two-hop design.
// Any authenticated user can be a member of any team; the team owner
// (teams.coach_id) determines who has management permissions.
export const teamMembers = sqliteTable(
  "team_members",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),   // FK → user.id (enforced at app level)
    teamId: text("team_id").notNull(),   // FK → teams.id
    jerseyNumber: int("jersey_number"),  // nullable — assigned later
    status: text("status", { enum: ["pending", "approved", "rejected"] })
      .notNull()
      .default("pending"),
    createdAt: int("created_at").notNull(),
    updatedAt: int("updated_at").notNull(),
  },
  (t) => [unique().on(t.userId, t.teamId)],
);

export type TeamMember = InferSelectModel<typeof teamMembers>;
export type NewTeamMember = InferInsertModel<typeof teamMembers>;

// profiles — extended contact info, 1:1 with the Better Auth user.
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
