CREATE TABLE `players` (
  `id`         text    PRIMARY KEY NOT NULL,
  `user_id`    text    NOT NULL UNIQUE,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

CREATE TABLE `player_teams` (
  `id`         text    PRIMARY KEY NOT NULL,
  `player_id`  text    NOT NULL REFERENCES players(id),
  `team_id`    text    NOT NULL REFERENCES teams(id),
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  UNIQUE(`player_id`, `team_id`)
);
