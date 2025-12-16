// ============================================================
// ASTRAL RELAY — DB ADMIN SERVICE
// Handles all database administration UI interactions.
// ============================================================

const logger = require("../core/logger");
const config = require("../core/config");

const dbAdminUI = require("../modules/dbadmin/dbAdminUI");
const dbAdmin = require("../modules/dbadmin/dbAdmin");

// ------------------------------------------------------------
// PERMISSION CHECK
// ------------------------------------------------------------

function isOwnerOrAdmin(interaction) {
    if (config.ownerIds?.includes(interaction.user.id)) return true;
    return interaction.member?.permissions?.has("Administrator");
}

// ------------------------------------------------------------
// ROUTING GUARD
// ------------------------------------------------------------

function canHandle(interaction) {
    return (
        interaction.isStringSelectMenu() &&
        interaction.customId === "dbadmin:select-table"
    ) || (
        interaction.isButton() &&
        interaction.customId.startsWith("dbadmin:")
    );
}

// ------------------------------------------------------------
// HANDLER
// ------------------------------------------------------------

async function handle(interaction) {
    if (!isOwnerOrAdmin(interaction)) {
        logger.security("Unauthorised DB admin access attempt.", {
            userId: interaction.user.id,
            guildId: interaction.guild?.id,
        });
        return;
    }

    // --------------------------------------------------------
    // SELECT MENU — TABLE CHOICE
    // --------------------------------------------------------

    if (interaction.isStringSelectMenu()) {
        const table = interaction.values[0];

        logger.info("DB admin table selected.", {
            table,
            userId: interaction.user.id,
        });

        return interaction.update({
            embeds: [dbAdminUI.makeSchemaEmbed(table)],
            components: dbAdminUI.makeMainPanel(),
        });
    }

    // --------------------------------------------------------
    // BUTTON HANDLING
    // --------------------------------------------------------

    const parts = interaction.customId.split(":");
    const action = parts[1];
    const table = parts[2];
    const page = parts[3] ? parseInt(parts[3], 10) : 0;

    logger.info("DB admin action executed.", {
        action,
        table,
        page,
        userId: interaction.user.id,
    });

    switch (action) {
        case "view-schema":
            return interaction.update({
                embeds: [dbAdminUI.makeSchemaEmbed(table)],
                components: dbAdminUI.makeMainPanel(),
            });

        case "view-rows": {
            const { embed, components } = dbAdminUI.makeRowsPage(table, 0);
            return interaction.update({ embeds: [embed], components });
        }

        case "rows-next": {
            const { embed, components } = dbAdminUI.makeRowsPage(table, page + 1);
            return interaction.update({ embeds: [embed], components });
        }

        case "rows-prev": {
            const { embed, components } = dbAdminUI.makeRowsPage(
                table,
                Math.max(0, page - 1)
            );
            return interaction.update({ embeds: [embed], components });
        }

        case "validate": {
            const issues = dbAdmin.validateSchema();

            return interaction.update({
                embeds: [
                    dbAdminUI.makeInfoEmbed(
                        "Schema Validation",
                        issues.join("\n")
                    ),
                ],
                components: dbAdminUI.makeMainPanel(),
            });
        }

        case "repair": {
            const result = dbAdmin.autoRepairSchema();
            const summary =
                "**Issues:**\n" +
                result.issues.join("\n") +
                "\n\n**Fixes Applied:**\n" +
                (result.fixes.length
                    ? result.fixes.join("\n")
                    : "No fixes needed");

            return interaction.update({
                embeds: [
                    dbAdminUI.makeSuccessEmbed(
                        "Schema Repair Complete",
                        summary
                    ),
                ],
                components: dbAdminUI.makeMainPanel(),
            });
        }
    }
}

module.exports = {
    canHandle,
    handle,
};
