-- ============================================================
-- KICKOFF LOCAL SEED  (role-hierarchy-redesign)
-- Wipes all app + auth data and inserts representative test
-- fixtures for the new isCoach / isDirector model.
-- Run via: pnpm db:seed:local
--
-- Test password for ALL accounts: Test1234!
-- ============================================================

-- ------------------------------------------------------------
-- 1. Clear existing data (reverse dependency order)
-- ------------------------------------------------------------
DELETE FROM notifications;
DELETE FROM tournament_manager_invites;
DELETE FROM tournament_managers;
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
--
-- New model:
--   role:       'admin' | 'user'   (platform superuser only)
--   isCoach:    1 = can create/manage teams and register
--   isDirector: 1 = can create/manage tournaments
--
-- Test accounts:
--   usr_admin      — platform superuser (admin, not coach/director)
--   usr_coach_a    — pure coach (Alex Coach)
--   usr_coach_b    — pure coach (Blake Torres)
--   usr_director_a — pure director, owns most tournaments
--   usr_director_b — director + coach (Drew Mitchell), co-manages tour_4
--   usr_both       — coach + director (Casey Rivera)
--   usr_player1-3  — players/members only (isCoach=0, isDirector=0)
--   usr_newbie     — no capabilities yet (edge case; has at least coach in prod)
-- ------------------------------------------------------------
INSERT INTO "user" (id, name, email, emailVerified, image, role, isCoach, isDirector, createdAt, updatedAt) VALUES
  -- Platform admin: bypasses all capability checks
  ('usr_admin',      'Admin User',     'admin@kickoff.test',       1, NULL, 'admin', 0, 0, 1700000000000, 1700000000000),
  -- Pure coaches
  ('usr_coach_a',    'Alex Coach',     'coach-a@kickoff.test',     1, NULL, 'user',  1, 0, 1700000000000, 1700000000000),
  ('usr_coach_b',    'Blake Torres',   'coach-b@kickoff.test',     1, NULL, 'user',  1, 0, 1700000000000, 1700000000000),
  -- Pure director (owns tours 1-7)
  ('usr_director_a', 'Jordan Director','director-a@kickoff.test',  1, NULL, 'user',  0, 1, 1700000000000, 1700000000000),
  -- Director + coach (co-manages tour_4 via tournament_managers, owns tour_8)
  ('usr_director_b', 'Drew Mitchell',  'director-b@kickoff.test',  1, NULL, 'user',  1, 1, 1700000000000, 1700000000000),
  -- Coach + director
  ('usr_both',       'Casey Rivera',   'both@kickoff.test',        1, NULL, 'user',  1, 1, 1700000000000, 1700000000000),
  -- Players (no capabilities)
  ('usr_player1',    'Jordan Lee',     'player1@kickoff.test',     1, NULL, 'user',  0, 0, 1700000000000, 1700000000000),
  ('usr_player2',    'Morgan Kim',     'player2@kickoff.test',     1, NULL, 'user',  0, 0, 1700000000000, 1700000000000),
  ('usr_player3',    'Riley Patel',    'player3@kickoff.test',     1, NULL, 'user',  0, 0, 1700000000000, 1700000000000),
  -- Newbie: signed up but no capabilities (edge case)
  ('usr_newbie',     'New User',       'newbie@kickoff.test',      1, NULL, 'user',  0, 0, 1700000000000, 1700000000000);

