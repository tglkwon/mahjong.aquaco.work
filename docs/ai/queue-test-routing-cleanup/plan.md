# Implementation Plan

## Metadata
- Work ID: queue-test-routing-cleanup
- Artifact mode: canonical
- Artifact revision: 2
- Language: en
- Status: draft
- Risk: standard
- Created: 2026-09-24
- Updated: 2026-09-24
- Owner: agent

## Tasks

- [ ] `TASK-001`: Unify score routes in `App.tsx`. Make `/scan_score` the single consolidated route; configure `/scan_score_test` and `/test_scan` to redirect to `/scan_score` preserving `search` and `hash` (`REQ-UNIFY-ROUTE-001`).
- [ ] `TASK-002`: Implement conditional test server reachability auto-detection in `PhotoUploadPanel.tsx` and `ScoreScanPage.tsx`. Automatically check status via `checkDropStatus` and only enable PC transfer and test controls when the test server is online (`REQ-TEST-SERVER-DETECT-001`).
- [ ] `TASK-003`: Update `QueuePage.tsx` and `SeatCheckinPage.tsx` to preserve test parameters (`dropUrl`, `dropPin`, `device`) in query strings and `sessionStorage`, consistently target `/scan_score?table=1`, and immediately clear `isEnqueued` on draw (`REQ-QUEUE-PARAM-FORWARD-001`, `REQ-QUEUE-CLIENT-SYNC-001`).
- [ ] `TASK-004`: Refactor `server/index.js` `POST /api/queue/draw-seats` and `POST /api/seat/join` to support smart session lifecycle (new session when queue differs from current seated players) and dual-key queue status update (`WHERE client_id = ? OR nickname = ?`) (`REQ-QUEUE-SEAT-EXCLUSION-001`, `REQ-QUEUE-SEAT-EXCLUSION-002`).
- [ ] `TASK-005`: Update automated tests in `App.test.tsx`, `QueuePage.test.tsx`, `PhotoUploadPanel.test.tsx`, and `server/index.test.js` to assert unified route redirects, conditional transfer activation, and queue exclusion.
- [ ] `TASK-006`: Perform zero-downtime hot-reload of Express backend on port 3001 and execute full quality gate audit.

## TDD Sequence
1. **Red**: Add test cases in `App.test.tsx` verifying that accessing `/scan_score_test?dropUrl=...` redirects to `/scan_score?dropUrl=...`.
2. **Red**: Add test in `PhotoUploadPanel.test.tsx` asserting that when `checkDropStatus` returns `ok: true`, PC transfer mode connects and uploads; when offline, transfer remains disabled.
3. **Red**: Add test cases in `server/index.test.js` asserting that drawing seats when a previous session is full correctly allocates new waiting players and removes them from the waiting queue.
4. **Green**: Implement code in `App.tsx`, `PhotoUploadPanel.tsx`, `ScoreScanPage.tsx`, `QueuePage.tsx`, and `server/index.js`.
5. **Refactor**: Clean up obsolete route constants and parameter handlers.

## Quality Gates
- **Gate 1**: Unit test suite passes without open handles: `npm test -- --watchAll=false --forceExit`.
- **Gate 2**: TypeScript type-check and production build pass: `npx tsc --noEmit && npm run build`.
- **Gate 3**: Express API port 3001 responding with healthy JSON responses.
- **Gate 4**: Zero disruption to running Cloudflare tunnels or React port 3000.
