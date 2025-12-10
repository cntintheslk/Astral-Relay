const fs = require("fs");
const path = require("path");

function loadCommands(client) {
    client.commands = new Map();

    const basePath = path.join(__dirname, "../commands");
    const categories = fs.readdirSync(basePath); // ["global", "dev"]

    for (const category of categories) {
        const categoryPath = path.join(basePath, category);

        if (!fs.lstatSync(categoryPath).isDirectory()) continue;

        // Recursively load commands from subfolders
        const items = fs.readdirSync(categoryPath);

        for (const item of items) {
            const itemPath = path.join(categoryPath, item);
            const stat = fs.lstatSync(itemPath);

            // CASE 1: Command file directly inside /global or /dev
            if (stat.isFile() && item.endsWith(".js")) {
                const command = require(itemPath);
                if (!command.data) continue;

                command.category = category;
                client.commands.set(command.data.name, command);
            }

            // CASE 2: Command file inside a subfolder
            if (stat.isDirectory()) {
                const subfiles = fs.readdirSync(itemPath).filter(f => f.endsWith(".js"));

                for (const file of subfiles) {
                    const commandPath = path.join(itemPath, file);
                    const command = require(commandPath);

                    if (!command.data) {
                        console.warn(`Skipping ${file} (missing data export)`);
                        continue;
                    }

                    command.category = category; // global or dev
                    client.commands.set(command.data.name, command);
                }
            }
        }
    }

    console.log(`Loaded ${client.commands.size} commands.`);
}

module.exports = loadCommands;