-- ------------------------------------------------------------
-- 3. Accounts  (Better Auth `account` — camelCase columns)
-- Password = Test1234! hashed via @better-auth/utils hashPassword
-- (Node crypto.scrypt, format: <hex-salt>:<hex-key>)
-- ------------------------------------------------------------
INSERT INTO account (id, accountId, providerId, userId, password, createdAt, updatedAt) VALUES
  ('acc_admin',      'usr_admin',      'credential', 'usr_admin',      '2acdde16c0d5ce394e3f16d7df9880e7:7fcfbdfb5b6eb83c036d0f226e00770ac7387f3c834804bd8d9ac4dd3ebf3ec679fbe1097234943d15c954750240289ca32fe9c10495e52fb676978a8d9ae39e', 1700000000000, 1700000000000),
  ('acc_coach_a',    'usr_coach_a',    'credential', 'usr_coach_a',    '2acdde16c0d5ce394e3f16d7df9880e7:7fcfbdfb5b6eb83c036d0f226e00770ac7387f3c834804bd8d9ac4dd3ebf3ec679fbe1097234943d15c954750240289ca32fe9c10495e52fb676978a8d9ae39e', 1700000000000, 1700000000000),
  ('acc_coach_b',    'usr_coach_b',    'credential', 'usr_coach_b',    '2acdde16c0d5ce394e3f16d7df9880e7:7fcfbdfb5b6eb83c036d0f226e00770ac7387f3c834804bd8d9ac4dd3ebf3ec679fbe1097234943d15c954750240289ca32fe9c10495e52fb676978a8d9ae39e', 1700000000000, 1700000000000),
  ('acc_director_a', 'usr_director_a', 'credential', 'usr_director_a', '2acdde16c0d5ce394e3f16d7df9880e7:7fcfbdfb5b6eb83c036d0f226e00770ac7387f3c834804bd8d9ac4dd3ebf3ec679fbe1097234943d15c954750240289ca32fe9c10495e52fb676978a8d9ae39e', 1700000000000, 1700000000000),
  ('acc_director_b', 'usr_director_b', 'credential', 'usr_director_b', '2acdde16c0d5ce394e3f16d7df9880e7:7fcfbdfb5b6eb83c036d0f226e00770ac7387f3c834804bd8d9ac4dd3ebf3ec679fbe1097234943d15c954750240289ca32fe9c10495e52fb676978a8d9ae39e', 1700000000000, 1700000000000),
  ('acc_both',       'usr_both',       'credential', 'usr_both',       '2acdde16c0d5ce394e3f16d7df9880e7:7fcfbdfb5b6eb83c036d0f226e00770ac7387f3c834804bd8d9ac4dd3ebf3ec679fbe1097234943d15c954750240289ca32fe9c10495e52fb676978a8d9ae39e', 1700000000000, 1700000000000),
  ('acc_player1',    'usr_player1',    'credential', 'usr_player1',    '2acdde16c0d5ce394e3f16d7df9880e7:7fcfbdfb5b6eb83c036d0f226e00770ac7387f3c834804bd8d9ac4dd3ebf3ec679fbe1097234943d15c954750240289ca32fe9c10495e52fb676978a8d9ae39e', 1700000000000, 1700000000000),
  ('acc_player2',    'usr_player2',    'credential', 'usr_player2',    '2acdde16c0d5ce394e3f16d7df9880e7:7fcfbdfb5b6eb83c036d0f226e00770ac7387f3c834804bd8d9ac4dd3ebf3ec679fbe1097234943d15c954750240289ca32fe9c10495e52fb676978a8d9ae39e', 1700000000000, 1700000000000),
  ('acc_player3',    'usr_player3',    'credential', 'usr_player3',    '2acdde16c0d5ce394e3f16d7df9880e7:7fcfbdfb5b6eb83c036d0f226e00770ac7387f3c834804bd8d9ac4dd3ebf3ec679fbe1097234943d15c954750240289ca32fe9c10495e52fb676978a8d9ae39e', 1700000000000, 1700000000000),
  ('acc_newbie',     'usr_newbie',     'credential', 'usr_newbie',     '2acdde16c0d5ce394e3f16d7df9880e7:7fcfbdfb5b6eb83c036d0f226e00770ac7387f3c834804bd8d9ac4dd3ebf3ec679fbe1097234943d15c954750240289ca32fe9c10495e52fb676978a8d9ae39e', 1700000000000, 1700000000000);

