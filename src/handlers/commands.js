const fs = require("fs");
const path = require("path");
const config = require("../core/config");

function loadCommands(client) {
    client.commands = new Map();

    const basePath = path.join(__dirname, "../commands");
    const isDev = config.environment === "development";

    /**
     * Recursively load .js command files from a directory
     */
    function loadDirectory(dirPath, scope) {
        const entries = fs.readdirSync(dirPath);

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry);
            const stat = fs.lstatSync(fullPath);

            if (stat.isDirectory()) {
                loadDirectory(fullPath, scope);
                continue;
            }

            if (!entry.endsWith(".js")) continue;

            const command = require(fullPath);

            if (!command?.data?.name || typeof command.execute !== "function") {
                console.warn(`Skipping ${fullPath} (invalid command export)`);
                continue;
            }

            command.scope = scope; // global | In_Development
            client.commands.set(command.data.name, command);
        }
    }

    // --------------------------------------------------------
    // GLOBAL COMMANDS (ALWAYS)
    // --------------------------------------------------------

    const globalPath = path.join(basePath, "global");
    if (fs.existsSync(globalPath)) {
        loadDirectory(globalPath, "global");
    }

    // --------------------------------------------------------
    // IN-DEVELOPMENT COMMANDS (DEV ONLY)
    // --------------------------------------------------------

    if (isDev) {
        const devPath = path.join(basePath, "In_Development");
        if (fs.existsSync(devPath)) {
            loadDirectory(devPath, "In_Development");
        }
    }

    console.log(
        `[Commands] Loaded ${client.commands.size} commands ` +
        `(env=${config.environment})`
    );
}

module.exports = loadCommands;
