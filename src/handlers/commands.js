const fs = require("fs");
const path = require("path");
const logger = require("../core/logger");

function loadCommands(client) {
    client.commands = new Map();

    const commandsPath = path.join(__dirname, "../commands");
    const categories = fs.readdirSync(commandsPath);

    for (const category of categories) {
        const categoryPath = path.join(commandsPath, category);
        const files = fs
            .readdirSync(categoryPath)
            .filter(f => f.endsWith(".js"));

        for (const file of files) {
            const filePath = path.join(categoryPath, file);
            const command = require(filePath);

            if (!command.data) {
                logger.warn(`Command missing data property: ${file}`);
                continue;
            }

            client.commands.set(command.data.name, command);
            logger.info(`Loaded command: ${command.data.name}`);
        }
    }

    return client.commands;
}

module.exports = loadCommands;
