// src/core/discordLogger.js

const { createLogEmbed } = require("./embedStyles");
let logChannel = null;
let clientInstance = null;

// Set log channel when bot starts
function setLogChannel(channel, client) {
    logChannel = channel;
    clientInstance = client;
}

// Structured logging with optional metadata
function log(type = "INFO", title, message, metadata = {}) {
    if (!logChannel || !clientInstance) return;

    let description = message;

    // If metadata object exists, append as formatted list
    if (metadata && typeof metadata === "object" && Object.keys(metadata).length) {
        description += "\n\n**Details:**\n";
        for (const [key, value] of Object.entries(metadata)) {
            description += `• **${key}:** ${value}\n`;
        }
    }

    const embed = createLogEmbed(clientInstance, type, title, description);

    logChannel.send({ embeds: [embed] }).catch(() => {});
}

// Namespaced logs: logModule("registration", "INFO", "Loaded", {...})
function logModule(moduleName, type, title, message, metadata = {}) {
    return log(type, `[module:${moduleName}] ${title}`, message, metadata);
}

// Expose structured logger for commands/events
function logError(context, error) {
    const errMsg = error?.stack || error?.message || `${error}`;
    log(
        "ERROR",
        `Error in ${context}`,
        "An unhandled error occurred.",
        {
            context,
            error: errMsg.substring(0, 1900)
        }
    );
}

module.exports = {
    setLogChannel,
    log,
    logModule,
    logError
};
