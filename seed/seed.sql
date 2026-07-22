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
DELETE FROM tournament_registrations;
DELETE FROM divisions;
DELETE FROM team_invites;
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
-- Roles: 'admin' = platform superuser, 'referee' = match official, 'player' = default
INSERT INTO "user" (id, name, email, emailVerified, image, role, createdAt, updatedAt) VALUES
  -- Admin: full platform access, also owns a rejected team + joined two others
  ('usr_admin',    'Admin User',    'admin@kickoff.test',    1, NULL, 'admin',   1700000000000, 1700000000000),
  -- Coaches: each owns 2 teams across different statuses
  ('usr_coach_a',  'Alex Coach',    'coach-a@kickoff.test',  1, NULL, 'player',  1700000000000, 1700000000000),
  ('usr_coach_b',  'Blake Torres',  'coach-b@kickoff.test',  1, NULL, 'player',  1700000000000, 1700000000000),
  -- coach-c owns only pending/rejected teams — Created section, Joined empty state
  ('usr_coach_c',  'Casey Rivera',  'coach-c@kickoff.test',  1, NULL, 'player',  1700000000000, 1700000000000),
  -- coach-d owns two approved teams and also plays on a team they don't own
  ('usr_coach_d',  'Drew Mitchell', 'coach-d@kickoff.test',  1, NULL, 'player',  1700000000000, 1700000000000),
  -- Players: varied membership patterns
  ('usr_player1',  'Jordan Lee',    'player1@kickoff.test',  1, NULL, 'player',  1700000000000, 1700000000000),
  ('usr_player2',  'Morgan Kim',    'player2@kickoff.test',  1, NULL, 'player',  1700000000000, 1700000000000),
  -- player3: mix of approved / pending / rejected memberships across many teams
  ('usr_player3',  'Riley Patel',   'player3@kickoff.test',  1, NULL, 'player',  1700000000000, 1700000000000),
  -- player4: every membership is rejected — exercises the all-denied edge case
  ('usr_player4',  'Sam Cruz',      'player4@kickoff.test',  1, NULL, 'player',  1700000000000, 1700000000000),
  -- player5: all approved, member of many teams — exercises a full, active roster
  ('usr_player5',  'Taylor Brooks', 'player5@kickoff.test',  1, NULL, 'player',  1700000000000, 1700000000000),
  -- referee: role-only account, no team involvement
  ('usr_referee',  'Chris Ref',     'referee@kickoff.test',  1, NULL, 'referee', 1700000000000, 1700000000000),
  -- newbie: no teams created, no memberships → global empty state on My Teams
  ('usr_newbie',   'New Player',    'newbie@kickoff.test',   1, NULL, 'player',  1700000000000, 1700000000000);

