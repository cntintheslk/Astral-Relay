// ============================================================
// ASTRAL RELAY — READY EVENT
// Final integration point once the Discord client is online.
// Responsible for wiring core systems and starting subsystems.
// ============================================================

const logger = require("../core/logger");
const discordLogger = require("../core/discordLogger");
const config = require("../core/config");
const { loadAllModules } = require("../core/moduleRegistry");
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

    logger.info(
        `Daily restart scheduled for ${next.toISOString()} (00:00 UTC).`
    );

    setTimeout(() => {
        logger.info(
            "Executing scheduled daily restart — process exiting with code 0."
        );

        // Allow time for final telemetry to flush
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
        // --------------------------------------------------------
        // CLIENT ONLINE
        // --------------------------------------------------------

        logger.success(`Connected to Discord as ${client.user.tag}`);

        // --------------------------------------------------------
        // DISCORD LOGGING INITIALISATION
        // --------------------------------------------------------

        const logChannel = client.channels.cache.get(config.logChannelId);

        if (!logChannel) {
            logger.warn(
                "LOG_CHANNEL_ID is invalid or inaccessible — Discord telemetry disabled."
            );
        } else {
            // Bind Discord sink and attach it to the core logger
            discordLogger.setLogChannel(logChannel, client);
            logger.attachDiscordLogger(discordLogger);

            logger.success(
                "Discord telemetry channel successfully initialised.",
                {
                    channelId: config.logChannelId,
                }
            );
        }

        // --------------------------------------------------------
        // ENVIRONMENT TELEMETRY
        // --------------------------------------------------------

        logger.info("Runtime environment initialised.", {
            environment: config.environment,
            node: process.version,
        });

        // --------------------------------------------------------
        // COMMAND & MODULE INITIALISATION
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
