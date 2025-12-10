// Centralized logging for registration events.
// Ensures ALL registration logs go to the configured guild log channel.

const { log } = require("./discordLogger");
const { getSettings } = require("../modules/registration/settingsStore");

module.exports.sendRegLog = async function sendRegLog(guild, level, title, description) {
    const settings = getSettings(guild.id);
    const channelId = settings.registration_log_channel_id;

    // No channel configured → DO NOT log to bot logs anymore
    if (!channelId) {
        console.warn(`[Registration] No registration_log_channel_id set for guild ${guild.id}`);
        return;
    }

    const channel = guild.channels.cache.get(channelId);
    if (!channel) {
        console.warn(`[Registration] Configured log channel ${channelId} not found in guild ${guild.id}`);
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
                                          0xe74c3c,
                timestamp: new Date().toISOString()
            }]
        });
    } catch (err) {
        console.error(`[Registration] Failed to send log: ${err.message}`);
    }
};
