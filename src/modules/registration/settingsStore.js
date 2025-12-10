const db = require("../../core/database");

function getSettings(guildId) {
    return db.prepare(`
        SELECT * FROM registration_settings WHERE guild_id = ?
    `).get(guildId);
}

function saveSettings(guildId, settings) {
    const {
        role_r1, role_r2, role_r3, role_r4, role_r5,
        require_approval_r4, require_approval_r5,
        approver_roles
    } = settings;

    db.prepare(`
        INSERT INTO registration_settings
        (guild_id, role_r1, role_r2, role_r3, role_r4, role_r5,
         require_approval_r4, require_approval_r5, approver_roles)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(guild_id)
        DO UPDATE SET
            role_r1 = excluded.role_r1,
            role_r2 = excluded.role_r2,
            role_r3 = excluded.role_r3,
            role_r4 = excluded.role_r4,
            role_r5 = excluded.role_r5,
            require_approval_r4 = excluded.require_approval_r4,
            require_approval_r5 = excluded.require_approval_r5,
            approver_roles = excluded.approver_roles
    `).run(
        guildId,
        role_r1, role_r2, role_r3, role_r4, role_r5,
        require_approval_r4, require_approval_r5,
        approver_roles
    );
}

module.exports = {
    getSettings,
    saveSettings
};
