const { SlashCommandBuilder } = require("discord.js");
const {
    listModules,
    loadModule,
    unloadModule,
    reloadModule,
} = require("../../core/moduleRegistry");
const config = require("../../core/config");
const logger = require("../../core/logger");
const { log } = require("../../core/discordLogger");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("module")
        .setDescription("Manage bot modules (developers only)")
        .addSubcommand(sub =>
            sub
                .setName("list")
                .setDescription("List all discovered and loaded modules")
        )
        .addSubcommand(sub =>
            sub
                .setName("load")
                .setDescription("Load a module")
                .addStringOption(opt =>
                    opt
                        .setName("name")
                        .setDescription("Module name to load")
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName("unload")
                .setDescription("Unload a module")
                .addStringOption(opt =>
                    opt
                        .setName("name")
                        .setDescription("Module name to unload")
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName("reload")
                .setDescription("Reload a module")
                .addStringOption(opt =>
                    opt
                        .setName("name")
                        .setDescription("Module name to reload")
                        .setRequired(true)
                )
        ),

    /**
     * Execute handler for /module command
     */
    async execute(interaction, client) {
        // Owner check
        if (!config.ownerIds.includes(interaction.user.id)) {
            return interaction.reply({
                content: "❌ You are not authorized to use module management commands.",
                ephemeral: true,
            });
        }

        const sub = interaction.options.getSubcommand();

        // -------------------
        // /module list
        // -------------------
        if (sub === "list") {
            const current = listModules();
            return interaction.reply({
                content:
                    `**Loaded Modules:**\n${current
                        .map(m => `• \`${m}\``)
                        .join("\n") || "None found."}`,
                ephemeral: true,
            });
        }

        // Module name for other commands
        const name = interaction.options.getString("name");

        // -------------------
        // /module load
        // -------------------
        if (sub === "load") {
            await loadModule({ name, path: `${process.cwd()}/src/modules/${name}/module.js` }, client);
            log("SUCCESS", "Module Loaded", `${name} module loaded by ${interaction.user.tag}`);
            return interaction.reply({
                content: `✅ Module **${name}** loaded.`,
                ephemeral: true,
            });
        }

        // -------------------
        // /module unload
        // -------------------
        if (sub === "unload") {
            await unloadModule(name, client);
            log("WARN", "Module Unloaded", `${name} module unloaded by ${interaction.user.tag}`);
            return interaction.reply({
                content: `⚠️ Module **${name}** unloaded.`,
                ephemeral: true,
            });
        }

        // -------------------
        // /module reload
        // -------------------
        if (sub === "reload") {
            await reloadModule(name, client);
            log("SUCCESS", "Module Reloaded", `${name} module reloaded by ${interaction.user.tag}`);
            return interaction.reply({
                content: `🔄 Module **${name}** reloaded.`,
                ephemeral: true,
            });
        }
    },
};
