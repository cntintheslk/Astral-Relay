// src/events/ready.js

const logger = require("../core/logger");
const { setLogChannel, log } = require("../core/discordLogger");
const config = require("../core/config");
const { loadAllModules } = require("../core/moduleRegistry");
const loadCommands = require("../handlers/commands");
const deployCommands = require("../handlers/commandDeployer");

// ----------------------------
// Daily Restart Scheduler
// ----------------------------
function scheduleDailyRestart() {
    const now = new Date();
    const next = new Date(now);
    next.setUTCHours(0, 0, 0, 0);
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    const msUntilRestart = next.getTime() - now.getTime();

    log(
        "INFO",
        "Daily Restart Scheduled",
        `Next restart at <t:${Math.floor(next.getTime() / 1000)}:F> (00:00 UTC).`
    );

    setTimeout(() => {
        log(
            "INFO",
            "Daily Restart Executing",
            "Process exiting with code 0 for scheduled daily restart."
        );
        // small delay so the log has a chance to send
        setTimeout(() => process.exit(0), 2000);
    }, msUntilRestart);
}

module.exports = {
    name: "ready",
    once: true,

    async execute(client) {
        logger.success(`Bot logged in as ${client.user.tag}`);

        // Fetch log channel
        const channel = client.channels.cache.get(config.logChannelId);

        if (!channel) {
            logger.warn("LOG_CHANNEL_ID is invalid or missing in environment/config.");
        } else {
            setLogChannel(channel, client);

            // Send startup embed
            log(
                "SUCCESS",
                "Bot Online",
                `Astral Relay is now operational.\nNode: \`${process.version}\`\nEnv: \`${config.environment || "production"}\``
            );
        }

        logger.info(`Environment: ${config.environment || "production"}`);
        logger.info(`Node Version: ${process.version}`);

        // 🔹 Load all modules AFTER logging is up
        loadCommands(client);
        await deployCommands(client);
        
        await loadAllModules(client);

        // ----------------------------
        // Start Daily Restart Timer
        // ----------------------------
        scheduleDailyRestart();
    },
};
