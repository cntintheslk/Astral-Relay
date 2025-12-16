// src/src/commands/dev/autopurge/autopurge.js

const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

const crypto = require("crypto");
const db = require("../../../../services/database");
const { dryRunSummary, runAutoPurge } = require("../../../../modules/autoPurge/engine");


// ===== Helpers =====
function toSeconds(duration, unit) {
    if (unit === "hours") return duration * 60 * 60;
    if (unit === "days") return duration * 24 * 60 * 60;
    return null;
}

function formatDuration(seconds) {
    const day = 86400;
    const hour = 3600;

    if (seconds % day === 0) return `${seconds / day} day(s)`;
    if (seconds % hour === 0) return `${seconds / hour} hour(s)`;
    return `${seconds} second(s)`;
}

function safeLimit(str, max = 512) {
    if (!str) return "";
    return str.length > max ? str.slice(0, max - 3) + "..." : str;
}

function msToRoughHours(ms) {
    return Math.max(0, Math.floor(ms / 1000 / 60 / 60));
}

// Persists live enable/disable in DB (auto_purge_state)
function setLiveState(guildId, enabled) {
    db.prepare(`
        INSERT INTO auto_purge_state (guild_id, enabled, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(guild_id)
        DO UPDATE SET
            enabled = excluded.enabled,
            updated_at = excluded.updated_at
    `).run(guildId, enabled ? 1 : 0, Date.now());
}

function getLiveState(guildId) {
    const row = db.prepare(`
        SELECT enabled
        FROM auto_purge_state
        WHERE guild_id = ?
    `).get(guildId);

    return row?.enabled === 1;
}

