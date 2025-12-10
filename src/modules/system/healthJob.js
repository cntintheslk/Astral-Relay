// modules/system/healthJob.js

const { buildHealthEmbed } = require("./buildHealthEmbed");

let healthMessage = null;   // persistent reference to the health message
let healthChannel = null;

const HEALTH_INTERVAL = 15000; // 15 seconds

async function startHealthJob(client) {
    const channelId = process.env.HEALTH_CHANNEL_ID;

    if (!channelId) {
        console.warn("[HEALTH] No HEALTH_CHANNEL_ID set — job disabled.");
        return;
    }

    // Fetch channel
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
        console.warn("[HEALTH] Invalid HEALTH_CHANNEL_ID — cannot start job.");
        return;
    }

    healthChannel = channel;

    // --- INITIAL SEND ---
    if (!healthMessage) {
        const embed = buildHealthEmbed(client);

        try {
            healthMessage = await channel.send({ embeds: [embed] });
        } catch (err) {
            console.error("[HEALTH] Failed to send initial health message:", err);
            return;
        }
    }

    console.log("[HEALTH] Auto-update system started.");

    // --- AUTO REFRESH LOOP ---
    setInterval(async () => {
        if (!healthMessage) return;

        try {
            const embed = buildHealthEmbed(client);

            // Edit existing message only (prevents spam)
            await healthMessage.edit({ embeds: [embed] });
        } catch (err) {
            console.error("[HEALTH] Failed to update health message:", err);
        }
    }, HEALTH_INTERVAL);
}

module.exports = { startHealthJob };
