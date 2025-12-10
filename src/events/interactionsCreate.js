// src/events/interactionCreate.js

const logger = require("../core/logger");
const { createInfoEmbed, createErrorEmbed } = require("../core/embedStyles");

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
                ephemeral: true
            });
        }

        try {
            // Execute the command
            await command.execute(interaction);
        } catch (err) {
            logger.error(`Command execution error (${interaction.commandName}):`);
            console.error(err);

            // Respond safely
            // Try to reply, but fall back to follow-up if interaction was already replied/deferred
            const errorEmbed = createErrorEmbed(
                "Command Error",
                "An unexpected error occurred while running this command.\nPlease try again later."
            );

            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true }).catch(() => {});
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(() => {});
            }
        }
    },
};
