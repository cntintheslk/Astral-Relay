// src/core/health.js

const os = require("os");
const { performance, PerformanceObserver } = require("perf_hooks");
const db = require("./database");
const moduleRegistry = require("./moduleRegistry");

async function measureEventLoopDelay() {
    return new Promise(resolve => {
        const start = performance.now();
        setTimeout(() => {
            resolve(performance.now() - start - 10); // expected ~0–2ms
        }, 10);
    });
}

async function measureDbStatus() {
    const start = performance.now();

    try {
        await db.get("SELECT 1"); // simple heartbeat query
        const duration = performance.now() - start;

        return {
            ok: true,
            responseTime: duration,
            locked: duration > 100 ? true : false, // DB locked or slow
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

async function collectHealth(client) {
    const memory = process.memoryUsage();
    const dbStatus = await measureDbStatus();
    const eventLoopDelay = await measureEventLoopDelay();

    return {
        uptime: process.uptime(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || "production",
        guildCount: client.guilds.cache.size,
        moduleCount: moduleRegistry.listModules().length,
        commandCount: client.commands.size,
        gatewayPing: client.ws.ping,

        memory: {
            rss: memory.rss,
            heapUsed: memory.heapUsed,
            heapTotal: memory.heapTotal
        },

        db: dbStatus,
        eventLoopDelay,
    };
}

module.exports = {
    collectHealth
};