-- ------------------------------------------------------------
-- 4. Profiles
-- ------------------------------------------------------------
INSERT INTO profiles (id, user_id, phone, date_of_birth, address_city, address_state, created_at, updated_at) VALUES
  ('pro_admin',      'usr_admin',      '555-0100', '1985-03-15', 'Austin',      'TX', 1700000000000, 1700000000000),
  ('pro_coach_a',    'usr_coach_a',    '555-0101', '1990-07-22', 'Dallas',      'TX', 1700000000000, 1700000000000),
  ('pro_coach_b',    'usr_coach_b',    '555-0102', '1988-11-05', 'San Diego',   'CA', 1700000000000, 1700000000000),
  ('pro_director_a', 'usr_director_a', '555-0103', '1982-04-18', 'Houston',     'TX', 1700000000000, 1700000000000),
  ('pro_director_b', 'usr_director_b', '555-0104', '1987-09-30', 'Chicago',     'IL', 1700000000000, 1700000000000),
  ('pro_both',       'usr_both',       '555-0105', '1992-01-25', 'Phoenix',     'AZ', 1700000000000, 1700000000000),
  ('pro_player1',    'usr_player1',    NULL,        NULL,         'Houston',     'TX', 1700000000000, 1700000000000),
  ('pro_player2',    'usr_player2',    '555-0107', '2002-11-08', NULL,          NULL, 1700000000000, 1700000000000),
  ('pro_player3',    'usr_player3',    '555-0108', '1998-06-14', 'Los Angeles', 'CA', 1700000000000, 1700000000000),
  ('pro_newbie',     'usr_newbie',     NULL,        NULL,         NULL,          NULL, 1700000000000, 1700000000000);

-- ------------------------------------------------------------
-- 5. Teams  (coach_id → isCoach users only)
-- ------------------------------------------------------------
INSERT INTO teams (id, name, short_name, city, coach_id, color, created_at, updated_at) VALUES
  -- coach_a teams
  ('team_a', 'River Hawks',    'RH', 'Austin',     'usr_coach_a',    'emerald', 1700000000000, 1700000000000),
  ('team_b', 'Storm United',   'SU', 'Dallas',     'usr_coach_a',    'blue',    1700000000000, 1700000000000),
  -- coach_b teams
  ('team_c', 'Coastal FC',     'CF', 'San Diego',  'usr_coach_b',    'sky',     1700000000000, 1700000000000),
  ('team_d', 'Iron City FC',   'IC', 'Pittsburgh', 'usr_coach_b',    'orange',  1700000000000, 1700000000000),
  -- director_b also coaches two teams
  ('team_e', 'Northside FC',   'NF', 'Chicago',    'usr_director_b', 'violet',  1700000000000, 1700000000000),
  ('team_f', 'Silver Arrows',  'SA', 'Seattle',    'usr_director_b', 'slate',   1700000000000, 1700000000000),
  -- both (coach+director)
  ('team_g', 'Desert Wolves',  'DW', 'Phoenix',    'usr_both',       'amber',   1700000000000, 1700000000000);

