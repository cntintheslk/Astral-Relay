const db = require("../../core/database");

function getRegistrationConfig(guildId) {
    const row = db.prepare(`
        SELECT *
        FROM registration_settings
        WHERE guild_id = ?
    `).get(guildId);

    // No config yet → return clean defaults
    if (!row) {
        return {
            roles: {
                R1: null,
                R2: null,
                R3: null,
                R4: null,
                R5: null,
            },
            approvalRequired: {
                R1: false,
                R2: false,
                R3: false,
                R4: false,
                R5: false,
            },
            approverRoleIds: [],
        };
    }

    return {
        roles: {
            R1: row.role_r1 ?? null,
            R2: row.role_r2 ?? null,
            R3: row.role_r3 ?? null,
            R4: row.role_r4 ?? null,
            R5: row.role_r5 ?? null,
        },
        approvalRequired: {
            R1: row.require_approval_r1 === 1,
            R2: row.require_approval_r2 === 1,
            R3: row.require_approval_r3 === 1,
            R4: row.require_approval_r4 === 1,
            R5: row.require_approval_r5 === 1,
        },
        approverRoleIds: row.approver_roles
            ? JSON.parse(row.approver_roles)
            : [],
    };
}


function getSettings(guildId) {
    return db.prepare(`
        SELECT *
        FROM registration_settings
        WHERE guild_id = ?
    `).get(guildId);
}

function saveSettings(guildId, settings) {
    const {
        role_r1, role_r2, role_r3, role_r4, role_r5,
        require_approval_r1,
        require_approval_r2,
        require_approval_r3,
        require_approval_r4,
        require_approval_r5,
        approver_roles
    } = settings;

    db.prepare(`
        INSERT INTO registration_settings (
            guild_id,
            role_r1, role_r2, role_r3, role_r4, role_r5,
            require_approval_r1, require_approval_r2, require_approval_r3,
            require_approval_r4, require_approval_r5,
            approver_roles
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(guild_id)
        DO UPDATE SET
            role_r1 = excluded.role_r1,
            role_r2 = excluded.role_r_r2,
            role_r3 = excluded.role_r3,
            role_r4 = excluded.role_r4,
            role_r5 = excluded.role_r5,
            require_approval_r1 = excluded.require_approval_r1,
            require_approval_r2 = excluded.require_approval_r2,
            require_approval_r3 = excluded.require_approval_r3,
            require_approval_r4 = excluded.require_approval_r4,
            require_approval_r5 = excluded.require_approval_r5,
            approver_roles = excluded.approver_roles;
    `).run(
        guildId,
        role_r1, role_r2, role_r3, role_r4, role_r5,
        require_approval_r1,
        require_approval_r2,
        require_approval_r3,
        require_approval_r4,
        require_approval_r5,
        approver_roles
    );
}

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
 * Set approval configuration for ANY rank (R1–R5)
 */
function setApprovalConfig(guildId, config) {
    const existing = getSettings(guildId) || {};

    saveSettings(guildId, {
        ...existing,
        require_approval_r1: config.R1 ?? existing.require_approval_r1 ?? 0,
        require_approval_r2: config.R2 ?? existing.require_approval_r2 ?? 0,
        require_approval_r3: config.R3 ?? existing.require_approval_r3 ?? 0,
        require_approval_r4: config.R4 ?? existing.require_approval_r4 ?? 0,
        require_approval_r5: config.R5 ?? existing.require_approval_r5 ?? 0,
    });
}

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
    setApproverRoles,
    getRegistrationConfig
};
