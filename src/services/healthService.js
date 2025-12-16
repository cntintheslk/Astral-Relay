// ============================================================
// ASTRAL RELAY — HEALTH SERVICE
// Collects runtime, database, and system telemetry.
// ============================================================

const os = require("os");
const { performance } = require("perf_hooks");
const db = require("./database");
const moduleRegistry = require("./moduleRegistry");
const config = require("../core/config");
const guild = client.guilds.cache.first();
const guildId = guild?.id;

// ------------------------------------------------------------
// INTERNAL MEASUREMENTS
// ------------------------------------------------------------

async function measureEventLoopDelay() {
    return new Promise(resolve => {
        const start = performance.now();
        setTimeout(() => {
            resolve(performance.now() - start - 10);
        }, 10);
    });
}

async function measureDbStatus() {
    const start = performance.now();

    try {
        db.prepare("SELECT 1").get();
        const duration = performance.now() - start;

        return {
            ok: true,
            responseTime: duration,
            locked: duration > 100,
        };
    } catch (err) {
        return {
            ok: false,
            responseTime: null,
            locked: true,
            error: err.message,
        };
    }
}

function determineStatus({ db, eventLoopDelay, gatewayPing }) {
    if (!db.ok) return "CRITICAL";
    if (eventLoopDelay > 50) return "DEGRADED";
    if (gatewayPing > 250) return "DEGRADED";
    return "OPERATIONAL";
}

// ------------------------------------------------------------
// PUBLIC API
// ------------------------------------------------------------

async function collectHealth(client) {
    const memory = process.memoryUsage();
    const dbStatus = await measureDbStatus();
    const eventLoopDelay = await measureEventLoopDelay();

    const status = determineStatus({
        db: dbStatus,
        eventLoopDelay,
        gatewayPing: client.ws.ping,
    });

    return {
        status,
        uptime: process.uptime(),
        environment: config.environment,
        nodeVersion: process.version,

        guildCount: client.guilds.cache.size,
        moduleCount: guildId
            ? moduleRegistry.getModuleCount(guildId)
            : 0,

        commandCount: client.commands.size,
        gatewayPing: client.ws.ping,

        memory: {
            rss: memory.rss,
            heapUsed: memory.heapUsed,
            heapTotal: memory.heapTotal,
        },

        db: dbStatus,
        eventLoopDelay,
    };
}

module.exports = {
    collectHealth,
};
