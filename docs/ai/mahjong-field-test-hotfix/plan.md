# Plan

## Metadata
- Work ID: mahjong-field-test-hotfix
- Artifact mode: canonical
- Artifact revision: 2
- Language: en
- Status: in_progress
- Risk: standard
- Created: 2026-09-23
- Updated: 2026-09-23
- Owner: agent

## Execution Strategy and Lanes
- **Lane 1 (Backend & Data Integrity)**: Implement atomic seat assignment, DB persistence in `session_seats`, queue status transition to `playing`, `latest_draw` delivery via `GET /api/queue`, and `session_score_submissions` table with optimistic canonical scoring & multi-device auto-correction.
- **Lane 2 (Frontend Synchronization & Nickname Flow)**: Connect `QueuePage.tsx` polling to `latest_draw` for synchronized 4-player transition; unblock `ScoreScanPage.tsx` table polling and session completion in production `/scan_score`; add router state hydration and live multi-device verification badge.
- **Lane 3 (OCR Flare Suppression & Domain Backtracking)**: Overhaul Segment G middle-bar detection in `scoreRecognition.ts` using relative contrast and compute dynamic confidence; introduce 100k/120k sum-consistent candidate backtracking in `scoreDraft.ts`.
- **Lane 4 (Verification & Quality Gates)**: Run backend API unit tests, frontend component tests, OCR image tests, TypeScript compilation, and production build.

## Tasks

### Phase 1: Planning and Approval Gate
- [x] `TASK-001`: Inspect codebase, diagnose 3 core defects, and construct 5-artifact SDLC governance chain.
- [x] `TASK-002`: Author IDE-integrated planning document (`implementation_plan.md`) with feedback request enabled.
- [x] `TASK-003`: 🛑 **Mandatory Human Approval Gate**: User granted explicit approval ("진행해줘.").

### Phase 2: Autonomous Implementation (Active Drive)
- [ ] `TASK-004`: **Backend Persistence, Atomic Draw & Multi-Device Scoring Schema** (`server/db.js`, `server/index.js`)
  - Update `server/db.js` with `session_score_submissions` table.
  - Update `POST /api/queue/draw-seats` to retrieve/create Table 1 session, insert 4 seats into `session_seats`, update `queue.status = 'playing'`, set `sessions.status = 'active'`, and cache/record `latest_draw`.
  - Add idempotency check: if current active session already has 4 seats assigned, return existing seats.
  - Update `GET /api/queue` to return `latest_draw` if active session exists.
  - Add `POST /api/sessions/:session_id/submit-score` for optimistic first-write + high-confidence auto-correction.
  - Update `GET /api/tables/:table_id/status` to return submissions and canonical draft score.
  - Update `POST /api/sessions/:session_id/finish` with atomic conditional UPDATE (`WHERE status = 'active'`) for First-Write-Wins and reset `latest_draw`.
- [ ] `TASK-005`: **Backend Unit Tests** (`server/__tests__/queue_draw.test.js`, `server/__tests__/score_submissions.test.js`)
  - Test draw-seats creates `session_seats` and transitions queue status.
  - Test idempotency: consecutive calls return identical seat distribution.
  - Test `GET /api/queue` includes `latest_draw`.
  - Test multi-device score submissions and auto-correction.
- [ ] `TASK-006`: **Frontend Queue Simultaneous Transition** (`src/components/QueuePage.tsx`)
  - Listen for `latest_draw` in polling response. If current client is in the draw, auto-populate `drawResult` without user interaction.
  - Disable or hide draw button once draw is completed or active.
  - Pass `?table=1` and `state: { drawnSeats: drawResult }` when clicking the score navigation button.
- [ ] `TASK-007`: **Frontend Production Score Page Sync & Verification Badge** (`src/components/ScoreScanPage.tsx`)
  - Extract `location.state?.drawnSeats` or query parameters on mount to immediately set `playerPool` with drawn nicknames (0ms hydration).
  - Remove `if (!effectiveTestMode) return;` guard from `pollTableStatus` so table status polls in `/scan_score`.
  - Remove `effectiveTestMode` restriction on session finish API call so game durations and records are preserved in production.
  - Display clean, compact live table seat indicator and multi-device verification badge.
  - Submit recognized scores to `POST /api/sessions/:session_id/submit-score`.
- [ ] `TASK-008`: **OCR Bloom Suppression & Relative Contrast** (`src/utils/scoreRecognition.ts`)
  - Re-engineer Segment G (middle horizontal bar) detection: calculate relative contrast ratio between the center probe and surrounding lit segments.
  - Dynamic confidence score calculation (0.00 ~ 1.00).
- [ ] `TASK-009`: **Domain Heuristic & 100k/120k Sum Backtracking** (`src/utils/scoreDraft.ts`)
  - Add hypothesis validation: when candidate score sum deviates from expected (e.g. 100,000 pts) by an ambiguous 8/0 discrepancy (difference of ±800, ±8000, etc.), test candidate swapping to resolve to the true score.
- [ ] `TASK-010`: **OCR Unit Testing & Regression Suite** (`src/utils/scoreRecognition.test.ts`, `src/utils/scoreDraft.test.ts`)
  - Unit test 0 vs 8 differentiation under simulated optical bloom.
  - Unit test sum-consistent backtracking solver.
- [ ] `TASK-011`: **Full SDLC Quality Gates & Verification**
  - Run `npm test -- --watchAll=false --forceExit`.
  - Run `npx tsc --noEmit`.
  - Run `npm run build`.
  - Update `evidence.md` with complete test output traces and set `Overall status: READY`.
  - Produce final `walkthrough.md`.

## Quality Gates
1. **Tier 1**: AST Semantic Read-only checks (`git status`, `Test-Path`).
2. **Tier 2**: Plan-bounded tests:
   - `node --test` or `npm test` for backend.
   - `npm test -- --watchAll=false --forceExit` for frontend.
   - `npx tsc --noEmit` for TypeScript safety.
   - `npm run build` for production bundle integrity.
3. **Completeness Audit**: Verify all 3 original handover defects are conclusively resolved with concrete terminal proof.
