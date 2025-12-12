const db = require("../../core/database");
const renderBoard = require("./renderBoard");
const { randomUUID } = require("crypto");

module.exports = {
    name: "loa",

    init(client) {
        console.log("[module:loa] Initializing LOA module...");

        setInterval(async () => {
            const now = Math.floor(Date.now() / 1000);

            // ==================================================
            // 24 HOUR REMINDER
            // ==================================================
            const endingSoon = db.prepare(`
                SELECT * FROM loas
                WHERE status = 'active'
                AND end_date BETWEEN ? AND ?
            `).all(now + 86400, now + 86460);

            for (const loa of endingSoon) {
                try {
                    const user = await client.users.fetch(loa.user_id);
                    await user.send(
                        `⏳ **LOA Reminder**\n\nYour LOA will end in **24 hours**.\n` +
                        `**Reason:** ${loa.reason}\n` +
                        `**Ends:** <t:${loa.end_date}:F>`
                    );
                } catch {}
            }

            // ==================================================
            // LOA EXPIRY HANDLER
            // ==================================================
            const expired = db.prepare(`
                SELECT * FROM loas
                WHERE status = 'active'
                AND end_date <= ?
            `).all(now);

            for (const loa of expired) {
                // Move to history
                db.prepare(`
                    INSERT INTO loa_history (
                        id, guild_id, user_id, reason,
                        start_date, end_date,
                        resolved_at, resolved_by,
                        resolution, status
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

                // Remove from active table
                db.prepare(
                    `DELETE FROM loas WHERE id = ?`
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
                    } catch {}
                }

                // DM user
                try {
                    const user = await client.users.fetch(loa.user_id);
                    await user.send(
                        `🌅 **Your LOA has ended. Welcome back!**\n` +
                        `**Ended:** <t:${loa.end_date}:F>`
                    );
                } catch {}

                // Update board
                client.emit("loaUpdate", loa.guild_id);
            }

        }, 60 * 1000); // every minute

        console.log("[module:loa] LOA scheduler active (60s)");
    }
};
