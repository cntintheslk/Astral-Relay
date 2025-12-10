// modules/system/buildHealthEmbed.js

const { EmbedBuilder } = require("discord.js");
const healthImage = Path.join(__dirname, "../../media/Astral Relay - Health System Embed Image.png")
function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    return `${h}h ${m}m ${s}s`;
}

function buildHealthEmbed(client) {
    const mem = process.memoryUsage();

    const uptimeSeconds = Math.floor(process.uptime());
    const uptimeString = formatUptime(uptimeSeconds);

    const botAvatar = client.user.displayAvatarURL();

    return new EmbedBuilder()
        .setColor(0x6b5bff) // astral purple
        .setTitle("✨ Astral Relay — System Health")
        .setDescription("**Live system diagnostics** updated every 15 seconds.\n")
        .setThumbnail(botAvatar)
        .addFields(
            {
                name: "📡 Uptime",
                value: `\`${uptimeString}\``,
                inline: true,
            },
            {
                name: "🧠 Memory Used",
                value: `\`${Math.round(mem.rss / 1024 / 1024)} MB\``,
                inline: true,
            },
            {
                name: "🟣 Node Version",
                value: `\`${process.version}\``,
                inline: true,
            },
            {
                name: "🌌 System Status",
                value: "```\nONLINE — Nominal\n```",
                inline: false,
            }
        )
        .setImage("attachment://Astral Relay - System Health Embed Image.png")
        .setTimestamp()
        .setFooter({
            text: "Astral Relay — System Log",
            iconURL: botAvatar
        });
}

module.exports = { buildHealthEmbed };
