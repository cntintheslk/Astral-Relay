const { getSettings } = require("../modules/registration/settingsStore");

module.exports.sendRegLog = async function sendRegLog(guild, level, title, description) {
    const settings = getSettings(guild.id);

    const channelId = settings.registration_log_channel_id;
    if (!channelId) {
        console.warn(`[Registration] No log channel set for guild ${guild.id}.`);
        return;
    }

    const channel = guild.channels.cache.get(channelId);
    if (!channel) {
        console.warn(`[Registration] Configured log channel ${channelId} does not exist in guild ${guild.id}`);
        return;
    }

    try {
        await channel.send({
            embeds: [{
                title,
                description,
                color:
                    level === "SUCCESS" ? 0x2ecc71 :
                    level === "WARN"    ? 0xf1c40f :
                                          0x3498db,
                timestamp: new Date().toISOString()
            }]
        });
    } catch (err) {
        console.error(`[Registration] Failed to send log: ${err.message}`);
    }
};
