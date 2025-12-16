// ============================================================
// ASTRAL RELAY — SYSTEM HEALTH COMMAND
// Operator-level runtime and service diagnostics.
// ============================================================

const { SlashCommandBuilder } = require("discord.js");
const { collectHealth } = require("../../services/healthService");
const { createInfoEmbed } = require("../../core/embedStyles");
const permissionService = require("../../services/permissionService");

// ------------------------------------------------------------
// COLOUR MAPS
// ------------------------------------------------------------

const SEVERITY_COLORS = {
    OPERATIONAL: 0x2ecc71, // green
    DEGRADED:    0xf1c40f, // amber
    CRITICAL:    0xe74c3c, // red
};

const DEV_TINT = {
    OPERATIONAL: 0x5dade2, // blue-green
    DEGRADED:    0xf39c12, // deep amber
    CRITICAL:    0xe67e22, // orange-red
};

// ------------------------------------------------------------
// COMMAND DEFINITION
// ------------------------------------------------------------

module.exports = {
    data: new SlashCommandBuilder()
        .setName("system")
        .setDescription("System-level commands")
        .addSubcommand(sub =>
            sub
                .setName("health")
                .setDescription("Show system health status")
        ),

    scope: "global",

    async execute(interaction) {
        // -----------------------------------------------------
        // PERMISSION CHECK (OWNER OR ADMIN)
        // -----------------------------------------------------

        if (!permissionService.isOwnerOrAdmin(interaction)) {
            return interaction.reply({
                content: "❌ You are not permitted to run this command.",
                flags: 64,
            });
        }

        const client = interaction.client;
        const health = await collectHealth(client);

        const isDev = health.environment === "development";
        const colorMap = isDev ? DEV_TINT : SEVERITY_COLORS;
        const embedColor = colorMap[health.status];

        const description = [
            `**Status:** \`${health.status}\``,
            `**Environment:** \`${health.environment}\``,
            `**Uptime:** ${Math.floor(health.uptime / 60)} min`,
            `**Gateway Ping:** \`${health.gatewayPing}ms\``,
            "",
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
            `**Database:**`,
            `• Response: \`${health.db.responseTime?.toFixed(2) || "ERR"}ms\``,
            `• Locked: \`${health.db.locked}\``,
        ].join("\n");

        const embed = createInfoEmbed(
            "System Health Report",
            description
        ).setColor(embedColor);

        return interaction.reply({
            embeds: [embed],
            flags: 64,
        });
    },
};
