// src/modules/registration/settingsStore.js

const db = require("../../core/database");
const logger = require("../../core/logger");
const { log } = require("../../core/discordLogger");

// Base shape for registration config
function getDefaultRegistrationConfig() {
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
            R3: true,
            R4: true,
            R5: true,
        },
        approverRoleIds: [],
    };
}

// --- low-level guild_settings access ---

function loadGuildSettingsRow(guildId) {
    try {
        const row = db
            .prepare("SELECT data FROM guild_settings WHERE guild_id = ?")
            .get(guildId);

        if (!row) return {};

        try {
            return JSON.parse(row.data || "{}");
        } catch (err) {
            logger.error(
                `[registration] Failed to parse guild_settings JSON for guild ${guildId}: ${err.message}`
            );
            log(
                "ERROR",
                "Guild Settings Parse Error",
                `Guild: \`${guildId}\`\n\`\`\`${err.message}\`\`\``
            );
            return {};
        }
    } catch (err) {
        logger.error(
            `[registration] DB error reading guild_settings for guild ${guildId}: ${err.message}`
        );
        log(
            "ERROR",
            "Guild Settings DB Error",
            `Failed to read guild_settings for guild \`${guildId}\`.\n\`\`\`${err.message}\`\`\``
        );
        return {};
    }
}

function saveGuildSettingsRow(guildId, settings) {
    const json = JSON.stringify(settings || {});

    try {
        db.prepare(`
            INSERT INTO guild_settings (guild_id, data)
            VALUES (?, ?)
            ON CONFLICT(guild_id) DO UPDATE SET data = excluded.data
        `).run(guildId, json);

        logger.info(`[registration] Saved guild_settings for guild ${guildId}.`);
    } catch (err) {
        logger.error(
            `[registration] DB error saving guild_settings for guild ${guildId}: ${err.message}`
        );
        log(
            "ERROR",
            "Guild Settings Save Error",
            `Failed to save guild_settings for guild \`${guildId}\`.\n\`\`\`${err.message}\`\`\``
        );
    }
}

// --- registration-specific helpers ---

function getRegistrationConfig(guildId) {
    const settings = loadGuildSettingsRow(guildId);
    const current = settings.registration || {};

    const base = getDefaultRegistrationConfig();

    // Merge current values into defaults
    const merged = {
        roles: {
            ...base.roles,
            ...(current.roles || {}),
        },
        approvalRequired: {
            ...base.approvalRequired,
            ...(current.approvalRequired || {}),
        },
        approverRoleIds: Array.isArray(current.approverRoleIds)
            ? current.approverRoleIds
            : base.approverRoleIds,
    };

    return merged;
}

function updateRegistrationConfig(guildId, updaterFn) {
    const settings = loadGuildSettingsRow(guildId);
    const currentReg = getRegistrationConfig(guildId);

    const updatedReg = updaterFn(currentReg) || currentReg;

    settings.registration = updatedReg;
    saveGuildSettingsRow(guildId, settings);

    return updatedReg;
}

// Set multiple R1–R5 role IDs at once (partial allowed)
function setRegistrationRoles(guildId, rolesPatch) {
    return updateRegistrationConfig(guildId, (reg) => {
        reg.roles = {
            ...reg.roles,
            ...rolesPatch,
        };
        return reg;
    });
}

// Set approval requirement for a specific rank
function setApprovalRequirement(guildId, rank, required) {
    return updateRegistrationConfig(guildId, (reg) => {
        reg.approvalRequired = {
            ...reg.approvalRequired,
            [rank]: !!required,
        };
        return reg;
    });
}

// Add an approver role
function addApproverRole(guildId, roleId) {
    return updateRegistrationConfig(guildId, (reg) => {
        if (!reg.approverRoleIds.includes(roleId)) {
            reg.approverRoleIds.push(roleId);
        }
        return reg;
    });
}

// Remove an approver role
function removeApproverRole(guildId, roleId) {
    return updateRegistrationConfig(guildId, (reg) => {
        reg.approverRoleIds = reg.approverRoleIds.filter((id) => id !== roleId);
        return reg;
    });
}

module.exports = {
    getRegistrationConfig,
    setRegistrationRoles,
    setApprovalRequirement,
    addApproverRole,
    removeApproverRole,
};
