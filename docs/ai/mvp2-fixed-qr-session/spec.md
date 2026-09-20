# Specification

## Metadata and source
- Work ID: mvp2-fixed-qr-session
- Artifact revision: 4
- Language: en
- Korean mirror: spec.ko.md
- Source: intent.md revision 4
- Status: ready
- Risk: standard
- Created: 2026-09-18
- Updated: 2026-09-18
- Owner: AquaCo

## Summary
This specification defines the lightweight session synchronization system for Mahjong gatherings. The system enables zero-auth player check-in via fixed table seat QR codes, online queue management with 3D Mahjong wind tile seat drawing, automated scorekeeper player assignment in `UmaOkaTable.tsx`, accurate game timing (`started_at`, `finished_at`, `duration_seconds`), client reset with `reset_{epoch}` anonymization, and session termination on score confirmation in `/scan_score_test` with persistence into SQLite (`mahjong.db`).

## Functional requirements
- `REQ-001` (must): Lazy Browser Identity - The client generates and persists a UUID `client_id` in browser `localStorage` only upon the first explicit registration or seat check-in action.
- `REQ-002` (must): Fixed Seat QR Check-in - Accessing `/seat?table=1&seat=east|south|west|north` provides 1-click check-in with `[⚡ 마작왕(으)로 착석]` if nickname exists, or a nickname input form on first visit.
- `REQ-003` (must): Dynamic Nickname Synchronization - Updating a nickname re-binds the name to `client_id` and propagates across active sessions and queue lists.
- `REQ-004` (must): Online Standby Queue and Digital Seat Draw - `/queue` displays FIFO waiting players and table status, offers 3D Mahjong wind tile seat drawing for 4 waiting players assigning East, South, West, and North, and transitions players from `waiting` to `playing` upon seat check-in.
- `REQ-005` (must): Real-time Seat Polling in Scorekeeper - `ScorePhotoInputPage.tsx` polls `/api/tables/1/status` every 2 seconds to auto-populate `UmaOkaTable.tsx` East, South, West, and North participants.
- `REQ-006` (must): Session Promotion and Start Timing - When 4 seats are occupied, the session transitions from `waiting_players` to `active` and records the start timestamp `started_at`.
- `REQ-007` (must): Score Submission, Duration Calculation, and Finalization - Submitting scores via `[기록 추가 및 공유]` calls `/api/sessions/:id/finish`, saves the match record including `started_at`, `finished_at`, and `duration_seconds` into `mahjong.db`, sets session status to `finished`, and resets the table.
- `REQ-008` (must): Lightweight Backend Service - Express server with `better-sqlite3` in WAL mode (`journal_mode = WAL`) runs in `server/` with RAM usage below 150MB.
- `REQ-009` (must): Apache Reverse Proxy - Apache forwards `/api` requests to the local Express server on `http://127.0.0.1:3001/api` while legacy files are isolated in `_legacy_backup_2026/`.
- `REQ-010` (should): Post-launch Cleanup Script - A cleanup script `cleanup-test-artifacts.sh` removes temporary debug code and dummy test databases while preserving `mahjong.db`.
- `REQ-011` (must): Client Reset and Deregistration - Clicking `[기기 등록 정보 초기화]` calls `POST /api/client/reset`, clears `localStorage`, redirects to `/`, vacates active seats, sets queue status to `canceled`, and anonymizes the server nickname to `reset_{epoch}` without creating orphan records.

## Non-functional requirements
- Memory consumption of the Node.js backend must not exceed 150MB on EC2 `t3.micro`.
- Database operations must use `better-sqlite3` WAL mode with busy timeout for concurrency without locks.
- Polling latency must remain under 200ms per request.
- Client UI must work seamlessly on mobile browsers (Safari, Chrome) without requiring app installation or login.

## User experience and flows
1. Player arrives at table, views `/queue` for digital seat drawing or draws physical seat (e.g. East), and scans the fixed QR code pointing to `/seat?table=1&seat=east`.
2. If first visit, player enters nickname and clicks check-in, which lazily generates `client_id`. If returning, player clicks `[⚡ 마작왕(으)로 착석]`.
3. Standby players open `/queue`, enter nickname to join waitlist, and trigger 4-player seat draw when ready.
4. When all 4 players scan in, `started_at` is marked, the session becomes `active`, and the scorekeeper on `/scan_score_test` sees the 4 names automatically appear in `UmaOkaTable.tsx`.
5. At the end of the round, the scorekeeper scans scores with camera OCR or manual adjustments.
6. Scorekeeper clicks `[기록 추가 및 공유]`. The round duration is computed (`duration_seconds`), stored in `mahjong.db`, the session completes (`finished`), and Table 1 resets for the next round.
7. If a player wishes to clear their device, clicking `[기기 등록 정보 초기화]` prompts for confirmation, clears storage, anonymizes the server record to `reset_{epoch}`, vacates any held seat, and redirects to home (`/`).

## Architecture and interfaces
- Frontend routes:
  - `/seat`: `src/components/SeatCheckinPage.tsx`
  - `/queue`: `src/components/QueuePage.tsx`
  - `/scan_score_test`: `src/components/ScorePhotoInputPage.tsx`
- Backend API (`server/index.js`):
  - `POST /api/client/register` (`{ client_id, nickname }`)
  - `GET /api/client/:client_id`
  - `POST /api/client/reset` (`{ client_id }`)
  - `GET /api/tables/:table_id/status`
  - `POST /api/seat/join` (`{ table_id, seat, client_id, nickname }`)
  - `GET /api/queue`
  - `POST /api/queue/join` (`{ client_id, nickname }`)
  - `POST /api/queue/leave` (`{ client_id }`)
  - `POST /api/queue/draw-seats` (`{ table_id }`)
  - `POST /api/sessions/:session_id/finish` (`{ table_id, scores, participants, raw_payload }`)
  - `POST /api/admin/reset` (`{ table_id }`)

