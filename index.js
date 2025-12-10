// index.js
const createClient = require("./src/core/client");
const loadEvents = require("./src/handlers/events");
const logger = require("./src/core/logger");
require("./src/core/database");
const { loadSchemas } = require("./src/modules/_schema");

const config = require("./src/core/config");


// Check for missing bot token
if (!config.token) {
  logger.error("BOT_TOKEN environment variable is missing. Set it in Render.");
  process.exit(1);
}

const client = createClient();

// Load events
loadEvents(client);

// Global crash handlers
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Promise Rejection:");
  console.error(err);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:");
  console.error(err);
});

// Start bot
client.login(config.token).catch((err) => {
  logger.error("Failed to login:");
  console.error(err);
});

// Schema Loader

const { loadSchemas } = require("./src/modules/_schema/index");
loadSchemas();