-- ------------------------------------------------------------
-- 3. Accounts  (Better Auth `account` table — camelCase columns)
-- Password = Test1234! hashed via @better-auth/utils hashPassword
-- (Node crypto.scrypt, format: <hex-salt>:<hex-key>)
-- ------------------------------------------------------------
INSERT INTO account (id, accountId, providerId, userId, password, createdAt, updatedAt) VALUES
  ('acc_admin',   'usr_admin',   'credential', 'usr_admin',   '2acdde16c0d5ce394e3f16d7df9880e7:7fcfbdfb5b6eb83c036d0f226e00770ac7387f3c834804bd8d9ac4dd3ebf3ec679fbe1097234943d15c954750240289ca32fe9c10495e52fb676978a8d9ae39e', 1700000000000, 1700000000000),
  ('acc_coach_a', 'usr_coach_a', 'credential', 'usr_coach_a', '2acdde16c0d5ce394e3f16d7df9880e7:7fcfbdfb5b6eb83c036d0f226e00770ac7387f3c834804bd8d9ac4dd3ebf3ec679fbe1097234943d15c954750240289ca32fe9c10495e52fb676978a8d9ae39e', 1700000000000, 1700000000000),
  ('acc_coach_b', 'usr_coach_b', 'credential', 'usr_coach_b', '2acdde16c0d5ce394e3f16d7df9880e7:7fcfbdfb5b6eb83c036d0f226e00770ac7387f3c834804bd8d9ac4dd3ebf3ec679fbe1097234943d15c954750240289ca32fe9c10495e52fb676978a8d9ae39e', 1700000000000, 1700000000000),
  ('acc_coach_c', 'usr_coach_c', 'credential', 'usr_coach_c', '2acdde16c0d5ce394e3f16d7df9880e7:7fcfbdfb5b6eb83c036d0f226e00770ac7387f3c834804bd8d9ac4dd3ebf3ec679fbe1097234943d15c954750240289ca32fe9c10495e52fb676978a8d9ae39e', 1700000000000, 1700000000000),
  ('acc_coach_d', 'usr_coach_d', 'credential', 'usr_coach_d', '2acdde16c0d5ce394e3f16d7df9880e7:7fcfbdfb5b6eb83c036d0f226e00770ac7387f3c834804bd8d9ac4dd3ebf3ec679fbe1097234943d15c954750240289ca32fe9c10495e52fb676978a8d9ae39e', 1700000000000, 1700000000000),
  ('acc_player1', 'usr_player1', 'credential', 'usr_player1', '2acdde16c0d5ce394e3f16d7df9880e7:7fcfbdfb5b6eb83c036d0f226e00770ac7387f3c834804bd8d9ac4dd3ebf3ec679fbe1097234943d15c954750240289ca32fe9c10495e52fb676978a8d9ae39e', 1700000000000, 1700000000000),
  ('acc_player2', 'usr_player2', 'credential', 'usr_player2', '2acdde16c0d5ce394e3f16d7df9880e7:7fcfbdfb5b6eb83c036d0f226e00770ac7387f3c834804bd8d9ac4dd3ebf3ec679fbe1097234943d15c954750240289ca32fe9c10495e52fb676978a8d9ae39e', 1700000000000, 1700000000000),
  ('acc_player3', 'usr_player3', 'credential', 'usr_player3', '2acdde16c0d5ce394e3f16d7df9880e7:7fcfbdfb5b6eb83c036d0f226e00770ac7387f3c834804bd8d9ac4dd3ebf3ec679fbe1097234943d15c954750240289ca32fe9c10495e52fb676978a8d9ae39e', 1700000000000, 1700000000000),
  ('acc_player4', 'usr_player4', 'credential', 'usr_player4', '2acdde16c0d5ce394e3f16d7df9880e7:7fcfbdfb5b6eb83c036d0f226e00770ac7387f3c834804bd8d9ac4dd3ebf3ec679fbe1097234943d15c954750240289ca32fe9c10495e52fb676978a8d9ae39e', 1700000000000, 1700000000000),
  ('acc_player5', 'usr_player5', 'credential', 'usr_player5', '2acdde16c0d5ce394e3f16d7df9880e7:7fcfbdfb5b6eb83c036d0f226e00770ac7387f3c834804bd8d9ac4dd3ebf3ec679fbe1097234943d15c954750240289ca32fe9c10495e52fb676978a8d9ae39e', 1700000000000, 1700000000000),
  ('acc_referee', 'usr_referee', 'credential', 'usr_referee', '2acdde16c0d5ce394e3f16d7df9880e7:7fcfbdfb5b6eb83c036d0f226e00770ac7387f3c834804bd8d9ac4dd3ebf3ec679fbe1097234943d15c954750240289ca32fe9c10495e52fb676978a8d9ae39e', 1700000000000, 1700000000000),
  ('acc_newbie',  'usr_newbie',  'credential', 'usr_newbie',  '2acdde16c0d5ce394e3f16d7df9880e7:7fcfbdfb5b6eb83c036d0f226e00770ac7387f3c834804bd8d9ac4dd3ebf3ec679fbe1097234943d15c954750240289ca32fe9c10495e52fb676978a8d9ae39e', 1700000000000, 1700000000000);

