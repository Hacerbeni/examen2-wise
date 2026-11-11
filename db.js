const Database = require('better-sqlite3');
const db = new Database('annuaire.db');
db.pragma('foreign_keys = ON'); 
module.exports = db;