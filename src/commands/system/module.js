const { SlashCommandBuilder } = require("discord.js");
const reply = require("../../core/reply");

const {
    listModules,
    loadModule,
    unloadModule,
    reloadModule,
} = require("../../core/moduleRegistry");

const config = require("../../core/config");
const logger = require("../../core/logger");
const { log } = require("../../core/discordLogger");
const path = require("path");

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

    async execute(interaction) {
        // Developer validation
        if (!config.ownerIds.includes(interaction.user.id)) {
            return reply.error(
                interaction,
                "Access Denied",
                "You are not authorized to use module management commands."
            );
        }

        const sub = interaction.options.getSubcommand();

        // =============== /module list ===============
        if (sub === "list") {
            const active = listModules();

            if (!active.length) {
                return reply.info(
                    interaction,
                    "Modules",
                    "No modules are currently loaded.",
                );
            }

            return reply.info(
                interaction,
                "Loaded Modules",
                active.map(m => `• \`${m}\``).join("\n")
            );
        }

        // Extract module name
        const name = interaction.options.getString("name");
        const modulePath = path.join(process.cwd(), "src", "modules", name, "module.js");

        // We defer to give smoother UX + avoid timeouts
        await reply.defer(interaction);

        try {
            // =============== /module load ===============
            if (sub === "load") {
                await loadModule({ name, path: modulePath }, interaction.client);

                log(
                    "SUCCESS",
                    "Module Loaded",
                    `${name} module loaded by ${interaction.user.tag}`
                );

                return reply.success(
                    interaction,
                    "Module Loaded",
                    `Module **${name}** is now active.`
                );
            }

            // =============== /module unload ===============
            if (sub === "unload") {
                await unloadModule(name, interaction.client);

                log(
                    "WARN",
                    "Module Unloaded",
                    `${name} module unloaded by ${interaction.user.tag}`
                );

                return reply.warn(
                    interaction,
                    "Module Unloaded",
                    `Module **${name}** was unloaded.`
                );
            }

            // =============== /module reload ===============
            if (sub === "reload") {
                await reloadModule(name, interaction.client);

                log(
                    "SUCCESS",
                    "Module Reloaded",
                    `${name} module reloaded by ${interaction.user.tag}`
                );

                return reply.success(
                    interaction,
                    "Module Reloaded",
                    `Module **${name}** has been refreshed.`
                );
            }
        } catch (err) {
            logger.error(`Module command error (${sub}:${name})`);
            console.error(err);

            log(
                "ERROR",
                "Module Error",
                `Error while handling **${sub} ${name}**\nExecutor: ${interaction.user.tag}`
            );

            return reply.error(
                interaction,
                "Operation Failed",
                `There was an error while processing the module **${name}**.\nPlease check logs.`
            );
        }
    },
};
