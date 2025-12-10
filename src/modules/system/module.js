// src/modules/system/module.js

const { start } = require("./healthJob");
const logger = require("../../core/logger");
const { log } = require("../../core/discordLogger");
const config = require("../../core/config");

module.exports = {
    /**
     * System module initializer
     * Called automatically by moduleRegistry.loadModule()
     */
    async init(client) {
        logger.info("[system] Initializing system module…");

        try {
            const channelId = config.devHealthChannelId;
            const channel = await client.channels.fetch(channelId).catch(() => null);
            // Start the auto-updating health monitor
            await start(client, channel);

            logger.success("[system] Health monitor started.");
            log("SUCCESS", "System Module", "Health monitor started successfully.");

        } catch (err) {
            logger.error("[system] Failed to start health monitor:");
            console.error(err);

            log(
                "ERROR",
                "System Module Error",
                `Failed to start health monitor.\n\`\`\`${err.message}\`\`\``
            );
        }

        return true;
    },

    async unload() {
        logger.info("[system] System module unloaded.");
    }
};
