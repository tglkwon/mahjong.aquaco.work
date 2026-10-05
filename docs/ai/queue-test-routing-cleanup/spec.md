# Specification

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

## Requirements

### REQ-UNIFY-ROUTE-001: Unified Score Input Route (`/scan_score`)
- **Description**: The application MUST provide a single consolidated route for all score scanning and input operations.
- **Criteria**:
  - `/scan_score` is the primary route for both production users and field testers.
  - `/scan_score_test` and `/test_scan` MUST redirect to `/scan_score` with complete search query (`location.search`) and hash fragment (`location.hash`) preserved.
  - All internal links (Sidebar, Header, Queue completion, Seat checkin completion) MUST target `/scan_score`.

### REQ-TEST-SERVER-DETECT-001: Conditional Data Transfer Based on Server Reachability
- **Description**: Scoreboard snapshots and camera recognition frames MUST ONLY be transmitted to PC when an active mobile-drop receiver server is verified online.
- **Criteria**:
  - `PhotoUploadPanel` extracts `dropUrl`, `dropPin`, and `device` from query params or `localStorage`.
  - When credentials exist, `PhotoUploadPanel` runs a lightweight, non-blocking health check (`checkDropStatus`) against `${cleanServerUrl(serverUrl)}/status` on mount and on connection retry.
  - If the test server responds with `ok: true`, test mode is confirmed:
    - Display connection indicator (`🟢 PC 전송 활성`).
    - Enable PC auto-upload (`Auto-drop`) for recognized score frames and manual photo selections.
    - Provide test helper controls (such as 100,000-point fill button).
  - If the test server is offline, unreachable, or unconfigured:
    - Data transfer is completely bypassed (`idle`/dormant).
    - No background network errors or failed uploads occur for regular parlor players.

### REQ-QUEUE-PARAM-FORWARD-001: Queue and Seat Parameter Preservation
- **Description**: When navigating between `/queue`, `/seat`, and `/scan_score`, any active test parameters (`dropUrl`, `dropPin`, `device`) MUST be preserved.
- **Criteria**:
  - `QueuePage` and `SeatCheckinPage` inspect `window.location.search` and `sessionStorage`.
  - Navigation links to `/scan_score` include available test query parameters.
  - Seat draw state (`state: { drawnSeats: drawResult }`) is forwarded to `/scan_score` for 0ms player name hydration.

### REQ-QUEUE-SEAT-EXCLUSION-001: Smart Session Lifecycle on Seat Draw
- **Description**: `POST /api/queue/draw-seats` MUST NOT trap new waiting players in a stale, pre-existing session.
- **Criteria**:
  - When Table 1 already has 4 seats in its current session:
    - If the top 4 waiting players match the current session's seated players, return the existing draw idempotently (`isExisting: true`).
    - If the top 4 waiting players contain NEW players (or `force_new: true` is requested), the server MUST archive/finish the stale session, create a new active session for Table 1, shuffle the 4 waiting players into seats, and transition them to `status = 'playing'`.

### REQ-QUEUE-SEAT-EXCLUSION-002: Dual-Key Atomic Queue Exclusion
- **Description**: Players seated via draw or direct check-in MUST be reliably excluded from the waiting list.
- **Criteria**:
  - When updating `queue` status to `'playing'`, the query MUST match either `client_id = ?` OR `nickname = ?`.
  - Both `POST /api/queue/draw-seats` and `POST /api/seat/join` MUST use this dual-key update.
  - Seated players will not appear in `GET /api/queue` (which selects `WHERE status = 'waiting'`).

### REQ-QUEUE-CLIENT-SYNC-001: Immediate Client State Refresh on Draw
- **Description**: In `QueuePage.tsx`, receiving a draw result (either from the draw trigger response or the polling interval) MUST immediately refresh user status.
- **Criteria**:
  - Sets `isEnqueued` to `false` for any player present in `drawResult`.
  - Triggers an immediate `fetchQueue()` call so the waiting list updates without waiting for the next 3-second polling tick.

## Acceptance Criteria
- `AC-001`: Direct access or redirect to `/scan_score_test?dropUrl=...` forwards to `/scan_score?dropUrl=...` without query parameter loss.
- `AC-002`: On `/scan_score`, if the mobile-drop server is listening, PC transfer badge is active and photo captures upload to `research-data/`. If mobile-drop is closed, no upload occurs and normal gameplay is unaffected.
- `AC-003`: When 4 players in `/queue` trigger seat drawing, their names immediately vanish from "현재 대기 명단", and the draw tiles show their 4 names.
- `AC-004`: If Table 1 had an earlier un-finished session, drawing seats for a new set of 4 queued players creates a new table session and seats the new players.
- `AC-005`: All automated tests pass (`npm test`) and production build succeeds (`npm run build`).
