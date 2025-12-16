const db = require("../../services/database");
const renderBoard = require("./renderBoard");
const { randomUUID } = require("crypto");

module.exports = {
    name: "loa",
    module: "loa",
    init(client) {
        console.log("[module:loa] Initializing LOA module...");

        // ==================================================
        // Refresh LOA boards on startup
        // ==================================================
        (async () => {
            try {
                const guilds = db
                    .prepare("SELECT DISTINCT guild_id FROM loa_board")
                    .all();

                for (const row of guilds) {
                    client.emit("loaUpdate", row.guild_id);
                }

                console.log(
                    `[module:loa] Refreshed ${guilds.length} LOA boards on startup`
                );
            } catch (err) {
                console.error(
                    "[module:loa] Failed to refresh boards on startup:",
                    err.message
                );
            }
        })();

        // ==================================================
        // LOA Scheduler (runs every minute)
        // ==================================================
        setInterval(async () => {
            const now = Math.floor(Date.now() / 1000);

            // --------------------------------------------------
            // 24 HOUR REMINDER
            // --------------------------------------------------
            const endingSoon = db.prepare(`
                SELECT * FROM loas
                WHERE status = 'active'
                AND end_date BETWEEN ? AND ?
            `).all(now + 86400, now + 86460);

            for (const loa of endingSoon) {
                try {
                    const user = await client.users.fetch(loa.user_id);
                    await user.send(
                        `⏳ **LOA Reminder**\n\n` +
                        `Your LOA will end in **24 hours**.\n` +
                        `**Reason:** ${loa.reason}\n` +
                        `**Ends:** <t:${loa.end_date}:F>`
                    );
                } catch {
                    // DM closed or user unavailable
                }
            }

            // --------------------------------------------------
            // EXPIRED LOAs
            // --------------------------------------------------
            const expired = db.prepare(`
                SELECT * FROM loas
                WHERE status = 'active'
                AND end_date <= ?
            `).all(now);

            for (const loa of expired) {
                // Move to history
                db.prepare(`
                    INSERT INTO loa_history (
                        id,
                        guild_id,
                        user_id,
                        reason,
                        start_date,
                        end_date,
                        resolved_at,
                        resolved_by,
                        resolution,
                        status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    randomUUID(),
                    loa.guild_id,
                    loa.user_id,
                    loa.reason,
                    loa.start_date,
                    loa.end_date,
                    now,
                    "system",
                    "expired",
                    "expired"
                );

                // Remove from active LOAs
                db.prepare(
                    "DELETE FROM loas WHERE id = ?"
                ).run(loa.id);

                // Remove LOA role if configured
                const settings = db.prepare(
                    "SELECT loa_role_id FROM loa_settings WHERE guild_id = ?"
                ).get(loa.guild_id);

                if (settings?.loa_role_id) {
                    try {
                        const guild = await client.guilds.fetch(loa.guild_id);
                        const member = await guild.members.fetch(loa.user_id);
                        await member.roles.remove(settings.loa_role_id);
                    } catch {
                        // Member may have left or role removed
                    }
                }

                // DM user on expiry
                try {
                    const user = await client.users.fetch(loa.user_id);
                    await user.send(
                        `🌅 **Your LOA has ended. Welcome back!**\n` +
                        `**Ended:** <t:${loa.end_date}:F>`
                    );
                } catch {
                    // DM closed
                }

                // Refresh board
                client.emit("loaUpdate", loa.guild_id);
            }

        }, 60 * 1000); // every minute

        console.log("[module:loa] LOA scheduler active (60s interval)");
    }
};
