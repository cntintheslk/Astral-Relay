const db = require("../../core/database");
const { EmbedBuilder } = require("discord.js");

module.exports = async function handleWelcome(member, { isTest = false } = {}) {

    const config = db.prepare(`
        SELECT * FROM welcome_config WHERE guild_id = ?
    `).get(member.guild.id);

    if (!config || !config.enabled) return;

    const channel = member.guild.channels.cache.get(config.channel_id);
    if (!channel) return;

    const vars = {
        "{user}": `<@${member.id}>`,
        "{username}": member.user.username,
        "{server}": member.guild.name,
        "{memberCount}": member.guild.memberCount,
        "{created}": member.user.createdAt.toDateString()
    };

    let message = config.message;
    for (const key in vars) {
        message = message.replaceAll(key, vars[key]);
    }

    const embed = new EmbedBuilder()
        .setColor("Blurple")
        .setTitle("Welcome")
        .setDescription(message)
        .setThumbnail(member.user.displayAvatarURL())
        .setFooter({ text: "Astral Relay • Welcome System" })
        .setTimestamp();

    await channel.send({
    embeds: [embed],
    allowedMentions: isTest ? { users: [] } : undefined
    });


    if (config.dm_enabled) {
        member.send({ embeds: [embed] }).catch(() => {});
    }
};
