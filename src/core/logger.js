// ============================================================
// ASTRAL RELAY — CORE LOGGER
// Centralised structured logging with optional sinks.
// ============================================================

const LOG_LEVELS = require("./logLevel");

const LEVEL_VALUES = Object.values(LOG_LEVELS);

let discordSink = null;

console.log(">>> LOGGER FILE LOADED:", __filename);

// ------------------------------------------------------------
// INTERNAL EMITTER
// ------------------------------------------------------------

function emit(level, message, meta = null) {
    if (!LEVEL_VALUES.includes(level)) {
        console.warn(`[LOGGER] Invalid log level used: ${level}`);
        level = LOG_LEVELS.INFO;
    }

    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        meta,
    };

    // Console output (always)
    const base = `[${entry.level}] ${entry.message}`;
    console.log(meta ? `${base} ${JSON.stringify(meta)}` : base);

    // Discord sink (optional)
    if (typeof discordSink === "function") {
        discordSink(entry);
    }
}

// ------------------------------------------------------------
// PUBLIC API
// ------------------------------------------------------------

const logger = {
    attachDiscordSink(fn) {
        discordSink = fn;
    },

    debug(msg, meta) {
        emit(LOG_LEVELS.DEBUG, msg, meta);
    },

    info(msg, meta) {
        emit(LOG_LEVELS.INFO, msg, meta);
    },

    success(msg, meta) {
        emit(LOG_LEVELS.SUCCESS, msg, meta);
    },

    warn(msg, meta) {
        emit(LOG_LEVELS.WARN, msg, meta);
    },

    security(msg, meta) {
        emit(LOG_LEVELS.SECURITY, msg, meta);
    },

    error(msg, meta) {
        emit(LOG_LEVELS.ERROR, msg, meta);
    },

    critical(msg, meta) {
        emit(LOG_LEVELS.CRITICAL, msg, meta);
    },
};

module.exports = logger;
