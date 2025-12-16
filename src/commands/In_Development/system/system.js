// src/commands/system/system.js

const { SlashCommandBuilder } = require("discord.js");
const { collectHealth } = require("../../services/healthService");
const deployCommands = require("../../handlers/commandDeployer");
const loadCommands = require("../../handlers/commands");
const config = require("../../core/config");
const logger = require("../../core/logger");
const { createInfoEmbed } = require("../../core/embedStyles");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("system")
        .setDescription("System administration commands")
        .addSubcommand(sub =>
            sub
                .setName("health")
                .setDescription("Show system health status")
        )
        .addSubcommand(sub =>
            sub
                .setName("refresh")
                .setDescription("Redeploy all application commands")
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        // ---------------------------------------------
        // PERMISSION CHECK
        // ---------------------------------------------
        const isOwner = config.ownerIds.includes(interaction.user.id);
        const isAdmin = interaction.member.permissions.has("Administrator");

        if (!isOwner && !isAdmin) {
            return interaction.reply({
                content: "❌ You do not have permission to use system commands.",
                flags: 64,
            });
        }

        // ---------------------------------------------
        // /system health
        // ---------------------------------------------
        if (sub === "health") {
            const health = await collectHealth(interaction.client);

            const embed = createInfoEmbed(
                "System Health Report",
                [
                    `**Environment:** \`${config.environment}\``,
                    `**Uptime:** ${Math.floor(health.uptime / 60)} min`,
                    `**Gateway Ping:** \`${health.gatewayPing}ms\``,
                    `**Guilds:** \`${health.guildCount}\``,
                    `**Modules Loaded:** \`${health.moduleCount}\``,
                    `**Commands Loaded:** \`${health.commandCount}\``,
                    "",
                    `**Memory Usage:**`,
                    `• Heap: ${(health.memory.heapUsed / 1024 / 1024).toFixed(1)} MB`,
                    `• RSS: ${(health.memory.rss / 1024 / 1024).toFixed(1)} MB`,
                    "",
                    `**Event Loop Delay:** \`${health.eventLoopDelay.toFixed(2)}ms\``,
                    "",
                    `**Database Response:** \`${health.db.responseTime ?? "ERR"}ms\``,
                    `**Database Locked:** \`${health.db.locked}\``,
                ].join("\n")
            );

            return interaction.reply({ embeds: [embed], flags: 64 });
        }

        // ---------------------------------------------
        // /system refresh
        // ---------------------------------------------
        if (sub === "refresh") {
            await interaction.deferReply({ flags: 64 });

            loadCommands(interaction.client);
            await deployCommands(interaction.client);

            logger.success("System commands refreshed.", {
                by: interaction.user.id,
                environment: config.environment,
            });

            return interaction.editReply("✅ Commands refreshed and redeployed.");
        }
    },
};
