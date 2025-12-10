const db = require("../../core/database");

/**
 * Fetch registration settings for a guild.
 */
function getSettings(guildId) {
    return db.prepare(`
        SELECT *
        FROM registration_settings
        WHERE guild_id = ?
    `).get(guildId);
}

/**
 * Save all settings at once (internal use)
 */
function saveSettings(guildId, settings) {
    const {
        role_r1, role_r2, role_r3, role_r4, role_r5,
        require_approval_r4, require_approval_r5,
        approver_roles
    } = settings;

    db.prepare(`
        INSERT INTO registration_settings (
            guild_id,
            role_r1, role_r2, role_r3, role_r4, role_r5,
            require_approval_r4, require_approval_r5,
            approver_roles
        )
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
            approver_roles = excluded.approver_roles;
    `).run(
        guildId,
        role_r1, role_r2, role_r3, role_r4, role_r5,
        require_approval_r4, require_approval_r5,
        approver_roles
    );
}

/**
 * PUBLIC: Save R1–R5 role IDs
 */
function setRegistrationRoles(guildId, roles) {
    const existing = getSettings(guildId) || {};

    saveSettings(guildId, {
        ...existing,
        role_r1: roles.r1 ?? existing.role_r1 ?? null,
        role_r2: roles.r2 ?? existing.role_r2 ?? null,
        role_r3: roles.r3 ?? existing.role_r3 ?? null,
        role_r4: roles.r4 ?? existing.role_r4 ?? null,
        role_r5: roles.r5 ?? existing.role_r5 ?? null,
    });
}

/**
 * PUBLIC: Save approval requirements for R4 + R5
 */
function setApprovalConfig(guildId, config) {
    const existing = getSettings(guildId) || {};

    saveSettings(guildId, {
        ...existing,
        require_approval_r4: config.r4 ?? existing.require_approval_r4 ?? 0,
        require_approval_r5: config.r5 ?? existing.require_approval_r5 ?? 0,
    });
}

/**
 * PUBLIC: Store approver roles (array → JSON)
 */
function setApproverRoles(guildId, approverRoles) {
    const existing = getSettings(guildId) || {};

    saveSettings(guildId, {
        ...existing,
        approver_roles: JSON.stringify(approverRoles),
    });
}

module.exports = {
    getSettings,
    saveSettings,
    setRegistrationRoles,
    setApprovalConfig,
    setApproverRoles
};
