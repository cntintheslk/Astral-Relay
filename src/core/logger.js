// ============================================================
// ASTRAL RELAY — CORE LOGGING SYSTEM
// Central telemetry authority. Emits structured log events
// to console and subscribed sinks (e.g. Discord).
// ============================================================

const chalk = require("chalk").default;
const config = require("./config");

// Discord logger is OPTIONAL and loaded lazily
let discordSink = null;

// ------------------------------------------------------------
// LOG LEVEL DEFINITIONS (CANONICAL)
// ------------------------------------------------------------

const LEVELS = [
    "DEBUG",
    "INFO",
    "SUCCESS",
    "WARN",
    "SECURITY",
    "ERROR",
    "CRITICAL",
];

const currentLevelIndex =
    LEVELS.indexOf((config.logLevel || "INFO").toUpperCase()) || 1;

// ------------------------------------------------------------
// INTERNAL HELPERS
// ------------------------------------------------------------

function shouldLog(level) {
    return LEVELS.indexOf(level) >= currentLevelIndex;
}

function getTimestamp() {
    return new Date().toISOString();
}

function formatLine(level, message) {
    return `[${getTimestamp()}] [${level.padEnd(8)}] ${message}`;
}

/**
 * Emits a structured log event to all registered sinks.
 */
function emit(severity, message, metadata) {
    if (!discordSink) return;

    try {
        discordSink.emit(
            severity,
            severity, // title (short + declarative)
            message,
            metadata,
            "CORE",
            config.environment
        );
    } catch (err) {
        console.error(
            "[Astral Relay] Discord log sink failure:",
            err?.message || err
        );
    }
}

// ------------------------------------------------------------
// PUBLIC LOGGING INTERFACE
// ------------------------------------------------------------

module.exports = {
    /**
     * Registers the Discord logging sink.
     * Must be called once after client is ready.
     */
    attachDiscordLogger(discordLogger) {
        discordSink = discordLogger;
    },

    debug(message, metadata) {
        if (!shouldLog("DEBUG")) return;
        console.log(chalk.gray(formatLine("DEBUG", message)));
        emit("DEBUG", message, metadata);
    },

    info(message, metadata) {
        if (!shouldLog("INFO")) return;
        console.log(chalk.blue(formatLine("INFO", message)));
        emit("INFO", message, metadata);
    },

    success(message, metadata) {
        if (!shouldLog("SUCCESS")) return;
        console.log(chalk.green(formatLine("SUCCESS", message)));
        emit("SUCCESS", message, metadata);
    },

    warn(message, metadata) {
        if (!shouldLog("WARN")) return;
        console.log(chalk.yellow(formatLine("WARN", message)));
        emit("WARN", message, metadata);
    },

    security(message, metadata) {
        if (!shouldLog("SECURITY")) return;
        console.log(chalk.keyword("orange")(formatLine("SECURITY", message)));
        emit("SECURITY", message, metadata);
    },

    error(message, metadata) {
        if (!shouldLog("ERROR")) return;
        console.log(chalk.red(formatLine("ERROR", message)));
        emit("ERROR", message, metadata);
    },

    critical(message, metadata) {
        console.log(chalk.bgRed.white(formatLine("CRITICAL", message)));
        emit("CRITICAL", message, metadata);
    },
};