-- ------------------------------------------------------------
-- 4. Profiles  (Drizzle app table — snake_case columns)
-- Some fields intentionally null to exercise nullable paths.
-- ------------------------------------------------------------
INSERT INTO profiles (id, user_id, phone, date_of_birth, address_city, address_state, created_at, updated_at) VALUES
  ('pro_admin',   'usr_admin',   '555-0100', '1985-03-15', 'Austin',      'TX', 1700000000000, 1700000000000),
  ('pro_coach_a', 'usr_coach_a', '555-0101', '1990-07-22', 'Dallas',      'TX', 1700000000000, 1700000000000),
  ('pro_coach_b', 'usr_coach_b', '555-0102', '1988-11-05', 'San Diego',   'CA', 1700000000000, 1700000000000),
  ('pro_coach_c', 'usr_coach_c', '555-0103', '1992-04-18', 'Phoenix',     'AZ', 1700000000000, 1700000000000),
  ('pro_coach_d', 'usr_coach_d', '555-0104', '1987-09-30', 'Chicago',     'IL', 1700000000000, 1700000000000),
  ('pro_player1', 'usr_player1', NULL,        NULL,         'Houston',     'TX', 1700000000000, 1700000000000),
  ('pro_player2', 'usr_player2', '555-0106', '2002-11-08', NULL,          NULL, 1700000000000, 1700000000000),
  ('pro_player3', 'usr_player3', '555-0107', '1998-06-14', 'Los Angeles', 'CA', 1700000000000, 1700000000000),
  ('pro_player4', 'usr_player4', NULL,        NULL,         'Miami',       'FL', 1700000000000, 1700000000000),
  ('pro_player5', 'usr_player5', '555-0109', '1995-02-27', 'Seattle',     'WA', 1700000000000, 1700000000000),
  ('pro_referee', 'usr_referee', '555-0110', '1983-08-12', 'Denver',      'CO', 1700000000000, 1700000000000),
  ('pro_newbie',  'usr_newbie',  NULL,        NULL,         NULL,          NULL, 1700000000000, 1700000000000);

-- ------------------------------------------------------------
-- 5. Teams  (Drizzle app table — snake_case columns)
-- 9 teams across various cities. No global status — approval
-- happens at the tournament_registrations level.
-- short_name set where a recognizable abbreviation fits.
-- ------------------------------------------------------------
INSERT INTO teams (id, name, short_name, city, coach_id, color, created_at, updated_at) VALUES
  -- coach_a teams
  ('team_a', 'River Hawks',     'RH',   'Austin',     'usr_coach_a', 'emerald', 1700000000000, 1700000000000),
  ('team_b', 'Storm United',    'SU',   'Dallas',     'usr_coach_a', 'blue',    1700000000000, 1700000000000),
  -- admin team
  ('team_c', 'Ghost FC',        'GFC',  'Houston',    'usr_admin',   'red',     1700000000000, 1700000000000),
  -- coach_b teams
  ('team_d', 'Coastal FC',      'CFC',  'San Diego',  'usr_coach_b', 'sky',     1700000000000, 1700000000000),
  ('team_e', 'Iron City United','ICU',  'Pittsburgh', 'usr_coach_b', 'orange',  1700000000000, 1700000000000),
  -- coach_c teams
  ('team_f', 'Desert Wolves',   'DW',   'Phoenix',    'usr_coach_c', 'amber',   1700000000000, 1700000000000),
  ('team_i', 'Red Canyon AC',   'RCAC', 'Denver',     'usr_coach_c', 'rose',    1700000000000, 1700000000000),
  -- coach_d teams
  ('team_g', 'Northside FC',    'NFC',  'Chicago',    'usr_coach_d', 'violet',  1700000000000, 1700000000000),
  ('team_h', 'Silver Arrows',   'SA',   'Seattle',    'usr_coach_d', 'slate',   1700000000000, 1700000000000);

