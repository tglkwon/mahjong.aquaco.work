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

  test('POST /api/queue/draw-seats: claims seats, transitions queue to playing, and returns latest_draw', async () => {
    // 1. Join 4 players into queue
    for (let i = 1; i <= 4; i++) {
      await request('/api/queue/join', {
        method: 'POST',
        body: JSON.stringify({ client_id: `q_user_${i}`, nickname: `대기자${i}` }),
      });
    }

    const queueBefore = await request('/api/queue');
    assert.equal(queueBefore.body.count, 4);
    assert.equal(queueBefore.body.latest_draw, null);

    // 2. Draw seats
    const drawRes = await request('/api/queue/draw-seats', {
      method: 'POST',
      body: JSON.stringify({ table_id: 1 }),
    });

    assert.equal(drawRes.status, 200);
    assert.equal(drawRes.body.success, true);
    assert.equal(drawRes.body.draw.length, 4);

    // 3. Verify queue is now empty (status='playing')
    const queueAfter = await request('/api/queue');
    assert.equal(queueAfter.body.count, 0);
    assert.ok(queueAfter.body.latest_draw);
    assert.equal(queueAfter.body.latest_draw.draw.length, 4);

    // 4. Verify table status has all 4 seats claimed
    const tableStatus = await request('/api/tables/1/status');
    assert.equal(tableStatus.body.occupied_count, 4);
    assert.equal(tableStatus.body.session_status, 'active');
    assert.ok(tableStatus.body.seats.east);
    assert.ok(tableStatus.body.seats.south);
    assert.ok(tableStatus.body.seats.west);
    assert.ok(tableStatus.body.seats.north);

    // 5. Test idempotency: subsequent draw returns existing arrangement
    const drawRes2 = await request('/api/queue/draw-seats', {
      method: 'POST',
      body: JSON.stringify({ table_id: 1 }),
    });
    assert.equal(drawRes2.status, 200);
    assert.equal(drawRes2.body.idempotent, true);
    assert.deepEqual(drawRes2.body.draw, drawRes.body.draw);
  });

  test('POST /api/sessions/:id/submit-score: multi-device optimistic scoring and high-confidence auto-correction', async () => {
    // Start session with 4 players
    for (const s of ['east', 'south', 'west', 'north']) {
      await request('/api/seat/join', {
        method: 'POST',
        body: JSON.stringify({ table_id: 1, seat: s, client_id: `p_${s}`, nickname: `Nick_${s}` }),
      });
    }

    const tableStatus = await request('/api/tables/1/status');
    const sessionId = tableStatus.body.session_id;

    // 1. First device submits score (confidence 0.82) -> optimistically canonical
    const sub1 = await request(`/api/sessions/${sessionId}/submit-score`, {
      method: 'POST',
      body: JSON.stringify({
        client_id: 'p_east',
        seat: 'east',
        device_name: 'iPhone 12',
        scores: { east: 35000, south: 25000, west: 22000, north: 18000 },
        confidence: 0.82,
      }),
    });

    assert.equal(sub1.status, 200);
    assert.equal(sub1.body.is_canonical, true);
    assert.equal(sub1.body.submissions_count, 1);
    assert.equal(sub1.body.canonical_scores.east, 35000);

    // Check table status reflects canonical score
    const status1 = await request('/api/tables/1/status');
    assert.equal(status1.body.canonical_score.east, 35000);
    assert.equal(status1.body.submissions_count, 1);

    // 2. Second device submits differing score with low confidence (0.83) -> NOT canonical
    const sub2 = await request(`/api/sessions/${sessionId}/submit-score`, {
      method: 'POST',
      body: JSON.stringify({
        client_id: 'p_south',
        seat: 'south',
        device_name: 'Budget Phone',
        scores: { east: 35000, south: 25800, west: 21200, north: 18000 },
        confidence: 0.83,
      }),
    });
    assert.equal(sub2.body.is_canonical, false);

    // 3. Third device submits corrected score with much higher confidence (0.95, delta >= 0.10) -> auto-corrects canonical!
    const sub3 = await request(`/api/sessions/${sessionId}/submit-score`, {
      method: 'POST',
      body: JSON.stringify({
        client_id: 'p_west',
        seat: 'west',
        device_name: 'Galaxy S24 Ultra',
        scores: { east: 36000, south: 25000, west: 21000, north: 18000 },
        confidence: 0.95,
      }),
    });
    assert.equal(sub3.body.is_canonical, true);
    assert.equal(sub3.body.canonical_scores.east, 36000);

    // Verify table status updated
    const status2 = await request('/api/tables/1/status');
    assert.equal(status2.body.canonical_score.east, 36000);
    assert.equal(status2.body.submissions_count, 3);
  });

  test('POST /api/sessions/:id/finish: idempotent first-write-wins', async () => {
    // Start session
    for (const s of ['east', 'south', 'west', 'north']) {
      await request('/api/seat/join', {
        method: 'POST',
        body: JSON.stringify({ table_id: 1, seat: s, client_id: `u_${s}`, nickname: `N_${s}` }),
      });
    }

    const tableStatus = await request('/api/tables/1/status');
    const sessionId = tableStatus.body.session_id;

    // Call finish 1st time
    const res1 = await request(`/api/sessions/${sessionId}/finish`, {
      method: 'POST',
      body: JSON.stringify({
        table_id: 1,
        scores: { east: 30000, south: 30000, west: 20000, north: 20000 },
      }),
    });
    assert.equal(res1.status, 200);
    assert.equal(res1.body.status, 'finished');
    const firstRecordId = res1.body.record_id;

    // Call finish 2nd time (duplicate/concurrent)
    const res2 = await request(`/api/sessions/${sessionId}/finish`, {
      method: 'POST',
      body: JSON.stringify({
        table_id: 1,
        scores: { east: 30000, south: 30000, west: 20000, north: 20000 },
      }),
    });
    assert.equal(res2.status, 200);
    assert.equal(res2.body.status, 'finished');
    assert.equal(res2.body.record_id, firstRecordId);
    assert.equal(res2.body.message, '이미 기록이 완료되었습니다.');
  });
});
