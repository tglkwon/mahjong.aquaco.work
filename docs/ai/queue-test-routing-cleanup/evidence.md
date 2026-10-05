# Verification Evidence

## Metadata
- Work ID: queue-test-routing-cleanup
- Artifact mode: canonical
- Artifact revision: 3
- Language: en
- Status: ready
- Risk: standard
- Created: 2026-09-24
- Updated: 2026-09-24
- Owner: agent

## Overall status
READY

## Verification Results

| Requirement / Task | Verification Method | Target Outcome | Current Status | Evidence |
| :--- | :--- | :--- | :--- | :--- |
| `REQ-UNIFY-ROUTE-001` | React Router redirect test in `App.test.tsx` | `/scan_score_test` & `/test_scan` redirect to `/scan_score` with query/hash | PASS | `App.test.tsx`: 4 redirects verified with query & hash preservation |
| `REQ-TEST-SERVER-DETECT-001` | Mocked status check test in `PhotoUploadPanel.test.tsx` | Online mobile-drop enables transfer; offline keeps transfer dormant | PASS | `PhotoUploadPanel.test.tsx`: 19/19 passed including auto-detection & status check |
| `REQ-QUEUE-PARAM-FORWARD-001` | Navigation test in `QueuePage.test.tsx` | Clicks to score board target `/scan_score` preserving `dropUrl` query | PASS | `QueuePage.test.tsx`: parameter forwarding to `/scan_score` verified |
| `REQ-QUEUE-SEAT-EXCLUSION-001` | Concurrency & session test in `server/index.test.js` | Subsequent draw with new queue creates fresh session & seats new players | PASS | `server/index.test.js`: 10/10 passed (fresh session 8 created, table occupied) |
| `REQ-QUEUE-SEAT-EXCLUSION-002` | DB query test in `server/index.test.js` | Seated players removed from waiting list by `client_id` OR `nickname` | PASS | `server/index.test.js`: dual-key exclusion verified |
| `REQ-QUEUE-CLIENT-SYNC-001` | React test in `QueuePage.test.tsx` | `isEnqueued` turns false immediately on draw result | PASS | `QueuePage.test.tsx`: instant exclusion upon tile draw verified |
| `TASK-001` ~ `TASK-006` | Full automated suite (`npm test`, `npm run build`, `npx tsc`) | All tests pass, build succeeds | PASS | 16 test suites passed (128/128), 0 errors in `npx tsc`, build succeeded |

## Test Execution Log
1. **Targeted React Unit Tests**:
   - `cmd.exe /c npm test -- --watchAll=false --forceExit src/App.test.tsx src/components/ScoreScanPage.test.tsx src/components/QueuePage.test.tsx src/components/PhotoUploadPanel.test.tsx`
   - Result: 4 test suites passed, 39 tests passed.
2. **Backend Unit Tests**:
   - `node --test server/index.test.js`
   - Result: 1 test suite passed, 10 tests passed (10/10).
3. **Full Frontend Unit Tests**:
   - `cmd.exe /c npm test -- --watchAll=false --forceExit`
   - Result: 16 test suites passed, 128 tests passed (128/128).
4. **TypeScript Typecheck**:
   - `cmd.exe /c npx tsc --noEmit`
   - Result: 0 errors.
5. **Production Build**:
   - `cmd.exe /c npm run build`
   - Result: Production build succeeded (`build/static/js/main.f11fb57c.js`).
6. **Backend Hot-Reload & Health Check**:
   - Recycled backend process on port 3001 via `scripts/recycle-backend.ps1` (PID 39312).
   - `curl http://localhost:3001/api/health` -> `{"status":"ok","uptime":56.29}`.
   - `curl http://localhost:3001/api/queue` -> `{"count":0,"queue":[],"latest_draw":{...}}`.
   - React dev server (port 3000) and Cloudflare tunnels remained active throughout without any interruption.
