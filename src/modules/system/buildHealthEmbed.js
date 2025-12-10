const { EmbedBuilder } = require("discord.js");
const os = require("os");

// Keep your existing hosted background image
const BASE64_IMAGE =
  "https://media.discordapp.net/attachments/1448193668728225813/1448193724990361650/Astral_Relay_-_Health_System_Embed_Image.png?ex=693a5f02&is=69390d82&hm=f2cfb6fb5c9c136264793af2d88f21ee2bb3099514a13011141757b5d35f4145&=&format=webp&quality=lossless&width=1536&height=864";

// CPU load calculation
function getCpuLoad() {
    const cpus = os.cpus();
    let idle = 0, total = 0;

    for (const cpu of cpus) {
        for (const type in cpu.times) total += cpu.times[type];
        idle += cpu.times.idle;
    }

    const idleAvg = idle / cpus.length;
    const totalAvg = total / cpus.length;
    return Math.round((1 - idleAvg / totalAvg) * 100);
}

// Uptime formatting
function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
}

function buildHealthEmbed(client) {
    const mem = process.memoryUsage();
    const totalMem = os.totalmem();
    const usedMem = mem.rss;

    const ramPercent = ((usedMem / totalMem) * 100).toFixed(1);
    const cpuLoad = getCpuLoad();

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
                value: `\`${Math.round(usedMem / 1024 / 1024)} MB (${ramPercent}%)\``,
                inline: true,
            },
            {
                name: "🖥 CPU Load",
                value: `\`${cpuLoad}%\``,
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
