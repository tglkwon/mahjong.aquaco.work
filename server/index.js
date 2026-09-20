const express = require('express');
const cors = require('cors');
const { getDb } = require('./db');

function createApp(dbInstance = null) {
  const app = express();
  const db = dbInstance || getDb();

  app.use(cors());
  app.use(express.json());

  // 1. Healthcheck
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  // 2. Client Register/Update
  app.post('/api/client/register', (req, res) => {
    const { client_id, nickname } = req.body;
    if (!client_id || !nickname || !nickname.trim()) {
      return res.status(400).json({ error: 'client_id and nickname are required' });
    }

    const trimmedNick = nickname.trim();
    const now = new Date().toISOString();

    const existing = db.prepare('SELECT * FROM clients WHERE client_id = ?').get(client_id);
    if (existing) {
      db.prepare(`
        UPDATE clients SET nickname = ?, updated_at = ? WHERE client_id = ?
      `).run(trimmedNick, now, client_id);

      // Also update queue if present
      db.prepare(`
        UPDATE queue SET nickname = ?, updated_at = ? WHERE client_id = ?
      `).run(trimmedNick, now, client_id);
    } else {
      db.prepare(`
        INSERT INTO clients (client_id, nickname, created_at, updated_at)
        VALUES (?, ?, ?, ?)
      `).run(client_id, trimmedNick, now, now);
    }

    res.json({ client_id, nickname: trimmedNick });
  });

  // 3. Get Client
  app.get('/api/client/:client_id', (req, res) => {
    const client = db.prepare('SELECT * FROM clients WHERE client_id = ?').get(req.params.client_id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(client);
  });

  // 4. Device Reset & Anonymization
  app.post('/api/client/reset', (req, res) => {
    const { client_id } = req.body;
    if (!client_id) {
      return res.status(400).json({ error: 'client_id is required' });
    }

    const epoch = Math.floor(Date.now() / 1000);
    const anonymizedNick = `reset_${epoch}`;
    const now = new Date().toISOString();

    // Vacate any active seats
    db.prepare('DELETE FROM session_seats WHERE client_id = ?').run(client_id);

    // Cancel from queue
    db.prepare(`
      UPDATE queue SET status = 'canceled', updated_at = ? WHERE client_id = ?
    `).run(now, client_id);

    // Anonymize nickname in clients table
    db.prepare(`
      UPDATE clients SET nickname = ?, updated_at = ? WHERE client_id = ?
    `).run(anonymizedNick, now, client_id);

    res.json({
      success: true,
      anonymized_nickname: anonymizedNick,
      message: 'Client registration reset and nickname anonymized',
    });
  });

  // Helper: Get or create active session for table
  function getOrCreateTableSession(tableId) {
    let table = db.prepare('SELECT * FROM tables WHERE table_id = ?').get(tableId);
    if (!table) {
      db.prepare('INSERT OR IGNORE INTO tables (table_id, name) VALUES (?, ?)').run(tableId, `테이블 ${tableId}`);
      table = db.prepare('SELECT * FROM tables WHERE table_id = ?').get(tableId);
    }

    let session = null;
    if (table.current_session_id) {
      session = db.prepare('SELECT * FROM sessions WHERE session_id = ?').get(table.current_session_id);
      if (session && session.status === 'finished') {
        session = null;
      }
    }

    if (!session) {
      const now = new Date().toISOString();
      const lastSession = db.prepare(`
        SELECT MAX(session_number) as max_num FROM sessions WHERE table_id = ?
      `).get(tableId);
      const nextNum = (lastSession && lastSession.max_num ? lastSession.max_num : 0) + 1;

      const ins = db.prepare(`
        INSERT INTO sessions (table_id, session_number, status, created_at)
        VALUES (?, ?, 'waiting_players', ?)
      `).run(tableId, nextNum, now);

      const newSessionId = ins.lastInsertRowid;
      db.prepare('UPDATE tables SET current_session_id = ? WHERE table_id = ?').run(newSessionId, tableId);
      session = db.prepare('SELECT * FROM sessions WHERE session_id = ?').get(newSessionId);
    }

    return session;
  }

  // 5. Table Status
  app.get('/api/tables/:table_id/status', (req, res) => {
    const tableId = parseInt(req.params.table_id, 10);
    const session = getOrCreateTableSession(tableId);

    const seats = { east: null, south: null, west: null, north: null };
    const rows = db.prepare(`
      SELECT ss.seat, ss.client_id, c.nickname, ss.joined_at
      FROM session_seats ss
      LEFT JOIN clients c ON ss.client_id = c.client_id
      WHERE ss.session_id = ?
    `).all(session.session_id);

    rows.forEach(r => {
      if (seats.hasOwnProperty(r.seat)) {
        seats[r.seat] = {
          client_id: r.client_id,
          nickname: r.nickname || '익명',
          joined_at: r.joined_at,
        };
      }
    });

    const occupiedCount = Object.values(seats).filter(Boolean).length;

    res.json({
      table_id: tableId,
      session_id: session.session_id,
      session_number: session.session_number,
      session_status: session.status,
      started_at: session.started_at,
      finished_at: session.finished_at,
      occupied_count: occupiedCount,
      seats,
    });
  });

  // 6. Join Seat
  app.post('/api/seat/join', (req, res) => {
    const { table_id, seat, client_id, nickname } = req.body;
    const validSeats = ['east', 'south', 'west', 'north'];
    if (!table_id || !seat || !validSeats.includes(seat) || !client_id) {
      return res.status(400).json({ error: 'Valid table_id, seat, and client_id are required' });
    }

    const tableId = parseInt(table_id, 10);
    const now = new Date().toISOString();

    // Ensure client exists
    if (nickname) {
      const existing = db.prepare('SELECT * FROM clients WHERE client_id = ?').get(client_id);
      if (!existing) {
        db.prepare(`
          INSERT INTO clients (client_id, nickname, created_at, updated_at)
          VALUES (?, ?, ?, ?)
        `).run(client_id, nickname.trim(), now, now);
      } else if (existing.nickname !== nickname.trim()) {
        db.prepare('UPDATE clients SET nickname = ?, updated_at = ? WHERE client_id = ?').run(nickname.trim(), now, client_id);
      }
    }

    const session = getOrCreateTableSession(tableId);

    // If client was seated in another seat at this table, vacate old seat
    db.prepare(`
      DELETE FROM session_seats WHERE session_id = ? AND client_id = ?
    `).run(session.session_id, client_id);

    // Claim target seat
    db.prepare(`
      INSERT OR REPLACE INTO session_seats (session_id, seat, client_id, joined_at)
      VALUES (?, ?, ?, ?)
    `).run(session.session_id, seat, client_id, now);

    // If client was in queue, update queue status to 'playing'
    db.prepare(`
      UPDATE queue SET status = 'playing', updated_at = ? WHERE client_id = ?
    `).run(now, client_id);

    // Check if all 4 seats are occupied to promote session to active
    const occupiedRows = db.prepare(`
      SELECT seat FROM session_seats WHERE session_id = ?
    `).all(session.session_id);

    if (occupiedRows.length === 4 && session.status === 'waiting_players') {
      db.prepare(`
        UPDATE sessions SET status = 'active', started_at = ? WHERE session_id = ?
      `).run(now, session.session_id);
    }

    // Return updated table status
    const updated = db.prepare('SELECT * FROM sessions WHERE session_id = ?').get(session.session_id);
    const seats = { east: null, south: null, west: null, north: null };
    const allSeats = db.prepare(`
      SELECT ss.seat, ss.client_id, c.nickname, ss.joined_at
      FROM session_seats ss
      LEFT JOIN clients c ON ss.client_id = c.client_id
      WHERE ss.session_id = ?
    `).all(session.session_id);

    allSeats.forEach(r => {
      seats[r.seat] = {
        client_id: r.client_id,
        nickname: r.nickname || '익명',
        joined_at: r.joined_at,
      };
    });

    res.json({
      success: true,
      table_id: tableId,
      session_id: session.session_id,
      session_status: updated.status,
      started_at: updated.started_at,
      seats,
    });
  });

  // 7. Get Queue
  app.get('/api/queue', (req, res) => {
    const list = db.prepare(`
      SELECT client_id, nickname, status, enqueued_at, updated_at
      FROM queue
      WHERE status = 'waiting'
      ORDER BY enqueued_at ASC
    `).all();
    res.json({ count: list.length, queue: list });
  });

  // 8. Join Queue
  app.post('/api/queue/join', (req, res) => {
    const { client_id, nickname } = req.body;
    if (!client_id || !nickname || !nickname.trim()) {
      return res.status(400).json({ error: 'client_id and nickname are required' });
    }

    const trimmed = nickname.trim();
    const now = new Date().toISOString();

    // Ensure in clients
    const c = db.prepare('SELECT * FROM clients WHERE client_id = ?').get(client_id);
    if (!c) {
      db.prepare(`
        INSERT INTO clients (client_id, nickname, created_at, updated_at) VALUES (?, ?, ?, ?)
      `).run(client_id, trimmed, now, now);
    }

    db.prepare(`
      INSERT OR REPLACE INTO queue (client_id, nickname, status, enqueued_at, updated_at)
      VALUES (?, ?, 'waiting', ?, ?)
    `).run(client_id, trimmed, now, now);

    res.json({ success: true, client_id, nickname: trimmed, status: 'waiting' });
  });

  // 9. Leave Queue
  app.post('/api/queue/leave', (req, res) => {
    const { client_id } = req.body;
    if (!client_id) {
      return res.status(400).json({ error: 'client_id is required' });
    }
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE queue SET status = 'canceled', updated_at = ? WHERE client_id = ?
    `).run(now, client_id);
    res.json({ success: true, client_id, status: 'canceled' });
  });

  // 10. 4-Player Digital Seat Draw (3D Wind Tile Allocation)
  app.post('/api/queue/draw-seats', (req, res) => {
    const waitingList = db.prepare(`
      SELECT client_id, nickname FROM queue WHERE status = 'waiting' ORDER BY enqueued_at ASC LIMIT 4
    `).all();

    if (waitingList.length < 4) {
      return res.status(400).json({
        error: '최소 4명의 대기자가 있어야 자리 뽑기가 가능합니다.',
        current_count: waitingList.length,
      });
    }

    // Shuffle 4 players
    const shuffled = [...waitingList];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const windTiles = [
      { seat: 'east', wind_char: '東', seat_label: '동가 (East)' },
      { seat: 'south', wind_char: '南', seat_label: '남가 (South)' },
      { seat: 'west', wind_char: '西', seat_label: '서가 (West)' },
      { seat: 'north', wind_char: '北', seat_label: '북가 (North)' },
    ];

    const draw = windTiles.map((wind, idx) => ({
      ...wind,
      client_id: shuffled[idx].client_id,
      nickname: shuffled[idx].nickname,
    }));

    res.json({ success: true, draw });
  });

  // 11. Finish Session & Record Duration
  app.post('/api/sessions/:session_id/finish', (req, res) => {
    const sessionId = parseInt(req.params.session_id, 10);
    const { table_id, scores, participants, raw_payload } = req.body;

    const session = db.prepare('SELECT * FROM sessions WHERE session_id = ?').get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const finishedAt = new Date().toISOString();
    const startedAt = session.started_at || session.created_at;
    const durationSeconds = Math.max(0, Math.round((new Date(finishedAt) - new Date(startedAt)) / 1000));

    // Update session status
    db.prepare(`
      UPDATE sessions SET status = 'finished', finished_at = ? WHERE session_id = ?
    `).run(finishedAt, sessionId);

    // Insert game record
    const s = scores || {};
    const p = participants || {};
    const ins = db.prepare(`
      INSERT INTO game_records (
        session_id, table_id,
        east_client_id, east_score,
        south_client_id, south_score,
        west_client_id, west_score,
        north_client_id, north_score,
        started_at, finished_at, duration_seconds, recorded_at, raw_payload
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sessionId,
      table_id || session.table_id,
      p.east || null, s.east ?? null,
      p.south || null, s.south ?? null,
      p.west || null, s.west ?? null,
      p.north || null, s.north ?? null,
      startedAt,
      finishedAt,
      durationSeconds,
      finishedAt,
      raw_payload ? JSON.stringify(raw_payload) : null
    );

    // Reset table current_session_id so next round starts clean
    if (table_id || session.table_id) {
      db.prepare('UPDATE tables SET current_session_id = NULL WHERE table_id = ?').run(table_id || session.table_id);
    }

    res.json({
      success: true,
      record_id: ins.lastInsertRowid,
      session_id: sessionId,
      status: 'finished',
      started_at: startedAt,
      finished_at: finishedAt,
      duration_seconds: durationSeconds,
    });
  });

  // 12. Admin Reset
  app.post('/api/admin/reset', (req, res) => {
    const tableId = parseInt(req.body.table_id || 1, 10);
    db.prepare('UPDATE tables SET current_session_id = NULL WHERE table_id = ?').run(tableId);
    res.json({ success: true, message: `Table ${tableId} reset` });
  });

  // 13. Serve Static Frontend (if build directory exists)
  const path = require('path');
  const fs = require('fs');
  const buildPath = path.join(__dirname, '..', 'build');
  if (fs.existsSync(buildPath)) {
    app.use(express.static(buildPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(buildPath, 'index.html'));
    });
  }

  return app;
}

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  const HOST = process.env.HOST || '0.0.0.0';
  const app = createApp();
  app.listen(PORT, HOST, () => {
    console.log(`Mahjong session server listening on http://${HOST}:${PORT}`);
  });
}

module.exports = { createApp };
