// src/src/commands/dev/features/features.js

const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

const db = require("../../../core/database");

// ============================================================
// HELPERS
// ============================================================

function setFeatureState(guildId, feature, enabled) {
    db.prepare(`
        INSERT INTO guild_modules (guild_id, module, enabled, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(guild_id, module)
        DO UPDATE SET
            enabled = excluded.enabled,
            updated_at = excluded.updated_at
    `).run(guildId, feature, enabled ? 1 : 0, Date.now());
}

function getFeatureState(guildId, feature) {
    const row = db.prepare(`
        SELECT enabled
        FROM guild_modules
        WHERE guild_id = ? AND module = ?
    `).get(guildId, feature);

    // Default = enabled
    return row?.enabled !== 0;
}

function listFeatures(client) {
    const features = new Set();

    for (const command of client.commands.values()) {
        if (command.module) {
            features.add(command.module);
        }
    }

    return Array.from(features).sort();
}

module.exports = {
    module: "core",

    data: new SlashCommandBuilder()
        .setName("features")
        .setDescription("Enable or disable bot features for this server")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

        .addSubcommand(sub =>
            sub
                .setName("enable")
                .setDescription("Enable a feature in this server")
                .addStringOption(opt =>
                    opt
                        .setName("name")
                        .setDescription("Feature name")
                        .setRequired(true)
                )
        )

        .addSubcommand(sub =>
            sub
                .setName("disable")
                .setDescription("Disable a feature in this server")
                .addStringOption(opt =>
                    opt
                        .setName("name")
                        .setDescription("Feature name")
                        .setRequired(true)
                )
        )

        .addSubcommand(sub =>
            sub
                .setName("status")
                .setDescription("View feature enable/disable status for this server")
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const sub = interaction.options.getSubcommand();

        const features = listFeatures(interaction.client);

        // ============================================================
        // ENABLE / DISABLE
        // ============================================================
        if (sub === "enable" || sub === "disable") {
            const feature = interaction.options
                .getString("name", true)
                .toLowerCase();

            if (!features.includes(feature)) {
                return interaction.reply({
                    ephemeral: true,
                    content:
                        `❌ Unknown feature \`${feature}\`.\n\n` +
                        `Available features:\n` +
                        features.map(f => `• ${f}`).join("\n")
                });
            }

            const enable = sub === "enable";
            setFeatureState(guildId, feature, enable);

            const embed = new EmbedBuilder()
                .setTitle(enable ? "✅ Feature Enabled" : "⛔ Feature Disabled")
                .setColor(enable ? 0x57f287 : 0xed4245)
                .setDescription(
                    `The **${feature}** feature is now **${enable ? "enabled" : "disabled"}** in this server.`
                )
                .setFooter({
                    text: enable
                        ? "Commands for this feature are now usable."
                        : "Commands for this feature are now blocked."
                });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ============================================================
        // STATUS
        // ============================================================
        if (sub === "status") {
            if (!features.length) {
                return interaction.reply({
                    ephemeral: true,
                    content: "No features are registered."
                });
            }

            const lines = features.map(name => {
                const enabled = getFeatureState(guildId, name);
                return `${enabled ? "✅" : "⛔"} **${name}**`;
            });

            const embed = new EmbedBuilder()
                .setTitle("🧩 Feature Status (This Server)")
                .setColor(0x2b2d31)
                .setDescription(lines.join("\n"))
                .setFooter({
                    text: "Disabled features cannot be used in this server."
                });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        return interaction.reply({
            ephemeral: true,
            content: "Unknown features command."
        });
    }
};
