# Implementation plan

## Metadata
- Work ID: mvp2-fixed-qr-session
- Artifact revision: 4
- Language: en
- Korean mirror: plan.ko.md
- Status: ready
- Risk: standard
- Created: 2026-09-18
- Updated: 2026-09-18
- Owner: AquaCo

## Context and target outcome
This plan details the implementation of a zero-authentication fixed QR seat check-in and session synchronization system for Mahjong live gatherings. The goal is enabling 1-second seat check-in via browser `localStorage` `client_id`, 3D Mahjong wind tile seat drawing in `/queue`, client reset with home redirect and `reset_{epoch}` anonymization, live seated player polling into `UmaOkaTable.tsx`, session completion upon clicking `[기록 추가 및 공유]` in `/scan_score_test` with timing metrics (`started_at`, `finished_at`, `duration_seconds`) persisted into `mahjong.db`, and post-launch cleanup guarantees.

## Repository state and constraints
- Frontend: React 18 SPA with TypeScript in `src/`.
- Scorekeeper: `/scan_score_test` renders `ScorePhotoInputPage.tsx` with `isTestMode={true}` and contains `UmaOkaTable.tsx`.
- Backend: Lightweight Node.js Express server to be located in `server/` with `better-sqlite3` in WAL mode (`journal_mode = WAL`).
- Memory limit: Under 150MB RSS on EC2 `t3.micro`.
- Test commands: Jest with `--watchAll=false --forceExit`.

## Change map
- `[NEW]` `src/utils/clientId.ts`: Client UUID lazy generation and `localStorage` persistence.
- `[NEW]` `src/utils/clientId.test.ts`: Unit test for client ID initialization and retrieval.
- `[NEW]` `src/components/SeatCheckinPage.tsx`: Seat QR scan check-in page (`/seat`) with device reset button.
- `[NEW]` `src/components/SeatCheckinPage.test.tsx`: Component tests for seat check-in and reset flow.
- `[NEW]` `src/components/QueuePage.tsx`: Standby queue view page (`/queue`) with 4-player 3D Mahjong wind tile seat draw.
- `[NEW]` `src/components/QueuePage.test.tsx`: Component tests for queue operations and seat drawing.
- `server/package.json`: Server package manifest for express and better-sqlite3.
- `server/db.js`: SQLite schema initialization including `started_at` and `duration_seconds`.
- `server/db.test.js`: Database integration tests.
- `server/index.js`: Express REST API endpoints including reset, queue draw, and session timing.
- `server/index.test.js`: API endpoint tests using supertest.
- `src/App.tsx`: Register `/seat` and `/queue` routes.
- `src/components/ScorePhotoInputPage.tsx`: Add 2-second polling hook for seated players and session finish hook on `[기록 추가 및 공유]`.
- `scripts/setup-backend-service.sh`: Deployment script for systemd and Apache reverse proxy.
- `scripts/cleanup-test-artifacts.sh`: Safe post-launch cleanup script.

## Dependency graph and parallelization
- Lane A (Frontend ID & Pages): TASK-001 -> TASK-004, TASK-005
- Lane B (Backend Service): TASK-002 -> TASK-003
- Lane C (Integration & Scorekeeper Sync): TASK-006 -> TASK-007
- Lane D (Infrastructure & Operations): TASK-008, TASK-009 -> TASK-010

