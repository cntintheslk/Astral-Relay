// src/events/interactionCreate.js

const logger = require("../core/logger");
const { log } = require("../core/discordLogger");

// Load slash commands
const commands = require("../handlers/commands");

// Load button handler for registration approvals
const approvalHandler = require("./interactionButtons/registrationApproval");

module.exports = {
    name: "interactionCreate",

    async execute(interaction) {
        try {
            // ================================
            // 1. BUTTON INTERACTIONS
            // ================================
            if (interaction.isButton()) {
                // Approval / Denial Buttons
                if (interaction.customId.startsWith("approve_") ||
                    interaction.customId.startsWith("deny_")) 
                {
                    return approvalHandler.handle(interaction);
                }

                // (Future button handlers can be inserted here)
            }

            // ================================
            // 2. SLASH COMMANDS
            // ================================
            if (interaction.isChatInputCommand()) {
                const command = commands.get(interaction.commandName);

                if (!command) {
                    logger.error(`Unknown slash command: ${interaction.commandName}`);
                    return interaction.reply({
                        content: "❌ Unknown command.",
                        flags: 64
                    });
                }

                await command.execute(interaction);
                return;
            }

            // ================================
            // 3. SELECT MENUS (future support)
            // ================================
            if (interaction.isStringSelectMenu()) {
                // Reserved for expansions
                return;
            }

        } catch (err) {
            logger.error(`Unhandled interaction error: ${err.stack || err}`);
            
            try {
                await interaction.reply({
                    content: "❌ An unexpected error occurred while processing your interaction.",
                    flags: 64
                });
            } catch (e) {
                // Fallback for if reply already sent
                logger.warn("Interaction already replied or deferred.");
            }

            log("ERROR", "Interaction Failure", err.message);
        }
    }
};
