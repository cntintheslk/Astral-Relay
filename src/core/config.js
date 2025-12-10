// src/core/config.js

module.exports = {
  token: process.env.BOT_TOKEN,
  environment: process.env.NODE_ENV || "production",
  logChannelId: process.env.LOG_CHANNEL_ID,
  devGuildId: process.env.DEV_GUILD_ID,
  ownerIds: process.env.OWNER_IDS ? process.env.OWNER_IDS.split(",") : [],
  logLevel: process.env.LOG_LEVEL || "INFO",
  devHealthChannelId: process.env.DEV_HEALTH_CHANNEL_ID
};
