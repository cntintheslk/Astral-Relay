// ============================================================
// ASTRAL RELAY — DISCORD CLIENT ERROR EVENT
// Handles fatal client-level errors.
// ============================================================

const logger = require("../core/logger");

module.exports = {
    name: "error",

    execute(error) {
        logger.error("Discord client error occurred.", {
            error: error?.stack || String(error),
        });
    },
};
