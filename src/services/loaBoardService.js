// ============================================================
// ASTRAL RELAY — LOA BOARD SERVICE
// Owns LOA board data aggregation and update orchestration.
// ============================================================

const db = require("./database");
const logger = require("../core/logger");
const renderBoard = require("../modules/loa/renderBoard");
const getRegistrationInfo = require("../modules/loa/getRegistrationInfo");

/**
 * Fetch active LOAs and hydrate them with registration info.
 */
function getActiveLoas(guildId) {
    const loas = db
        .prepare(`
            SELECT *
            FROM loas
            WHERE guild_id = ?
              AND status = 'active'
            ORDER BY end_date ASC
        `)
        .all(guildId);

    return loas.map(loa => {
        const reg = getRegistrationInfo(guildId, loa.user_id);

        return {
            userId: loa.user_id,
            ign: reg?.ign || null,
            rank: reg?.rank || null,
            reason: loa.reason,
            startDate: loa.start_date,
            endDate: loa.end_date,
        };
    });
}

/**
 * Updates the LOA board message for a guild.
 */
async function updateBoard(guildId, client) {
    if (!guildId || typeof guildId !== "string") return;

    logger.info("LOA board update triggered.", { guildId });

    try {
        const board = db
            .prepare(
                "SELECT * FROM loa_board WHERE guild_id = ?"
            )
            .get(guildId);

        if (!board) {
            logger.info("No LOA board configured for guild.", { guildId });
            return;
        }

        logger.info("Fetching LOA board message.", {
            guildId,
            channelId: board.channel_id,
            messageId: board.message_id,
        });

        const guild = await client.guilds.fetch(guildId);
        const channel = await guild.channels.fetch(board.channel_id);
        const message = await channel.messages.fetch(board.message_id);

        // -----------------------------------------------------
        // DATA AGGREGATION
        // -----------------------------------------------------

        const loas = getActiveLoas(guildId);

        // -----------------------------------------------------
        // PRESENTATION
        // -----------------------------------------------------

        const embed = renderBoard({
            loas,
            updatedAt: Date.now(),
        });

        await message.edit({ embeds: [embed] });

        db.prepare(
            "UPDATE loa_board SET updated_at = ? WHERE guild_id = ?"
        ).run(Math.floor(Date.now() / 1000), guildId);

        logger.success("LOA board updated successfully.", {
            guildId,
            channelId: board.channel_id,
            messageId: board.message_id,
            activeLoas: loas.length,
        });

    } catch (err) {
        logger.error("LOA board update failed.", {
            guildId,
            error: err?.stack || err.message,
        });
    }
}

module.exports = {
    updateBoard,
};
