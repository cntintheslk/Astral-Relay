// ============================================================
// ASTRAL RELAY — LOA UPDATE EVENT
// Triggers LOA board refresh for a guild.
// ============================================================

const logger = require("../core/logger");
const { updateBoard } = require("../services/loaBoardService");

module.exports = {
    name: "loaUpdate",

    /**
     * @param {string} guildId
     * @param {import("discord.js").Client} client
     */
    async execute(guildId, client) {
        // -----------------------------------------------------
        // VALIDATION
        // -----------------------------------------------------

        if (!guildId || typeof guildId !== "string") {
            logger.warn("LOA update triggered with invalid guildId.", {
                guildId,
            });
            return;
        }

        if (!client) {
            logger.error("LOA update triggered without Discord client.", {
                guildId,
            });
            return;
        }

        // -----------------------------------------------------
        // INTENT
        // -----------------------------------------------------

        logger.info("LOA update event received.", {
            guildId,
        });

        // -----------------------------------------------------
        // DELEGATION
        // -----------------------------------------------------

        try {
            await updateBoard(guildId, client);

            logger.success("LOA board update process completed.", {
                guildId,
            });

        } catch (err) {
            logger.error("Unhandled error during LOA board update.", {
                guildId,
                error: err?.stack || err.message,
            });
        }
    },
};
