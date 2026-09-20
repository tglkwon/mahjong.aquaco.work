# Intent

## Metadata
- Work ID: mvp2-fixed-qr-session
- Artifact revision: 4
- Language: en
- Korean mirror: intent.ko.md
- Status: ready
- Risk: standard
- Created: 2026-09-18
- Updated: 2026-09-18
- Owner: AquaCo

## Originating request
The user requested an upgraded lightweight session synchronization system for an upcoming Friday Mahjong gathering (casual gathering with acquaintances) to test live play with:
1. Zero-authentication (no signup/login) seat check-in using lazy browser `client_id` in `localStorage` generated on first explicit registration/check-in action, enabling 1-second 1-click check-in after initial registration with button `[⚡ 마작왕(으)로 착석]`.
2. Clear client reset and deregistration mechanism via `[기기 등록 정보 초기화]` redirecting to home (`/`), releasing active seats, setting queue to `canceled`, and anonymizing nickname to `reset_{epoch}` in SQLite (`mahjong.db`) while keeping past game integrity intact.
3. 4 fixed physical seat QR codes per table (East, South, West, North) where players redraw seats each hanchan and scan their drawn seat's QR, auto-activating the session to `active` once all 4 seats are scanned.
4. Online waiting queue (`/queue`) where non-seated players register by nickname, view queue order and current table status, manage 4 waiting players with digital seat drawing styled as physical Mahjong wind tiles (East, South, West, North), and transition from `waiting` to `playing` upon seat check-in.
5. Accurate game timing capturing session start (`started_at`) upon 4th player check-in, finish time (`finished_at`), and net gameplay duration (`duration_seconds`).
6. Auto-filling the scorekeeper's recorder table (`UmaOkaTable.tsx`) by polling the server every 2 seconds to inject the 4 seated players into the East, South, West, North slots.
7. Score recognition test page (`/scan_score_test`, `isTestMode={true}`) integration where clicking `[기록 추가 및 공유]` after OCR verification concludes the session (`finished`), commits the game score and duration into `mahjong.db`, and automatically resets the table for the next hanchan.
8. Clean-slate EC2 infrastructure setup on `t3.micro` (RAM 1GB) using lightweight Node.js Express with `better-sqlite3` (`journal_mode = WAL`), Apache reverse proxy (`/api`), isolating any legacy leftovers into `_legacy_backup_2026/`.
9. Post-launch cleanup guarantees: safely preserve live match history in `mahjong.db`, while offering one-touch cleanup for temporary debug branches, force-reset tools, legacy backups, and dummy test databases via `cleanup-test-artifacts.sh`.

## Problem and evidence
- In physical Mahjong gatherings, manually typing player names into `UmaOkaTable.tsx` before each hanchan is tedious, prone to typos, and slows down game rotation.
- Physical tile shuffling for seat drawing is slow and prone to confusion; a digital seat draw feature in `/queue` with realistic Mahjong wind tile visuals provides an authentic and fast experience.
- Eagerly generating UUIDs on page load can re-create identities immediately after reset; lazy generation on submit ensures clean resets.
- Without dedicated `started_at` timestamps, session elapsed time incorrectly includes pre-game wait time, obscuring true round length.
- Requiring accounts or logins causes friction and delays when casual guests gather to play.
- Scoring is already verified and tested via `/scan_score_test`; binding its submission action directly to backend session finalization cleanly completes the round lifecycle without additional operator overhead.
- EC2 `t3.micro` has strict RAM limits (1GB); heavy frameworks or databases risk out-of-memory or CPU credit depletion. A minimal Node.js Express + `better-sqlite3` setup fits within budget and memory limits.

## Desired outcomes
- Players scan a seat QR code and can check in within 1 second using their previously saved nickname.
- Nickname changes update the persistent `client_id`, propagating cleanly to active and past records.
- Resetting device data removes local storage, redirects to home (`/`), frees active seats, and anonymizes server nickname to `reset_{epoch}` without orphan records.
- Standby players can register in `/queue`, track their wait position, trigger digital seat draw for 4 queued players rendered as Mahjong tiles, and see designated seats.
- When 4 players check in, the session starts (`started_at`) and `active` status is broadcast.
- Once 4 players scan East, South, West, North, `UmaOkaTable.tsx` automatically displays their names.
- Submitting scores on `/scan_score_test` ends the active session, persists scores and `duration_seconds` into `mahjong.db`, resets the table, and readies it for the next round.
- Post-event cleanup easily removes temporary test fixtures without risking recorded match data.

