# Specification

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

## Requirements and Acceptance Criteria

### REQ-DRAW-001: Strict DB-Level Atomic Seat Draw & Idempotency
Seat drawing operations must be atomic, serialized, and strictly idempotent. Subsequent calls must never reshuffle or produce diverging seating orders.

- **AC-DRAW-001.1**: When `POST /api/queue/draw-seats` is invoked for Table 1:
  - Check if the active session already has 4 seats assigned in `session_seats`.
  - If 4 seats are already occupied, immediately return the existing draw mapping without executing a new shuffle.
  - Return `{ success: true, table_id: 1, session_id: number, draw: TileDrawResult[], drawn_at: string, idempotent: true }`.
- **AC-DRAW-001.2**: Atomicity:
  - If a draw has not yet occurred, select 4 waiting players FIFO by `enqueued_at`.
  - Perform shuffle and execute seat assignment, queue status update to `'playing'`, and session activation (`status = 'active'`) in a single atomic SQLite transaction.
- **AC-DRAW-001.3**: Deterministic Seat Structure:
  - Seat assignment must strictly map to `[east, south, west, north]` with wind tiles `[東, 南, 西, 北]` and corresponding client IDs and nicknames.

### REQ-DRAW-002: DB-Backed Reliable `latest_draw` Delivery in Queue Polling
All queue clients must reliably receive the current table draw from DB state without depending on volatile memory variables.

- **AC-DRAW-002.1**: `GET /api/queue` queries `session_seats` and `clients` for Table 1's active session.
  - If 4 seats are occupied, return `{ count: number, queue: QueueItem[], latest_draw: { table_id: 1, session_id: number, draw: TileDrawResult[], drawn_at: string } }`.
  - If no active 4-player session exists, return `latest_draw: null`.
- **AC-DRAW-002.2**: Cache fallback resilience:
  - Even if the Node process restarts or the in-memory cache is empty, `getLatestDrawForTable(1)` queries the persistent DB tables to reconstruct the active draw seamlessly.

### REQ-DRAW-003: React Reactive State & Universal Simultaneous Transition (`QueuePage.tsx`)
All client devices on `/queue` must automatically and synchronously transition to the 3D drawn wind tile view within 1 polling cycle (<= 3 seconds).

- **AC-DRAW-003.1**: Reactive Client ID:
  - `currentClientId` is managed as React `useState` initialized from `getClientId()` and synchronized whenever `ensureClientId()` or nickname registration runs.
- **AC-DRAW-003.2**: Guaranteed Simultaneous Transition:
  - In `fetchQueue`, if `data.latest_draw` contains 4 seats and the user is either currently enqueued (`isEnqueued === true`), is in the drawn participant list, or `drawResult` is not yet set, `setDrawResult` is called immediately.
- **AC-DRAW-003.3**: Single-Initiator Button Guard:
  - When 4 or more players are waiting in queue (`queue.length >= 4`):
    - Only the first player in line (`queue[0].client_id === currentClientId`) sees the clickable `[🀄 4인 자리 추첨 (바람패 타일 뽑기)]` button.
    - Other waiting players (#2, #3, #4) see a waiting indicator banner: `⏳ 1번 대기자(${queue[0].nickname})가 자리 추첨을 진행합니다`.
    - Clicking the button disables it immediately and displays `추첨 진행 중...`.

### REQ-OPS-001: Zero-Downtime Backend Process Recycling
Field testing with mobile clients must not be interrupted by tunnel disconnection or React dev server termination.

- **AC-OPS-001.1**: The backend update procedure must isolate the Node.js API server (port 3001) for graceful restart, keeping port 3000 (React Webpack) and the Cloudflare tunnel (`cloudflared`) uninterrupted.
- **AC-OPS-001.2**: After port 3001 restart, mobile clients retain their existing session and URL without re-scanning QR codes.
