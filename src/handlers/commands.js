const fs = require("fs");
const path = require("path");

function loadCommands(client) {
    client.commands = new Map();

    const commandsPath = path.join(__dirname, "../commands");
    const categories = fs.readdirSync(commandsPath); // ["global", "dev"]

    for (const category of categories) {
        const categoryPath = path.join(commandsPath, category);

        // Prevent crashes from missing folders
        if (!fs.lstatSync(categoryPath).isDirectory()) {
            console.warn(`Skipping ${categoryPath} — not a directory.`);
            continue;
        }

        const commandFiles = fs.readdirSync(categoryPath).filter(f => f.endsWith(".js"));

        for (const file of commandFiles) {
            const filePath = path.join(categoryPath, file);
            const command = require(filePath);

            if (!command.data) {
                console.warn(`Skipping command ${file} — missing data export.`);
                continue;
            }

            // Tag by category: global or dev
            command.category = category;

            client.commands.set(command.data.name, command);
        }
    }

    console.log(`Loaded ${client.commands.size} commands.`);
}

module.exports = loadCommands;
