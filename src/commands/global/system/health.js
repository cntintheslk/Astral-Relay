// src/commands/system/health.js

const { SlashCommandBuilder } = require("discord.js");
const { collectHealth } = require("../../core/health");
const { createInfoEmbed } = require("../../core/embedStyles");
const config = require("../../core/config");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("system")
        .setDescription("System-level commands")
        .addSubcommand(sub =>
            sub.setName("health").setDescription("Show system health status")
        ),

    async execute(interaction) {
        if (!config.ownerIds.includes(interaction.user.id)) {
            return interaction.reply({
                content: "❌ You are not permitted to run this command.",
                flags: 64
            });
        }

        const client = interaction.client;
        const health = await collectHealth(client);

        const embed = createInfoEmbed(
            "System Health Report",
            [
                `**Environment:** \`${health.environment}\``,
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
                `**Database Response:** \`${health.db.responseTime?.toFixed(2) || "ERR"}ms\``,
                `**Database Locked:** \`${health.db.locked}\``,
            ].join("\n")
        );

        return interaction.reply({ embeds: [embed], flags: 64 });
    }
};
