// ============================================================
// ASTRAL RELAY — SYSTEM COMMAND REFRESH
// Forces Discord to re-register all slash commands.
// ============================================================

const { SlashCommandBuilder } = require("discord.js");
const { refreshCommands } = require("../../handlers/commandDeployer");
const permissionService = require("../../services/permissionService");
const config = require("../../core/config");
const logger = require("../../core/logger");
const { createSuccessEmbed, createErrorEmbed } = require("../../core/embedStyles");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("system")
        .setDescription("System-level commands")
        .addSubcommand(sub =>
            sub
                .setName("refresh")
                .setDescription("Force refresh all slash commands")
        ),

    scope: "global",

    async execute(interaction) {
        // -----------------------------------------------------
        // PERMISSION CHECK
        // -----------------------------------------------------

        if (!permissionService.isOwnerOrAdmin(interaction)) {
            return interaction.reply({
                content: "❌ You are not permitted to run this command.",
                flags: 64,
            });
        }

        // -----------------------------------------------------
        // ENVIRONMENT SAFETY
        // -----------------------------------------------------

        if (config.environment === "production") {
            return interaction.reply({
                embeds: [
                    createErrorEmbed(
                        "Command Refresh Blocked",
                        "For safety, command refresh is disabled in **production**."
                    )
                ],
                flags: 64,
            });
        }

        await interaction.deferReply({ flags: 64 });

        try {
            await refreshCommands(interaction.client);

            logger.warn("Manual command refresh executed.", {
                userId: interaction.user.id,
                environment: config.environment,
            });

            return interaction.editReply({
                embeds: [
                    createSuccessEmbed(
                        "Commands Refreshed",
                        "All slash commands have been successfully re-registered."
                    )
                ]
            });

        } catch (err) {
            logger.error("Command refresh failed.", {
                error: err?.stack || err.message,
            });

            return interaction.editReply({
                embeds: [
                    createErrorEmbed(
                        "Command Refresh Failed",
                        err.message || "An unknown error occurred."
                    )
                ]
            });
        }
    },
};
