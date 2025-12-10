// src/events/interactionCreate.js

const logger = require("../core/logger");
const { createInfoEmbed, createErrorEmbed } = require("../core/embedStyles");
const { logError } = require("../core/discordLogger");

module.exports = {
    name: "interactionCreate",

    async execute(interaction) {
        // Only handle slash commands
        if (!interaction.isChatInputCommand()) return;

        const client = interaction.client;
        const command = client.commands.get(interaction.commandName);

        if (!command) {
            logger.warn(`Command not found: ${interaction.commandName}`);
            return interaction.reply({
                embeds: [
                    createErrorEmbed(
                        "Unknown Command",
                        "This command is not registered or has been removed."
                    )
                ],
                flags: 64
            });
        }

        try {
            // Execute the command
            await command.execute(interaction, client);

        } catch (err) {
            // Console log
            logger.error(`Command execution error (${interaction.commandName}):`);
            console.error(err);

            // Discord structured log
            logError(`command:${interaction.commandName}`, err);

            // Prepare error embed
            const errorEmbed = createErrorEmbed(
                "Command Error",
                "An unexpected error occurred while running this command.\nPlease try again later."
            );

            // If already replied/deferred → followUp
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({ embeds: [errorEmbed], flags: 64 }).catch(() => {});
            } else {
                await interaction.reply({ embeds: [errorEmbed], flags: 64 }).catch(() => {});
            }
        }
    },
};
