// src/modules/system/module.js

const logger = require("../../core/logger");
const { log } = require("../../core/discordLogger");

module.exports = {
    name: "system",

    async init(client) {
        logger.success("[module:system] Initialized.");
        log("SUCCESS", "Module Init", "System module initialized.");
        // In future: register commands, health checks, etc.
    },

    async unload(client) {
        logger.info("[module:system] Unloaded.");
        log("WARN", "Module Unloaded", "System module was unloaded (dev action).");
    },
};