-- ------------------------------------------------------------
-- 6. Team Members  (Drizzle app table — snake_case columns)
-- 28 rows covering every combination of role × membership status.
-- ------------------------------------------------------------
INSERT INTO team_members (id, user_id, team_id, jersey_number, status, created_at, updated_at) VALUES

  -- ── Admin: owns Ghost FC + joined two teams → both sections visible ──
  ('tm_01', 'usr_admin',   'team_a', NULL, 'approved', 1700000000000, 1700000000000),
  ('tm_02', 'usr_admin',   'team_g', NULL, 'approved', 1700000000000, 1700000000000),

  -- ── coach-a: owns River Hawks + Storm United, joined one rejected + one approved ──
  ('tm_03', 'usr_coach_a', 'team_c', NULL, 'pending',  1700000000000, 1700000000000),
  ('tm_04', 'usr_coach_a', 'team_g', 10,   'approved', 1700000000000, 1700000000000),

  -- ── coach-b: owns Coastal FC + Iron City, plays on two teams they don't own ──
  ('tm_05', 'usr_coach_b', 'team_a', 22,   'approved', 1700000000000, 1700000000000),
  ('tm_06', 'usr_coach_b', 'team_g', NULL, 'pending',  1700000000000, 1700000000000),

  -- ── coach-c: owns Desert Wolves (pending) + Red Canyon (rejected), no memberships ──
  -- (no rows — exercises Created-only / Joined empty-state path)

  -- ── coach-d: owns Northside FC + Silver Arrows, also plays on Iron City ──
  ('tm_07', 'usr_coach_d', 'team_e', 5,    'approved', 1700000000000, 1700000000000),

  -- ── player1 (Jordan Lee): approved on several teams, pending on one ──
  ('tm_08', 'usr_player1', 'team_a', 7,    'approved', 1700000000000, 1700000000000),
  ('tm_09', 'usr_player1', 'team_b', NULL, 'pending',  1700000000000, 1700000000000),
  ('tm_10', 'usr_player1', 'team_c', 99,   'approved', 1700000000000, 1700000000000),
  ('tm_11', 'usr_player1', 'team_d', 11,   'approved', 1700000000000, 1700000000000),
  ('tm_12', 'usr_player1', 'team_g', NULL, 'approved', 1700000000000, 1700000000000),

  -- ── player2 (Morgan Kim): mix of pending / rejected / one approved ──
  ('tm_13', 'usr_player2', 'team_a', NULL, 'pending',  1700000000000, 1700000000000),
  ('tm_14', 'usr_player2', 'team_b', NULL, 'rejected', 1700000000000, 1700000000000),
  ('tm_15', 'usr_player2', 'team_e', 3,    'approved', 1700000000000, 1700000000000),

  -- ── player3 (Riley Patel): all statuses across five teams ──
  ('tm_16', 'usr_player3', 'team_d', 8,    'approved', 1700000000000, 1700000000000),
  ('tm_17', 'usr_player3', 'team_e', NULL, 'approved', 1700000000000, 1700000000000),
  ('tm_18', 'usr_player3', 'team_f', NULL, 'pending',  1700000000000, 1700000000000),
  ('tm_19', 'usr_player3', 'team_g', NULL, 'rejected', 1700000000000, 1700000000000),
  ('tm_20', 'usr_player3', 'team_h', 14,   'pending',  1700000000000, 1700000000000),

  -- ── player4 (Sam Cruz): every membership rejected — all-denied edge case ──
  ('tm_21', 'usr_player4', 'team_a', NULL, 'rejected', 1700000000000, 1700000000000),
  ('tm_22', 'usr_player4', 'team_d', NULL, 'rejected', 1700000000000, 1700000000000),
  ('tm_23', 'usr_player4', 'team_g', NULL, 'rejected', 1700000000000, 1700000000000),

  -- ── player5 (Taylor Brooks): all approved, active on five teams ──
  ('tm_24', 'usr_player5', 'team_a', 9,    'approved', 1700000000000, 1700000000000),
  ('tm_25', 'usr_player5', 'team_d', 9,    'approved', 1700000000000, 1700000000000),
  ('tm_26', 'usr_player5', 'team_e', 9,    'approved', 1700000000000, 1700000000000),
  ('tm_27', 'usr_player5', 'team_g', 9,    'approved', 1700000000000, 1700000000000),
  ('tm_28', 'usr_player5', 'team_h', 9,    'approved', 1700000000000, 1700000000000);

  -- referee and newbie have no team_members rows by design

