const { startHealthJob } = require("./healthJob");
const logger = require("../../core/logger");
const config = require("../../core/config");

module.exports = {
    async init(client) {
        logger.info("[system] Initializing system module…");

        const channel = client.channels.cache.get(config.devHealthChannelId);

        await startHealthJob(client, channel);

        logger.success("[system] Health monitor started.");
    },

    async unload() {
        logger.info("[system] System module unloaded.");
    }
};