module.exports = {
    scope: "in_development",
    data: new SlashCommandBuilder()
        .setName("autopurge")
        .setDescription("Manage the automatic role-based purge system")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)

        // ─────────────── STATUS ───────────────
        .addSubcommand(sub =>
            sub
                .setName("status")
                .setDescription("View auto-purge status and rule counts")
        )

        // ─────────────── PREVIEW ───────────────
        .addSubcommand(sub =>
            sub
                .setName("preview")
                .setDescription("Preview members that would be affected by enabled rules")
        )

        // ─────────────── ENABLE / DISABLE (system) ───────────────
        .addSubcommand(sub =>
            sub
                .setName("enable")
                .setDescription("Enable live auto-purge enforcement")
        )
        .addSubcommand(sub =>
            sub
                .setName("disable")
                .setDescription("Disable live auto-purge enforcement")
        )

        // ─────────────── RULES GROUP ───────────────
        .addSubcommandGroup(group =>
            group
                .setName("rules")
                .setDescription("Manage auto-purge rules")

                .addSubcommand(sub =>
                    sub
                        .setName("add")
                        .setDescription("Add a new auto-purge rule")
                        .addRoleOption(opt =>
                            opt.setName("role")
                                .setDescription("Role to target")
                                .setRequired(true)
                        )
                        .addIntegerOption(opt =>
                            opt.setName("duration")
                                .setDescription("Duration before purge")
                                .setRequired(true)
                                .setMinValue(1)
                        )
                        .addStringOption(opt =>
                            opt.setName("unit")
                                .setDescription("Time unit")
                                .setRequired(true)
                                .addChoices(
                                    { name: "Hours", value: "hours" },
                                    { name: "Days", value: "days" }
                                )
                        )
                        .addStringOption(opt =>
                            opt.setName("action")
                                .setDescription("Action to perform")
                                .setRequired(true)
                                .addChoices(
                                    { name: "Kick member", value: "kick" },
                                    { name: "Remove role", value: "remove_role" }
                                )
                        )
                        .addStringOption(opt =>
                            opt.setName("reason")
                                .setDescription("Reason for the purge")
                                .setRequired(true)
                                .setMaxLength(512)
                        )
                )

                .addSubcommand(sub =>
                    sub
                        .setName("list")
                        .setDescription("List all auto-purge rules for this server")
                )

                .addSubcommand(sub =>
                    sub
                        .setName("enable")
                        .setDescription("Enable an auto-purge rule")
                        .addStringOption(opt =>
                            opt.setName("rule_id")
                                .setDescription("Rule ID")
                                .setRequired(true)
                        )
                )

                .addSubcommand(sub =>
                    sub
                        .setName("disable")
                        .setDescription("Disable an auto-purge rule")
                        .addStringOption(opt =>
                            opt.setName("rule_id")
                                .setDescription("Rule ID")
                                .setRequired(true)
                        )
                )

                .addSubcommand(sub =>
                    sub
                        .setName("remove")
                        .setDescription("Delete an auto-purge rule")
                        .addStringOption(opt =>
                            opt.setName("rule_id")
                                .setDescription("Rule ID")
                                .setRequired(true)
                        )
                )
        )

        // ─────────────── EXECUTION ───────────────
        .addSubcommand(sub =>
            sub
                .setName("dryrun")
                .setDescription("Manually run auto-purge in dry-run mode (no actions performed)")
        )
        .addSubcommand(sub =>
            sub
                .setName("run")
                .setDescription("Manually run auto-purge LIVE (not implemented yet)")
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const sub = interaction.options.getSubcommand();
        const group = interaction.options.getSubcommandGroup(false);

        // ─────────────── STATUS ───────────────
        if (sub === "status") {
            const total = db.prepare(`
                SELECT COUNT(*) AS count
                FROM auto_purge_rules
                WHERE guild_id = ?
            `).get(guildId)?.count ?? 0;

            const enabledRules = db.prepare(`
                SELECT COUNT(*) AS count
                FROM auto_purge_rules
                WHERE guild_id = ? AND enabled = 1
            `).get(guildId)?.count ?? 0;

            const live = getLiveState(guildId);

            const embed = new EmbedBuilder()
                .setTitle("🚮 Auto-Purge Status")
                .setColor(0x2b2d31)
                .addFields(
                    { name: "Rules (total)", value: `${total}`, inline: true },
                    { name: "Rules (enabled)", value: `${enabledRules}`, inline: true },
                    { name: "Live Mode", value: live ? "✅ Enabled" : "❌ Disabled", inline: true }
                )
                .setFooter({ text: "Tip: Use /autopurge dryrun before enabling live mode." });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ─────────────── SYSTEM ENABLE / DISABLE ───────────────
        if (sub === "enable" || sub === "disable") {
            const enable = sub === "enable";
            setLiveState(guildId, enable);

            const embed = new EmbedBuilder()
                .setTitle(enable ? "🔐 Auto-Purge Enabled" : "⛔ Auto-Purge Disabled")
                .setColor(enable ? 0x57f287 : 0xed4245)
                .setDescription(
                    enable
                        ? "Auto-purge **live enforcement is now ENABLED**.\n\n" +
                          "⚠️ When the scheduler/manual run is implemented, members may be kicked or have roles removed when rules match.\n" +
                          "Use `/autopurge disable` to turn this off immediately."
                        : "Auto-purge **live enforcement is now DISABLED**.\n\n" +
                          "No members will be kicked or modified automatically."
                )
                .setFooter({ text: "Tip: /autopurge dryrun shows what would happen without actions." });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ─────────────── PREVIEW ───────────────
        if (sub === "preview") {
            const guild = interaction.guild;
            const now = Date.now();

            const rules = db.prepare(`
                SELECT *
                FROM auto_purge_rules
                WHERE guild_id = ? AND enabled = 1
            `).all(guildId);

            if (!rules.length) {
                return interaction.reply({
                    ephemeral: true,
                    content: "There are no enabled auto-purge rules for this server."
                });
            }

            await guild.members.fetch();

            const results = [];

            for (const rule of rules) {
                for (const member of guild.members.cache.values()) {
                    if (!member.roles.cache.has(rule.role_id)) continue;
                    if (member.permissions.has("Administrator")) continue;

                    const assignment = db.prepare(`
                        SELECT assigned_at
                        FROM role_assignments
                        WHERE guild_id = ?
                          AND user_id = ?
                          AND role_id = ?
                    `).get(guildId, member.id, rule.role_id);

                    if (!assignment) continue;

                    const heldMs = now - assignment.assigned_at;
                    const requiredMs = rule.duration_seconds * 1000;

                    if (heldMs < requiredMs) continue;

                    results.push({ user: member.user, rule, heldMs });
                }
            }

            if (!results.length) {
                return interaction.reply({
                    ephemeral: true,
                    content: "No members would be affected if auto-purge ran right now."
                });
            }

            const lines = results.slice(0, 15).map(r => {
                const heldHours = msToRoughHours(r.heldMs);
                return [
                    `👤 **${r.user.tag}**`,
                    `• Role: <@&${r.rule.role_id}>`,
                    `• After: **${formatDuration(r.rule.duration_seconds)}** (held ~${heldHours}h)`,
                    `• Action: \`${r.rule.action}\``,
                    `• Rule ID: \`${r.rule.id}\``,
                    `• Reason: ${safeLimit(r.rule.reason, 220)}`
                ].join("\n");
            });

            const embed = new EmbedBuilder()
                .setTitle("🧪 Auto-Purge Preview")
                .setColor(0xffcc00)
                .setDescription(lines.join("\n\n"))
                .setFooter({
                    text: results.length > 15
                        ? `${results.length} members matched. Showing first 15.`
                        : `${results.length} member(s) matched.`
                });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ─────────────── RULES ───────────────
        if (group === "rules") {
            // ADD
            if (sub === "add") {
                const role = interaction.options.getRole("role", true);
                const duration = interaction.options.getInteger("duration", true);
                const unit = interaction.options.getString("unit", true);
                const action = interaction.options.getString("action", true);
                const reason = safeLimit(interaction.options.getString("reason", true), 512);

                if (role.id === interaction.guild.id) {
                    return interaction.reply({ ephemeral: true, content: "You can’t target the @everyone role." });
                }

                const durationSeconds = toSeconds(duration, unit);
                if (!durationSeconds) {
                    return interaction.reply({ ephemeral: true, content: "Invalid duration unit." });
                }

                const ruleId = crypto.randomUUID();
                const now = Date.now();

                db.prepare(`
                    INSERT INTO auto_purge_rules
                    (id, guild_id, role_id, duration_seconds, action, reason, enabled, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, 1, ?)
                `).run(ruleId, guildId, role.id, durationSeconds, action, reason, now);

                const embed = new EmbedBuilder()
                    .setTitle("✅ Auto-Purge Rule Added")
                    .setColor(0x57f287)
                    .addFields(
                        { name: "Rule ID", value: `\`${ruleId}\`` },
                        { name: "Role", value: `<@&${role.id}>`, inline: true },
                        { name: "Duration", value: formatDuration(durationSeconds), inline: true },
                        { name: "Action", value: `\`${action}\``, inline: true },
                        { name: "Reason", value: reason }
                    );

                if (role.managed && action === "remove_role") {
                    embed.setFooter({
                        text: "Note: This role is managed by an integration; removing it may fail when live execution is added."
                    });
                }

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // LIST
            if (sub === "list") {
                const rules = db.prepare(`
                    SELECT id, role_id, duration_seconds, action, reason, enabled, created_at
                    FROM auto_purge_rules
                    WHERE guild_id = ?
                    ORDER BY created_at DESC
                `).all(guildId);

                if (!rules.length) {
                    return interaction.reply({ ephemeral: true, content: "No auto-purge rules found for this server." });
                }

                const lines = rules.slice(0, 20).map(r => {
                    const status = r.enabled ? "✅" : "⛔";
                    return [
                        `${status} \`${r.id}\``,
                        `Role: <@&${r.role_id}>`,
                        `After: **${formatDuration(r.duration_seconds)}**`,
                        `Action: \`${r.action}\``,
                        `Reason: ${safeLimit(r.reason, 140)}`
                    ].join(" • ");
                });

                const embed = new EmbedBuilder()
                    .setTitle("📜 Auto-Purge Rules")
                    .setColor(0x2b2d31)
                    .setDescription(lines.join("\n\n"))
                    .setFooter({
                        text: rules.length > 20
                            ? `Showing 20 of ${rules.length} rules.`
                            : `${rules.length} rule(s) total.`
                    });

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // ENABLE / DISABLE (rule)
            if (sub === "enable" || sub === "disable") {
                const ruleId = interaction.options.getString("rule_id", true);

                const existing = db.prepare(`
                    SELECT id, enabled
                    FROM auto_purge_rules
                    WHERE id = ? AND guild_id = ?
                `).get(ruleId, guildId);

                if (!existing) {
                    return interaction.reply({
                        ephemeral: true,
                        content: "Rule not found for this server (check the rule ID)."
                    });
                }

                const newEnabled = sub === "enable" ? 1 : 0;

                db.prepare(`
                    UPDATE auto_purge_rules
                    SET enabled = ?
                    WHERE id = ? AND guild_id = ?
                `).run(newEnabled, ruleId, guildId);

                const embed = new EmbedBuilder()
                    .setTitle(newEnabled ? "✅ Rule Enabled" : "⛔ Rule Disabled")
                    .setColor(newEnabled ? 0x57f287 : 0xed4245)
                    .setDescription(`Rule \`${ruleId}\` is now **${newEnabled ? "enabled" : "disabled"}**.`);

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // REMOVE
            if (sub === "remove") {
                const ruleId = interaction.options.getString("rule_id", true);

                const existing = db.prepare(`
                    SELECT id, role_id, duration_seconds, action, reason
                    FROM auto_purge_rules
                    WHERE id = ? AND guild_id = ?
                `).get(ruleId, guildId);

                if (!existing) {
                    return interaction.reply({
                        ephemeral: true,
                        content: "Rule not found for this server (check the rule ID)."
                    });
                }

                db.prepare(`
                    DELETE FROM auto_purge_rules
                    WHERE id = ? AND guild_id = ?
                `).run(ruleId, guildId);

                const embed = new EmbedBuilder()
                    .setTitle("🗑️ Auto-Purge Rule Removed")
                    .setColor(0xed4245)
                    .addFields(
                        { name: "Rule ID", value: `\`${ruleId}\`` },
                        { name: "Role", value: `<@&${existing.role_id}>`, inline: true },
                        { name: "Duration", value: formatDuration(existing.duration_seconds), inline: true },
                        { name: "Action", value: `\`${existing.action}\``, inline: true },
                        { name: "Reason", value: safeLimit(existing.reason, 512) }
                    )
                    .setFooter({ text: "Tip: You can disable rules instead of deleting them." });

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            return interaction.reply({ ephemeral: true, content: "Unknown rules subcommand." });
        }

        // ─────────────── DRY RUN ───────────────
        if (sub === "dryrun") {
            await interaction.deferReply({ ephemeral: true });

            const summary = await dryRunSummary(interaction.client, guildId);

            const embed = new EmbedBuilder()
                .setTitle("🧪 Auto-Purge Dry Run")
                .setColor(0x5865f2)
                .addFields(
                    { name: "Enabled Rules (matched)", value: `${summary.rules}`, inline: true },
                    { name: "Matched Members", value: `${summary.matched}`, inline: true },
                    { name: "Actions Taken", value: "None (dry run)", inline: true }
                )
                .setFooter({ text: "This performs no kicks or role removals." });

            return interaction.editReply({ embeds: [embed] });
        }

        // ─────────────── RUN (LIVE) ───────────────
        if (sub === "run") {
            await interaction.deferReply({ ephemeral: true });

            // Safety check (UX-level, engine also enforces)
            if (!getLiveState(guildId)) {
                return interaction.editReply({
                    content: "❌ Auto-purge live mode is **disabled**.\n\nEnable it first with `/autopurge enable`."
                });
            }

            const result = await runAutoPurge(
                interaction.client,
                guildId,
                { dryRun: false }
            );

            // Engine-level block (extra safety)
            if (result?.blocked) {
                return interaction.editReply({
                    content: "❌ Auto-purge run blocked because live mode is disabled."
                });
            }

            const embed = new EmbedBuilder()
                .setTitle("🚨 Auto-Purge Executed")
                .setColor(result.executed > 0 ? 0xed4245 : 0x57f287)
                .addFields(
                    { name: "Matched Members", value: `${result.matched}`, inline: true },
                    { name: "Actions Executed", value: `${result.executed}`, inline: true },
                    { name: "Live Mode", value: "✅ Enabled", inline: true }
                )
                .setFooter({
                    text: "This was a LIVE run. Actions were applied immediately."
                });

            return interaction.editReply({ embeds: [embed] });
        }
    }
};
