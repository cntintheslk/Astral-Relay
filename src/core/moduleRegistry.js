// src/core/moduleRegistry.js

const fs = require("fs");
const path = require("path");
const logger = require("./logger");
const { logModule, logError } = require("./discordLogger");

const MODULES_DIR = path.join(process.cwd(), "src/modules");

// Internal tracking of loaded modules
// name -> { module, path, metadata }
const loadedModules = new Map();

/**
 * Discover modules inside /src/modules
 */
function discoverModules() {
    if (!fs.existsSync(MODULES_DIR)) {
        logger.warn("Modules directory missing.");
        return [];
    }

    const dirs = fs.readdirSync(MODULES_DIR, { withFileTypes: true });
    const modules = [];

    for (const entry of dirs) {
        if (!entry.isDirectory()) continue;
        if (entry.name.startsWith("_")) continue; // ignore _schema, etc.

        const modPath = path.join(MODULES_DIR, entry.name, "module.js");

        if (!fs.existsSync(modPath)) {
            logger.warn(`Module "${entry.name}" missing module.js — skipped.`);
            continue;
        }

        modules.push({
            name: entry.name,
            path: modPath
        });
    }

    return modules;
}

/**
 * Load a module by definition
 */
async function loadModule(def, client) {
    const { name, path: modPath } = def;

    try {
        // Clear require cache for reload support
        delete require.cache[require.resolve(modPath)];
        const mod = require(modPath);

        if (!mod || typeof mod.init !== "function") {
            logger.warn(`Module "${name}" has no init() — skipping.`);
            logModule(name, "WARN", "Module Skipped", "Missing init(client) export.");
            return false;
        }

        // If module already loaded, unload first
        if (loadedModules.has(name)) {
            await unloadModule(name, client);
        }

        // Initialize module
        await Promise.resolve(mod.init(client));

        loadedModules.set(name, {
            module: mod,
            path: modPath,
            metadata: {
                loadedAt: new Date(),
                supportsShutdown: typeof mod.shutdown === "function"
            }
        });

        logger.success(`[module:${name}] Initialized`);
        logModule(name, "SUCCESS", "Module Loaded", `${name} initialized successfully.`);

        return true;

    } catch (err) {
        logger.error(`Error loading module "${name}": ${err.message}`);
        console.error(err);

        logError(`moduleLoad:${name}`, err);
        return false;
    }
}

/**
 * Unload a module cleanly
 */
async function unloadModule(name, client) {
    const entry = loadedModules.get(name);
    if (!entry) {
        logger.warn(`Unload requested for unknown module "${name}"`);
        return false;
    }

    const { module, path: modPath } = entry;

    try {
        if (typeof module.shutdown === "function") {
            await Promise.resolve(module.shutdown(client));
        }

        delete require.cache[require.resolve(modPath)];
        loadedModules.delete(name);

        logger.warn(`[module:${name}] Unloaded`);
        logModule(name, "WARN", "Module Unloaded", `${name} shutdown completed.`);

        return true;

    } catch (err) {
        logger.error(`Error unloading module "${name}": ${err.message}`);
        console.error(err);
        logError(`moduleUnload:${name}`, err);
        return false;
    }
}

/**
 * Reload lifecycle for a module
 */
async function reloadModule(name, client) {
    const defs = discoverModules();
    const def = defs.find((m) => m.name === name);

    if (!def) {
        logger.warn(`Reload failed — module not found: ${name}`);
        return false;
    }

    await unloadModule(name, client);
    return await loadModule(def, client);
}

/**
 * Load all modules at startup
 */
async function loadAllModules(client) {
    const defs = discoverModules();

    if (!defs.length) {
        logger.info("No modules discovered.");
        return;
    }

    logger.info(`Discovered ${defs.length} modules. Initializing...`);

    for (const def of defs) {
        try {
            // Prevent concurrency issues during init()
            // eslint-disable-next-line no-await-in-loop
            await loadModule(def, client);
        } catch (err) {
            logger.error(`Fatal error loading module "${def.name}": ${err.message}`);
            logError(`moduleFatal:${def.name}`, err);
        }
    }

    logger.success("All modules loaded.");
}

/**
 * List loaded modules
 */
function listModules() {
    return Array.from(loadedModules.keys());
}

/**
 * Export API
 */
module.exports = {
    discoverModules,
    loadModule,
    unloadModule,
    reloadModule,
    loadAllModules,
    listModules,
    loadedModules // exported for introspection + dashboard future use
};
