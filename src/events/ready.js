// ============================================================
// ASTRAL RELAY — READY EVENT
// Final startup integration once the Discord client is online.
// ============================================================

const logger = require("../core/logger");
const discordLogger = require("../core/discordLogger");
const config = require("../core/config");

const { loadAllModules } = require("../core/moduleRegistry");
const loadCommands = require("../handlers/commands");
const { deployCommands } = require("../handlers/commandDeployer");

// ------------------------------------------------------------
// DAILY RESTART SCHEDULER
// ------------------------------------------------------------

function scheduleDailyRestart() {
    const now = new Date();
    const next = new Date(now);

    next.setUTCHours(0, 0, 0, 0);
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);

    const seconds = Math.round((next - now) / 1000);

    logger.info("Daily restart scheduled.", {
        target: "00:00 UTC",
        secondsUntilRestart: seconds,
    });

    setTimeout(() => {
        logger.warn("Daily scheduled restart executing.");
        process.exit(0);
    }, next - now);
}

// ------------------------------------------------------------
// EVENT HANDLER
// ------------------------------------------------------------

module.exports = {
    name: "ready",
    once: true,

    async execute(client) {
        // --------------------------------------------------------
        // CLIENT ONLINE
        // --------------------------------------------------------

        logger.success("Bot logged in.", {
            user: client.user.tag,
            id: client.user.id,
        });

        // --------------------------------------------------------
        // DISCORD LOGGING INITIALISATION
        // --------------------------------------------------------

        if (!config.logChannelId) {
            logger.warn("LOG_CHANNEL_ID not set — Discord logging disabled.");
        } else {
            const channel = client.channels.cache.get(config.logChannelId);

            if (!channel) {
                logger.warn("Log channel not found or inaccessible.", {
                    channelId: config.logChannelId,
                });
            } else {
                discordLogger.setLogChannel(channel);
                logger.attachDiscordSink(discordLogger.handleLog);

                logger.success("Discord logging initialised.", {
                    channelId: channel.id,
                });
            }
        }

        // --------------------------------------------------------
        // ENVIRONMENT TELEMETRY
        // --------------------------------------------------------

        logger.info("Runtime environment ready.", {
            environment: config.environment,
            node: process.version,
            guilds: client.guilds.cache.size,
        });

        // --------------------------------------------------------
        // COMMANDS & MODULES
        // --------------------------------------------------------

        loadCommands(client);
        await deployCommands(client);
        await loadAllModules(client);

        // --------------------------------------------------------
        // SCHEDULERS
        // --------------------------------------------------------

        scheduleDailyRestart();
    },
};
