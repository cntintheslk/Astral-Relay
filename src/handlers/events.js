const fs = require("fs");
const path = require("path");
const logger = require("../core/logger");
const { logError } = require("../core/discordLogger");

function loadEvents(client) {
    const eventsPath = path.join(__dirname, "../events");
    const files = fs.readdirSync(eventsPath).filter(f => f.endsWith(".js"));

    for (const file of files) {
        const event = require(path.join(eventsPath, file));
        logger.info(`Event loaded: ${event.name}`);

        if (event.once) {
            client.once(event.name, async (...args) => {
                try {
                    await event.execute(...args, client);
                } catch (err) {
                    logError(`event:${event.name}`, err);
                }
            });
        } else {
            client.on(event.name, async (...args) => {
                try {
                    await event.execute(...args, client);
                } catch (err) {
                    logError(`event:${event.name}`, err);
                }
            });
        }
    }
}

module.exports = loadEvents;
