// ============================================================
// ASTRAL RELAY — READY EVENT
// Initialises runtime services after Discord connection.
// ============================================================

const logger = require("../core/logger");
const { setLogChannel, handleLog } = require("../core/discordLogger");
const config = require("../core/config");

module.exports = {
    name: "ready",
    once: true,

    async execute(client) {
        // ----------------------------------------------------
        // DISCORD LOGGING SETUP
        // ----------------------------------------------------

        if (config.logChannelId) {
            const channel = client.channels.cache.get(config.logChannelId);

            if (channel) {
                setLogChannel(channel);

                // Attach Discord sink to core logger
                logger.attachDiscordSink(handleLog);

                logger.success("Discord logging initialised.", {
                    channelId: config.logChannelId,
                });
            } else {
                logger.warn("Log channel not found.", {
                    channelId: config.logChannelId,
                });
            }
        } else {
            logger.warn("LOG_CHANNEL_ID not set — Discord logging disabled.");
        }

        // ----------------------------------------------------
        // RUNTIME INFO
        // ----------------------------------------------------

        logger.info("Runtime environment ready.", {
            environment: config.environment,
            node: process.version,
        });
    },
};