## Tasks
- TASK-001 (Status: done, REQ: REQ-001, AC: AC-001): Implement `src/utils/clientId.ts` with lazy generation and `src/utils/clientId.test.ts`.
- TASK-002 (Status: done, REQ: REQ-008, AC: AC-008): Create `server/db.js` with WAL mode, `started_at`, and `duration_seconds` schema.
- TASK-003 (Status: done, REQ: REQ-002, REQ-003, REQ-004, REQ-006, REQ-007, REQ-011, AC: AC-002, AC-003, AC-004, AC-005, AC-007, AC-011, AC-012, AC-013): Implement `server/index.js` including `/api/client/reset` and seat draw.
- TASK-004 (Status: done, REQ: REQ-002, REQ-003, REQ-011, AC: AC-002, AC-003, AC-011): Create `src/components/SeatCheckinPage.tsx` with reset action redirecting to `/`.
- TASK-005 (Status: done, REQ: REQ-004, AC: AC-004, AC-012): Create `src/components/QueuePage.tsx` with 4-player 3D Mahjong wind tile seat draw.
- TASK-006 (Status: done, REQ: REQ-005, REQ-006, AC: AC-005, AC-006): Integrate 2-second polling in `src/components/ScorePhotoInputPage.tsx` to auto-fill `UmaOkaTable.tsx`.
- TASK-007 (Status: done, REQ: REQ-007, AC: AC-007, AC-013): Bind `[기록 추가 및 공유]` in `src/components/ScorePhotoInputPage.tsx` to `/api/sessions/:id/finish` recording `duration_seconds`.
- TASK-008 (Status: done, REQ: REQ-009, AC: AC-009): Create `scripts/setup-backend-service.sh` for Apache `/api` proxy and systemd setup.
- TASK-009 (Status: done, REQ: REQ-010, AC: AC-010): Create `scripts/cleanup-test-artifacts.sh` for post-test cleanup.
- TASK-010 (Status: done, REQ: REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-010, REQ-011, AC: AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013): End-to-end verification, quality gate execution, and evidence recording.

## TDD sequence
1. `npm test -- --watchAll=false --forceExit src/utils/clientId.test.ts`
2. `node --test server/db.test.js`
3. `node --test server/index.test.js`
4. `npm test -- --watchAll=false --forceExit src/components/SeatCheckinPage.test.tsx`
5. `npm test -- --watchAll=false --forceExit src/components/QueuePage.test.tsx`
6. `npm test -- --watchAll=false --forceExit src/components/ScorePhotoInputPage.test.tsx`

## End-to-end scenarios
- Scenario 1: New player visits `/seat?table=1&seat=east`, enters nickname `마작왕`, checks in, and sees seat confirmation.
- Scenario 2: Returning player visits `/seat?table=1&seat=south`, clicks `[⚡ 마작왕(으)로 착석]`, and checks in within 1 second.
- Scenario 3: 4 players gather on `/queue`, click digital seat draw, and receive designated East, South, West, and North seats with 3D Mahjong wind tile UI.
- Scenario 4: 4 players scan seats, `started_at` is marked, status becomes `active`, and `UmaOkaTable.tsx` on `/scan_score_test` displays 4 players automatically.
- Scenario 5: Scorekeeper verifies OCR scores on `/scan_score_test`, clicks `[기록 추가 및 공유]`, session status becomes `finished`, row saved to `mahjong.db` with `duration_seconds`, and Table 1 resets.
- Scenario 6: Player clicks `[기기 등록 정보 초기화]`, `localStorage` is cleared, redirected to `/`, and nickname is anonymized to `reset_{epoch}` on server.

## Quality gates
- Quality Gate 1: TypeScript compilation check via `npx tsc --noEmit`
- Quality Gate 2: React frontend tests via `npm test -- --watchAll=false --forceExit`
- Quality Gate 3: Node.js backend tests via `npm --prefix server test`
- Quality Gate 4: Production frontend build via `npm run build`
- Quality Gate 5: Artifact chain synchronization via `scripts/validate-artifact-chain.ps1 -ArtifactDirectory docs/ai/mvp2-fixed-qr-session`

## Risks, migration, and rollback
- Risk: Memory exhaustion on `t3.micro`. Mitigation: Node.js capped at 150MB RSS and SQLite WAL mode eliminates table locks.
- Risk: Network failure during game. Mitigation: `/scan_score_test` gracefully handles API disconnects and keeps local scoring functional.
- Rollback: Revert `src/` changes via Git and stop `mahjong-api.service`; existing static site operation remains fully intact.

## Completion proof
- Successful execution of all tests in `TDD sequence`.
- Passing results for all Quality Gates 1 through 5.
- Verified database rows in `mahjong.db` with valid `started_at` and `duration_seconds`.

## Progress log
- 2026-09-18: Phase 1 planning initiated and artifact chain drafted.
- 2026-09-18: Revision 2 incorporated client reset, digital seat draw, and game timing.
- 2026-09-18: Revision 3 updated 4-player seat draw to 3D Mahjong wind tile design.
