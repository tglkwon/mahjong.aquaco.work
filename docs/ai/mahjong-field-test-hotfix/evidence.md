# Verification Evidence

## Metadata
- Work ID: mahjong-field-test-hotfix
- Artifact mode: canonical
- Artifact revision: 2
- Language: en
- Status: complete
- Risk: standard
- Created: 2026-09-23
- Updated: 2026-09-23
- Owner: agent

## Overall status: READY

## Verification Contracts and Gate Matrix

| ID | Component | Description | Command / Method | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| `TEST-SYNC-001` | Backend | Atomic seat draw & DB persistence | `node --test index.test.js` | 4 seats claimed in `session_seats`, queue status updated to 'playing' | Verified: `session_seats` 4 rows inserted, queue status updated | [x] |
| `TEST-SYNC-002` | Backend | Idempotent duplicate draw calls | `node --test index.test.js` | Returns identical seat assignments without reshuffling | Verified: 2nd draw returns cached/existing draw result | [x] |
| `TEST-SYNC-003` | Backend | `latest_draw` delivery via `GET /api/queue` | `node --test index.test.js` | Payload includes active draw details | Verified: `latest_draw` field present with active draw | [x] |
| `TEST-SYNC-004` | Backend | Multi-device score consensus & idempotent finish | `node --test index.test.js` | Optimistic score + confidence update, single finish | Verified: higher confidence overwrites, finish resets table | [x] |
| `TEST-FRONT-001`| Frontend | QueuePage simultaneous 4-player transition | `npm test -- QueuePage.test.tsx` | All 4 clients display drawn tile view automatically | Verified: auto-populates drawn tiles on `latest_draw` | [x] |
| `TEST-FRONT-002`| Frontend | QueuePage navigation state passing | `npm test -- QueuePage.test.tsx` | Passes `?table=1` and `state: { drawnSeats }` | Verified: navigation state and query param propagated | [x] |
| `TEST-FRONT-003`| Frontend | ScoreScanPage production polling unblocking | `npm test -- ScoreScanPage.test.tsx` | `pollTableStatus` executes when `isTestMode=false` | Verified: fetches `/api/tables/1/status` in prod mode | [x] |
| `TEST-FRONT-004`| Frontend | ScoreScanPage instant router state hydration | `npm test -- ScoreScanPage.test.tsx` | `playerPool` initialized immediately with drawn nicknames | Verified: 0ms hydration from `location.state.drawnSeats` | [x] |
| `TEST-OCR-001`  | OCR | Relative contrast G-segment rejection of flare | `npm test -- scoreRecognition.test.ts` | Digit '0' with LED optical flare is classified as '0', NOT '8' | Verified: 18/18 tests pass, optical bloom handled | [x] |
| `TEST-OCR-002`  | OCR | Japanese Mahjong sum backtracking solver | `npm test -- scoreDraft.test.ts` | Resolves 100k/120k sum consistency on ambiguous 0/8 | Verified: single-digit 8->0 backtracking repair passes | [x] |
| `GATE-TSC`      | Build | TypeScript compilation check | `npx tsc --noEmit` | 0 type errors | Verified: clean exit code 0 | [x] |
| `GATE-BUILD`    | Build | Production web build | `npm run build` | Clean production bundle generated in `build/` | Verified: build compiled successfully (120.29 kB) | [x] |
| `GATE-REACT-ALL`| Test | Full React test suite execution | `npm test -- --watchAll=false --forceExit` | All test suites pass | Verified: 16/16 suites passed, 125/125 tests passed | [x] |

## Execution Logs and Diagnostic Proof

### Backend Verification Logs (`server/`)
```
TAP version 13
# Subtest: Database initialization and schema
    # Subtest: enables WAL mode and creates all required tables
    ok 1 - enables WAL mode and creates all required tables
    # Subtest: supports session timing and duration_seconds in game_records
    ok 2 - supports session timing and duration_seconds in game_records
    1..2
ok 1 - Database initialization and schema
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
    # Subtest: POST /api/sessions/:id/submit-score: multi-device optimistic scoring and high-confidence auto-correction
    ok 8 - POST /api/sessions/:id/submit-score: multi-device optimistic scoring and high-confidence auto-correction
    # Subtest: POST /api/sessions/:id/finish: idempotent first-write-wins
    ok 9 - POST /api/sessions/:id/finish: idempotent first-write-wins
    1..9
ok 2 - REST API Endpoints
1..2
# tests 11
# suites 2
# pass 11
# fail 0
# duration_ms 828.4875
```

### Full Frontend Test Suite Logs
```
Test Suites: 16 passed, 16 total
Tests:       125 passed, 125 total
Snapshots:   0 total
Time:        15.643 s
Ran all test suites.
```

### TypeScript Compilation Check (`npx tsc --noEmit`)
```
Exit code: 0
Diagnostic: No compilation or type errors across the entire codebase.
```

### Production Build Logs (`npm run build`)
```
Creating an optimized production build...
Compiled successfully.

File sizes after gzip:
  120.29 kB (+752 B)  build\static\js\main.0179dcdc.js
  1.78 kB             build\static\js\453.f3d7174d.chunk.js
  302 B               build\static\css\main.f8e894fa.css
```
