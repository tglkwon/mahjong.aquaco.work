# Intent

## Metadata
- Work ID: mahjong-field-test-hotfix
- Artifact mode: canonical
- Artifact revision: 1
- Language: en
- Status: draft
- Risk: standard
- Created: 2026-09-23
- Updated: 2026-09-23
- Owner: agent

## Originating request
The user reported three critical defects discovered during offline parlor field testing and requested comprehensive fixes governed by `/gemini-autonomous-sdlc`:

1. **Defect 1 (Nickname Linkage Disconnection)**:
   - When moving from the queue screen (`/queue`) to the score screen (`/scan_score`) after a 4-player seat draw, assigned nicknames are not propagated, rolling back to default names ("플레이어1~4").
   - Root Causes:
     - `POST /api/queue/draw-seats` shuffles waiting players and responds to client, but never claims seats in `session_seats` for Table 1.
     - Production score page (`ScoreScanPage.tsx`) has `if (!effectiveTestMode) return;` inside `pollTableStatus`, 100% blocking table polling and seat hydration in production `/scan_score`.
     - Navigation button in `QueuePage.tsx` navigates to `/scan_score` without parameters or state.

2. **Defect 2 (Multi-Execution & Unsynchronized Seat Draw)**:
   - When 4 players gather in the queue, all 4 mobile screens display an active `[자리 추첨]` button.
   - Any player clicking the button generates a different random permutation. Players see conflicting wind assignments and other players never receive the drawn state.
   - Root Causes:
     - `POST /api/queue/draw-seats` is stateless and re-runs random shuffle on every request without persisting.
     - Polling endpoint `GET /api/queue` lacks `latest_draw` state.
     - No concurrency lock or state transition to prevent redundant draws.

3. **Defect 3 (Digit '0' vs '8' Flickering & OCR Degradation on Cross-Vendor Cameras)**:
   - On non-primary smartphones, red 7-segment digit '0' violently flickers into '8' due to optical bloom/light bleeding into the center G-segment zone.
   - Even a single '0' misread as '8' causes an 800 or 8,000-point total discrepancy, completely failing the 100,000-point sum consensus and blocking scan capture.
   - Root Causes:
     - Segment G (middle bar) probe uses left-biased coordinates (`cx=0.40`) and absolute density threshold (`0.40`), making it overly sensitive to bleed from the left vertical segments.
     - Absence of relative contrast comparison between the middle bar and surrounding illuminated segments.
     - Lack of domain heuristic backtracking (Japanese Mahjong scores have 00 at the end in 100-pt units, and sum must strictly match 100k/120k).

## Problem and evidence
- In physical mahjong parlors, players register on their phones, draw seats digitally, and record scores at table-side.
- If nicknames are lost upon transitioning to the score sheet, users must manually re-enter all names, defeating the purpose of the digital queue.
- If 4 players draw different seats, the physical seating order breaks down into disputes.
- If the OCR camera cannot distinguish 0 from 8 under intense LED flare and phone camera sharpening, automatic score recording cannot be used.

## Desired outcomes
- **Atomic Single-Source Seat Draw**:
  - `POST /api/queue/draw-seats` claims seats in `session_seats` for Table 1, marks participants as playing, and caches/persists `latest_draw`. Duplicate calls return the same atomic draw.
  - `GET /api/queue` includes `latest_draw` payload.
  - In `QueuePage.tsx`, when 1 player clicks draw, all 4 players' screens transition synchronously to the identical seat cards within 1 poll cycle.
- **Seamless Production Score Synchronization**:
  - `ScoreScanPage.tsx` unblocks `pollTableStatus` and session finishing for production `/scan_score`.
  - `QueuePage.tsx` passes `?table=1` and router state for instantaneous 0ms nickname hydration.
- **Robust 7-Segment OCR with Bloom Suppression & Domain Backtracking**:
  - Center G-segment uses relative luminance contrast against active boundary segments to suppress optical flare.
  - Domain-aware score candidate solver rectifies 0-vs-8 ambiguities by validating 100k/120k point sum consistency.
- **Automated Verification**:
  - Full backend and frontend unit tests, TypeScript type checking, and production build pass without regressions.
