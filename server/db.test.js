const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { initDb, closeDb } = require('./db');

describe('Database initialization and schema', () => {
  const testDbPath = path.join(__dirname, 'data', 'test_mahjong.db');

  beforeEach(() => {
    closeDb();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  afterEach(() => {
    closeDb();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  test('enables WAL mode and creates all required tables', () => {
    const db = initDb(testDbPath);
    const journalMode = db.pragma('journal_mode', { simple: true });
    assert.equal(journalMode.toLowerCase(), 'wal');

    // Verify tables exist
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
    assert.ok(tables.includes('clients'));
    assert.ok(tables.includes('queue'));
    assert.ok(tables.includes('tables'));
    assert.ok(tables.includes('sessions'));
    assert.ok(tables.includes('session_seats'));
    assert.ok(tables.includes('game_records'));

    // Verify default table 1 exists
    const table1 = db.prepare('SELECT * FROM tables WHERE table_id = 1').get();
    assert.ok(table1);
    assert.equal(table1.name, '테이블 1');
  });

  test('supports session timing and duration_seconds in game_records', () => {
    const db = initDb(testDbPath);

    // Insert client
    db.prepare(`
      INSERT INTO clients (client_id, nickname, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `).run('u1', 'Player1', '2026-09-18T10:00:00Z', '2026-09-18T10:00:00Z');

    // Insert game record with duration
    const started = '2026-09-18T10:00:00Z';
    const finished = '2026-09-18T10:45:30Z';
    const duration = Math.round((new Date(finished) - new Date(started)) / 1000); // 2730 seconds

    const res = db.prepare(`
      INSERT INTO game_records (
        session_id, table_id, east_client_id, east_score,
        started_at, finished_at, duration_seconds, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(1, 1, 'u1', 35000, started, finished, duration, finished);

    assert.ok(res.lastInsertRowid > 0);

    const record = db.prepare('SELECT * FROM game_records WHERE record_id = ?').get(res.lastInsertRowid);
    assert.equal(record.duration_seconds, 2730);
    assert.equal(record.started_at, started);
    assert.equal(record.finished_at, finished);
  });
});
