const db = require("./database");

function isModuleEnabled(guildId, moduleName) {
    const row = db.prepare(`
        SELECT enabled
        FROM guild_modules
        WHERE guild_id = ? AND module = ?
    `).get(guildId, moduleName);

    // Default: enabled unless explicitly disabled
    return row?.enabled !== 0;
}

module.exports = {
    isModuleEnabled
};
