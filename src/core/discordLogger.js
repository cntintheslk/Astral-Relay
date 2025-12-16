// ============================================================
// ASTRAL RELAY — DISCORD LOGGER
// Bridges core telemetry into Discord embeds for operators.
// This module must never be a single point of failure.
// ============================================================

const {
    createInfoEmbed,
    createSuccessEmbed,
    createWarningEmbed,
    createSecurityEmbed,
    createErrorEmbed,
    createCriticalEmbed,
} = require("./embedStyles");

let logChannel = null;
let clientInstance = null;

// ------------------------------------------------------------
// INITIALISATION
// ------------------------------------------------------------

/**
 * Binds the Discord logging channel once the client is ready.
 */
function setLogChannel(channel, client) {
    logChannel = channel;
    clientInstance = client;
}

// ------------------------------------------------------------
// INTERNAL HELPERS
// ------------------------------------------------------------

const EMBED_FACTORY_BY_SEVERITY = {
    INFO: createInfoEmbed,
    SUCCESS: createSuccessEmbed,
    WARN: createWarningEmbed,
    SECURITY: createSecurityEmbed,
    ERROR: createErrorEmbed,
    CRITICAL: createCriticalEmbed,
};

/**
 * Formats structured metadata into a readable embed section.
 */
function appendMetadata(description, metadata) {
    if (!metadata || typeof metadata !== "object") return description;
    const entries = Object.entries(metadata);
    if (!entries.length) return description;

    let output = `${description}\n\n**Details:**\n`;
    for (const [key, value] of entries) {
        output += `• **${key}:** ${value}\n`;
    }
    return output;
}

// ------------------------------------------------------------
// PUBLIC LOG SINK
// ------------------------------------------------------------

/**
 * Emits a log event to Discord.
 * This should only be called by the core logging pipeline.
 */
function emit(severity, title, message, metadata = {}, source, environment) {
    if (!logChannel || !clientInstance) return;

    const factory = EMBED_FACTORY_BY_SEVERITY[severity];
    if (!factory) {
        console.error(
            `[Astral Relay] Invalid log severity "${severity}" — Discord log dropped.`
        );
        return;
    }

    const description = appendMetadata(message, metadata);

    const embed = factory({
        title,
        description,
        source,
        environment,
    });

    logChannel.send({ embeds: [embed] }).catch(err => {
        console.error(
            "[Astral Relay] Failed to send Discord log embed:",
            err?.message || err
        );
    });
}

// ------------------------------------------------------------
// CONVENIENCE WRAPPERS (INTERNAL USE)
// ------------------------------------------------------------

function emitModule(moduleName, severity, title, message, metadata = {}, environment) {
    return emit(
        severity,
        title,
        message,
        metadata,
        `MODULE:${moduleName}`,
        environment
    );
}

function emitError(context, error, environment) {
    const errMsg =
        error?.stack ||
        error?.message ||
        String(error);

    emit(
        "ERROR",
        `Unhandled Error — ${context}`,
        "An unexpected error occurred during operation.",
        {
            context,
            error: errMsg.substring(0, 1900),
        },
        "CORE",
        environment
    );
}

module.exports = {
    setLogChannel,

    // Internal sinks — should not be used directly by feature code
    emit,
    emitModule,
    emitError,
};