-- ------------------------------------------------------------
-- 7. Team Invites  (Drizzle app table — snake_case columns)
-- One active invite per approved team. Pending/rejected teams have none.
-- Tokens are fixed strings for test predictability.
-- ------------------------------------------------------------
INSERT INTO team_invites (id, team_id, token, created_by, is_active, created_at, updated_at) VALUES
  ('inv_team_a', 'team_a', 'seed_token_river_hawks_xxxxx', 'usr_coach_a', 1, 1700000000000, 1700000000000),
  ('inv_team_d', 'team_d', 'seed_token_coastal_fc_xxxxxx', 'usr_coach_b', 1, 1700000000000, 1700000000000),
  ('inv_team_e', 'team_e', 'seed_token_iron_city_xxxxxxx', 'usr_coach_b', 1, 1700000000000, 1700000000000),
  ('inv_team_g', 'team_g', 'seed_token_northside_fc_xxxx', 'usr_coach_d', 1, 1700000000000, 1700000000000),
  ('inv_team_h', 'team_h', 'seed_token_silver_arrows_xxx', 'usr_coach_d', 1, 1700000000000, 1700000000000);

-- ------------------------------------------------------------
-- 8. Tournaments  (Drizzle app table — snake_case columns)
-- 9 tournaments covering past / active / upcoming across divisions.
-- ------------------------------------------------------------
INSERT INTO tournaments (id, name, slug, start_date, end_date, registration_deadline, location, description, created_at, updated_at) VALUES
  ('tour_1', 'Winter Cup 2024',             'winter-cup-2024',             '2024-01-15', '2024-01-28', NULL,         NULL,                     NULL,                                              1700000000000, 1700000000000),
  ('tour_2', 'Spring Invitational 2025',    'spring-invitational-2025',    '2025-03-01', '2025-03-15', NULL,         NULL,                     NULL,                                              1700000000000, 1700000000000),
  ('tour_3', 'Pacific Coast Cup 2025',      'pacific-coast-cup-2025',      '2025-08-10', '2025-08-24', NULL,         'San Diego Sports Park',  NULL,                                              1700000000000, 1700000000000),
  ('tour_4', 'Regional Qualifiers 2026',    'regional-qualifiers-2026',    '2026-04-05', '2026-04-12', '2026-03-20', 'Austin FC Stadium',      'Regional qualifier for the state championship.', 1700000000000, 1700000000000),
  ('tour_5', 'Summer Classic 2026',         'summer-classic-2026',         '2026-06-01', '2026-08-31', '2026-05-15', 'Zilker Park Fields',     'Open summer league across all age groups.',      1700000000000, 1700000000000),
  ('tour_6', 'Open State Championship 2026','open-state-championship-2026','2026-07-01', '2026-07-20', '2026-06-15', 'Round Rock Multiplex',   NULL,                                              1700000000000, 1700000000000),
  ('tour_7', 'Fall Championship 2026',      'fall-championship-2026',      '2026-12-01', '2026-12-20', '2026-11-01', NULL,                     NULL,                                              1700000000000, 1700000000000),
  ('tour_8', 'Youth Invitational 2027',     'youth-invitational-2027',     '2027-02-14', '2027-02-21', '2027-01-31', 'Cedar Park Center',      'Annual youth invitational for U12–U18 divisions.',1700000000000, 1700000000000),
  ('tour_9', 'Masters League Spring 2027',  'masters-league-spring-2027',  '2027-04-01', '2027-04-30', '2027-03-15', NULL,                     NULL,                                              1700000000000, 1700000000000);

