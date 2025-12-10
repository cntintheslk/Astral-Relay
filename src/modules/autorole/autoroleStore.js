const db = require("../../core/database");

function getAutoRoles(guildId) {
    const rows = db.prepare(`
        SELECT role_id
        FROM autorole_settings
        WHERE guild_id = ?
    `).all(guildId);

    return rows.map(r => r.role_id);
}

function addAutoRole(guildId, roleId) {
    db.prepare(`
        INSERT OR IGNORE INTO autorole_settings (guild_id, role_id)
        VALUES (?, ?)
    `).run(guildId, roleId);
}

function removeAutoRole(guildId, roleId) {
    db.prepare(`
        DELETE FROM autorole_settings
        WHERE guild_id = ? AND role_id = ?
    `).run(guildId, roleId);
}

function clearAutoRoles(guildId) {
    db.prepare(`
        DELETE FROM autorole_settings
        WHERE guild_id = ?
    `).run(guildId);
}

module.exports = {
    getAutoRoles,
    addAutoRole,
    removeAutoRole,
    clearAutoRoles
};
