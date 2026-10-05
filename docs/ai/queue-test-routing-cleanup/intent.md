# Intent

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

## Originating request
During active on-site mobile testing, the user identified two primary defects and issued an architectural unification directive:
1. **Unify Score Input Pages & Conditional Data Transfer**:
   - Consolidate the production score page (`/scan_score`) and test score lab page (`/scan_score_test`) into a single unified route (`/scan_score`).
   - Eliminate route fragmentation and redirect all `/scan_score_test` accesses to `/scan_score` while preserving URL query parameters.
   - Automatically enable data transfer to the PC (`mobile-drop`) ONLY when the test server is open and reachable; when the test server is closed, operate in pure production mode without data transmission.
2. **Seated Players Not Excluded from Queue**:
   - When players are selected/drawn into seats from the waiting list (`/queue`), they must be reliably marked as `playing` and excluded from the waiting list.
   - If Table 1 has a stale session from prior tests, drawing seats for a new waiting group must automatically allocate a new session rather than returning stale seated players.

## Problem and evidence
1. **Route Fragmentation & Lost Test Bridge**:
   - `App.tsx` previously split `/scan_score` (`isTestMode=false`) and `/scan_score_test` (`isTestMode=true`).
   - When moving between `/queue`, `/seat`, and the score board, hardcoded links to `/scan_score` dropped query parameters (`dropUrl`, `dropPin`, `device`) and rendered `PhotoUploadPanel` without PC transfer controls.
   - Testers faced confusion over which URL to use and whether uploads were active.
2. **Stale Table Session Blocking Queue Promotion**:
   - In `server/index.js` `POST /api/queue/draw-seats`, `if (existingSeats.length === 4) return { isExisting: true };` permanently locked Table 1 once 4 seats were filled.
   - Any new queue of 4 players got back the old session's draw, and the database query updating queue status to `playing` was completely bypassed.
3. **Storage Mismatch in Queue Removal**:
   - `POST /api/seat/join` and `draw-seats` updated queue status solely by `client_id`. If browser private browsing, tab switching, or storage clearing changed the client ID, matching failed and players remained listed as waiting.

## Desired outcomes
1. **Unified Score Route (`/scan_score`)**:
   - `/scan_score` serves as the single source of truth for both live parlor gameplay and test recording.
   - Legacy and test aliases (`/scan_score_test`, `/test_scan`) redirect to `/scan_score` while preserving all search and hash parameters.
2. **Dynamic Test Server Auto-Detection**:
   - When `dropUrl` and `dropPin` are present (from URL or storage), `PhotoUploadPanel` performs a lightweight, non-blocking health check against `${cleanServerUrl(serverUrl)}/status`.
   - If the test receiver is online (`ok: true`), PC auto-transfer mode and test helpers activate automatically with a connected status indicator (`🟢 PC 전송 활성`).
   - If the test receiver is unreachable or not configured, data transfer is dormant, ensuring zero performance penalty or unexpected network errors for production users.
3. **Queue Parameter Forwarding**:
   - `/queue` and `/seat` detect test parameters and pass them along when navigating to `/scan_score?table=1&dropUrl=...&dropPin=...&device=...`.
4. **Smart Session Lifecycle & Dual-Key Queue Exclusion**:
   - In `server/index.js` `POST /api/queue/draw-seats`, compare the top 4 waiting players with existing session occupants. If they differ, automatically close the stale session, create a fresh session, seat the new players, and update queue status to `playing`.
   - Update queue status matching `WHERE client_id = ? OR nickname = ?` across both `draw-seats` and `seat/join`.
   - In `QueuePage.tsx`, clear `isEnqueued` to `false` and trigger immediate queue re-fetch upon draw completion.
