// src/modules/registration/module.js

const logger = require("../../core/logger");
const { log } = require("../../core/discordLogger");

module.exports = {
    module: "registration",
    async init() {
        logger.info("[registration] Initializing registration module…");
        log("INFO", "Registration Module", "Registration system module initialized.");
        return true;
    },

    async unload() {
        logger.info("[registration] Registration module unloaded.");
        log("WARN", "Registration Module", "Registration system module unloaded.");
    },
};
