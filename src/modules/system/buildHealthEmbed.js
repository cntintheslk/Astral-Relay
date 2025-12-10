// modules/system/buildHealthEmbed.js
const { EmbedBuilder } = require("discord.js");
const BASE64_IMAGE = "https://media.discordapp.net/attachments/1448193668728225813/1448193724990361650/Astral_Relay_-_Health_System_Embed_Image.png?ex=693a5f02&is=69390d82&hm=f2cfb6fb5c9c136264793af2d88f21ee2bb3099514a13011141757b5d35f4145&=&format=webp&quality=lossless&width=1536&height=864"
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
        .setImage(BASE64_IMAGE)
        .setTimestamp()
        .setFooter({
            text: "Astral Relay — System Log",
            iconURL: botAvatar
        });
}

module.exports = { buildHealthEmbed };
