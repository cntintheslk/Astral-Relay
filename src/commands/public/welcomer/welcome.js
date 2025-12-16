const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

const db = require("../../../core/database");
const handleWelcome = require("../../../modules/welcome/welcomeHandler");


module.exports = {
    data: new SlashCommandBuilder()
        .setName("welcome")
        .setDescription("Configure the welcome system")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

        .addSubcommand(sc =>
            sc.setName("setup")
                .setDescription("Setup welcome message and channel")
                .addChannelOption(o =>
                    o.setName("channel")
                        .setDescription("Channel to send welcome messages")
                        .setRequired(true)
                )
                .addStringOption(o =>
                    o.setName("message")
                        .setDescription("Welcome message (supports variables)")
                        .setRequired(true)
                )
        )

        .addSubcommand(sc =>
            sc.setName("toggle")
                .setDescription("Enable or disable the welcome system")
        )

        .addSubcommand(sc =>
            sc.setName("preview")
                .setDescription("Preview the welcome message")
        )

        .addSubcommand(sc =>
            sc.setName("status")
                .setDescription("Show current welcome configuration")
        )
        .addSubcommand(sc =>
            sc.setName("dm")
                .setDescription("Enable or disable welcome DMs")
                .addBooleanOption(o =>
                    o.setName("enabled")
                        .setDescription("Whether welcome DMs should be sent")
                )
        )
        .addSubcommand(sc =>
            sc.setName("test")
                .setDescription("Send a test welcome message using current config")
        ),



    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        const now = Date.now();

        const config = db.prepare(`
            SELECT * FROM welcome_config WHERE guild_id = ?
        `).get(guildId);

        /* ======================
           SETUP
        ====================== */
        if (sub === "setup") {
            const channel = interaction.options.getChannel("channel");
            const message = interaction.options.getString("message");

            db.prepare(`
                INSERT INTO welcome_config (
                    guild_id, channel_id, message, enabled, created_at, updated_at
                ) VALUES (?, ?, ?, 1, ?, ?)
                ON CONFLICT(guild_id) DO UPDATE SET
                    channel_id = excluded.channel_id,
                    message = excluded.message,
                    updated_at = excluded.updated_at
            `).run(guildId, channel.id, message, now, now);

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Green")
                        .setTitle("Welcome System Configured")
                        .setDescription(
                            `**Channel:** ${channel}\n\n**Message:**\n${message}`
                        )
                        .setFooter({ text: "Astral Relay • Welcome System" })
                ],
                ephemeral: true
            });
        }

        /* ======================
           TOGGLE
        ====================== */
        if (sub === "toggle") {
            const enabled = config ? !config.enabled : 1;

            db.prepare(`
                INSERT INTO welcome_config (guild_id, enabled, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(guild_id) DO UPDATE SET
                    enabled = excluded.enabled,
                    updated_at = excluded.updated_at
            `).run(guildId, enabled, now);

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(enabled ? "Green" : "Red")
                        .setTitle("Welcome System Updated")
                        .setDescription(
                            `Welcome system is now **${enabled ? "ENABLED" : "DISABLED"}**`
                        )
                ],
                ephemeral: true
            });
        }
        /* ======================
            DM TOGGLE
        ====================== */
        if (sub === "dm") {
            const enabled = interaction.options.getBoolean("enabled");
            const now = Date.now();

            db.prepare(`
                INSERT INTO welcome_config (guild_id, dm_enabled, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(guild_id) DO UPDATE SET
                    dm_enabled = excluded.dm_enabled,
                    updated_at = excluded.updated_at
            `).run(guildId, enabled ? 1 : 0, now);

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(enabled ? "Green" : "Red")
                        .setTitle("Welcome DM Updated")
                        .setDescription(
                            `Welcome DMs are now **${enabled ? "ENABLED" : "DISABLED"}**`
                        )
                        .setFooter({ text: "Astral Relay • Welcome System" })
                ],
                ephemeral: true
            });
        }


        /* ======================
           PREVIEW
        ====================== */
        if (sub === "preview") {
            if (!config) {
                return interaction.reply({
                    content: "❌ Welcome system is not configured.",
                    ephemeral: true
                });
            }

            const vars = {
                "{user}": interaction.user.toString(),
                "{username}": interaction.user.username,
                "{server}": interaction.guild.name,
                "{memberCount}": interaction.guild.memberCount,
                "{created}": interaction.user.createdAt.toDateString()
            };

            let preview = config.message;
            for (const k in vars) preview = preview.replaceAll(k, vars[k]);

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Blurple")
                        .setTitle("Welcome Preview")
                        .setDescription(preview)
                        .setThumbnail(interaction.user.displayAvatarURL())
                ],
                ephemeral: true
            });
        }
        /* ======================
            TEST
        ====================== */
        if (sub === "test") {
            if (!config || !config.channel_id || !config.message) {
                return interaction.reply({
                    content: "❌ Welcome system is not fully configured.",
                    ephemeral: true
                });
            }

            const fakeMember = {
                id: interaction.user.id,
                user: interaction.user,
                guild: interaction.guild
            };

            try {
                await handleWelcome(fakeMember, { isTest: true });

                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Green")
                            .setTitle("Welcome Test Sent")
                            .setDescription(
                                `A test welcome message has been sent to <#${config.channel_id}>.`
                            )
                    ],
                    ephemeral: true
                });
            } catch (err) {
                return interaction.reply({
                    content: `❌ Failed to send test welcome: ${err.message}`,
                    ephemeral: true
                });
            }
        }


        /* ======================
           STATUS
        ====================== */
        if (sub === "status") {
            if (!config) {
                return interaction.reply({
                    content: "❌ Welcome system is not configured.",
                    ephemeral: true
                });
            }

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Blurple")
                        .setTitle("Welcome System Status")
                        .addFields(
                            { name: "Enabled", value: config.enabled ? "Yes" : "No", inline: true },
                            { name: "Channel", value: `<#${config.channel_id}>`, inline: true }
                        )
                        .addFields({
                            name: "Message",
                            value: config.message
                        })
                ],
                ephemeral: true
            });
        }
    }
};
