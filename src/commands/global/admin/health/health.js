// ============================================================
// ASTRAL RELAY — SYSTEM HEALTH COMMAND
// Operator-facing runtime health report.
// ============================================================

const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require("discord.js");
const { collectHealth } = require("../../../../services/healthService");
const config = require("../../../../core/config");

// ------------------------------------------------------------
// STATUS → COLOUR MAP
// ------------------------------------------------------------

const STATUS_COLOURS = {
    OPERATIONAL: 0x2ecc71,
    DEGRADED: 0xf1c40f,
    CRITICAL: 0xe74c3c,
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

    async execute(interaction) {
        // --------------------------------------------------------
        // ACCESS CONTROL (OWNER OR ADMIN)
        // --------------------------------------------------------

        const isOwner = config.ownerIds.includes(interaction.user.id);
        const isAdmin = interaction.member?.permissions?.has(
            PermissionsBitField.Flags.Administrator
        );

        if (!isOwner && !isAdmin) {
            return interaction.reply({
                content: "❌ You must be a server administrator to run this command.",
                flags: 64,
            });
        }

        // --------------------------------------------------------
        // HEALTH COLLECTION
        // --------------------------------------------------------

        const health = await collectHealth(interaction.client);

        // --------------------------------------------------------
        // EMBED CONSTRUCTION
        // --------------------------------------------------------

        const embed = new EmbedBuilder()
            .setColor(STATUS_COLOURS[health.status] || STATUS_COLOURS.DEGRADED)
            .setTitle(`SYSTEM STATUS — ${health.status}`)
            .setTimestamp()
            .setFooter({
                text: "Astral Relay — Operator Status",
            });

        // --------------------------------------------------------
        // STATUS SUMMARY
        // --------------------------------------------------------

        if (health.issues?.length) {
            embed.setDescription(
                `⚠️ **Issues Detected:**\n• ${health.issues.join("\n• ")}`
            );
        } else {
            embed.setDescription(
                "✅ All monitored systems are operating within normal parameters."
            );
        }

        // --------------------------------------------------------
        // RUNTIME
        // --------------------------------------------------------

        embed.addFields({
            name: "Runtime",
            value: [
                `**Environment:** \`${health.environment}\``,
                `**Node:** \`${health.nodeVersion}\``,
                `**Uptime:** \`${Math.floor(health.uptime / 60)} min\``,
            ].join("\n"),
        });

        // --------------------------------------------------------
        // DISCORD
        // --------------------------------------------------------

        embed.addFields({
            name: "Discord",
            value: [
                `**Gateway Ping:** \`${health.gatewayPing}ms\``,
                `**Guilds:** \`${health.guildCount}\``,
                `**Commands Loaded:** \`${health.commandCount}\``,
                `**Modules Loaded:** \`${health.moduleCount}\``,
            ].join("\n"),
        });

        // --------------------------------------------------------
        // DATABASE
        // --------------------------------------------------------

        embed.addFields({
            name: "Database",
            value: [
                `**Connected:** \`${health.db.ok}\``,
                `**Response Time:** \`${health.db.responseTime?.toFixed(2) ?? "ERR"}ms\``,
                `**Locked:** \`${health.db.locked}\``,
            ].join("\n"),
        });

        // --------------------------------------------------------
        // PERFORMANCE
        // --------------------------------------------------------

        embed.addFields({
            name: "Performance",
            value: [
                `**Heap Used:** ${(health.memory.heapUsed / 1024 / 1024).toFixed(1)} MB`,
                `**RSS:** ${(health.memory.rss / 1024 / 1024).toFixed(1)} MB`,
                `**Event Loop Delay:** \`${health.eventLoopDelay?.toFixed(2) ?? "N/A"}ms\``,
            ].join("\n"),
        });

        // --------------------------------------------------------
        // RESPONSE
        // --------------------------------------------------------

        return interaction.reply({
            embeds: [embed],
            flags: 64,
        });
    },
};
