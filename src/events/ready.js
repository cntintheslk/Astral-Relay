const logger = require("../core/logger");

module.exports = {
  name: "ready",
  once: true,

  execute(client) {
    logger.success(`Bot logged in as ${client.user.tag}`);
  },
};
