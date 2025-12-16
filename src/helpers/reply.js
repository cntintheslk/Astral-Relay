// src/core/reply.js

const {
    createSuccessEmbed,
    createInfoEmbed,
    createWarningEmbed,
    createErrorEmbed
} = require("../core/embedStyles");

/**
 * Safely send a response to an interaction.
 * Handles replies, followups, and errors during reply lifecycle.
 */
async function safeReply(interaction, message) {
    try {
        if (interaction.deferred || interaction.replied) {
            return await interaction.followUp(message);
        } else {
            return await interaction.reply(message);
        }
    } catch {
        // Fallback fail-safe
        return await interaction.followUp(message).catch(() => {});
    }
}

/**
 * Shorthand reply functions using your embed styles
 */

module.exports = {
    success: async (interaction, title, description, ephemeral = true) => {
        return safeReply(interaction, {
            embeds: [createSuccessEmbed(title, description)],
            ephemeral
        });
    },

    info: async (interaction, title, description, ephemeral = true) => {
        return safeReply(interaction, {
            embeds: [createInfoEmbed(title, description)],
            ephemeral
        });
    },

    warn: async (interaction, title, description, ephemeral = true) => {
        return safeReply(interaction, {
            embeds: [createWarningEmbed(title, description)],
            ephemeral
        });
    },

    error: async (interaction, title, description, ephemeral = true) => {
        return safeReply(interaction, {
            embeds: [createErrorEmbed(title, description)],
            ephemeral
        });
    },

    /**
     * Optional: auto-defer helper for long operations
     */
    defer: async (interaction, ephemeral = true) => {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral });
        }
    }
};
