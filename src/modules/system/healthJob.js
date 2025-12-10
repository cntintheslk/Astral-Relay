// src/modules/system/healthJob.js

const logger = require("../../core/logger");
const { EmbedBuilder } = require("discord.js");

let interval = null;

module.exports = {
    start(client) {
        logger.info("[system] Starting health monitor...");

        const guildId = process.env.DEV_GUILD_ID;
        const channelId = process.env.DEV_HEALTH_CHANNEL_ID; // make this later
        const messageId = process.env.DEV_HEALTH_MESSAGE_ID; // also optional until we add

        if (!guildId || !channelId) {
            logger.warn("[system] Health monitor disabled: missing DEV_HEALTH_CHANNEL_ID.");
            return;
        }

        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            logger.warn("[system] Health monitor disabled: guild not found.");
            return;
        }

        const channel = guild.channels.cache.get(channelId);
        if (!channel) {
            logger.warn("[system] Health monitor disabled: channel not found.");
            return;
        }

        async function update() {
            try {
                const memory = process.memoryUsage();

                const embed = new EmbedBuilder()
                    .setColor(0x3498db)
                    .setTitle("🩺 Astral Relay — System Health")
                    .setDescription("Auto-updating health status report")
                    .addFields(
                        {
                            name: "Uptime",
                            value: `${Math.floor(process.uptime())}s`,
                            inline: true,
                        },
                        {
                            name: "Memory Used",
                            value: `${Math.round(memory.rss / 1024 / 1024)} MB`,
                            inline: true,
                        },
                        {
                            name: "Node Version",
                            value: process.version,
                            inline: true,
                        }
                    )
                    .setTimestamp();

                // Later we will pin a message ID and edit instead of sending new ones.
                await channel.send({ embeds: [embed] });
            } catch (err) {
                logger.error("[system] Health monitor update failed: " + err.message);
            }
        }

        // Update every 60 seconds
        interval = setInterval(update, 60_000);
        update(); // run immediately
    },

    stop() {
        if (interval) {
            clearInterval(interval);
            interval = null;
            logger.info("[system] Health monitor stopped.");
        }
    }
};
