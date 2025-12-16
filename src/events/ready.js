// ============================================================
// ASTRAL RELAY — READY EVENT
// ============================================================

const logger = require("../core/logger");
const config = require("../core/config");
const deployCommands = require("../handlers/commandDeployer");
const { setLogChannel, handleLog } = require("../core/discordLogger");

module.exports = {
    name: "ready",
    once: true,

    async execute(client) {
        logger.success("Bot logged in.", {
            user: client.user.tag,
            id: client.user.id,
        });

        // ---------------------------------------------
        // Initialise Discord logging sink
        // ---------------------------------------------
        const logChannelId =
            config.environment === "production"
                ? config.logChannelId
                : config.devHealthChannelId || config.logChannelId;

        const channel = client.channels.cache.get(logChannelId);

        if (channel) {
            logger.attachDiscordSink(handleLog);
            setLogChannel(channel);

            logger.success("Discord logging initialised.", {
                channelId: logChannelId,
            });
        } else {
            logger.warn("Log channel not found.", { logChannelId });
        }

        // ---------------------------------------------
        // DEPLOY COMMANDS (THIS IS THE CRITICAL BIT)
        // ---------------------------------------------
        try {
            await deployCommands(client);
        } catch (err) {
            logger.critical("Command deployment failed.", {
                error: err?.stack || err?.message || String(err),
            });
        }

        logger.info("Runtime environment ready.", {
            environment: config.environment,
            node: process.version,
        });
    },
};
