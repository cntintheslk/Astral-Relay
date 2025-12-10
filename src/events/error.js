const logger = require("../core/logger");

module.exports = {
  name: "error",

  execute(error) {
    logger.error("Discord client error:");
    console.error(error);
  },
};
