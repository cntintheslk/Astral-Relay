const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const db = require("../../../core/database");
const renderBoard = require("../../../modules/loa/renderBoard");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("loa-board-set")
        .setDescription("Set the LOA board channel.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addChannelOption(opt =>
            opt.setName("channel")
               .setDescription("Channel to post or update LOA board")
               .setRequired(true)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const channel = interaction.options.getChannel("channel");

        // Create or update board row
        const embed = renderBoard(guildId);
        const message = await channel.send({ embeds: [embed] });

        db.prepare(`
            INSERT INTO loa_board (guild_id, channel_id, message_id, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(guild_id) DO UPDATE SET
                channel_id = excluded.channel_id,
                message_id = excluded.message_id,
                updated_at = excluded.updated_at
        `).run(guildId, channel.id, message.id, Math.floor(Date.now() / 1000));

        await interaction.reply({ content: "LOA board configured.", ephemeral: true });
    }
};
