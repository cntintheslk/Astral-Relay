const logger = require("../../core/logger");
const { runAutoPurge } = require("./engine");

module.exports = {
    name: "autoPurge",
    description: "Role-based automatic purge system",

    enabled: true,

    /**
     * Called when modules are loaded
     */
    async init(client) {
        logger.info("[AutoPurge] Module initialised");

        // Hourly dry-run by default
        this.interval = setInterval(() => {
            runAutoPurge(client, true); // DRY RUN ONLY
        }, 1000 * 60 * 60);
    },

    /**
     * Called on shutdown / reload
     */
    async shutdown() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        logger.info("[AutoPurge] Module stopped");
    }
};