-- ------------------------------------------------------------
-- 6. Team Members
-- ------------------------------------------------------------
INSERT INTO team_members (id, user_id, team_id, jersey_number, status, created_at, updated_at) VALUES
  -- coach_a teams: some cross-members
  ('tm_01', 'usr_coach_a',    'team_a', NULL, 'approved', 1700000000000, 1700000000000),
  ('tm_02', 'usr_player1',    'team_a', 7,    'approved', 1700000000000, 1700000000000),
  ('tm_03', 'usr_player2',    'team_a', NULL, 'pending',  1700000000000, 1700000000000),
  ('tm_04', 'usr_player3',    'team_a', 11,   'approved', 1700000000000, 1700000000000),
  ('tm_05', 'usr_coach_b',    'team_a', 22,   'approved', 1700000000000, 1700000000000),
  ('tm_06', 'usr_player1',    'team_b', NULL, 'pending',  1700000000000, 1700000000000),
  ('tm_07', 'usr_player2',    'team_b', NULL, 'rejected', 1700000000000, 1700000000000),
  -- coach_b teams
  ('tm_08', 'usr_player1',    'team_c', 8,    'approved', 1700000000000, 1700000000000),
  ('tm_09', 'usr_player3',    'team_c', NULL, 'approved', 1700000000000, 1700000000000),
  ('tm_10', 'usr_player2',    'team_d', 3,    'approved', 1700000000000, 1700000000000),
  -- director_b teams
  ('tm_11', 'usr_director_b', 'team_e', 5,    'approved', 1700000000000, 1700000000000),
  ('tm_12', 'usr_player1',    'team_e', NULL, 'approved', 1700000000000, 1700000000000),
  ('tm_13', 'usr_player3',    'team_f', 14,   'pending',  1700000000000, 1700000000000),
  -- both's team
  ('tm_14', 'usr_both',       'team_g', NULL, 'approved', 1700000000000, 1700000000000),
  ('tm_15', 'usr_player2',    'team_g', NULL, 'pending',  1700000000000, 1700000000000);

-- Imported (pending_signup) roster entries
INSERT INTO team_members
  (id, user_id, team_id, email, display_name, jersey_number, date_of_birth, phone, player_id, status, created_at, updated_at)
VALUES
  ('tm_import_01', NULL, 'team_a', 'import-player1@example.test', 'Jamie Torres', 21, '2000-05-10', '555-2001', 'TX-10001', 'pending_signup', 1700000000000, 1700000000000),
  ('tm_import_02', NULL, 'team_c', 'import-player2@example.test', 'Avery Nguyen',  4, '2001-03-17', '555-2003', 'CA-20004', 'pending_signup', 1700000000000, 1700000000000);

-- ------------------------------------------------------------
-- 7. Team Invites
-- ------------------------------------------------------------
INSERT INTO team_invites (id, team_id, token, created_by, is_active, created_at, updated_at) VALUES
  ('inv_team_a', 'team_a', 'seed_token_river_hawks_xxxxx', 'usr_coach_a',    1, 1700000000000, 1700000000000),
  ('inv_team_c', 'team_c', 'seed_token_coastal_fc_xxxxxx', 'usr_coach_b',    1, 1700000000000, 1700000000000),
  ('inv_team_e', 'team_e', 'seed_token_northside_fc_xxxx', 'usr_director_b', 1, 1700000000000, 1700000000000),
  ('inv_team_g', 'team_g', 'seed_token_desert_wolves_xxx', 'usr_both',       1, 1700000000000, 1700000000000);

-- ------------------------------------------------------------
-- 8. Tournaments  (created_by set on all rows)
-- ------------------------------------------------------------
INSERT INTO tournaments (id, name, slug, start_date, end_date, registration_deadline, location, description, created_by, created_at, updated_at) VALUES
  ('tour_1', 'Winter Cup 2024',             'winter-cup-2024',             '2024-01-15', '2024-01-28', NULL,         NULL,                     NULL,                                              'usr_director_a', 1700000000000, 1700000000000),
  ('tour_2', 'Spring Invitational 2025',    'spring-invitational-2025',    '2025-03-01', '2025-03-15', NULL,         NULL,                     NULL,                                              'usr_director_a', 1700000000000, 1700000000000),
  ('tour_3', 'Pacific Coast Cup 2025',      'pacific-coast-cup-2025',      '2025-08-10', '2025-08-24', NULL,         'San Diego Sports Park',  NULL,                                              'usr_director_a', 1700000000000, 1700000000000),
  ('tour_4', 'Regional Qualifiers 2026',    'regional-qualifiers-2026',    '2026-04-05', '2026-04-12', '2026-03-20', 'Austin FC Stadium',      'Regional qualifier for the state championship.', 'usr_director_a', 1700000000000, 1700000000000),
  ('tour_5', 'Summer Classic 2026',         'summer-classic-2026',         '2026-06-01', '2026-08-31', '2026-05-15', 'Zilker Park Fields',     'Open summer league across all age groups.',      'usr_director_a', 1700000000000, 1700000000000),
  ('tour_6', 'Open State Championship 2026','open-state-championship-2026','2026-07-01', '2026-07-20', '2026-06-15', 'Round Rock Multiplex',   NULL,                                              'usr_director_a', 1700000000000, 1700000000000),
  ('tour_7', 'Fall Championship 2026',      'fall-championship-2026',      '2026-12-01', '2026-12-20', '2026-11-01', NULL,                     NULL,                                              'usr_director_a', 1700000000000, 1700000000000),
  -- tour_8 owned by director_b
  ('tour_8', 'Youth Invitational 2027',     'youth-invitational-2027',     '2027-02-14', '2027-02-21', '2027-01-31', 'Cedar Park Center',      'Annual youth invitational for U12-U18 divisions.','usr_director_b', 1700000000000, 1700000000000),
  -- tour_9 owned by usr_both (coach+director)
  ('tour_9', 'Masters League Spring 2027',  'masters-league-spring-2027',  '2027-04-01', '2027-04-30', '2027-03-15', NULL,                     NULL,                                              'usr_both',       1700000000000, 1700000000000);