## Data and migrations
- Database: `server/data/mahjong.db`
- Tables:
  - `clients`: `client_id` (TEXT PK), `nickname` (TEXT), `created_at` (TEXT), `updated_at` (TEXT)
  - `queue`: `client_id` (TEXT PK), `status` (TEXT), `enqueued_at` (TEXT), `updated_at` (TEXT)
  - `tables`: `table_id` (INTEGER PK), `name` (TEXT), `current_session_id` (INTEGER)
  - `sessions`: `session_id` (INTEGER PK AUTOINCREMENT), `table_id` (INTEGER), `session_number` (INTEGER), `status` (TEXT), `created_at` (TEXT), `started_at` (TEXT), `finished_at` (TEXT)
  - `session_seats`: `session_id` (INTEGER), `seat` (TEXT), `client_id` (TEXT), `joined_at` (TEXT), PK(`session_id`, `seat`)
  - `game_records`: `record_id` (INTEGER PK AUTOINCREMENT), `session_id` (INTEGER), `table_id` (INTEGER), `east_client_id` (TEXT), `east_score` (INTEGER), `south_client_id` (TEXT), `south_score` (INTEGER), `west_client_id` (TEXT), `west_score` (INTEGER), `north_client_id` (TEXT), `north_score` (INTEGER), `started_at` (TEXT), `finished_at` (TEXT), `duration_seconds` (INTEGER), `recorded_at` (TEXT), `raw_payload` (TEXT)

## Failure modes and edge cases
- Network disconnection: `/scan_score_test` retains local state and allows manual entry even if backend polling fails.
- Duplicate seat scan: If a player scans an already occupied seat, UI prompts for seat takeover confirmation or error message.
- Seat hopping: If a player scans a different seat at the same table, their previous seat reservation is vacated.
- Mid-game reset: If a seated player resets, their seat is vacated while past round records remain intact with `reset_{epoch}`.

## Security, privacy, and permissions
- Zero-Auth model: No passwords, emails, or personal data stored.
- Device reset fully anonymizes nickname to `reset_{epoch}` for unlinked auditability.
- CORS restricted to local origin or designated domain `mahjong.aquaco.work`.
- SQLite parameterized queries prevent SQL injection.
- Rate limit headers and User-Agent defense remain active at Apache level.

## Observability and operations
- Express morgan/custom logger outputs minimal timestamped JSON logs.
- Status healthcheck at `GET /api/health`.
- Service managed by systemd unit `mahjong-api.service`.

## Test strategy
- Unit and integration tests for backend endpoints using supertest.
- Component tests for `SeatCheckinPage.tsx` and `QueuePage.tsx`.
- Integration test for `ScorePhotoInputPage.tsx` session polling and finish trigger with timing calculation.
- Performance check ensuring memory usage on `t3.micro` stays under 150MB.

## Acceptance criteria
- `AC-001`: Generating and saving `client_id` in `localStorage` occurs lazily upon first submit and persists across reloads.
- `AC-002`: Visiting `/seat?table=1&seat=east` displays 1-click check-in button `[⚡ 마작왕(으)로 착석]`.
- `AC-003`: Nickname modification updates existing client record without changing `client_id`.
- `AC-004`: Queue displays FIFO order and seated players change status from `waiting` to `playing`.
- `AC-005`: All 4 seats claimed transitions session to `active` and records `started_at`.
- `AC-006`: `UmaOkaTable.tsx` automatically displays the 4 player nicknames within 2 seconds.
- `AC-007`: Clicking `[기록 추가 및 공유]` writes game record with `duration_seconds` into `mahjong.db` and resets Table 1.
- `AC-008`: Backend runs with `better-sqlite3` in WAL mode using less than 150MB RSS memory.
- `AC-009`: Apache reverse proxy correctly routes `/api/*` to Node.js backend.
- `AC-010`: Executing `cleanup-test-artifacts.sh` cleans test files while preserving `mahjong.db`.
- `AC-011`: Clicking `[기기 등록 정보 초기화]` clears `localStorage`, calls `POST /api/client/reset`, redirects to `/`, vacates active seats, and updates nickname to `reset_{epoch}`.
- `AC-012`: `/queue` provides a 4-player seat draw feature allocating East, South, West, and North rendered with 3D Mahjong wind tile UI.
- `AC-013`: Finished game records contain valid `started_at`, `finished_at`, and `duration_seconds` values.

## Traceability
- Desired Outcome 1 (1-second check-in): `REQ-001`, `REQ-002`, `AC-001`, `AC-002`
- Desired Outcome 2 (Nickname sync): `REQ-003`, `AC-003`
- Desired Outcome 3 (Device reset): `REQ-011`, `AC-011`
- Desired Outcome 4 (Waiting queue & seat draw): `REQ-004`, `AC-004`, `AC-012`
- Desired Outcome 5 (Game start timing): `REQ-006`, `AC-005`
- Desired Outcome 6 (Auto-fill scorekeeper): `REQ-005`, `AC-006`
- Desired Outcome 7 (Score submission & duration): `REQ-007`, `AC-007`, `AC-013`
- Desired Outcome 8 (Lightweight EC2 infra): `REQ-008`, `REQ-009`, `AC-008`, `AC-009`
- Desired Outcome 9 (Post-launch cleanup): `REQ-010`, `AC-010`

## Open decisions
- Not applicable: All architectural and operational decisions were confirmed by the user.
