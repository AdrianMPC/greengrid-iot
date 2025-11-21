// db.js
const Database = require('better-sqlite3');

const db = new Database('greengrid.db');

// Tabla de lecturas
db.exec(`
  CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT NOT NULL,
    ts INTEGER NOT NULL,         -- timestamp en ms desde epoch
    payload TEXT NOT NULL        -- JSON string
  );
`);

module.exports = db;