-- ------------------------------------------------------------
-- 9. Divisions
-- ------------------------------------------------------------
INSERT INTO divisions (id, tournament_id, name, max_teams, created_at, updated_at) VALUES
  ('div_1a', 'tour_1', 'Open Men''s',    16,   1700000000000, 1700000000000),
  ('div_1b', 'tour_1', 'Open Women''s',  16,   1700000000000, 1700000000000),
  ('div_2a', 'tour_2', 'Open Men''s',    NULL, 1700000000000, 1700000000000),
  ('div_2b', 'tour_2', 'Open Women''s',  NULL, 1700000000000, 1700000000000),
  ('div_2c', 'tour_2', 'U18 Boys',       12,   1700000000000, 1700000000000),
  ('div_3a', 'tour_3', 'Open Men''s',    16,   1700000000000, 1700000000000),
  ('div_3b', 'tour_3', 'Open Women''s',  16,   1700000000000, 1700000000000),
  ('div_3c', 'tour_3', 'U18 Boys',       NULL, 1700000000000, 1700000000000),
  ('div_4a', 'tour_4', 'Open Men''s',    16,   1700000000000, 1700000000000),
  ('div_4b', 'tour_4', 'Open Women''s',  16,   1700000000000, 1700000000000),
  ('div_4c', 'tour_4', 'U18 Boys',       NULL, 1700000000000, 1700000000000),
  ('div_5a', 'tour_5', 'Open Men''s',    NULL, 1700000000000, 1700000000000),
  ('div_5b', 'tour_5', 'Open Women''s',  NULL, 1700000000000, 1700000000000),
  ('div_5c', 'tour_5', 'U18 Boys',       12,   1700000000000, 1700000000000),
  ('div_6a', 'tour_6', 'Open Men''s',    24,   1700000000000, 1700000000000),
  ('div_6b', 'tour_6', 'Open Women''s',  24,   1700000000000, 1700000000000),
  ('div_7a', 'tour_7', 'Open Men''s',    16,   1700000000000, 1700000000000),
  ('div_7b', 'tour_7', 'Open Women''s',  16,   1700000000000, 1700000000000),
  ('div_8a', 'tour_8', 'U12 Boys',       8,    1700000000000, 1700000000000),
  ('div_8b', 'tour_8', 'U16 Girls',      8,    1700000000000, 1700000000000),
  ('div_9a', 'tour_9', 'Masters Men''s', 12,   1700000000000, 1700000000000),
  ('div_9b', 'tour_9', 'Masters Women''s', 12, 1700000000000, 1700000000000);

