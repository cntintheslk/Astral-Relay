// ============================================================
// ASTRAL RELAY — REGISTRATION LOG SERVICE
// Handles structured logging for registration-related events.
// ============================================================

const logger = require("../core/logger");
const { createLogEmbed } = require("../core/embedStyles");
const guildConfigService = require("./guildConfigService");

/**
 * Sends a registration log to the guild-specific log channel if configured.
 * Falls back to core telemetry when unavailable.
 */
async function sendRegistrationLog(guild, level, title, description) {
    if (!guild) return;

    const { registration_log_channel_id: channelId } =
        guildConfigService.getSettings(guild.id);

    if (!channelId) {
        logger.debug("Registration log skipped (no channel configured).", {
            guildId: guild.id,
        });
        return;
    }

    const channel = guild.channels.cache.get(channelId);

    if (!channel) {
        logger.warn("Registration log channel not found.", {
            guildId: guild.id,
            channelId,
        });
        return;
    }

    try {
        const embed = createLogEmbed(
            guild.client,
            level,
            title,
            description
        );

        await channel.send({ embeds: [embed] });

        logger.debug("Registration log sent.", {
            guildId: guild.id,
            channelId,
            level,
        });

    } catch (err) {
        logger.error("Failed to send registration log.", {
            guildId: guild.id,
            channelId,
            error: err?.stack || err.message,
        });
    }
}

module.exports = {
    sendRegistrationLog,
};
