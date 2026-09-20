const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let dbInstance = null;

function initDb(customPath = null) {
  const dbPath = customPath || path.join(__dirname, 'data', 'mahjong.db');
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);

  // Enable WAL mode for high concurrency without locks
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      client_id TEXT PRIMARY KEY,
      nickname TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS queue (
      client_id TEXT PRIMARY KEY,
      nickname TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'waiting',
      enqueued_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tables (
      table_id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      current_session_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS sessions (
      session_id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER NOT NULL,
      session_number INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'waiting_players',
      created_at TEXT NOT NULL,
      started_at TEXT,
      finished_at TEXT,
      FOREIGN KEY (table_id) REFERENCES tables(table_id)
    );

    CREATE TABLE IF NOT EXISTS session_seats (
      session_id INTEGER NOT NULL,
      seat TEXT NOT NULL,
      client_id TEXT NOT NULL,
      joined_at TEXT NOT NULL,
      PRIMARY KEY (session_id, seat),
      FOREIGN KEY (session_id) REFERENCES sessions(session_id),
      FOREIGN KEY (client_id) REFERENCES clients(client_id)
    );

    CREATE TABLE IF NOT EXISTS game_records (
      record_id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      table_id INTEGER NOT NULL,
      east_client_id TEXT,
      east_score INTEGER,
      south_client_id TEXT,
      south_score INTEGER,
      west_client_id TEXT,
      west_score INTEGER,
      north_client_id TEXT,
      north_score INTEGER,
      started_at TEXT,
      finished_at TEXT,
      duration_seconds INTEGER,
      recorded_at TEXT NOT NULL,
      raw_payload TEXT
    );
  `);

  // Ensure default table 1 exists
  const insertTable = db.prepare(`
    INSERT OR IGNORE INTO tables (table_id, name) VALUES (1, '테이블 1')
  `);
  insertTable.run();

  dbInstance = db;
  return db;
}

function getDb() {
  if (!dbInstance) {
    dbInstance = initDb();
  }
  return dbInstance;
}

function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

module.exports = {
  initDb,
  getDb,
  closeDb,
};
