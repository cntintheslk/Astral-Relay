const db = require("../core/database");
const renderBoard = require("../modules/loa/renderBoard");

module.exports = {
    name: "loaUpdate",
    async execute(guildId, client) {
        const row = db.prepare(`
            SELECT * FROM loa_board WHERE guild_id = ?
        `).get(guildId);

        if (!row) return; // No board set

        const channel = client.channels.cache.get(row.channel_id);
        if (!channel) return;

        const embed = renderBoard(guildId);

        try {
            const msg = await channel.messages.fetch(row.message_id);
            msg.edit({ embeds: [embed] });

            db.prepare(`
                UPDATE loa_board SET updated_at = ? WHERE guild_id = ?
            `).run(Math.floor(Date.now() / 1000), guildId);

        } catch (err) {
            console.error("[loaUpdate] Failed to update board:", err.message);
        }
    }
};