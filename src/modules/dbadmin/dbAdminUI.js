// src/modules/dbadmin/dbAdminUI.js

const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType
} = require("discord.js");

const dbAdmin = require("./dbadmin");
const {
    createInfoEmbed,
    createErrorEmbed,
    createSuccessEmbed
} = require("../../core/embedStyles");

module.exports = {
    /**
     * Main panel UI components
     */
    makeMainPanel() {
        const tables = dbAdmin.getTables();

        return [
            new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("dbadmin:select-table")
                    .setPlaceholder("Select a table…")
                    .addOptions(
                        tables.map(t => ({
                            label: t,
                            value: t
                        }))
                    )
            ),

            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("dbadmin:validate")
                    .setLabel("Validate Schema")
                    .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                    .setCustomId("dbadmin:repair")
                    .setLabel("Auto-Repair Schema")
                    .setStyle(ButtonStyle.Danger)
            )
        ];
    },

    /**
     * Schema viewer
     */
    makeSchemaEmbed(table) {
        const schema = dbAdmin.getTableSchema(table);

        if (!schema)
            return createErrorEmbed("Invalid Table", `Table **${table}** does not exist.`);

        const formatted = schema
            .map(col => `• **${col.name}** — ${col.type} ${col.notnull ? "(NOT NULL)" : ""} ${col.pk ? "(PK)" : ""}`)
            .join("\n");

        return createInfoEmbed(`Schema: ${table}`, formatted);
    },

    /**
     * Row viewer with pagination
     */
    makeRowsPage(table, page = 0, pageSize = 10) {
        const rows = dbAdmin.fetchRows(table, (page + 1) * pageSize);

        if (!rows)
            return { embed: createErrorEmbed("Error", `Could not read rows from **${table}**.`), components: [] };

        const pageRows = rows.slice(page * pageSize, (page + 1) * pageSize);

        const embed = createInfoEmbed(
            `Rows in ${table} (Page ${page + 1})`,
            "```json\n" + JSON.stringify(pageRows, null, 2).substring(0, 1900) + "\n```"
        );

        const components = [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`dbadmin:rows-prev:${table}:${page}`)
                    .setLabel("◀ Prev")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page <= 0),

                new ButtonBuilder()
                    .setCustomId(`dbadmin:rows-next:${table}:${page}`)
                    .setLabel("Next ▶")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(pageRows.length < pageSize)
            )
        ];

        return { embed, components };
    }
};
