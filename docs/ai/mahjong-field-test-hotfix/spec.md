# Specification

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

## Requirements and Acceptance Criteria

### REQ-SYNC-001: Atomic Seat Draw & Backend Persistence
The seat drawing operation must be atomic, idempotent, and persist seating claims directly into the target table's active session.

- **AC-SYNC-001.1**: When `POST /api/queue/draw-seats` is invoked with `{ table_id: 1 }`:
  - Exactly 4 waiting players from the queue are selected (FIFO by `enqueued_at`).
  - An active session is retrieved or created for Table 1.
  - The 4 players are mapped to seats (`east`, `south`, `west`, `north`).
  - Seats are recorded into `session_seats` (`INSERT OR REPLACE INTO session_seats (session_id, seat, client_id, joined_at)`).
  - The session status is updated to `'active'`, and `started_at` is set to the current ISO timestamp.
  - The 4 players' status in `queue` is updated from `'waiting'` to `'playing'`.
- **AC-SYNC-001.2**: Idempotency & Concurrency:
  - If a draw has already been executed for the current active session of Table 1 within a recent window (or if all 4 seats are already occupied in `active` state), subsequent calls to `POST /api/queue/draw-seats` must return the existing seating arrangement without generating a new random permutation.
- **AC-SYNC-001.3**: The response payload must return:
  `{ success: true, table_id: 1, session_id: number, draw: TileDrawResult[], drawn_at: string }`.

### REQ-SYNC-002: Real-time Queue Polling & Simultaneous Transition
All connected clients on the queue page must synchronize to the same seat drawing outcome without requiring manual page reloads.

- **AC-SYNC-002.1**: The endpoint `GET /api/queue` must include a `latest_draw` field:
  - If Table 1 has an active draw session involving recent participants, return `{ table_id: 1, session_id: number, draw: TileDrawResult[], drawn_at: string }`.
  - If no active draw exists or after a session is finished, `latest_draw` returns `null`.
- **AC-SYNC-002.2**: In `QueuePage.tsx`, on every poll cycle (every 3 seconds):
  - If `latest_draw` is present in the response and contains the current client's `client_id` (or if 4 players are drawn and queue has transitioned):
    - `drawResult` state is automatically populated with `latest_draw.draw`.
    - The seat draw 3D tile view renders automatically for all 4 players simultaneously.
- **AC-SYNC-002.3**: Once a seat draw is executed or when fewer than 4 players are waiting, the `[자리 추첨]` button is disabled/hidden to prevent race conditions.

### REQ-PROP-001: Production Score Page Nickname Propagation & Real-time Sync
Player nicknames from the drawn seats must propagate seamlessly to the score tracker in production (`/scan_score`).

- **AC-PROP-001.1**: Fast Hydration:
  - When the user taps `[📊 자리 배정 완료 후 점수 입력/인식 페이지로 이동 ➔]` in `QueuePage.tsx`, navigation routes to `/scan_score?table=1` with `state: { drawnSeats: drawResult }`.
  - `ScoreScanPage.tsx` checks `location.state?.drawnSeats` or query parameters on mount to immediately hydrate `playerPool` with `[East, South, West, North]` nicknames (0ms latency).
- **AC-PROP-001.2**: Production Polling Unblocking:
  - In `ScoreScanPage.tsx`, the `pollTableStatus` hook must execute for both production mode (`/scan_score`) and test mode (`effectiveTestMode`). The guard `if (!effectiveTestMode) return;` is removed from table polling.
  - Development-only utilities (PC mobile-drop panel, test score button) remain guarded by `effectiveTestMode`.
- **AC-PROP-001.3**: Session Finish Unblocking:
  - In `ScoreScanPage.tsx`, `handleRecordButtonPress` must execute `POST /api/sessions/:session_id/finish` in production mode whenever an `activeSessionId` is present, properly recording game duration and resetting the table session for the next match.
- **AC-PROP-001.4**: UI Table Indicator:
  - The live table seat indicator (East, South, West, North nicknames) renders cleanly on `/scan_score` so table-side players can visually confirm active seating.

### REQ-VERIFY-001: Optimistic Scoring & Cross-Device Telemetry Consensus
The score recording flow must support zero-latency optimistic display while collecting multi-device OCR readings and auto-correcting to higher-confidence data.

- **AC-VERIFY-001.1**: Backend Submissions Storage:
  - Create table `session_score_submissions` (`submission_id`, `session_id`, `client_id`, `seat`, `device_name`, `scores`, `confidence`, `submitted_at`, `is_canonical`).
  - Endpoint `POST /api/sessions/:session_id/submit-score` saves each player's recognized score along with their client ID, device model (parsed from User-Agent), and calculated confidence.
- **AC-VERIFY-001.2**: Optimistic Canonical Binding & Auto-Correction:
  - The first valid submission is immediately marked `is_canonical = 1` and broadcast as the table's current draft scores.
  - If a subsequent submission arrives with a significantly higher confidence (delta >= 0.10) or forms a majority match across multiple devices, the canonical score is updated to the higher-confidence candidate.
- **AC-VERIFY-001.3**: Multi-Device Status in Table Polling:
  - `GET /api/tables/:table_id/status` returns `submissions_count`, `canonical_score`, `verified_devices` count, and consensus state.
- **AC-VERIFY-001.4**: Frontend Verification Badge:
  - `ScoreScanPage.tsx` shows a live verification badge ("📱 뽀삐 1차 인식 (82%) ➔ 🟢 2개 기종 검증 일치 (96%)") so players have complete visibility.

### REQ-OCR-001: 7-Segment Digit '0' vs '8' Flare Suppression & Domain Solver
The optical recognition engine must distinguish digit '0' from '8' reliably across diverse smartphone cameras under intense LED glare and automatic ISP sharpening.

- **AC-OCR-001.1**: Relative Contrast Middle-Bar Probe:
  - In `src/utils/scoreRecognition.ts`, probe zone for Segment G (middle horizontal bar, index 3) must evaluate relative pixel intensity/density against the illuminated boundary segments (top, bottom, and vertical segments) rather than relying solely on a fixed absolute threshold (`0.40`).
  - Calculate dynamic confidence score (0.0 to 1.0) based on segment contrast clarity.
- **AC-OCR-001.2**: Japanese Parlor Domain Quantization & 100k/120k Point Sum Backtracking:
  - In standard Japanese Riichi Mahjong, individual scores end in 00 (in 100-pt units, e.g., 250 = 25,000 pts).
  - In `src/utils/scoreDraft.ts`:
    - If a reading initially fails the target sum (100,000 or 120,000) and contains ambiguous 0/8 digits with marginal center-bar confidence, the solver performs single-digit hypothesis testing (backtracking) to check if resolving an ambiguous '8' to '0' produces an exact sum match.
- **AC-OCR-001.3**: High Consensus Stability:
  - The camera consensus tracker (`scoreStabilityTracker`) consistently reaches 3/3 consensus on video frames without flickering between 0 and 8.
