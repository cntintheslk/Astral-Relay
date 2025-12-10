// src/events/interactionCreate.js

const logger = require("../core/logger");
const { createErrorEmbed } = require("../core/embedStyles");
const dbAdminUI = require("../modules/dbadmin/dbAdminUI");
const dbAdmin = require("../modules/dbadmin/dbAdmin");
const config = require("../core/config");
const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

function isOwnerOrAdmin(interaction) {
    if (config.ownerIds.includes(interaction.user.id)) return true;
    return interaction.member?.permissions?.has("Administrator");
}

module.exports = {
    name: "interactionCreate",
    async execute(interaction) {
        try {

            // ============================================================
            // HANDLE DB ADMIN PANEL (BUTTONS + SELECT MENUS)
            // ============================================================

            //
            // SELECT MENU: choose table
            //
            if (interaction.isStringSelectMenu() && interaction.customId === "dbadmin:select-table") {
                if (!isOwnerOrAdmin(interaction)) return;

                const table = interaction.values[0];

                return interaction.update({
                    embeds: [
                        dbAdminUI.makeSchemaEmbed(table)
                    ],
                    components: dbAdminUI.makeMainPanel()
                });
            }

            //
            // BUTTONS
            //
            if (interaction.isButton() && interaction.customId.startsWith("dbadmin:")) {
                if (!isOwnerOrAdmin(interaction)) return;

                const parts = interaction.customId.split(":");
                const action = parts[1];
                const table = parts[2];
                const value = parts[3] ? parseInt(parts[3]) : 0;

                // View schema
                if (action === "view-schema") {
                    return interaction.update({
                        embeds: [dbAdminUI.makeSchemaEmbed(table)],
                        components: dbAdminUI.makeMainPanel()
                    });
                }

                // View rows (page 0)
                if (action === "view-rows") {
                    const { embed, components } = dbAdminUI.makeRowsPage(table, 0);
                    return interaction.update({ embeds: [embed], components });
                }

                // Rows: next page
                if (action === "rows-next") {
                    const { embed, components } = dbAdminUI.makeRowsPage(table, value + 1);
                    return interaction.update({ embeds: [embed], components });
                }

                // Rows: prev page
                if (action === "rows-prev") {
                    const { embed, components } = dbAdminUI.makeRowsPage(table, Math.max(0, value - 1));
                    return interaction.update({ embeds: [embed], components });
                }

                // Validate DB
                if (action === "validate") {
                    const issues = dbAdmin.validateSchema();

                    return interaction.update({
                        embeds: [
                            createInfoEmbed("Validation Results", issues.join("\n"))
                        ],
                        components: dbAdminUI.makeMainPanel()
                    });
                }

                // Auto-repair
                if (action === "repair") {
                    const result = dbAdmin.autoRepairSchema();
                    const summary =
                        "**Issues:**\n" +
                        result.issues.join("\n") +
                        "\n\n**Fixes Applied:**\n" +
                        (result.fixes.length ? result.fixes.join("\n") : "No fixes needed");

                    return interaction.update({
                        embeds: [createSuccessEmbed("Schema Repaired", summary)],
                        components: dbAdminUI.makeMainPanel()
                    });
                }
            }
            // ============================================================
            //  REGISTRATION APPROVAL BUTTON HANDLING
            // ============================================================

            const { getSettings } = require("../modules/registration/settingsStore");
            const db = require("../core/database");

            if (interaction.isButton() && interaction.customId.startsWith("regapprove:")) {
                const parts = interaction.customId.split(":");  // regapprove:approve:userId:guildId
                const action = parts[1];
                const targetUserId = parts[2];
                const guildId = parts[3];

                // Only approvers or owners/admins may act
                const settings = getSettings(guildId);
                const approverRoles = JSON.parse(settings.approver_roles || "[]");

                const member = await interaction.guild.members.fetch(interaction.user.id);

                const isApprover =
                    config.ownerIds.includes(interaction.user.id) ||
                    member.permissions.has("Administrator") ||
                    approverRoles.some(roleId => member.roles.cache.has(roleId));

                if (!isApprover) {
                    return interaction.reply({
                        content: "❌ You do not have permission to approve registrations.",
                        flags: 64
                    });
                }

                // Load the registration entry
                const reg = db.prepare(`
                    SELECT * FROM registrations 
                    WHERE user_id = ? AND guild_id = ? AND status = 'pending'
                    ORDER BY timestamp DESC LIMIT 1
                `).get(targetUserId, guildId);

                if (!reg) {
                    return interaction.reply({
                        content: "⚠️ No pending registration found.",
                        flags: 64
                    });
                }

                const targetMember = await interaction.guild.members.fetch(reg.user_id);

                if (action === "approve") {

                    // Assign the role
                    const roleField = `role_${reg.rank.toLowerCase()}`;
                    const roleId = settings[roleField];

                    try {
                        if (roleId) await targetMember.roles.add(roleId);
                    } catch (err) {
                        console.error(err);
                    }

                    // Update DB
                    db.prepare(`
                        UPDATE registrations 
                        SET status = 'approved'
                        WHERE id = ?
                    `).run(reg.id);

                    return interaction.update({
                        content: `✅ <@${reg.user_id}> has been **approved** as **${reg.rank}**.`,
                        components: []
                    });
                }

                if (action === "deny") {

                    // Update DB
                    db.prepare(`
                        UPDATE registrations 
                        SET status = 'denied'
                        WHERE id = ?
                    `).run(reg.id);

                    return interaction.update({
                        content: `❌ <@${reg.user_id}>'s registration has been **denied**.`,
                        components: []
                    });
                }
            }


            // ============================================================
            // SLASH COMMAND HANDLER (this MUST stay after UI handlers)
            // ============================================================

            if (interaction.isChatInputCommand()) {
                const command = interaction.client.commands.get(interaction.commandName);

                if (!command) {
                    logger.warn(`Unknown slash command: ${interaction.commandName}`);
                    return interaction.reply({
                        embeds: [createErrorEmbed("Error", "Unknown command.")],
                        flags: 64
                    });
                }

                await command.execute(interaction);
            }


        } catch (err) {
            logger.error(`Unhandled interaction error: ${err.stack || err}`);

            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({
                        embeds: [
                            createErrorEmbed("Unexpected Error", "Something went wrong processing this interaction.")
                        ]
                    });
                } else {
                    await interaction.reply({
                        embeds: [
                            createErrorEmbed("Unexpected Error", "Something went wrong processing this interaction.")
                        ],
                        flags: 64
                    });
                }
            } catch (err2) {
                logger.error("Failed to send error reply for interaction.");
            }
        }
    }
};
