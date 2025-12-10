// src/core/configValidator.js

const logger = require("./logger");
const { log } = require("./discordLogger");

function isSnowflake(id) {
    return typeof id === "string" && /^\d{17,20}$/.test(id);
}

function validateConfig(config) {
    let fatal = false;
    const issues = [];

    // BOT TOKEN
    if (!config.token) {
        fatal = true;
        issues.push("BOT_TOKEN is missing.");
    }

    // LOG CHANNEL
    if (!config.logChannelId) {
        fatal = true;
        issues.push("LOG_CHANNEL_ID is missing.");
    } else if (!isSnowflake(config.logChannelId)) {
        fatal = true;
        issues.push(`LOG_CHANNEL_ID is invalid: ${config.logChannelId}`);
    }

    // DEV GUILD
    if (!config.devGuildId) {
        issues.push("DEV_GUILD_ID is not set (commands will not deploy to dev guild).");
    } else if (!isSnowflake(config.devGuildId)) {
        issues.push(`DEV_GUILD_ID is invalid: ${config.devGuildId}`);
    }

    // OWNER IDS
    if (!config.ownerIds.length) {
        issues.push("OWNER_IDS is empty — no one can use protected commands.");
    } else {
        for (const id of config.ownerIds) {
            if (!isSnowflake(id)) {
                issues.push(`OWNER_ID is invalid: ${id}`);
            }
        }
    }

    // Log issues
    if (issues.length > 0) {
        const msg = ["Configuration issues detected:", ...issues.map(x => `• ${x}`)].join("\n");
        logger.warn(msg);
        log("WARN", "Configuration Issues", msg);
    }

    if (fatal) {
        logger.error("Fatal configuration error — shutting down.");
        process.exit(1);
    }
}

module.exports = validateConfig;
