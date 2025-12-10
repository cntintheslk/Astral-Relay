-- System-level tables: guild settings, users

CREATE TABLE IF NOT EXISTS guild_settings (
  guild_id TEXT PRIMARY KEY,
  data     TEXT NOT NULL,
  registration_log_channel_id TEXT
);

CREATE TABLE IF NOT EXISTS users (
  user_id     TEXT PRIMARY KEY,
  first_seen  INTEGER NOT NULL,
  last_seen   INTEGER NOT NULL,
  notes       TEXT
);

CREATE TABLE IF NOT EXISTS system_health (
    message_id TEXT
);
