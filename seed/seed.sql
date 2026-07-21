-- ============================================================
-- KICKOFF LOCAL SEED
-- Wipes all app + auth data and inserts representative test
-- fixtures. Run via: pnpm db:seed:local
--
-- Test password for ALL accounts: Test1234!
-- Hash algorithm: Node crypto.scrypt (used by @better-auth/utils)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Clear existing data (reverse dependency order)
-- ------------------------------------------------------------
DELETE FROM team_members;
DELETE FROM profiles;
DELETE FROM teams;
DELETE FROM tournaments;
DELETE FROM account;
DELETE FROM session;
DELETE FROM verification;
DELETE FROM "user";

-- ------------------------------------------------------------
-- 2. Users  (Better Auth `user` table — camelCase columns)
-- ------------------------------------------------------------
-- role 'admin' gets full admin access; 'player' is the default.
-- coach-a owns two teams; admin owns the rejected team.
INSERT INTO "user" (id, name, email, emailVerified, image, role, createdAt, updatedAt) VALUES
  ('usr_admin',   'Admin User',  'admin@kickoff.test',   1, NULL, 'admin',  1700000000000, 1700000000000),
  ('usr_coach_a', 'Alex Coach',  'coach-a@kickoff.test', 1, NULL, 'player', 1700000000000, 1700000000000),
  ('usr_player1', 'Player One',  'player1@kickoff.test', 1, NULL, 'player', 1700000000000, 1700000000000),
  ('usr_player2', 'Player Two',  'player2@kickoff.test', 1, NULL, 'player', 1700000000000, 1700000000000);

-- ------------------------------------------------------------
-- 3. Accounts  (Better Auth `account` table — camelCase columns)
-- Password = Test1234! hashed via @better-auth/utils hashPassword
-- (Node crypto.scrypt, format: <hex-salt>:<hex-key>)
-- ------------------------------------------------------------
INSERT INTO account (id, accountId, providerId, userId, password, createdAt, updatedAt) VALUES
  ('acc_admin',   'usr_admin',   'credential', 'usr_admin',   '2acdde16c0d5ce394e3f16d7df9880e7:7fcfbdfb5b6eb83c036d0f226e00770ac7387f3c834804bd8d9ac4dd3ebf3ec679fbe1097234943d15c954750240289ca32fe9c10495e52fb676978a8d9ae39e', 1700000000000, 1700000000000),
  ('acc_coach_a', 'usr_coach_a', 'credential', 'usr_coach_a', '2acdde16c0d5ce394e3f16d7df9880e7:7fcfbdfb5b6eb83c036d0f226e00770ac7387f3c834804bd8d9ac4dd3ebf3ec679fbe1097234943d15c954750240289ca32fe9c10495e52fb676978a8d9ae39e', 1700000000000, 1700000000000),
  ('acc_player1', 'usr_player1', 'credential', 'usr_player1', '2acdde16c0d5ce394e3f16d7df9880e7:7fcfbdfb5b6eb83c036d0f226e00770ac7387f3c834804bd8d9ac4dd3ebf3ec679fbe1097234943d15c954750240289ca32fe9c10495e52fb676978a8d9ae39e', 1700000000000, 1700000000000),
  ('acc_player2', 'usr_player2', 'credential', 'usr_player2', '2acdde16c0d5ce394e3f16d7df9880e7:7fcfbdfb5b6eb83c036d0f226e00770ac7387f3c834804bd8d9ac4dd3ebf3ec679fbe1097234943d15c954750240289ca32fe9c10495e52fb676978a8d9ae39e', 1700000000000, 1700000000000);

-- ------------------------------------------------------------
-- 4. Profiles  (Drizzle app table — snake_case columns)
-- Some fields intentionally left null to exercise nullable paths.
-- ------------------------------------------------------------
INSERT INTO profiles (id, user_id, phone, date_of_birth, address_city, address_state, created_at, updated_at) VALUES
  ('pro_admin',   'usr_admin',   '555-0100', '1985-03-15', 'Austin',  'TX', 1700000000000, 1700000000000),
  ('pro_coach_a', 'usr_coach_a', '555-0101', '1990-07-22', 'Dallas',  'TX', 1700000000000, 1700000000000),
  ('pro_player1', 'usr_player1', NULL,        NULL,         'Houston', 'TX', 1700000000000, 1700000000000),
  ('pro_player2', 'usr_player2', '555-0103', '2002-11-08', NULL,      NULL, 1700000000000, 1700000000000);

-- ------------------------------------------------------------
-- 5. Teams  (Drizzle app table — snake_case columns)
-- Covers all three status values: approved, pending, rejected.
-- ------------------------------------------------------------
INSERT INTO teams (id, name, city, division, coach_id, color, status, created_at, updated_at) VALUES
  ('team_a', 'River Hawks',  'Austin',  'Open', 'usr_coach_a', 'emerald', 'approved', 1700000000000, 1700000000000),
  ('team_b', 'Storm United', 'Dallas',  'Open', 'usr_coach_a', 'blue',    'pending',  1700000000000, 1700000000000),
  ('team_c', 'Ghost FC',     'Houston', 'Open', 'usr_admin',   'red',     'rejected', 1700000000000, 1700000000000);

-- ------------------------------------------------------------
-- 6. Team Members  (Drizzle app table — snake_case columns)
-- Covers all three membership statuses across multiple teams.
-- ------------------------------------------------------------
INSERT INTO team_members (id, user_id, team_id, jersey_number, status, created_at, updated_at) VALUES
  ('tm_1', 'usr_player1', 'team_a', 7,    'approved', 1700000000000, 1700000000000),
  ('tm_2', 'usr_player2', 'team_a', NULL, 'pending',  1700000000000, 1700000000000),
  ('tm_3', 'usr_player1', 'team_b', NULL, 'pending',  1700000000000, 1700000000000),
  ('tm_4', 'usr_player2', 'team_b', NULL, 'rejected', 1700000000000, 1700000000000),
  ('tm_5', 'usr_player1', 'team_c', 99,   'approved', 1700000000000, 1700000000000);

-- ------------------------------------------------------------
-- 7. Tournaments  (Drizzle app table — snake_case columns)
-- Covers all three derived statuses: past, active, upcoming.
-- ------------------------------------------------------------
INSERT INTO tournaments (id, name, slug, start_date, end_date, created_at, updated_at) VALUES
  ('tour_past',     'Spring Invitational 2025', 'spring-invitational-2025', '2025-03-01', '2025-03-15', 1700000000000, 1700000000000),
  ('tour_active',   'Summer Classic 2026',      'summer-classic-2026',      '2026-06-01', '2026-08-31', 1700000000000, 1700000000000),
  ('tour_upcoming', 'Fall Championship 2026',   'fall-championship-2026',   '2026-12-01', '2026-12-20', 1700000000000, 1700000000000);
