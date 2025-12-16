// ============================================================
// ASTRAL RELAY — HEALTH SERVICE
// Collects and evaluates runtime health signals.
// ============================================================

const { performance } = require("perf_hooks");
const db = require("./database");
const moduleRegistry = require("./moduleRegistry");
const config = require("../core/config")

// ------------------------------------------------------------
// INTERNAL MEASUREMENTS
// ------------------------------------------------------------

async function measureEventLoopDelay() {
    try {
        const start = performance.now();

        return await new Promise(resolve => {
            setTimeout(() => {
                resolve(performance.now() - start - 10); // expected ~0–2ms
            }, 10);
        });
    } catch {
        return null;
    }
}

async function measureDbStatus() {
    const start = performance.now();

    try {
        await db.get("SELECT 1"); // heartbeat
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

// ------------------------------------------------------------
// VERDICT LOGIC
// ------------------------------------------------------------

function deriveHealthStatus({ db, eventLoopDelay }) {
    const issues = [];
    let status = "OPERATIONAL";

    // --- Database ---
    if (!db.ok) {
        status = "CRITICAL";
        issues.push("Database unreachable");
    } else if (db.locked) {
        status = "DEGRADED";
        issues.push("Database responding slowly or locked");
    }

    // --- Event Loop ---
    if (eventLoopDelay !== null && eventLoopDelay > 50) {
        if (status !== "CRITICAL") status = "DEGRADED";
        issues.push("Event loop delay elevated");
    }

    return { status, issues };
}

// ------------------------------------------------------------
// PUBLIC API
// ------------------------------------------------------------

async function collectHealth(client) {
    try {
        const memory = process.memoryUsage();

        const [dbStatus, eventLoopDelay] = await Promise.all([
            measureDbStatus(),
            measureEventLoopDelay(),
        ]);

        const verdict = deriveHealthStatus({
            db: dbStatus,
            eventLoopDelay,
        });

        return {
            // --- Verdict ---
            status: verdict.status,
            issues: verdict.issues,

            // --- Runtime ---
            uptime: process.uptime(),
            nodeVersion: process.version,
            environment: config.environment,

            // --- Discord ---
            guildCount: client.guilds.cache.size,
            commandCount: client.commands.size,
            moduleCount: moduleRegistry.listModules().length,
            gatewayPing: client.ws.ping,

            // --- Memory ---
            memory: {
                rss: memory.rss,
                heapUsed: memory.heapUsed,
                heapTotal: memory.heapTotal,
            },

            // --- Performance ---
            eventLoopDelay,

            // --- Database ---
            db: dbStatus,
        };

    } catch (err) {
        // Absolute fallback — health command must never crash
        return {
            status: "CRITICAL",
            issues: ["Health collection failed"],

            uptime: process.uptime(),
            environment: process.env.NODE_ENV || "production",

            error: err?.stack || String(err),
        };
    }
}

module.exports = {
    collectHealth,
};
