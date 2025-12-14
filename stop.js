const logger = require("./src/core/logger");
const database = require("./src/core/database");

let shuttingDown = false;

module.exports = async function stopBot(client, reason = "Manual shutdown") {
    if (shuttingDown) return;
    shuttingDown = true;

    try {
        logger.warn(`[system] Shutdown initiated: ${reason}`);

        // Destroy Discord client
        if (client) {
            logger.info("[system] Destroying Discord client...");
            await client.destroy();
        }

        // Close database
        if (database && database.close) {
            logger.info("[system] Closing database connection...");
            database.close();
        }

        logger.success("[system] Bot shutdown complete.");
        process.exit(0);

    } catch (err) {
        logger.error(`[system] Shutdown error: ${err.stack || err.message}`);
        process.exit(1);
    }
};
