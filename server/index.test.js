const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { initDb, closeDb } = require('./db');
const { createApp } = require('./index');

describe('REST API Endpoints', () => {
  const testDbPath = path.join(__dirname, 'data', 'test_api.db');
  let server;
  let baseUrl;
  let db;

  beforeEach(async () => {
    closeDb();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    db = initDb(testDbPath);
    const app = createApp(db);

    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
    closeDb();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  async function request(endpoint, options = {}) {
    const url = `${baseUrl}${endpoint}`;
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  }

  test('GET /api/health returns ok', async () => {
    const res = await request('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });

  test('POST /api/client/register and GET /api/client/:id', async () => {
    const reg = await request('/api/client/register', {
      method: 'POST',
      body: JSON.stringify({ client_id: 'c1', nickname: '마작왕' }),
    });
    assert.equal(reg.status, 200);
    assert.equal(reg.body.nickname, '마작왕');

    const get = await request('/api/client/c1');
    assert.equal(get.status, 200);
    assert.equal(get.body.nickname, '마작왕');
  });

  test('POST /api/seat/join 4 players promotes session to active with started_at', async () => {
    const players = [
      { seat: 'east', client_id: 'p1', nickname: '동가' },
      { seat: 'south', client_id: 'p2', nickname: '남가' },
      { seat: 'west', client_id: 'p3', nickname: '서가' },
      { seat: 'north', client_id: 'p4', nickname: '북가' },
    ];

    for (const p of players.slice(0, 3)) {
      const res = await request('/api/seat/join', {
        method: 'POST',
        body: JSON.stringify({ table_id: 1, ...p }),
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.session_status, 'waiting_players');
      assert.equal(res.body.started_at, null);
    }

    // 4th player joins
    const last = await request('/api/seat/join', {
      method: 'POST',
      body: JSON.stringify({ table_id: 1, ...players[3] }),
    });
    assert.equal(last.status, 200);
    assert.equal(last.body.session_status, 'active');
    assert.ok(last.body.started_at);
  });

  test('Queue join, leave, and 4-player seat drawing with 3D wind tiles', async () => {
    // Join 4 players
    for (let i = 1; i <= 4; i++) {
      await request('/api/queue/join', {
        method: 'POST',
        body: JSON.stringify({ client_id: `q${i}`, nickname: `대기자${i}` }),
      });
    }

    const qRes = await request('/api/queue');
    assert.equal(qRes.body.count, 4);

    // Draw seats
    const drawRes = await request('/api/queue/draw-seats', {
      method: 'POST',
      body: JSON.stringify({ table_id: 1 }),
    });
    assert.equal(drawRes.status, 200);
    assert.equal(drawRes.body.draw.length, 4);
    const seats = drawRes.body.draw.map(d => d.seat);
    assert.deepEqual(seats, ['east', 'south', 'west', 'north']);
    const windChars = drawRes.body.draw.map(d => d.wind_char);
    assert.deepEqual(windChars, ['東', '南', '西', '北']);
  });

  test('POST /api/client/reset vacates seat, cancels queue, and anonymizes nickname to reset_{epoch}', async () => {
    // Register and seat
    await request('/api/seat/join', {
      method: 'POST',
      body: JSON.stringify({ table_id: 1, seat: 'east', client_id: 'r1', nickname: '탈퇴자' }),
    });
    await request('/api/queue/join', {
      method: 'POST',
      body: JSON.stringify({ client_id: 'r1', nickname: '탈퇴자' }),
    });

    // Reset
    const resetRes = await request('/api/client/reset', {
      method: 'POST',
      body: JSON.stringify({ client_id: 'r1' }),
    });
    assert.equal(resetRes.status, 200);
    assert.ok(resetRes.body.anonymized_nickname.startsWith('reset_'));

    // Verify seat is vacated
    const status = await request('/api/tables/1/status');
    assert.equal(status.body.seats.east, null);

    // Verify queue is empty
    const queue = await request('/api/queue');
    assert.equal(queue.body.count, 0);

    // Verify client nickname in db
    const client = await request('/api/client/r1');
    assert.ok(client.body.nickname.startsWith('reset_'));
  });

  test('POST /api/sessions/:id/finish records duration_seconds and resets table', async () => {
    // Start session with 4 players
    for (const s of ['east', 'south', 'west', 'north']) {
      await request('/api/seat/join', {
        method: 'POST',
        body: JSON.stringify({ table_id: 1, seat: s, client_id: `user_${s}`, nickname: `Name_${s}` }),
      });
    }

    const tableStatus = await request('/api/tables/1/status');
    const sessionId = tableStatus.body.session_id;

    // Finish session
    const finishRes = await request(`/api/sessions/${sessionId}/finish`, {
      method: 'POST',
      body: JSON.stringify({
        table_id: 1,
        scores: { east: 35000, south: 25000, west: 22000, north: 18000 },
        participants: { east: 'user_east', south: 'user_south', west: 'user_west', north: 'user_north' },
        raw_payload: { memo: '반장전 1회' },
      }),
    });

    assert.equal(finishRes.status, 200);
    assert.equal(finishRes.body.status, 'finished');
    assert.ok(finishRes.body.duration_seconds >= 0);
    assert.ok(finishRes.body.record_id > 0);

    // Verify table is reset (new session will be created on next status call)
    const nextStatus = await request('/api/tables/1/status');
    assert.notEqual(nextStatus.body.session_id, sessionId);
    assert.equal(nextStatus.body.session_status, 'waiting_players');
    assert.equal(nextStatus.body.occupied_count, 0);
  });
});
