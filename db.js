const Database = require('better-sqlite3');

// Crée ou ouvre la base de données SQLite
const db = new Database('./database.sqlite', { verbose: console.log });

console.log('Connecté à la base de données SQLite (via better-sqlite3).');

module.exports = db;