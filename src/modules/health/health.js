// src/modules/system/healthJob.js

const { collectHealth } = require("../../core/health");
const { createInfoEmbed } = require("../../core/embedStyles");
const db = require("../../core/database");
const config = require("../../core/config");
const logger = require("../../core/logger");

const JOB_INTERVAL = 5 * 60 * 1000; // 5 minutes

let interval = null;

async function getOrCreateMessage(channel) {
    const row = await db.get("SELECT value FROM system WHERE key = 'health_message_id'");

    if (row) {
        try {
            return await channel.messages.fetch(row.value);
        } catch (_) {
            // Message deleted, recreate below
        }
    }

    // Create fresh message
    const msg = await channel.send({ content: "Preparing system health dashboard..." });

    await db.run(
        "INSERT INTO system (key, value) VALUES ('health_message_id', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        msg.id
    );

    return msg;
}

async function updateHealthMessage(client) {
    const guild = client.guilds.cache.get(config.devGuildId);
    if (!guild) return;

    const channel = guild.channels.cache.get(process.env.DEV_HEALTH_CHANNEL_ID);
    if (!channel) return;

    const msg = await getOrCreateMessage(channel);
    const health = await collectHealth(client);

    const embed = createInfoEmbed(
        "Astral Relay — Dev Health Dashboard",
        [
            `**Environment:** \`${health.environment}\``,
            `**Uptime:** ${Math.floor(health.uptime / 60)} min`,
            `**Gateway Ping:** \`${health.gatewayPing}ms\``,
            "",
            `**Memory:**`,
            `• Heap: ${(health.memory.heapUsed / 1024 / 1024).toFixed(1)} MB`,
            `• RSS: ${(health.memory.rss / 1024 / 1024).toFixed(1)} MB`,
            "",
            `**Event Loop Delay:** \`${health.eventLoopDelay.toFixed(2)}ms\``,
            "",
            `**Database:**`,
            `• Response: \`${health.db.responseTime?.toFixed(2) || "ERR"}ms\``,
            `• Locked: \`${health.db.locked}\``,
            "",
            `**Modules Loaded:** \`${health.moduleCount}\``,
            `**Commands Loaded:** \`${health.commandCount}\``
        ].join("\n")
    );

    msg.edit({ embeds: [embed] });
}

function start(client) {
    if (interval) clearInterval(interval);

    interval = setInterval(() => updateHealthMessage(client), JOB_INTERVAL);
    logger.info("System health monitor started.");
}

function stop() {
    if (interval) clearInterval(interval);
    interval = null;
}

module.exports = {
    start,
    stop
};
