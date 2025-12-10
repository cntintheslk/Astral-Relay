CREATE TABLE IF NOT EXISTS autorole_settings (
    guild_id TEXT NOT NULL,
    role_id TEXT NOT NULL,

    PRIMARY KEY (guild_id, role_id)
);


ALTER TABLE autorole_settings RENAME TO autorole_settings_old;

CREATE TABLE autorole_settings (
    guild_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    PRIMARY KEY (guild_id, role_id)
);

DROP TABLE autorole_settings_old;