-- ------------------------------------------------------------
-- 8. Divisions  (per-tournament competitive brackets)
-- ------------------------------------------------------------
INSERT INTO divisions (id, tournament_id, name, max_teams, created_at, updated_at) VALUES
  -- Winter Cup 2024 (tour_1) — past
  ('div_1a', 'tour_1', 'Open Men''s',    16, 1700000000000, 1700000000000),
  ('div_1b', 'tour_1', 'Open Women''s',  16, 1700000000000, 1700000000000),

  -- Spring Invitational 2025 (tour_2) — past
  ('div_2a', 'tour_2', 'Open Men''s',    NULL, 1700000000000, 1700000000000),
  ('div_2b', 'tour_2', 'Open Women''s',  NULL, 1700000000000, 1700000000000),
  ('div_2c', 'tour_2', 'U18 Boys',       12,   1700000000000, 1700000000000),

  -- Pacific Coast Cup 2025 (tour_3) — past
  ('div_3a', 'tour_3', 'Open Men''s',    16, 1700000000000, 1700000000000),
  ('div_3b', 'tour_3', 'Open Women''s',  16, 1700000000000, 1700000000000),
  ('div_3c', 'tour_3', 'U18 Boys',       NULL, 1700000000000, 1700000000000),

  -- Regional Qualifiers 2026 (tour_4) — three divisions
  ('div_4a', 'tour_4', 'Open Men''s',    16, 1700000000000, 1700000000000),
  ('div_4b', 'tour_4', 'Open Women''s',  16, 1700000000000, 1700000000000),
  ('div_4c', 'tour_4', 'U18 Boys',       NULL, 1700000000000, 1700000000000),

  -- Summer Classic 2026 (tour_5) — four divisions
  ('div_5a', 'tour_5', 'Open Men''s',    NULL, 1700000000000, 1700000000000),
  ('div_5b', 'tour_5', 'Open Women''s',  NULL, 1700000000000, 1700000000000),
  ('div_5c', 'tour_5', 'U18 Boys',       12,   1700000000000, 1700000000000),
  ('div_5d', 'tour_5', 'Masters Men''s', 8,    1700000000000, 1700000000000),

  -- Open State Championship 2026 (tour_6) — upcoming
  ('div_6a', 'tour_6', 'Open Men''s',    24, 1700000000000, 1700000000000),
  ('div_6b', 'tour_6', 'Open Women''s',  24, 1700000000000, 1700000000000),
  ('div_6c', 'tour_6', 'Co-Ed Open',     16, 1700000000000, 1700000000000),

  -- Fall Championship 2026 (tour_7) — upcoming
  ('div_7a', 'tour_7', 'Open Men''s',    16, 1700000000000, 1700000000000),
  ('div_7b', 'tour_7', 'Open Women''s',  16, 1700000000000, 1700000000000),
  ('div_7c', 'tour_7', 'U18 Boys',       12, 1700000000000, 1700000000000),
  ('div_7d', 'tour_7', 'U18 Girls',      12, 1700000000000, 1700000000000),

  -- Youth Invitational 2027 (tour_8) — two divisions
  ('div_8a', 'tour_8', 'U12 Boys',       8, 1700000000000, 1700000000000),
  ('div_8b', 'tour_8', 'U16 Girls',      8, 1700000000000, 1700000000000),

  -- Masters League Spring 2027 (tour_9) — upcoming
  ('div_9a', 'tour_9', 'Masters Men''s', 12, 1700000000000, 1700000000000),
  ('div_9b', 'tour_9', 'Masters Women''s', 12, 1700000000000, 1700000000000);

