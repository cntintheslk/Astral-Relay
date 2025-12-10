const db = require("./database");

// Fetch the saved health message ID
function getHealthMessageId() {
    const row = db.prepare(`SELECT message_id FROM system_health LIMIT 1`).get();
    return row ? row.message_id : null;
}

// Save or update the health message ID
function setHealthMessageId(id) {
    db.prepare(`
        INSERT INTO system_health (message_id)
        VALUES (?)
        ON CONFLICT DO UPDATE SET message_id = excluded.message_id
    `).run(id);
}

module.exports = { getHealthMessageId, setHealthMessageId };