-- ------------------------------------------------------------
-- 10. Tournament Registrations
-- ------------------------------------------------------------
INSERT INTO tournament_registrations (id, team_id, division_id, tournament_id, status, registered_at, notes, created_at, updated_at) VALUES
  -- tour_1 (past)
  ('reg_1',  'team_a', 'div_1a', 'tour_1', 'approved',   '2023-12-01T10:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_2',  'team_c', 'div_1b', 'tour_1', 'approved',   '2023-12-03T09:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_3',  'team_e', 'div_1a', 'tour_1', 'approved',   '2023-12-05T11:00:00Z', NULL,                                  1700000000000, 1700000000000),
  -- tour_2 (past)
  ('reg_4',  'team_a', 'div_2a', 'tour_2', 'approved',   '2025-01-15T10:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_5',  'team_b', 'div_2c', 'tour_2', 'approved',   '2025-01-25T08:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_6',  'team_c', 'div_2b', 'tour_2', 'approved',   '2025-01-20T11:00:00Z', NULL,                                  1700000000000, 1700000000000),
  -- tour_3 (past)
  ('reg_7',  'team_a', 'div_3a', 'tour_3', 'approved',   '2025-06-01T10:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_8',  'team_d', 'div_3a', 'tour_3', 'approved',   '2025-06-03T09:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_9',  'team_e', 'div_3c', 'tour_3', 'rejected',   '2025-06-10T16:00:00Z', 'Missing player eligibility docs.',    1700000000000, 1700000000000),
  -- tour_4 (upcoming — has pending registrations to exercise director dashboard)
  ('reg_10', 'team_a', 'div_4a', 'tour_4', 'approved',   '2026-03-01T10:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_11', 'team_b', 'div_4c', 'tour_4', 'pending',    '2026-03-15T09:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_12', 'team_c', 'div_4b', 'tour_4', 'approved',   '2026-03-05T09:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_13', 'team_d', 'div_4a', 'tour_4', 'pending',    '2026-03-18T14:30:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_14', 'team_e', 'div_4c', 'tour_4', 'waitlisted', '2026-03-20T16:00:00Z', 'Waiting on roster confirmation.',     1700000000000, 1700000000000),
  ('reg_15', 'team_g', 'div_4a', 'tour_4', 'rejected',   '2026-03-22T18:00:00Z', 'Age verification failed.',            1700000000000, 1700000000000),
  -- tour_5 (upcoming)
  ('reg_16', 'team_a', 'div_5a', 'tour_5', 'pending',    '2026-04-25T16:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_17', 'team_c', 'div_5b', 'tour_5', 'approved',   '2026-04-15T09:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_18', 'team_d', 'div_5c', 'tour_5', 'waitlisted', '2026-04-28T10:00:00Z', 'Division filling fast.',              1700000000000, 1700000000000),
  -- tour_6 (active)
  ('reg_19', 'team_a', 'div_6a', 'tour_6', 'approved',   '2026-05-10T10:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_20', 'team_b', 'div_6a', 'tour_6', 'pending',    '2026-05-28T13:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_21', 'team_c', 'div_6b', 'tour_6', 'approved',   '2026-05-08T14:00:00Z', NULL,                                  1700000000000, 1700000000000),
  -- tour_7 (upcoming)
  ('reg_22', 'team_a', 'div_7a', 'tour_7', 'pending',    '2026-09-01T10:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_23', 'team_e', 'div_7a', 'tour_7', 'approved',   '2026-09-08T09:00:00Z', NULL,                                  1700000000000, 1700000000000),
  -- tour_8 (owned by director_b)
  ('reg_24', 'team_f', 'div_8a', 'tour_8', 'pending',    '2026-11-05T09:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_25', 'team_g', 'div_8b', 'tour_8', 'approved',   '2026-11-03T14:00:00Z', NULL,                                  1700000000000, 1700000000000),
  -- tour_9 (owned by both)
  ('reg_26', 'team_e', 'div_9a', 'tour_9', 'approved',   '2026-12-01T10:00:00Z', NULL,                                  1700000000000, 1700000000000),
  ('reg_27', 'team_a', 'div_9a', 'tour_9', 'pending',    '2026-12-10T11:00:00Z', NULL,                                  1700000000000, 1700000000000);

