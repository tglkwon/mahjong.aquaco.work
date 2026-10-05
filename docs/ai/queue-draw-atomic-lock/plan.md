# Implementation Plan

## Metadata
- Work ID: queue-draw-atomic-lock
- Artifact mode: canonical
- Artifact revision: 1
- Language: en
- Status: draft
- Risk: standard
- Created: 2026-09-24
- Updated: 2026-09-24
- Owner: agent

## Tasks

- [ ] `TASK-BACK-001`: Strengthen DB-level atomic idempotency in `server/index.js` for `POST /api/queue/draw-seats` and `GET /api/queue`.
- [ ] `TASK-BACK-002`: Add automated unit tests in `server/index.test.js` verifying parallel/subsequent `draw-seats` calls return the exact identical seat assignments.
- [ ] `TASK-FRONT-001`: Refactor `QueuePage.tsx` with reactive `currentClientId` state, single-initiator draw button guard, and universal simultaneous transition.
- [ ] `TASK-FRONT-002`: Update and expand `src/components/QueuePage.test.tsx` to verify host vs non-host button state and polling transition.
- [ ] `TASK-OPS-001`: Script or execute graceful recycle of port 3001 (`node server/index.js`) while preserving port 3000 and Cloudflare tunnel.
- [ ] `TASK-VERIFY-001`: Run full backend test suite (`node --test`), frontend test suite (`npm test`), TypeScript verification (`npx tsc --noEmit`), and production build (`npm run build`).

## TDD Sequence
1. Write failing test in `server/index.test.js` simulating concurrent / consecutive `POST /api/queue/draw-seats` requests and asserting identical wind assignments.
2. Implement backend fix in `server/index.js` until test passes.
3. Write failing test in `src/components/QueuePage.test.tsx` verifying single-initiator UI guard and universal draw transition.
4. Implement frontend changes in `src/components/QueuePage.tsx` until all tests pass.
5. Execute end-to-end verification and compile bundle.

## Quality Gates
- `GATE-BACKEND-TEST`: `node --test index.test.js` passes with 0 failures in `server/`.
- `GATE-FRONTEND-TEST`: `npm test -- QueuePage.test.tsx --watchAll=false --forceExit` passes.
- `GATE-TSC`: `npx tsc --noEmit` exits with code 0.
- `GATE-BUILD`: `npm run build` generates production bundle without error.
- `GATE-REACT-ALL`: Full React test suite passes (`npm test -- --watchAll=false --forceExit`).

## Execution Lanes & Model Routing
- Lane: Backend & Frontend Core Logic
- Required Model: High-reasoning (Gemini 3.8 Flash High / inherit)
- Permissions: Local file read/write, run test commands within workspace.
