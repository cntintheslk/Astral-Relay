// ============================================================
// ASTRAL RELAY — REGISTRATION APPROVAL SERVICE
// Owns all registration approval / denial business logic.
// ============================================================

const logger = require("../core/logger");
const db = require("./database");

const permissionService = require("./permissionService");
const guildConfigService = require("./guildConfigService");

// ------------------------------------------------------------
// INTERNAL HELPERS
// ------------------------------------------------------------

function parseInteraction(interaction) {
    const id = interaction.customId;

    if (!id || (!id.startsWith("approve_") && !id.startsWith("deny_"))) {
        return null;
    }

    const [, regId] = id.split("_");

    if (!regId) {
        return null;
    }

    return {
        isApprove: id.startsWith("approve_"),
        regId,
    };
}

function fetchRegistration(regId) {
    return db.prepare(`
        SELECT *
        FROM registrations
        WHERE id = ?
    `).get(regId);
}

function updateRegistration(regId, status, approverId) {
    db.prepare(`
        UPDATE registrations
        SET status = ?,
            approved_by = ?
        WHERE id = ?
    `).run(status, approverId, regId);
}

// ------------------------------------------------------------
// MAIN HANDLER
// ------------------------------------------------------------

async function handle(interaction) {
    if (!interaction.isButton()) return;

    const parsed = parseInteraction(interaction);
    const guild = interaction.guild;
    const guildId = guild?.id;

    if (!parsed || !guildId) {
        logger.warn("Malformed registration approval interaction.", {
            customId: interaction.customId,
            userId: interaction.user.id,
            guildId,
        });
        return;
    }

    const { isApprove, regId } = parsed;

    // --------------------------------------------------------
    // LOAD REGISTRATION
    // --------------------------------------------------------

    const reg = fetchRegistration(regId);

    if (!reg) {
        logger.warn("Registration approval attempted on missing record.", {
            regId,
            userId: interaction.user.id,
            guildId,
        });

        return interaction.reply({
            content: "⚠️ That registration no longer exists.",
            flags: 64,
        });
    }

    // --------------------------------------------------------
    // PERMISSION CHECK
    // --------------------------------------------------------

    const settings = await guildConfigService.getSettings(guildId);
    const approverRoles = JSON.parse(settings?.approver_roles || "[]");

    const member = await guild.members.fetch(interaction.user.id);

    const allowed = permissionService.canApproveRegistration(
        interaction.user,
        member,
        approverRoles
    );

    if (!allowed) {
        logger.security("Registration approval denied (permission).", {
            regId,
            userId: interaction.user.id,
            guildId,
        });

        return interaction.reply({
            content: "❌ You do not have permission to approve or deny registrations.",
            flags: 64,
        });
    }

    // --------------------------------------------------------
    // TARGET MEMBER
    // --------------------------------------------------------

    const targetMember = await guild.members.fetch(reg.user_id);

    // --------------------------------------------------------
    // INTENT LOG (BEFORE MUTATION)
    // --------------------------------------------------------

    logger.info("Updating registration status.", {
        regId,
        status: isApprove ? "approved" : "denied",
        approver: interaction.user.id,
        guildId,
    });

    // --------------------------------------------------------
    // APPROVE PATH
    // --------------------------------------------------------

    if (isApprove) {
        updateRegistration(regId, "approved", interaction.user.id);

        const rankKey = reg.rank.toLowerCase();
        const roleId = settings?.[`role_${rankKey}`];

        if (roleId) {
            try {
                await targetMember.roles.add(roleId);
            } catch (err) {
                logger.error("Failed to assign registration role.", {
                    roleId,
                    userId: reg.user_id,
                    guildId,
                    error: err?.stack || err.message,
                });
            }
        }

        const nickname = `[${reg.rank}] | ${reg.ign}`;
        if (targetMember.manageable) {
            try {
                await targetMember.setNickname(nickname);
            } catch (err) {
                logger.warn("Failed to set registration nickname.", {
                    userId: reg.user_id,
                    guildId,
                    error: err?.stack || err.message,
                });
            }
        }

        logger.success("Registration approved.", {
            regId,
            userId: reg.user_id,
            rank: reg.rank,
            approver: interaction.user.id,
            guildId,
        });

        return interaction.update({
            content: `✅ Registration **approved** for <@${reg.user_id}> as **${reg.rank}**.`,
            embeds: [],
            components: [],
        });
    }

    // --------------------------------------------------------
    // DENY PATH
    // --------------------------------------------------------

    updateRegistration(regId, "denied", interaction.user.id);

    logger.warn("Registration denied.", {
        regId,
        userId: reg.user_id,
        rank: reg.rank,
        approver: interaction.user.id,
        guildId,
    });

    return interaction.update({
        content: `❌ Registration **denied** for <@${reg.user_id}>.`,
        embeds: [],
        components: [],
    });
}

module.exports = {
    handle,
};