-- ------------------------------------------------------------
-- 9. Tournament Registrations
-- One registration per team per tournament (UNIQUE enforced).
-- Covers all 9 tournaments, all 4 statuses, and realistic
-- use cases: multi-tournament teams, near-full divisions,
-- rejected submissions with notes, past results.
-- ------------------------------------------------------------
INSERT INTO tournament_registrations (id, team_id, division_id, tournament_id, status, registered_at, notes, created_at, updated_at) VALUES

  -- ── Winter Cup 2024 (tour_1) — past results ──────────────────────────────
  ('reg_1',  'team_a', 'div_1a', 'tour_1', 'approved',   '2023-12-01T10:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_2',  'team_d', 'div_1b', 'tour_1', 'approved',   '2023-12-03T09:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_3',  'team_g', 'div_1a', 'tour_1', 'approved',   '2023-12-05T11:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_4',  'team_e', 'div_1a', 'tour_1', 'approved',   '2023-12-07T14:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_5',  'team_c', 'div_1a', 'tour_1', 'rejected',   '2023-12-10T16:00:00Z', 'Submitted after deadline.',           1700000000000, 1700000000000),

  -- ── Spring Invitational 2025 (tour_2) — past results ─────────────────────
  ('reg_6',  'team_a', 'div_2a', 'tour_2', 'approved',   '2025-01-15T10:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_7',  'team_g', 'div_2a', 'tour_2', 'approved',   '2025-01-18T09:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_8',  'team_d', 'div_2b', 'tour_2', 'approved',   '2025-01-20T11:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_9',  'team_h', 'div_2b', 'tour_2', 'rejected',   '2025-01-22T15:00:00Z', 'Roster not submitted in time.',       1700000000000, 1700000000000),
  ('reg_10', 'team_b', 'div_2c', 'tour_2', 'approved',   '2025-01-25T08:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_11', 'team_f', 'div_2c', 'tour_2', 'approved',   '2025-01-26T13:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_12', 'team_i', 'div_2c', 'tour_2', 'waitlisted', '2025-01-28T10:00:00Z', 'Division at capacity, on waitlist.',  1700000000000, 1700000000000),

  -- ── Pacific Coast Cup 2025 (tour_3) — past results ───────────────────────
  ('reg_13', 'team_a', 'div_3a', 'tour_3', 'approved',   '2025-06-01T10:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_14', 'team_g', 'div_3a', 'tour_3', 'approved',   '2025-06-03T09:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_15', 'team_e', 'div_3a', 'tour_3', 'approved',   '2025-06-05T11:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_16', 'team_d', 'div_3b', 'tour_3', 'approved',   '2025-06-04T14:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_17', 'team_h', 'div_3b', 'tour_3', 'approved',   '2025-06-06T10:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_18', 'team_b', 'div_3c', 'tour_3', 'approved',   '2025-06-07T08:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_19', 'team_c', 'div_3a', 'tour_3', 'rejected',   '2025-06-10T16:00:00Z', 'Missing player eligibility docs.',    1700000000000, 1700000000000),

  -- ── Regional Qualifiers 2026 (tour_4) — deadline passed, mix of statuses ─
  ('reg_20', 'team_a', 'div_4a', 'tour_4', 'approved',   '2026-03-01T10:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_21', 'team_g', 'div_4a', 'tour_4', 'pending',    '2026-03-10T14:30:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_22', 'team_e', 'div_4a', 'tour_4', 'approved',   '2026-03-08T09:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_23', 'team_d', 'div_4b', 'tour_4', 'approved',   '2026-03-05T09:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_24', 'team_h', 'div_4b', 'tour_4', 'waitlisted', '2026-03-12T11:00:00Z', 'Division near capacity.',             1700000000000, 1700000000000),
  ('reg_25', 'team_b', 'div_4c', 'tour_4', 'pending',    '2026-03-15T09:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_26', 'team_i', 'div_4c', 'tour_4', 'waitlisted', '2026-03-18T16:00:00Z', 'Waiting on roster confirmation.',     1700000000000, 1700000000000),
  ('reg_27', 'team_f', 'div_4c', 'tour_4', 'rejected',   '2026-03-19T17:00:00Z', 'Age verification failed.',            1700000000000, 1700000000000),
  ('reg_28', 'team_c', 'div_4a', 'tour_4', 'rejected',   '2026-03-20T18:00:00Z', 'Submitted after deadline.',           1700000000000, 1700000000000),

  -- ── Summer Classic 2026 (tour_5) — registration open ─────────────────────
  ('reg_29', 'team_e', 'div_5d', 'tour_5', 'approved',   '2026-04-20T08:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_30', 'team_a', 'div_5a', 'tour_5', 'pending',    '2026-04-25T16:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_31', 'team_g', 'div_5a', 'tour_5', 'approved',   '2026-04-12T08:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_32', 'team_c', 'div_5a', 'tour_5', 'rejected',   '2026-04-18T13:00:00Z', 'Incomplete roster submission.',       1700000000000, 1700000000000),
  ('reg_33', 'team_f', 'div_5c', 'tour_5', 'approved',   '2026-04-10T11:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_34', 'team_b', 'div_5c', 'tour_5', 'waitlisted', '2026-04-28T10:00:00Z', 'U18 Boys division filling fast.',     1700000000000, 1700000000000),
  ('reg_35', 'team_h', 'div_5b', 'tour_5', 'pending',    '2026-04-22T14:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_36', 'team_d', 'div_5b', 'tour_5', 'approved',   '2026-04-15T09:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_37', 'team_i', 'div_5c', 'tour_5', 'pending',    '2026-04-30T11:00:00Z', NULL,                                  1700000000000, 1700000000000),

  -- ── Open State Championship 2026 (tour_6) — registration open ────────────
  ('reg_38', 'team_a', 'div_6a', 'tour_6', 'pending',    '2026-05-10T10:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_39', 'team_g', 'div_6a', 'tour_6', 'approved',   '2026-05-12T09:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_40', 'team_e', 'div_6a', 'tour_6', 'pending',    '2026-05-15T11:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_41', 'team_d', 'div_6b', 'tour_6', 'approved',   '2026-05-08T14:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_42', 'team_h', 'div_6b', 'tour_6', 'pending',    '2026-05-20T10:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_43', 'team_c', 'div_6c', 'tour_6', 'rejected',   '2026-05-25T16:00:00Z', 'Not enough registered players.',      1700000000000, 1700000000000),
  ('reg_44', 'team_b', 'div_6a', 'tour_6', 'waitlisted', '2026-05-28T13:00:00Z', 'Open Men''s filling quickly.',        1700000000000, 1700000000000),

  -- ── Fall Championship 2026 (tour_7) — registration open ──────────────────
  ('reg_45', 'team_a', 'div_7a', 'tour_7', 'pending',    '2026-09-01T10:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_46', 'team_g', 'div_7a', 'tour_7', 'approved',   '2026-09-03T09:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_47', 'team_d', 'div_7b', 'tour_7', 'pending',    '2026-09-05T11:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_48', 'team_h', 'div_7b', 'tour_7', 'approved',   '2026-09-07T14:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_49', 'team_b', 'div_7c', 'tour_7', 'pending',    '2026-09-10T08:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_50', 'team_i', 'div_7c', 'tour_7', 'waitlisted', '2026-09-12T10:00:00Z', 'U18 Boys spots limited.',             1700000000000, 1700000000000),
  ('reg_51', 'team_f', 'div_7d', 'tour_7', 'pending',    '2026-09-15T13:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_52', 'team_e', 'div_7a', 'tour_7', 'approved',   '2026-09-08T09:00:00Z', NULL,                                  1700000000000, 1700000000000),

  -- ── Youth Invitational 2027 (tour_8) — registration open, small caps ──────
  ('reg_53', 'team_b', 'div_8a', 'tour_8', 'approved',   '2026-11-01T10:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_54', 'team_f', 'div_8a', 'tour_8', 'waitlisted', '2026-11-05T09:00:00Z', 'U12 Boys at capacity (8 teams).',     1700000000000, 1700000000000),
  ('reg_55', 'team_i', 'div_8b', 'tour_8', 'pending',    '2026-11-08T11:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_56', 'team_d', 'div_8b', 'tour_8', 'approved',   '2026-11-03T14:00:00Z', NULL,                                  1700000000000, 1700000000000),

  -- ── Masters League Spring 2027 (tour_9) — registration open ──────────────
  ('reg_57', 'team_e', 'div_9a', 'tour_9', 'approved',   '2026-12-01T10:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_58', 'team_g', 'div_9a', 'tour_9', 'pending',    '2026-12-05T09:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_59', 'team_a', 'div_9a', 'tour_9', 'pending',    '2026-12-10T11:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_60', 'team_c', 'div_9b', 'tour_9', 'rejected',   '2026-12-15T16:00:00Z', 'Team does not meet Masters age requirement.', 1700000000000, 1700000000000);
