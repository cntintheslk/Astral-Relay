CREATE TABLE IF NOT EXISTS welcome_config (
    guild_id TEXT PRIMARY KEY,
    enabled INTEGER DEFAULT 1,
    channel_id TEXT,
    message TEXT,
    dm_enabled INTEGER DEFAULT 0,
    autoroles TEXT,
    created_at INTEGER,
    updated_at at INTEGER
)