-- ------------------------------------------------------------
-- 11. Tournament Managers
-- director_b is a co-manager of tour_4 (owned by director_a)
-- This exercises the isOwnerOrManager() path and the manager listing
-- ------------------------------------------------------------
INSERT INTO tournament_managers (id, tournament_id, user_id, added_by, created_at) VALUES
  ('mgr_01', 'tour_4', 'usr_director_b', 'usr_director_a', 1700000000000);

-- ------------------------------------------------------------
-- 12. Notifications
-- Representative fixtures covering all three notification types.
-- Times are relative to 1700000000000 (Nov 2023) so badges fire immediately.
--
-- usr_coach_a  → sees: registration status changes + player join
-- usr_director_a → sees: new registration submitted (for their tournaments)
-- usr_director_b → sees: new registration submitted (for tour_8 they own)
-- ------------------------------------------------------------
INSERT INTO notifications (id, user_id, type, title, body, reference_url, read_at, created_at, updated_at) VALUES
  -- coach_a: tour_1 reg approved (read)
  ('notif_01', 'usr_coach_a',
   'registration_status_changed',
   'Registration approved',
   'Your registration for Winter Cup 2024 was approved.',
   '/teams/team_a#registrations',
   1700000100000,
   1700000090000, 1700000100000),

  -- coach_a: tour_4 reg pending → rejected (unread)
  ('notif_02', 'usr_coach_a',
   'registration_status_changed',
   'Registration rejected',
   'Your registration for Regional Qualifiers 2026 was rejected. Director note: Age verification failed.',
   '/teams/team_a#registrations',
   NULL,
   1700000200000, 1700000200000),

  -- coach_a: player joined team_a via invite (unread)
  ('notif_03', 'usr_coach_a',
   'player_joined_team',
   'New player joined',
   'Jordan Lee joined River Hawks via the invite link.',
   '/teams/team_a',
   NULL,
   1700000300000, 1700000300000),

  -- director_a: new registration submitted for tour_4 (read)
  ('notif_04', 'usr_director_a',
   'new_registration_submitted',
   'New registration submitted',
   'Storm United has registered for Regional Qualifiers 2026.',
   '/director/tournaments/tour_4/registrations',
   1700000150000,
   1700000120000, 1700000150000),

  -- director_a: another new registration for tour_5 (unread)
  ('notif_05', 'usr_director_a',
   'new_registration_submitted',
   'New registration submitted',
   'River Hawks has registered for Summer Classic 2026.',
   '/director/tournaments/tour_5/registrations',
   NULL,
   1700000400000, 1700000400000),

  -- director_b: new registration for tour_8 they own (unread)
  ('notif_06', 'usr_director_b',
   'new_registration_submitted',
   'New registration submitted',
   'Silver Arrows has registered for Youth Invitational 2027.',
   '/director/tournaments/tour_8/registrations',
   NULL,
   1700000500000, 1700000500000),

  -- coach_b: player joined team_c (read)
  ('notif_07', 'usr_coach_b',
   'player_joined_team',
   'New player joined',
   'Morgan Kim joined Coastal FC via the invite link.',
   '/teams/team_c',
   1700000250000,
   1700000220000, 1700000250000);

-- ------------------------------------------------------------
-- 13. Tournament Manager Invites
-- One pending invite for tour_4 (48h expiry from "now" = far future so it
-- never expires in dev; token is known for manual /director/join/[token] test)
-- ------------------------------------------------------------
INSERT INTO tournament_manager_invites
  (id, tournament_id, email, token, created_by, expires_at, accepted_at, created_at)
VALUES
  ('inv_mgr_01', 'tour_4', NULL, 'seed_manager_invite_token_tour4_xxx',
   'usr_director_a',
   9999999999999,   -- far-future expiry so the invite is always valid in dev
   NULL,
   1700000000000);
