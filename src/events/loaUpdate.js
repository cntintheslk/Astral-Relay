const db = require("../core/database");
const renderBoard = require("../modules/loa/renderBoard");

module.exports = {
  name: "loaUpdate",

  async execute(client, guildId) {
    const board = db
      .prepare("SELECT * FROM loa_board WHERE guild_id = ?")
      .get(guildId);

    if (!board) return;

    try {
      const guild = await client.guilds.fetch(guildId);
      const channel = await guild.channels.fetch(board.channel_id);
      const message = await channel.messages.fetch(board.message_id);

      const embed = renderBoard(guildId);

      await message.edit({ embeds: [embed] });

      db.prepare(
        "UPDATE loa_board SET updated_at = ? WHERE guild_id = ?"
      ).run(Math.floor(Date.now() / 1000), guildId);

    } catch (err) {
      console.error("[LOA BOARD] Failed to update board:", err.message);
    }
  },
};
