// ============================================================
// ASTRAL RELAY — REGISTRATION LOOKUP
// Retrieves approved registration metadata for a guild member.
// ============================================================

const db = require("../../services/database");
const logger = require("../../core/logger");

module.exports = function getRegistrationInfo(guildId, userId) {
    const row = db
        .prepare(`
            SELECT ign, rank
            FROM registrations
            WHERE guild_id = ?
              AND user_id = ?
              AND status = 'approved'
        `)
        .get(guildId, userId);

    // Expected condition: member may not be registered or approved
    if (!row) {
        logger.debug("No approved registration found for member.", {
            guildId,
            userId,
        });

        return {
            ign: null,
            rank: null,
        };
    }

    return {
        ign: row.ign,
        rank: row.rank,
    };
};
