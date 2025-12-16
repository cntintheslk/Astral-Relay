// src/modules/dbadmin/dbAdmin.js

const db = require("../../services/database");
const logger = require("../../core/logger");
const { log } = require("../../core/discordLogger");

/**
 * DB ADMIN PANEL MODULE
 * Provides safe admin-level database actions for developers/owners.
 * Avoids destructive commands unless explicitly allowed.
 */

module.exports = {
    /**
     * Get all table names in the database.
     */
    getTables() {
        return db.prepare(`
            SELECT name 
            FROM sqlite_master 
            WHERE type = 'table'
            ORDER BY name;
        `).all().map(t => t.name);
    },

    /**
     * Get schema info for a given table.
     */
    getTableSchema(tableName) {
        try {
            return db.prepare(`PRAGMA table_info(${tableName});`).all();
        } catch (err) {
            return null;
        }
    },

    /**
     * Count rows in a given table.
     */
    countRows(tableName) {
        try {
            const row = db.prepare(`SELECT COUNT(*) AS count FROM ${tableName};`).get();
            return row.count;
        } catch (err) {
            return null;
        }
    },

    /**
     * Dump the most recent rows from a table.
     */
    fetchRows(tableName, limit = 20) {
        try {
            return db.prepare(`
                SELECT * FROM ${tableName}
                ORDER BY ROWID DESC
                LIMIT ?;
            `).all(limit);
        } catch (err) {
            return null;
        }
    },

    /**
     * Validate required schema for Astral Relay.
     * Returns list of missing columns or tables.
     */
    validateSchema() {
        const issues = [];

        const required = {
            registrations: [
                "id",
                "guild_id",
                "user_id",
                "ign",
                "rank",
                "status",
                "timestamp",
                "approved_by",
                "reason"
            ],
            registration_settings: [
                "guild_id",
                "role_r1",
                "role_r2",
                "role_r3",
                "role_r4",
                "role_r5",
                "require_approval_r1",
                "require_approval_r2",
                "require_approval_r3",
                "require_approval_r4",
                "require_approval_r5",
                "approver_roles"
            ]
        };

        for (const table of Object.keys(required)) {
            const schema = this.getTableSchema(table);
            if (!schema) {
                issues.push(`❌ Missing table: ${table}`);
                continue;
            }

            const actualCols = schema.map(col => col.name);
            for (const col of required[table]) {
                if (!actualCols.includes(col)) {
                    issues.push(`❌ Missing column in ${table}: ${col}`);
                }
            }
        }

        if (issues.length === 0) {
            issues.push("✅ Schema is valid.");
        }

        return issues;
    },

    /**
     * Attempt automatic schema repair:
     * Adds missing columns safely.
     */
    autoRepairSchema() {
        const schemaIssues = this.validateSchema();
        const performed = [];

        const safeAdd = (table, column, type) => {
            try {
                db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type};`).run();
                performed.push(`✔ Added missing column: ${table}.${column}`);
            } catch (err) {
                performed.push(`⚠ Failed to add ${table}.${column}: ${err.message}`);
            }
        };

        // Registrations table required columns
        const regSchema = this.getTableSchema("registrations");
        const regCols = regSchema.map(c => c.name);

        if (!regCols.includes("approved_by"))
            safeAdd("registrations", "approved_by", "TEXT");

        if (!regCols.includes("reason"))
            safeAdd("registrations", "reason", "TEXT");

        return {
            issues: schemaIssues,
            fixes: performed
        };
    },

    /**
     * Execute a SAFE read-only SQL query.
     * No INSERT / UPDATE / DELETE allowed.
     */
    safeQuery(sql) {
        const lowered = sql.trim().toLowerCase();
        if (
            lowered.startsWith("insert") ||
            lowered.startsWith("update") ||
            lowered.startsWith("delete") ||
            lowered.startsWith("alter") ||
            lowered.startsWith("drop")
        ) {
            return { error: "❌ Unsafe query type not permitted." };
        }

        try {
            const result = db.prepare(sql).all();
            return { rows: result };
        } catch (err) {
            return { error: err.message };
        }
    }
};
