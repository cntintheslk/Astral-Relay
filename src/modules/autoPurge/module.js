// src/src/modules/autoPurge/module.js

const logger = require("../../core/logger");
const { runAutoPurge } = require("./engine");

function msUntilNextNoonUTC(now = new Date()) {
    // Next 12:00 UTC (noon)
    const next = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        12, 0, 0, 0
    ));

    // If it's already past 12:00 UTC today, schedule for tomorrow
    if (now.getTime() >= next.getTime()) {
        next.setUTCDate(next.getUTCDate() + 1);
    }

    return next.getTime() - now.getTime();
}

async function runDailyAutoPurge(client) {
    const guildIds = Array.from(client.guilds.cache.keys());

    logger.info(`[AutoPurge] Daily scheduler tick (12:00 UTC). Guilds: ${guildIds.length}`);

    for (const guildId of guildIds) {
        try {
            // Live run attempt; engine should block per-guild if not enabled
            const result = await runAutoPurge(client, guildId, { dryRun: false });

            if (result?.blocked) {
                // Live disabled for this guild (expected for most)
                continue;
            }

            logger.warn(
                `[AutoPurge] Guild ${guildId}: matched=${result?.matched ?? 0}, executed=${result?.executed ?? 0}`
            );
        } catch (err) {
            logger.error(`[AutoPurge] Scheduler run failed for guild ${guildId}`, err);
        }
    }
}

module.exports = {
    name: "autoPurge",
    module: "autopurge",
    description: "Role-based automatic purge system (daily 12:00 UTC scheduler)",
    enabled: true,

    async init(client) {
        logger.info("[AutoPurge] Module initialised (daily 12:00 UTC schedule)");

        const delay = msUntilNextNoonUTC(new Date());

        this._timeout = setTimeout(async () => {
            // Run once at the next noon UTC
            await runDailyAutoPurge(client);

            // Then every 24 hours thereafter
            this._interval = setInterval(() => {
                runDailyAutoPurge(client);
            }, 24 * 60 * 60 * 1000);

        }, delay);

        logger.info(`[AutoPurge] Next run in ${(delay / 1000 / 60).toFixed(2)} minutes (target: 12:00 UTC)`);
    },

    async shutdown() {
        if (this._timeout) {
            clearTimeout(this._timeout);
            this._timeout = null;
        }
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = null;
        }

        logger.info("[AutoPurge] Module stopped (scheduler cleared)");
    }
};
