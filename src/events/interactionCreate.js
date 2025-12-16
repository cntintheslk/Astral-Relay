// src/events/interactionCreate.js

const logger = require("../core/logger");
const config = require("../core/config");
const { createErrorEmbed, createInfoEmbed, createSuccessEmbed } = require("../core/embedStyles");

const dbAdminUI = require("../modules/dbadmin/dbAdminUI");
const dbAdmin = require("../modules/dbadmin/dbAdmin");
const approvalHandler = require("./interactionButtons/registrationApproval");

const db = require("../core/database");

const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

// ============================================================
// HELPERS
// ============================================================
function isOwnerOrAdmin(interaction) {
    if (config.ownerIds?.includes(interaction.user.id)) return true;
    return interaction.member?.permissions?.has("Administrator");
}

/**
 * Check if a module is enabled for a specific guild.
 * Defaults to ENABLED if no record exists.
 */
function isModuleEnabled(guildId, moduleName) {
    const row = db.prepare(`
        SELECT enabled
        FROM guild_modules
        WHERE guild_id = ? AND module = ?
    `).get(guildId, moduleName);

    return row?.enabled !== 0;
}

module.exports = {
    name: "interactionCreate",

    async execute(interaction) {
        try {
            // ============================================================
            // 0) AUTOCOMPLETE — MUST RUN FIRST
            // ============================================================
            if (interaction.isAutocomplete()) {
                if (interaction.commandName !== "features") return;

                const focused = interaction.options.getFocused(true);

                // Only autocomplete the "name" option
                if (focused.name !== "name") return;

                const features = new Set();
                for (const command of interaction.client.commands.values()) {
                    if (command.module) {
                        features.add(command.module.toLowerCase());
                    }
                }

                const results = [...features]
                    .filter(f =>
                        f.includes(focused.value.toLowerCase())
                    )
                    .slice(0, 25) // Discord hard limit
                    .map(f => ({ name: f, value: f }));

                return interaction.respond(results);
            }

            // ============================================================
            // 1) DB ADMIN PANEL — SELECT MENU
            // ============================================================
            if (interaction.isStringSelectMenu() && interaction.customId === "dbadmin:select-table") {
                if (!isOwnerOrAdmin(interaction)) return;

                const table = interaction.values[0];

                return interaction.update({
                    embeds: [dbAdminUI.makeSchemaEmbed(table)],
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
            // 4) SLASH COMMANDS (WITH PER-GUILD MODULE GUARD)
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

                // 🔐 MODULE PER-GUILD ENABLE CHECK
                if (command.module) {
                    const guildId = interaction.guild?.id;

                    if (guildId && !isModuleEnabled(guildId, command.module)) {
                        return interaction.reply({
                            embeds: [
                                createInfoEmbed(
                                    "Module Disabled",
                                    `The **${command.module}** module is disabled in this server.`
                                )
                            ],
                            flags: 64
                        });
                    }
                }

                await command.execute(interaction);
            }

        } catch (err) {
            logger.error(`Unhandled interaction error: ${err.stack || err}`);

            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({
                        embeds: [
                            createErrorEmbed(
                                "Unexpected Error",
                                "Something went wrong processing this interaction."
                            )
                        ]
                    });
                } else {
                    await interaction.reply({
                        embeds: [
                            createErrorEmbed(
                                "Unexpected Error",
                                "Something went wrong processing this interaction."
                            )
                        ],
                        flags: 64
                    });
                }
            } catch {
                logger.error("Failed to send error reply for interaction.");
            }
        }
    }
};
