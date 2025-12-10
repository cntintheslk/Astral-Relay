const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { createInfoEmbed, createSuccessEmbed, createErrorEmbed } = require("../../../core/embedStyles");
const config = require("../../../core/config");
const BOT_LOGO =
    "https://cdn.discordapp.com/icons/1444904297358688320/a_d05db8a486d3c803566d67525914c901.gif?size=256";
module.exports = {
    data: new SlashCommandBuilder()
        .setName("dev-changelog")
        .setDescription("Developer-only: publish an official changelog")
        .addStringOption(opt =>
            opt.setName("version")
                .setDescription("Version number (e.g. 2.0.0)")
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName("changes")
                .setDescription("List of changes for this version")
                .setRequired(true)
        ),

    async execute(interaction) {

        // Developer-only check
        if (!config.ownerIds?.includes(interaction.user.id)) {
            return interaction.reply({
                embeds: [createErrorEmbed("Denied", "This command is for developers only.")],
                ephemeral: true
            });
        }

        const version = interaction.options.getString("version");
        const changes = interaction.options.getString("changes");

        // Get changelog channel from env var
        const changelogChannelId = process.env.BOT_CHANGELOGS;
        if (!changelogChannelId) {
            return interaction.reply({
                embeds: [createErrorEmbed("Missing Config", "BOT_CHANGELOGS env variable is not set on Render.")],
                ephemeral: true
            });
        }

        const channel = interaction.guild.channels.cache.get(changelogChannelId);
        if (!channel) {
            return interaction.reply({
                embeds: [createErrorEmbed("Invalid Channel", `Channel ID **${changelogChannelId}** not found in this server.`)],
                ephemeral: true
            });
        }

        // Build embed
        const embed = createInfoEmbed(`Update ${version}`, changes)
            .setFooter({ text: "Astral Relay — Development Changelog" })
            .setTimestamp()
            .setThumbnail(BOT_LOGO);

        await channel.send({ embeds: [embed] });

        return interaction.reply({
            embeds: [createSuccessEmbed("Changelog Published", `Version **${version}** has been posted to <#${changelogChannelId}>.`)],
            ephemeral: true
        });
    }
};
