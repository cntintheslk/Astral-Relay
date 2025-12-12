// scripts/clearLegacyLoas.js
const db = require("../core/database");

const info = db.prepare(`
  DELETE FROM loa_requests
  WHERE request_id NOT LIKE '%-%-%-%-%'
`).run();

const hist = db.prepare(`
  DELETE FROM loa_history
  WHERE request_id NOT LIKE '%-%-%-%-%'
`).run();

console.log("Deleted from loa_requests:", info.changes);
console.log("Deleted from loa_history:", hist.changes);
