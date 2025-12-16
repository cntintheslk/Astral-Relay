// ============================================================
// Astral Relay — Event Loader
// Dynamically loads and binds Discord event handlers.
// ============================================================

const fs = require("fs");
const path = require("path");
const logger = require("../core/logger");

// ============================================================
// LOAD EVENTS
// ============================================================

function loadEvents(client) {
    const eventsPath = path.join(__dirname, "../events");
    const files = fs.readdirSync(eventsPath).filter(f => f.endsWith(".js"));

    for (const file of files) {
        const eventPath = path.join(eventsPath, file);
        const event = require(eventPath);

        if (!event?.name || typeof event.execute !== "function") {
            logger.warn("Invalid event file skipped.", { file });
            continue;
        }

        logger.info("Event loaded.", { event: event.name });

        if (event.once) {
            client.once(event.name, async (...args) => {
                try {
                    await event.execute(...args, client);
                } catch (err) {
                    logger.error("Unhandled error in event handler.", {
                        event: event.name,
                        error: err?.stack || err?.message || String(err),
                    });
                }
            });
        } else {
            client.on(event.name, async (...args) => {
                try {
                    await event.execute(...args, client);
                } catch (err) {
                    logger.error("Unhandled error in event handler.", {
                        event: event.name,
                        error: err?.stack || err?.message || String(err),
                    });
                }
            });
        }
    }
}

// ============================================================
// EXPORT
// ============================================================

module.exports = loadEvents;
