const db = require("../../core/database");

function getAutoRole(guildId) {
    const row = db.prepare(`
        SELECT role_id
        FROM autorole_settings
        WHERE guild_id = ?
    `).get(guildId);

    return row?.role_id || null;
}

function setAutoRole(guildId, roleId) {
    db.prepare(`
        INSERT INTO autorole_settings (guild_id, role_id)
        VALUES (?, ?)
        ON CONFLICT(guild_id) DO UPDATE SET role_id = excluded.role_id
    `).run(guildId, roleId);
}

function clearAutoRole(guildId) {
    db.prepare(`
        DELETE FROM autorole_settings
        WHERE guild_id = ?
    `).run(guildId);
}

module.exports = {
    getAutoRole,
    setAutoRole,
    clearAutoRole
};
