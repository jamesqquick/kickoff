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
-- 9 teams across all status values, divisions, and cities.
-- short_name set where a recognizable abbreviation fits.
-- ------------------------------------------------------------
INSERT INTO teams (id, name, short_name, city, coach_id, color, status, created_at, updated_at) VALUES
  -- coach_a teams: one approved, one pending
  ('team_a', 'River Hawks',     'RH',   'Austin',     'usr_coach_a', 'emerald', 'approved', 1700000000000, 1700000000000),
  ('team_b', 'Storm United',    'SU',   'Dallas',     'usr_coach_a', 'blue',    'pending',  1700000000000, 1700000000000),
  -- admin team: rejected
  ('team_c', 'Ghost FC',        'GFC',  'Houston',    'usr_admin',   'red',     'rejected', 1700000000000, 1700000000000),
  -- coach_b teams: both approved
  ('team_d', 'Coastal FC',      'CFC',  'San Diego',  'usr_coach_b', 'sky',     'approved', 1700000000000, 1700000000000),
  ('team_e', 'Iron City United','ICU',  'Pittsburgh', 'usr_coach_b', 'orange',  'approved', 1700000000000, 1700000000000),
  -- coach_c teams: both unapproved — exercises Created-only path on My Teams
  ('team_f', 'Desert Wolves',   'DW',   'Phoenix',    'usr_coach_c', 'amber',   'pending',  1700000000000, 1700000000000),
  ('team_i', 'Red Canyon AC',   'RCAC', 'Denver',     'usr_coach_c', 'rose',    'rejected', 1700000000000, 1700000000000),
  -- coach_d teams: both approved
  ('team_g', 'Northside FC',    'NFC',  'Chicago',    'usr_coach_d', 'violet',  'approved', 1700000000000, 1700000000000),
  ('team_h', 'Silver Arrows',   'SA',   'Seattle',    'usr_coach_d', 'slate',   'approved', 1700000000000, 1700000000000);

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
-- 7. Tournaments  (Drizzle app table — snake_case columns)
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
  -- Regional Qualifiers 2026 (tour_4) — three divisions
  ('div_4a', 'tour_4', 'Open Men''s',    16, 1700000000000, 1700000000000),
  ('div_4b', 'tour_4', 'Open Women''s',  16, 1700000000000, 1700000000000),
  ('div_4c', 'tour_4', 'U18 Boys',       NULL, 1700000000000, 1700000000000),

  -- Summer Classic 2026 (tour_5) — four divisions
  ('div_5a', 'tour_5', 'Open Men''s',    NULL, 1700000000000, 1700000000000),
  ('div_5b', 'tour_5', 'Open Women''s',  NULL, 1700000000000, 1700000000000),
  ('div_5c', 'tour_5', 'U18 Boys',       12, 1700000000000, 1700000000000),
  ('div_5d', 'tour_5', 'Masters Men''s', 8,  1700000000000, 1700000000000),

  -- Youth Invitational 2027 (tour_8) — two divisions
  ('div_8a', 'tour_8', 'U12 Boys',       8, 1700000000000, 1700000000000),
  ('div_8b', 'tour_8', 'U16 Girls',      8, 1700000000000, 1700000000000);

-- ------------------------------------------------------------
-- 9. Tournament Registrations
-- (team_id, division_id, tournament_id, status)
-- One registration per team per tournament — unique constraint enforced.
-- ------------------------------------------------------------
INSERT INTO tournament_registrations (id, team_id, division_id, tournament_id, status, registered_at, notes, created_at, updated_at) VALUES
  -- River Hawks (team_a) in Regional Qualifiers → Open Men's → approved
  ('reg_1', 'team_a', 'div_4a', 'tour_4', 'approved',   '2026-03-01T10:00:00Z', NULL, 1700000000000, 1700000000000),
  -- Northside FC (team_g) in Regional Qualifiers → Open Men's → pending
  ('reg_2', 'team_g', 'div_4a', 'tour_4', 'pending',    '2026-03-10T14:30:00Z', NULL, 1700000000000, 1700000000000),
  -- Coastal FC (team_d) in Regional Qualifiers → Open Women's → approved
  ('reg_3', 'team_d', 'div_4b', 'tour_4', 'approved',   '2026-03-05T09:00:00Z', NULL, 1700000000000, 1700000000000),
  -- Silver Arrows (team_h) in Regional Qualifiers → Open Women's → waitlisted
  ('reg_4', 'team_h', 'div_4b', 'tour_4', 'waitlisted', '2026-03-12T11:00:00Z', 'Division near capacity', 1700000000000, 1700000000000),
  -- Iron City United (team_e) in Summer Classic → Masters Men's → approved
  ('reg_5', 'team_e', 'div_5d', 'tour_5', 'approved',   '2026-04-20T08:00:00Z', NULL, 1700000000000, 1700000000000),
  -- River Hawks (team_a) in Summer Classic → Open Men's → pending
  ('reg_6', 'team_a', 'div_5a', 'tour_5', 'pending',    '2026-04-25T16:00:00Z', NULL, 1700000000000, 1700000000000);
