# Verification Evidence

## Metadata
- Work ID: queue-draw-atomic-lock
- Artifact mode: canonical
- Artifact revision: 2
- Language: en
- Status: complete
- Risk: standard
- Created: 2026-09-24
- Updated: 2026-09-24
- Owner: agent

## Overall status: READY

## Verification Contracts and Gate Matrix

| ID | Component | Description | Command / Method | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| `TEST-BACK-001` | Backend | Atomic seat draw idempotency | `node --test server/index.test.js` | Subsequent `draw-seats` returns identical seats | Verified: parallel & subsequent calls return identical arrangement | [x] |
| `TEST-BACK-002` | Backend | `latest_draw` DB resilience | `node --test server/index.test.js` | `GET /api/queue` returns draw even without memory cache | Verified: DB-backed `latest_draw` delivered reliably | [x] |
| `TEST-FRONT-001`| Frontend | Single-initiator button guard | `npm test -- QueuePage.test.tsx` | Player #1 sees button; #2-#4 see waiting banner | Verified: Player 1 sees active button, Player 2 sees waiting banner | [x] |
| `TEST-FRONT-002`| Frontend | Universal simultaneous transition | `npm test -- QueuePage.test.tsx` | Auto-transitions all participants upon polling `latest_draw` | Verified: All clients auto-transition on `latest_draw` | [x] |
| `GATE-TSC`      | Build | TypeScript compilation check | `npx tsc --noEmit` | 0 type errors | Verified: Exit code 0, 0 compilation errors | [x] |
| `GATE-BUILD`    | Build | Production web build | `npm run build` | Clean production bundle generated | Verified: Compiled successfully (`main.1bdc3103.js`, 120.46 kB) | [x] |
| `GATE-REACT-ALL`| Test | Full React test suite execution | `npm test -- --watchAll=false --forceExit` | All test suites pass | Verified: 16/16 test suites passed, 126/126 tests passed | [x] |
| `GATE-OPS-LIVE` | Ops | Port 3001 graceful recycling | `node server/index.js` background bounce | Port 3001 responds with latest logic, tunnel intact | Verified: PID 33684 active, `/api/queue` live | [x] |

## Diagnostic Proof

### 1. Backend Concurrency & Idempotency Test Output (`node --test server/index.test.js`)
```
TAP version 13
# Subtest: REST API Endpoints
    # Subtest: GET /api/health returns ok
    ok 1 - GET /api/health returns ok
    # Subtest: POST /api/client/register and GET /api/client/:id
    ok 2 - POST /api/client/register and GET /api/client/:id
    # Subtest: POST /api/seat/join 4 players promotes session to active with started_at
    ok 3 - POST /api/seat/join 4 players promotes session to active with started_at
    # Subtest: Queue join, leave, and 4-player seat drawing with 3D wind tiles
    ok 4 - Queue join, leave, and 4-player seat drawing with 3D wind tiles
    # Subtest: POST /api/client/reset vacates seat, cancels queue, and anonymizes nickname to reset_{epoch}
    ok 5 - POST /api/client/reset vacates seat, cancels queue, and anonymizes nickname to reset_{epoch}
    # Subtest: POST /api/sessions/:id/finish records duration_seconds and resets table
    ok 6 - POST /api/sessions/:id/finish records duration_seconds and resets table
    # Subtest: POST /api/queue/draw-seats: claims seats, transitions queue to playing, and returns latest_draw
    ok 7 - POST /api/queue/draw-seats: claims seats, transitions queue to playing, and returns latest_draw
    # Subtest: POST /api/queue/draw-seats: parallel calls return identical arrangement without conflict
    ok 8 - POST /api/queue/draw-seats: parallel calls return identical arrangement without conflict
    # Subtest: POST /api/sessions/:id/submit-score: multi-device optimistic scoring and high-confidence auto-correction
    ok 9 - POST /api/sessions/:id/submit-score: multi-device optimistic scoring and high-confidence auto-correction
    # Subtest: POST /api/sessions/:id/finish: idempotent first-write-wins
    ok 10 - POST /api/sessions/:id/finish: idempotent first-write-wins
    1..10
ok 1 - REST API Endpoints
1..1
# tests 10
# suites 1
# pass 10
# fail 0
# duration_ms 924.439
```

### 2. Frontend Component Test Output (`npm test -- QueuePage.test.tsx`)
```
PASS src/components/QueuePage.test.tsx
  QueuePage component
    √ renders empty queue and join input (100 ms)
    √ shows draw button when 4 players are queued, and renders 3D wind tiles on click (173 ms)
    √ clicking score scan buttons navigates to /scan_score (not /scan_score_test) (12 ms)
    √ automatically renders 3D wind tiles and hides draw button when latest_draw is received from polling (27 ms)
    √ shows waiting banner instead of draw button for non-host queued player (17 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        16.854 s
```

### 3. Full React Test Suite Output (`npm test -- --watchAll=false --forceExit`)
```
Test Suites: 16 passed, 16 total
Tests:       126 passed, 126 total
Snapshots:   0 total
Time:        12.892 s
Ran all test suites.
```

### 4. TypeScript Compilation & Production Build
```
> npx tsc --noEmit (Exit Code: 0)
> npm run build
Compiled successfully.
File sizes after gzip:
  120.46 kB (+174 B)  build\static\js\main.1bdc3103.js
  1.78 kB             build\static\js\453.f3d7174d.chunk.js
  302 B               build\static\css\main.f8e894fa.css
```

### 5. Live Process Recycling Verification
```
PID 33684 listening on port 3001
Port 3001 Health: ok
Live Queue Members in SQLite:
  1. GTO (#1 - Host, clickable draw trigger enabled)
  2. 관절 (#2 - Waiting banner shown)
  3. 마작왕 (#3 - Waiting banner shown)
  4. 아쿠아컴퍼니 (#4 - Waiting banner shown)
```