## Scope
- Frontend client identification utility (`src/utils/clientId.ts`) with lazy generation.
- Seat QR check-in page (`/seat`, `src/components/SeatCheckinPage.tsx`) with reset button.
- Online queue page (`/queue`, `src/components/QueuePage.tsx`) with Mahjong tile styled 4-player digital seat draw.
- Real-time seated player polling in `ScorePhotoInputPage.tsx` and `UmaOkaTable.tsx`.
- Backend Express API with `better-sqlite3` in `server/` with `started_at` and `duration_seconds` support.
- Database schema for clients, queue, tables, sessions, seats, and game records in `mahjong.db`.
- Client reset endpoint `POST /api/client/reset` with `reset_{epoch}` anonymization.
- Session completion hook on score submission in `/scan_score_test`.
- Apache reverse proxy configuration snippet for `/api` and deployment script.
- Safe cleanup script `cleanup-test-artifacts.sh` for post-test maintenance.

## Non-goals
- User authentication, passwords, OAuth, or email verification (strict zero-auth requirement).
- Payment, tournament bracket automation, or multi-venue management.
- Modifying core Mahjong OCR recognition algorithms or Uma/Oka math logic.
- Real-time WebSockets or heavy SSE streaming (simple 2-second HTTP polling is optimal and resilient on `t3.micro`).

## Constraints and policies
- Memory footprint on EC2 `t3.micro` must remain under 150MB for the Node.js backend.
- `better-sqlite3` must operate in WAL mode (`journal_mode = WAL`) with busy timeout to handle concurrent reads/writes safely.
- Zero data loss for finalized match records in `mahjong.db`.
- Backward compatibility for existing `/scan_score_test` standalone manual operation if server is unreachable.
- No destructive git or database commands without human approval.

## Acceptance signals
- A player visiting `/seat?table=1&seat=east` enters a nickname and checks in; returning players check in via `[⚡ 마작왕(으)로 착석]`.
- Clicking `[기기 등록 정보 초기화]` clears local storage, redirects to `/`, and anonymizes server nickname to `reset_{epoch}` while freeing the seat.
- `/queue` allows queuing, lists waiting players, and provides digital seat draw rendered as Mahjong tiles for 4 players.
- When 4 players check into East, South, West, and North of Table 1, `started_at` is set, status becomes `active`, and `UmaOkaTable.tsx` on `/scan_score_test` populates their names within 2 seconds.
- Submitting scores via `[기록 추가 및 공유]` on `/scan_score_test` sends a finish request to the backend, writes the row with `duration_seconds` into `mahjong.db`, and marks the session `finished`.
- The table status immediately returns to empty/ready for the next hanchan seat draw.

## Assumptions and open questions
- Assumption: Table count is initially 1 (Table 1), with scalable schema support for additional tables if needed in the future.
- Assumption: Polling interval of 2 seconds introduces negligible load on SQLite WAL while providing near-instant UI responsiveness.
- Assumption: The recording device (phone or tablet running `/scan_score_test`) has network connectivity to the EC2 server via `/api`.

## Decisions
- Work ID: mvp2-fixed-qr-session
- Architecture: Express + `better-sqlite3` in `server/`, React frontend routes in `src/`.
- Polling strategy: Standard HTTP GET polling every 2 seconds during active check-in phases.
- Device reset policy: Clear `localStorage`, redirect to home (`/`), set server nickname to `reset_{epoch}`, and vacate active seats.
- Game timing policy: Record `started_at` on 4th player check-in and calculate `duration_seconds` on final score submission.
- Seat draw policy: Digital seat draw on `/queue` uses realistic Mahjong wind tile design and serves as assignment guidance; physical seat QR scanning remains the final source of truth.
