// src/core/moduleRegistry.js

const fs = require("fs");
const path = require("path");
const logger = require("./logger");
const { log } = require("./discordLogger");

const modulesRoot = path.join(__dirname, "../modules");

// name -> { module, path }
const loadedModules = new Map();

function discoverModules() {
    if (!fs.existsSync(modulesRoot)) {
        logger.warn("Modules directory not found, skipping module discovery.");
        return [];
    }

    const entries = fs.readdirSync(modulesRoot, { withFileTypes: true });

    const modules = [];

    for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (entry.name.startsWith("_")) continue; // skip _schema etc.

        const modulePath = path.join(modulesRoot, entry.name, "module.js");

        if (fs.existsSync(modulePath)) {
            modules.push({
                name: entry.name,
                path: modulePath,
            });
        } else {
            logger.warn(
                `Module folder "${entry.name}" has no module.js, skipping.`
            );
        }
    }

    return modules;
}

async function loadModule(def, client) {
    const { name, path: modulePath } = def;

    try {
        delete require.cache[require.resolve(modulePath)];
        const mod = require(modulePath);

        if (!mod || typeof mod.init !== "function") {
            logger.warn(
                `Module "${name}" does not export an init(client) function. Skipping.`
            );
            return;
        }

        // If it previously existed, unload first
        if (loadedModules.has(name)) {
            await unloadModule(name, client);
        }

        // Call init; support async
        await Promise.resolve(mod.init(client));

        loadedModules.set(name, {
            module: mod,
            path: modulePath,
        });

        logger.success(`Module loaded: ${name}`);
        log("SUCCESS", "Module Loaded", `\`${name}\` module initialized.`);
    } catch (err) {
        logger.error(`Failed to load module "${name}": ${err.message}`);
        console.error(err);
        log(
            "ERROR",
            "Module Load Error",
            `Module: \`${name}\`\n\`\`\`${err.message}\`\`\``
        );
    }
}

async function unloadModule(name, client) {
    const entry = loadedModules.get(name);
    if (!entry) {
        logger.warn(`Tried to unload unknown module: ${name}`);
        return;
    }

    const { module, path: modulePath } = entry;

    try {
        if (typeof module.unload === "function") {
            await Promise.resolve(module.unload(client));
        }

        delete require.cache[require.resolve(modulePath)];
        loadedModules.delete(name);

        logger.info(`Module unloaded: ${name}`);
        log("WARN", "Module Unloaded", `\`${name}\` module was unloaded.`);
    } catch (err) {
        logger.error(`Failed to unload module "${name}": ${err.message}`);
        console.error(err);
        log(
            "ERROR",
            "Module Unload Error",
            `Module: \`${name}\`\n\`\`\`${err.message}\`\`\``
        );
    }
}

async function reloadModule(name, client) {
    const modules = discoverModules();
    const def = modules.find((m) => m.name === name);

    if (!def) {
        logger.warn(`Cannot reload, module definition not found: ${name}`);
        return;
    }

    await unloadModule(name, client);
    await loadModule(def, client);
}

async function loadAllModules(client) {
    const defs = discoverModules();

    if (!defs.length) {
        logger.info("No modules discovered to load.");
        return;
    }

    logger.info(`Discovered ${defs.length} modules. Initializing...`);

    for (const def of defs) {
        // eslint-disable-next-line no-await-in-loop
        await loadModule(def, client);
    }

    logger.success("All modules loaded.");
}

function listModules() {
    return Array.from(loadedModules.keys());
}

module.exports = {
    loadAllModules,
    reloadModule,
    unloadModule,
    listModules,
};
