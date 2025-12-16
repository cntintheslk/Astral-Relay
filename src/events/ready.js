// ============================================================
// ASTRAL RELAY — READY EVENT
// Final integration point once the Discord client is online.
// ============================================================

const logger = require("../core/logger");
const discordLogger = require("../core/discordLogger");
const config = require("../core/config");
const { loadAllModules } = require("../services/moduleRegistry");
const loadCommands = require("../handlers/commands");
const deployCommands = require("../handlers/commandDeployer");

// ------------------------------------------------------------
// DAILY RESTART SCHEDULER
// ------------------------------------------------------------

function scheduleDailyRestart() {
    const now = new Date();
    const next = new Date(now);

    next.setUTCHours(0, 0, 0, 0);
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);

    const msUntilRestart = next.getTime() - now.getTime();

    logger.info("Daily restart scheduled.", {
        target: next.toISOString(),
        secondsUntil: Math.round(msUntilRestart / 1000),
    });

    setTimeout(() => {
        logger.warn("Executing scheduled daily restart.");
        setTimeout(() => process.exit(0), 2000);
    }, msUntilRestart);
}

// ------------------------------------------------------------
// EVENT HANDLER
// ------------------------------------------------------------

module.exports = {
    name: "ready",
    once: true,

    async execute(client) {
        logger.success(`Bot logged in as ${client.user.tag}`);

        // ----------------------------------------------------
        // DISCORD LOGGING INITIALISATION
        // ----------------------------------------------------

        const channel = client.channels.cache.get(config.logChannelId);

        if (!channel) {
            logger.warn("LOG_CHANNEL_ID invalid — Discord logging disabled.");
        } else {
            discordLogger.setLogChannel(channel);
            logger.attachDiscordSink(discordLogger.handleLog);

            logger.success("Discord logging initialised.", {
                channelId: config.logChannelId,
            });
        }

        // ----------------------------------------------------
        // ENVIRONMENT TELEMETRY
        // ----------------------------------------------------

        logger.info("Runtime environment ready.", {
            environment: config.environment,
            node: process.version,
        });

        // ----------------------------------------------------
        // COMMANDS & MODULES
        // ----------------------------------------------------

        loadCommands(client);
        await deployCommands(client);
        await loadAllModules(client);

        // ----------------------------------------------------
        // SCHEDULERS
        // ----------------------------------------------------

        scheduleDailyRestart();
    },
};
