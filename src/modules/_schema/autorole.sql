CREATE TABLE IF NOT EXISTS autorole_settings (
    guild_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    PRIMARY KEY (guild_id, role_id)
);