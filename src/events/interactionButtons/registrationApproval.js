// src/interactionButtons/registrationApproval.js

const db = require("../../core/database");
const logger = require("../../core/logger");
const { getSettings } = require("../../modules/registration/settingsStore");
const config = require("../../core/config");
const { log } = require("../../core/discordLogger");

module.exports = {
    async handle(interaction) {
        if (!interaction.isButton()) return;

        const id = interaction.customId;

        if (!id.startsWith("approve_") && !id.startsWith("deny_")) return;

        const isApprove = id.startsWith("approve_");
        const regId = id.split("_")[1];

        const guild = interaction.guild;
        const guildId = guild.id;

        // Load registration
        const reg = db.prepare(`
            SELECT *
            FROM registrations
            WHERE id = ?
        `).get(regId);

        if (!reg) {
            return interaction.reply({
                content: "⚠️ That registration no longer exists.",
                flags: 64
            });
        }

        // Permission check: owners, admins, approver roles
        const settings = getSettings(guildId) || {};
        const approverRoles = JSON.parse(settings.approver_roles || "[]");

        const member = await guild.members.fetch(interaction.user.id);

        const isOwner = config.ownerIds?.includes(interaction.user.id);
        const isAdmin = member.permissions.has("Administrator");
        const hasApproverRole = approverRoles.some(rid => member.roles.cache.has(rid));

        if (!isOwner && !isAdmin && !hasApproverRole) {
            return interaction.reply({
                content: "❌ You do not have permission to approve or deny registrations.",
                flags: 64
            });
        }

        const targetMember = await guild.members.fetch(reg.user_id);

        if (isApprove) {
            // Resolve role for this rank
            const rankKey = reg.rank.toLowerCase(); // "r5"
            const roleField = `role_${rankKey}`;
            const roleId = settings[roleField];

            // Update DB
            db.prepare(`
                UPDATE registrations
                SET status = 'approved',
                    approved_by = ?
                WHERE id = ?
            `).run(interaction.user.id, regId);

            // Assign role
            if (roleId) {
                try {
                    await targetMember.roles.add(roleId);
                } catch (err) {
                    logger.error(`[approval] Failed to assign role ${roleId} to ${reg.user_id}: ${err.message}`);
                }
            }

            // Set nickname
            const nick = `[${reg.rank}] | ${reg.ign}`;
            if (targetMember.manageable) {
                try {
                    await targetMember.setNickname(nick);
                } catch (err) {
                    logger.warn(`[approval] Failed to set nickname for ${reg.user_id}: ${err.message}`);
                }
            }

            log(
                "SUCCESS",
                "Registration Approved",
                `User: <@${reg.user_id}>\nRank: **${reg.rank}**\nIGN: \`${reg.ign}\`\nApproved by: <@${interaction.user.id}>`
            );

            return interaction.update({
                content: `✅ Registration **approved** for <@${reg.user_id}> as **${reg.rank}**.`,
                embeds: [],
                components: []
            });
        }

        // Deny path
        db.prepare(`
            UPDATE registrations
            SET status = 'denied',
                approved_by = ?
        WHERE id = ?
        `).run(interaction.user.id, regId);

        log(
            "WARN",
            "Registration Denied",
            `User: <@${reg.user_id}>\nRank: **${reg.rank}**\nIGN: \`${reg.ign}\`\nDenied by: <@${interaction.user.id}>`
        );

        return interaction.update({
            content: `❌ Registration **denied** for <@${reg.user_id}>.`,
            embeds: [],
            components: []
        });
    }
};
