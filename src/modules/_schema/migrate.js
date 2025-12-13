const db = require("../../core/database");

function ensureColumn(table, column, type) {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all();
    if (!cols.some(c => c.name === column)) {
        db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
        console.log(`[LOA MIGRATION] Added ${table}.${column}`);
    }
}

module.exports = function migrateLOA() {
    // loa_settings
    ensureColumn("loa_settings", "loa_role_id", "TEXT");

    // loas
    ensureColumn("loas", "approved_at", "INTEGER");
    ensureColumn("loas", "approved_by", "TEXT");
    ensureColumn("loas", "pending_message_id", "TEXT");

    // loa_history
    ensureColumn("loa_history", "resolved_by", "TEXT");
};
