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

CREATE TABLE IF NOT EXISTS system_health (
    message_id TEXT
);

CREATE TABLE IF NOT EXISTS guild_modules (
    guild_id TEXT NOT NULL,
    module TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (guild_id, module)
);
