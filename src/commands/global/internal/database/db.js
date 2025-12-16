// src/commands/admin/db.js

const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require("discord.js");

const dbAdmin = require("../../../modules/dbadmin/dbAdmin");
const config = require("../../../core/config");
const { createInfoEmbed, createErrorEmbed, createSuccessEmbed } = require("../../../core/embedStyles");
const logger = require("../../../core/logger");

/**
 * Check if user is bot owner OR guild admin.
 */
function isAuthorised(interaction) {
    // Bot owner override
    if (config.ownerIds?.includes(interaction.user.id)) return true;

    // Guild admin
    const member = interaction.member;
    return member?.permissions?.has(PermissionFlagsBits.Administrator);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("db")
        .setDescription("Database administration tools (owners/admins only)")
        
        .addSubcommand(sub =>
            sub.setName("tables")
                .setDescription("List all database tables")
        )

        .addSubcommand(sub =>
            sub.setName("schema")
                .setDescription("Show schema for a table")
                .addStringOption(opt =>
                    opt.setName("table")
                        .setDescription("Table name")
                        .setRequired(true)
                )
        )

        .addSubcommand(sub =>
            sub.setName("rows")
                .setDescription("Show latest rows from a table")
                .addStringOption(opt =>
                    opt.setName("table")
                        .setDescription("Table name")
                        .setRequired(true)
                )
                .addIntegerOption(opt =>
                    opt.setName("limit")
                        .setDescription("Number of rows to show (default 20)")
                        .setRequired(false)
                )
        )

        .addSubcommand(sub =>
            sub.setName("count")
                .setDescription("Count rows in a table")
                .addStringOption(opt =>
                    opt.setName("table")
                        .setDescription("Table name")
                        .setRequired(true)
                )
        )

        .addSubcommand(sub =>
            sub.setName("validate")
                .setDescription("Validate schema integrity")
        )

        .addSubcommand(sub =>
            sub.setName("repair")
                .setDescription("Attempt automatic schema repair")
        )

        .addSubcommand(sub =>
            sub.setName("query")
                .setDescription("Run a SAFE SQL SELECT query")
                .addStringOption(opt =>
                    opt.setName("sql")
                        .setDescription("SQL SELECT query only")
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        if (!isAuthorised(interaction)) {
            return interaction.reply({
                embeds: [createErrorEmbed("Forbidden", "You do not have permission to run DB admin commands.")],
                flags: 64
            });
        }

        const sub = interaction.options.getSubcommand();

        // ------------------------------
        // /db tables
        // ------------------------------
        if (sub === "tables") {
            const tables = dbAdmin.getTables();

            return interaction.reply({
                embeds: [
                    createInfoEmbed("Database Tables", tables.length
                        ? tables.map(t => `• \`${t}\``).join("\n")
                        : "*No tables found*"
                    )
                ],
                flags: 64
            });
        }

        // ------------------------------
        // /db schema
        // ------------------------------
        if (sub === "schema") {
            const table = interaction.options.getString("table");
            const schema = dbAdmin.getTableSchema(table);

            if (!schema) {
                return interaction.reply({
                    embeds: [createErrorEmbed("Invalid Table", `Table \`${table}\` does not exist.`)],
                    flags: 64
                });
            }

            const formatted = schema
                .map(c => `• **${c.name}** — ${c.type} ${c.notnull ? "(NOT NULL)" : ""} ${c.pk ? "(PK)" : ""}`)
                .join("\n");

            return interaction.reply({
                embeds: [createInfoEmbed(`Schema: ${table}`, formatted)],
                flags: 64
            });
        }

        // ------------------------------
        // /db rows
        // ------------------------------
        if (sub === "rows") {
            const table = interaction.options.getString("table");
            const limit = interaction.options.getInteger("limit") ?? 20;

            const rows = dbAdmin.fetchRows(table, limit);

            if (!rows) {
                return interaction.reply({
                    embeds: [createErrorEmbed("Error", `Could not fetch rows for table \`${table}\`.`)],
                    flags: 64
                });
            }

            const json = "```json\n" + JSON.stringify(rows, null, 2).substring(0, 1900) + "\n```";

            return interaction.reply({
                embeds: [
                    createInfoEmbed(
                        `Last ${limit} Rows from ${table}`,
                        json
                    )
                ],
                flags: 64
            });
        }

        // ------------------------------
        // /db count
        // ------------------------------
        if (sub === "count") {
            const table = interaction.options.getString("table");
            const count = dbAdmin.countRows(table);

            if (count === null) {
                return interaction.reply({
                    embeds: [createErrorEmbed("Invalid Table", `Table \`${table}\` does not exist.`)],
                    flags: 64
                });
            }

            return interaction.reply({
                embeds: [createSuccessEmbed("Row Count", `\`${table}\` has **${count}** rows.`)],
                flags: 64
            });
        }

        // ------------------------------
        // /db validate
        // ------------------------------
        if (sub === "validate") {
            const issues = dbAdmin.validateSchema();

            return interaction.reply({
                embeds: [
                    createInfoEmbed(
                        "Schema Validation",
                        issues.join("\n")
                    )
                ],
                flags: 64
            });
        }

        // ------------------------------
        // /db repair
        // ------------------------------
        if (sub === "repair") {
            const result = dbAdmin.autoRepairSchema();

            const summary =
                "**Issues:**\n" +
                result.issues.join("\n") +
                "\n\n**Fixes Applied:**\n" +
                (result.fixes.length ? result.fixes.join("\n") : "No fixes needed");

            return interaction.reply({
                embeds: [createSuccessEmbed("Schema Repair Complete", summary)],
                flags: 64
            });
        }

        // ------------------------------
        // /db query
        // ------------------------------
        if (sub === "query") {
            const sql = interaction.options.getString("sql");

            const result = dbAdmin.safeQuery(sql);

            if (result.error) {
                return interaction.reply({
                    embeds: [createErrorEmbed("Query Error", result.error)],
                    flags: 64
                });
            }

            const json = "```json\n" + JSON.stringify(result.rows, null, 2).substring(0, 1900) + "\n```";

            return interaction.reply({
                embeds: [createInfoEmbed("Query Result", json)],
                flags: 64
            });
        }

        // fallback
        return interaction.reply({
            embeds: [createErrorEmbed("Unhandled", "Unknown DB command.")],
            flags: 64
        });
    }
};
