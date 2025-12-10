// src/events/interactionCreate.js

const logger = require("../core/logger");
const config = require("../core/config");
const { createErrorEmbed, createInfoEmbed, createSuccessEmbed } = require("../core/embedStyles");
const dbAdminUI = require("../modules/dbadmin/dbAdminUI");
const dbAdmin = require("../modules/dbadmin/dbAdmin");
const approvalHandler = require("../interactionButtons/registrationApproval");
const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

function isOwnerOrAdmin(interaction) {
    if (config.ownerIds?.includes(interaction.user.id)) return true;
    return interaction.member?.permissions?.has("Administrator");
}

module.exports = {
    name: "interactionCreate",
    async execute(interaction) {
        try {
            // ============================================================
            // 1) DB ADMIN PANEL — SELECT MENU
            // ============================================================
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

            // ============================================================
            // 2) DB ADMIN PANEL — BUTTONS
            // ============================================================
            if (interaction.isButton() && interaction.customId.startsWith("dbadmin:")) {
                if (!isOwnerOrAdmin(interaction)) return;

                const parts = interaction.customId.split(":");
                const action = parts[1];
                const table = parts[2];
                const page = parts[3] ? parseInt(parts[3], 10) : 0;

                if (action === "view-schema") {
                    return interaction.update({
                        embeds: [dbAdminUI.makeSchemaEmbed(table)],
                        components: dbAdminUI.makeMainPanel()
                    });
                }

                if (action === "view-rows") {
                    const { embed, components } = dbAdminUI.makeRowsPage(table, 0);
                    return interaction.update({ embeds: [embed], components });
                }

                if (action === "rows-next") {
                    const { embed, components } = dbAdminUI.makeRowsPage(table, page + 1);
                    return interaction.update({ embeds: [embed], components });
                }

                if (action === "rows-prev") {
                    const { embed, components } = dbAdminUI.makeRowsPage(table, Math.max(0, page - 1));
                    return interaction.update({ embeds: [embed], components });
                }

                if (action === "validate") {
                    const issues = dbAdmin.validateSchema();

                    return interaction.update({
                        embeds: [
                            createInfoEmbed("Schema Validation", issues.join("\n"))
                        ],
                        components: dbAdminUI.makeMainPanel()
                    });
                }

                if (action === "repair") {
                    const result = dbAdmin.autoRepairSchema();
                    const summary =
                        "**Issues:**\n" +
                        result.issues.join("\n") +
                        "\n\n**Fixes Applied:**\n" +
                        (result.fixes.length ? result.fixes.join("\n") : "No fixes needed");

                    return interaction.update({
                        embeds: [createSuccessEmbed("Schema Repair Complete", summary)],
                        components: dbAdminUI.makeMainPanel()
                    });
                }
            }

            // ============================================================
            // 3) REGISTRATION APPROVAL BUTTONS
            // ============================================================
            if (
                interaction.isButton() &&
                (interaction.customId.startsWith("approve_") || interaction.customId.startsWith("deny_"))
            ) {
                return approvalHandler.handle(interaction);
            }

            // ============================================================
            // 4) SLASH COMMANDS
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
