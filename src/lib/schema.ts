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
  shortName: text("short_name"), // crest initials, e.g. "FC" — nullable; display falls back to name slice
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

export const tournaments = sqliteTable("tournaments", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // URL-safe, e.g. 'spring-invitational-2026'
  startDate: text("start_date"), // ISO date YYYY-MM-DD, nullable until set
  endDate: text("end_date"),
  createdAt: int("created_at").notNull(),
  updatedAt: int("updated_at").notNull(),
});

export type Tournament = InferSelectModel<typeof tournaments>;
export type NewTournament = InferInsertModel<typeof tournaments>;

// teamInvites — one persistent invite link per team, shared by coaches with players.
// Joining via an invite link auto-approves membership (no pending → approval flow).
// Regenerating deactivates the old token (is_active = 0) and creates a fresh one.
export const teamInvites = sqliteTable("team_invites", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull(),      // FK → teams.id (app-level)
  token: text("token").notNull().unique(), // 24-char URL-safe random string
  createdBy: text("created_by").notNull(), // FK → user.id (the coach who generated it)
  isActive: int("is_active").notNull().default(1), // 1 = usable, 0 = revoked
  createdAt: int("created_at").notNull(),
  updatedAt: int("updated_at").notNull(),
});

export type TeamInvite = InferSelectModel<typeof teamInvites>;
export type NewTeamInvite = InferInsertModel<typeof teamInvites>;
