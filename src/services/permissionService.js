// ============================================================
// ASTRAL RELAY — PERMISSION SERVICE
// Centralised access-control and policy enforcement.
// ============================================================

const logger = require("../core/logger");
const config = require("../core/config");

// ------------------------------------------------------------
// CORE PERMISSION CHECKS
// ------------------------------------------------------------

/**
 * Determines whether a user is a bot owner.
 */
function isOwner(userId) {
    return Boolean(
        userId && config.ownerIds?.includes(userId)
    );
}

/**
 * Determines whether a guild member has Administrator permission.
 */
function isAdmin(member) {
    return Boolean(
        member?.permissions?.has("Administrator")
    );
}

/**
 * Determines whether a user is a bot owner or guild administrator.
 * (Interaction-based convenience wrapper)
 */
function isOwnerOrAdmin(interaction) {
    return (
        isOwner(interaction?.user?.id) ||
        isAdmin(interaction?.member)
    );
}

/**
 * Enforces owner/admin access and logs violations.
 */
function requireOwnerOrAdmin(interaction, context = "UNKNOWN") {
    const allowed = isOwnerOrAdmin(interaction);

    if (!allowed) {
        logger.security("Permission denied.", {
            context,
            userId: interaction?.user?.id,
            guildId: interaction?.guild?.id,
        });
    }

    return allowed;
}

// ------------------------------------------------------------
// FEATURE-SPECIFIC POLICIES
// ------------------------------------------------------------

/**
 * Determines whether a user may approve or deny registrations.
 *
 * Policy:
 *  - Bot owners are always allowed
 *  - Guild administrators are allowed
 *  - Members with an approver role are allowed
 */
function canApproveRegistration(user, member, approverRoles = []) {
    // Owner override
    if (isOwner(user?.id)) {
        return true;
    }

    // Guild admin override
    if (isAdmin(member)) {
        return true;
    }

    // Role-based approval
    if (Array.isArray(approverRoles) && member?.roles) {
        return approverRoles.some(roleId =>
            member.roles.cache.has(roleId)
        );
    }

    return false;
}

module.exports = {
    // Core checks
    isOwner,
    isAdmin,
    isOwnerOrAdmin,
    requireOwnerOrAdmin,

    // Feature policies
    canApproveRegistration,
};
