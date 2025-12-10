// src/core/discordLogger.js

const { createLogEmbed } = require("./embedStyles");
const logger = require("./logger");

let logChannel = null;
let clientRef = null;

// Called from ready.js
function setLogChannel(channel, client) {
    logChannel = channel;
    clientRef = client;

    logger.success(`Discord log channel set: ${channel.id}`);
}

// Type: INFO / WARN / SUCCESS / ERROR
async function log(type, title, description) {
    if (!logChannel || !clientRef) {
        return logger.warn(`Attempted to log before log channel was initialized: ${title}`);
    }

    try {
        const embed = createLogEmbed(clientRef, type, title, description);
        await logChannel.send({ embeds: [embed] });
    } catch (err) {
        logger.error("Failed to send Discord log:");
        console.error(err);
    }
}

module.exports = {
    setLogChannel,
    log,
};
