const db = require("../../services/database");

module.exports = {
    getHealthMessageId() {
        return new Promise((resolve) => {
            db.get(
                "SELECT message_id FROM system_health LIMIT 1",
                (err, row) => {
                    if (err) return resolve(null);
                    resolve(row ? row.message_id : null);
                }
            );
        });
    },

    saveHealthMessageId(id) {
        db.run("DELETE FROM system_health");
        db.run("INSERT INTO system_health (message_id) VALUES (?)", id);
    }
};
