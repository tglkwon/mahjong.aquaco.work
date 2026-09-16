# Specification

## Metadata and source
- Work ID: scanner-negative-hud-feedback
- Artifact revision: 3
- Language: en
- Korean mirror: spec.ko.md
- Source: intent.md revision 3

## Summary
Enhance the live Mahjong scoreboard scanner with negative score (hakoten) recognition, open full-frame viewfinder guidance with 4-corner L-shaped reticles (removing obstructive scrims), and a 3-stage visual consensus convergence indicator with snappy 100ms flash.

## Functional requirements
- REQ-001 must: Filter horizontal single-bar connected components matching `isMinusBar` (`w >= 6 && w <= 28 && h >= 2 && h <= 12 && w >= h * 1.3 && tail >= 12`) in `scoreRecognition.ts`. When `isMinusBar` is the leftmost element of a digit group run, assign `"-"` to produce signed score drafts (e.g. `"-020"` -> `-2000`). Preserve 4-player sum validation for games with negative scores.
- REQ-002 must: In `PhotoUploadPanel.tsx`, overlay an open full-frame viewfinder HUD with four L-shaped corner reticles, removing restrictive 25% top/bottom scrim masks to leverage natural CSS `object-cover` framing while providing a generous targeting area.
- REQ-003 must: Bind `stable.count` (0 to 3) from `startScoreCamera`'s `onReading` callback to React state `consensusCount`. Transition reticle/border illumination colors across consensus stages (Count 0: White -> Count 1: Blue -> Count 2-3: Emerald) and render a 3-dot gauge (`● ○ ○` -> `● ● ○` -> `● ● ●`). Upon reaching count 3, display a 100ms white flash overlay before stopping the camera and presenting the editable draft.
- REQ-004 must: Maintain 100% backward compatibility with AMOS REXX 3 positive score recognition, bottom-seat rank slicing (`!group[0].isMinus`), player seat rotation, manual entry fallback, and developer PC drop bridges.

## Non-functional requirements
Keep image processing 100% local within browser canvas memory. Ensure viewfinder overlay layout is responsive across mobile screen ratios without horizontal overflow. All visual animations must be performant and CSS-driven.

## User experience and flows
1. User starts live scan: Viewfinder opens with open full-frame view bounded by 4 corner reticles. 3-dot indicator shows `○ ○ ○`.
2. Aiming scoreboard: User positions scoreboard within the framed viewfinder. Once consecutive valid frames are detected, reticles glow Blue and 3-dot gauge advances to `● ○ ○` (count 1), then Emerald `● ● ○` (count 2).
3. Automatic capture: On 3rd consecutive match (`● ● ●`), a crisp 100ms white flash fires, camera stops, and the review draft appears with recognized scores (including negative scores if present).

## Architecture and interfaces
- `scoreRecognition.ts`: Introduce `isMinus?: boolean` property on `Box`. Allow `isMinusBar` boxes to group with adjacent digits horizontally. Map leftmost minus box to `"-"`. Guard rank slice on Player 1 seat (`!group[0].isMinus`).
- `PhotoUploadPanel.tsx`: Manage `consensusCount` and `flashing` states. Render full-frame corner reticle classes and 100ms flash timer inside the video container.

## Data and migrations
Not applicable: client-only UI and recognizer logic. No database schema or external API changes.

## Failure modes and edge cases
- Stale or noise minus bar in the middle of digits: Ignored or disqualified from score runs; only leftmost position accepted.
- Rank slice collision: If Player 1 has a negative score, do not slice the minus sign as a rank digit.
- Rapid unmount during 100ms flash: Use safe timer cleanup to prevent memory leaks or state updates after unmount.

## Security, privacy, and permissions
Camera stream remains strictly local on the client device. No audio requested. Media stream tracks are cleaned up on capture, stop, unmount, or hidden visibility.

## Observability and operations
The 3-dot gauge and dynamic status messages provide real-time feedback on recognition status and error conditions.

## Test strategy
1. Add unit tests in `scoreRecognition.test.ts` for horizontal minus bar detection, grouping, and negative draft validation.
2. Add component tests in `PhotoUploadPanel.test.tsx` verifying full-frame reticle rendering, reticle classes, consensus count state binding, and 100ms flash transition.
3. Run full regression test suite (`react-scripts test --watchAll=false`).

## Acceptance criteria
- AC-001: Unit tests prove REQ-001 with synthetic negative score boards and draft validation totaling 100,000.
- AC-002: UI tests prove REQ-002 with open full-frame viewfinder and corner reticles rendered without restrictive scrims during scanning.
- AC-003: UI tests prove REQ-003 with consensus counts 0 to 3 driving 3-dot dots, reticle color transitions, and 100ms flash before capture.
- AC-004: Regression tests prove REQ-004 with existing AMOS REXX 3 positive tests and rotation remaining intact.

## Traceability
- Hakoten bug fix -> REQ-001 -> AC-001
- Open Viewfinder HUD -> REQ-002 -> AC-002
- 3-stage consensus feedback & 100ms flash -> REQ-003 -> AC-003
- Compatibility and regression -> REQ-004 -> AC-004

## Open decisions
None blocking. The 100ms flash timer and full-frame reticle are encapsulated in `PhotoUploadPanel.tsx`.
