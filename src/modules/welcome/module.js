// src/modules/welcomer/module.js

const logger = require("../../core/logger");
const db = require("../../services/database");

module.exports = {
    module: "welcomer",
    description: "Handles welcome messages when members join the server",

    /**
     * Called when the module is enabled for a guild
     */
    onEnable(guildId) {
        db.prepare(`
            INSERT INTO guild_modules (guild_id, module, enabled, updated_at)
            VALUES (?, ?, 1, ?)
            ON CONFLICT(guild_id, module)
            DO UPDATE SET
                enabled = 1,
                updated_at = excluded.updated_at
        `).run(guildId, this.name, Date.now());

        logger.info(`[Welcomer] Enabled for guild ${guildId}`);
    },

    /**
     * Called when the module is disabled for a guild
     */
    onDisable(guildId) {
        db.prepare(`
            UPDATE guild_modules
            SET enabled = 0, updated_at = ?
            WHERE guild_id = ? AND module = ?
        `).run(Date.now(), guildId, this.name);

        logger.info(`[Welcomer] Disabled for guild ${guildId}`);
    },

    /**
     * Check if the welcomer is enabled for a guild.
     * Defaults to ENABLED if no record exists.
     */
    isEnabled(guildId) {
        const row = db.prepare(`
            SELECT enabled
            FROM guild_modules
            WHERE guild_id = ? AND module = ?
        `).get(guildId, this.name);

        return row?.enabled !== 0;
    }
};
