// modules/system/buildHealthEmbed.js
const { EmbedBuilder } = require("discord.js");
const os = require("os");
const { execSync } = require("child_process");

const IMAGE = "https://media.discordapp.net/attachments/1448193668728225813/1448193724990361650/Astral_Relay_-_Health_System_Embed_Image.png?format=webp&quality=lossless&width=1536&height=864";

function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    return `${h}h ${m}m ${s}s`;
}

function getDiskInfo() {
    try {
        // Run Linux df command on /data (Render disk mount)
        const output = execSync("df -k /data").toString().split("\n")[1].trim().split(/\s+/);

        const totalKB = parseInt(output[1], 10);
        const usedKB = parseInt(output[2], 10);
        const freeKB = parseInt(output[3], 10);

        return {
            totalMB: Math.round(totalKB / 1024),
            usedMB: Math.round(usedKB / 1024),
            freeMB: Math.round(freeKB / 1024),
            percent: ((usedKB / totalKB) * 100).toFixed(1)
        };

    } catch (err) {
        return {
            totalMB: 0,
            usedMB: 0,
            freeMB: 0,
            percent: "ERR"
        };
    }
}

function buildHealthEmbed(client) {
    const mem = process.memoryUsage();
    const diskInfo = getDiskInfo();
    const uptimeSeconds = Math.floor(process.uptime());
    const uptimeString = formatUptime(uptimeSeconds);

    const botAvatar = client.user.displayAvatarURL();

    return new EmbedBuilder()
        .setColor(0x6b5bff)
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
                name: "💾 Disk Usage (/data)",
                value:
`**Used:** ${diskInfo.usedMB} MB  
**Free:** ${diskInfo.freeMB} MB  
**Total:** ${diskInfo.totalMB} MB  
**Usage:** ${diskInfo.percent}%`,
                inline: false,
            },
            {
                name: "🌌 System Status",
                value: "```\nONLINE — Nominal\n```",
                inline: false,
            }
        )
        .setImage(IMAGE)
        .setTimestamp()
        .setFooter({
            text: "Astral Relay — System Log",
            iconURL: botAvatar
        });
}

module.exports = { buildHealthEmbed };
