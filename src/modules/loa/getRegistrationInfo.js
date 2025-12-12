const db = require("../../core/database");

module.exports = function getRegistrationInfo(guildId, userId) {
    const row = db.prepare(`
        SELECT ign, rank 
        FROM registrations 
        WHERE guild_id = ? AND user_id = ? AND status = 'approved'
    `).get(guildId, userId);

    if (!row) {
        return { ign: null, rank: null };
    }

    return {
        ign: row.ign,
        rank: row.rank
    };
};
