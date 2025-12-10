-- Leave of Absence (LOA) tables

CREATE TABLE IF NOT EXISTS loas (
  id           TEXT PRIMARY KEY,
  guild_id     TEXT NOT NULL,
  user_id      TEXT NOT NULL,
  reason       TEXT,
  start_date   INTEGER NOT NULL,
  end_date     INTEGER NOT NULL,
  status       TEXT NOT NULL,    -- pending, active, completed, cancelled, expired
  submitted_at INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_loas_guild
  ON loas (guild_id);

CREATE INDEX IF NOT EXISTS idx_loas_user
  ON loas (user_id);

CREATE TABLE IF NOT EXISTS loa_history (
  id          TEXT PRIMARY KEY,
  guild_id    TEXT NOT NULL,
  user_id     TEXT NOT NULL,
  reason      TEXT,
  start_date  INTEGER NOT NULL,
  end_date    INTEGER NOT NULL,
  resolved_at INTEGER NOT NULL,
  status      TEXT NOT NULL      -- completed, cancelled, expired
);

CREATE INDEX IF NOT EXISTS idx_loa_history_guild
  ON loa_history (guild_id);

CREATE INDEX IF NOT EXISTS idx_loa_history_user
  ON loa_history (user_id);

CREATE TABLE IF NOT EXISTS loa_board (
  guild_id   TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
