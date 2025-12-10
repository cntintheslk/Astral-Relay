-- System-level tables: guild settings, users

CREATE TABLE IF NOT EXISTS guild_settings (
  guild_id TEXT PRIMARY KEY,
  data     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  user_id     TEXT PRIMARY KEY,
  first_seen  INTEGER NOT NULL,
  last_seen   INTEGER NOT NULL,
  notes       TEXT
);
