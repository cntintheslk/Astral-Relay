// src/modules/system/module.js

const logger = require("../../core/logger");
const { log } = require("../../core/discordLogger");
const healthJob = require("./healthJob");

module.exports = {
    /**
     * Called automatically when the system module is loaded.
     * Starts the health dashboard auto-update process.
     */
    async init(client) {
        logger.info("[system] Initializing system module...");
        log("INFO", "System Module Init", "System module initialization started.");

        try {
            healthJob.start(client);
            logger.success("[system] Health monitor started.");
            log("SUCCESS", "Health Monitor Active", "System health dashboard is now updating automatically.");
        } catch (err) {
            logger.error(`[system] Failed to start health monitor: ${err.message}`);
            log("ERROR", "Health Monitor Error", `\`\`\`${err.message}\`\`\``);
        }

        logger.success("[system] Module initialized.");
    },

    /**
     * Called when unloading/reloading this module.
     * Ensures the health job interval is stopped cleanly.
     */
    async unload(client) {
        logger.info("[system] Unloading system module...");
        log("WARN", "System Module Unloaded", "System module was unloaded.");

        try {
            healthJob.stop();
            logger.info("[system] Health monitor stopped.");
        } catch (err) {
            logger.error(`[system] Error stopping health monitor: ${err.message}`);
        }
    }
};
