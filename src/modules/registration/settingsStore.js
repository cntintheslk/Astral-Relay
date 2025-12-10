const db = require("../../core/database");

/**
 * Normalize boolean-like inputs into clean integer flags (0/1)
 */
function normalizeBoolean(input, fallback = 0) {
    if (input === undefined || input === null) {
        return fallback ? 1 : 0;
    }

    // truthy values
    if (
        input === true ||
        input === "true" ||
        input === 1 ||
        input === "1"
    ) {
        return 1;
    }

    return 0;
}

/**
 * Fetch raw settings row
 */
function getSettings(guildId) {
    return db.prepare(`
        SELECT *
        FROM registration_settings
        WHERE guild_id = ?
    `).get(guildId);

        return row || {
        approver_roles: "[]",
        role_r1: null,
        role_r2: null,
        role_r3: null,
        role_r4: null,
        role_r5: null,
        registration_log_channel_id: null
        };
}

/**
 * Transform raw DB row into structured config
 */
function getRegistrationConfig(guildId) {
    const row = getSettings(guildId);

    return {
        roles: {
            R1: row?.role_r1 || null,
            R2: row?.role_r2 || null,
            R3: row?.role_r3 || null,
            R4: row?.role_r4 || null,
            R5: row?.role_r5 || null,
        },

        // FIXED: SQLite returns strings → must use Number()
        approvalRequired: {
            R1: row && Number(row.require_approval_r1) === 1,
            R2: row && Number(row.require_approval_r2) === 1,
            R3: row && Number(row.require_approval_r3) === 1,
            R4: row && Number(row.require_approval_r4) === 1,
            R5: row && Number(row.require_approval_r5) === 1,
        },

        approverRoleIds: row?.approver_roles
            ? JSON.parse(row.approver_roles)
            : [],
    };
}

/**
 * Save/update settings
 */
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
            role_r2 = excluded.role_r2,
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

/**
 * Save role mapping for ranks R1–R5
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
 * Setting approval requirements for R1–R5
 * (This was the bug source — NOW FIXED)
 */
function setApprovalConfig(guildId, config) {
    const existing = getSettings(guildId) || {};

    saveSettings(guildId, {
        ...existing,
        require_approval_r1: normalizeBoolean(config.R1, existing.require_approval_r1),
        require_approval_r2: normalizeBoolean(config.R2, existing.require_approval_r2),
        require_approval_r3: normalizeBoolean(config.R3, existing.require_approval_r3),
        require_approval_r4: normalizeBoolean(config.R4, existing.require_approval_r4),
        require_approval_r5: normalizeBoolean(config.R5, existing.require_approval_r5),
    });
}

/**
 * Save approver role list
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
    setApproverRoles,
    getRegistrationConfig
};
