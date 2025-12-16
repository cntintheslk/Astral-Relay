// ============================================================
// ASTRAL RELAY — INTERACTION CREATE EVENT
// Central dispatcher for all Discord interactions.
// ============================================================

const logger = require("../core/logger");
const {
    createErrorEmbed,
    createInfoEmbed,
} = require("../core/embedStyles");

const approvalHandler = require("./interactionButtons/registrationApproval");
const dbAdminService = require("../services/dbAdminService");
const moduleRegistry = require("../services/moduleRegistry");

// ============================================================
// EVENT HANDLER
// ============================================================

module.exports = {
    name: "interactionCreate",

    async execute(interaction) {
        try {
            // AUTOCOMPLETE
            if (interaction.isAutocomplete()) {
                if (interaction.commandName !== "features") return;

                const focused = interaction.options.getFocused(true);
                if (focused.name !== "name") return;

                const features = new Set();
                for (const command of interaction.client.commands.values()) {
                    if (command.module) {
                        features.add(command.module.toLowerCase());
                    }
                }

                return interaction.respond(
                    [...features]
                        .filter(f =>
                            f.includes(focused.value.toLowerCase())
                        )
                        .slice(0, 25)
                        .map(f => ({ name: f, value: f }))
                );
            }

            // DB ADMIN
            if (dbAdminService.canHandle(interaction)) {
                return dbAdminService.handle(interaction);
            }

            // REGISTRATION APPROVAL
            if (
                interaction.isButton() &&
                (interaction.customId.startsWith("approve_") ||
                 interaction.customId.startsWith("deny_"))
            ) {
                return approvalHandler.handle(interaction);
            }

            // SLASH COMMANDS
            if (interaction.isChatInputCommand()) {
                const command =
                    interaction.client.commands.get(interaction.commandName);

                if (!command) {
                    logger.warn("Unknown slash command invoked.", {
                        command: interaction.commandName,
                        userId: interaction.user.id,
                    });

                    return interaction.reply({
                        embeds: [
                            createErrorEmbed(
                                "Unknown Command",
                                "This command is not recognised."
                            ),
                        ],
                        flags: 64,
                    });
                }

                // MODULE GUARD (SERVICE-ENFORCED)
                if (command.module) {
                    const guildId = interaction.guild?.id;

                    if (
                        guildId &&
                        !moduleRegistry.requireEnabled(
                            guildId,
                            command.module,
                            "SLASH_COMMAND"
                        )
                    ) {
                        return interaction.reply({
                            embeds: [
                                createInfoEmbed(
                                    "Module Disabled",
                                    `The **${command.module}** module is disabled in this server.`
                                ),
                            ],
                            flags: 64,
                        });
                    }
                }

                return command.execute(interaction);
            }

        } catch (err) {
            logger.error("Unhandled interaction error.", {
                error: err?.stack || String(err),
                interaction: interaction?.id,
            });

            try {
                const errorEmbed = createErrorEmbed(
                    "Unexpected Error",
                    "Something went wrong while processing this interaction."
                );

                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ embeds: [errorEmbed] });
                } else {
                    await interaction.reply({
                        embeds: [errorEmbed],
                        flags: 64,
                    });
                }
            } catch {
                logger.critical(
                    "Failed to send error response for interaction."
                );
            }
        }
    },
};
