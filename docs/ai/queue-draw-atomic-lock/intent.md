# Intent

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

## Originating request
During parlor on-site testing with 4 mobile devices on `/queue`, the users experienced critical desynchronization:
1. Each player was assigned a different seat and wind permutation.
2. Duplicate draw prevention failed when multiple users clicked the draw button.
3. Simultaneous transition to the 3D tile outcome view failed for players who did not trigger the draw.
The user requested a root cause investigation and implementation of the solution under `/gemini-autonomous-sdlc` while keeping the active test server running.

## Problem and evidence
1. **Stateless / Volatile Seat Draw & Race Condition**:
   - `POST /api/queue/draw-seats` relied heavily on in-memory `latestDrawCache`. If multiple players tapped `[자리 추첨]` in close succession, or if the backend process was not restarted after code changes, separate shuffles occurred, creating contradictory seat cards across the 4 devices.
   - `getLatestDrawForTable` failed to guarantee deterministic order when reading back from DB `session_seats`, and `GET /api/queue` did not reliably deliver the active draw if the session status checks or memory cache misaligned.
2. **Client ID State Drift in React**:
   - In `QueuePage.tsx`, `const currentClientId = getClientId();` was evaluated as a plain local variable outside React `useState`.
   - When a user registered nickname on the fly, `ensureClientId()` created a new ID in `localStorage`, but `currentClientId` remained un-synchronized in the component closure, failing `isParticipant` validation and aborting the automatic draw transition.
3. **Unrestricted Multi-Trigger UI**:
   - All 4 waiting players had an active `[자리 추첨]` button simultaneously, encouraging competing draw clicks.
4. **Runtime Process Staleness**:
   - While React Dev Server (`react-scripts`) supports hot module reloading for frontend files, Node.js backend (`server/index.js`) requires process recycling. The field test server was executing stale backend code.

## Desired outcomes
1. **DB-Backed Atomic Idempotent Draw (`server/index.js`)**:
   - `POST /api/queue/draw-seats` enforces strict DB-level serialization: if Table 1's active session already has a draw or 4 claimed seats, subsequent requests return the existing draw verbatim without re-shuffling.
   - `GET /api/queue` reads `latest_draw` directly from DB state, resilient to server restarts or cache misses.
2. **Robust Client State & Universal Simultaneous Transition (`QueuePage.tsx`)**:
   - `clientId` managed as reactive state (`useState`) synchronized with `localStorage`.
   - Polling hook automatically transitions any enqueued player or spectator to the drawn tile view upon receiving `latest_draw`.
   - Single-initiator button guard: Only queue #1 (host) has active draw trigger; #2-#4 see a waiting state.
3. **Hot Backend Process Recycling**:
   - Provide a targeted PowerShell command/script to bounce port 3001 (`node server/index.js`) within 1-2 seconds without terminating Cloudflare tunnel or React server.
4. **Automated Verification**:
   - Backend unit tests verifying concurrency idempotency under parallel `draw-seats` calls.
   - Frontend unit tests verifying state hydration and transition.
   - TypeScript compilation and clean production build.
