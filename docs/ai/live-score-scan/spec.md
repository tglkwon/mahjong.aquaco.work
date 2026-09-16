# Specification

## Metadata and source
- Work ID: live-score-scan
- Artifact revision: 1
- Language: en
- Korean mirror: spec.ko.md
- Source: intent.md revision 1

## Summary
Provide live mobile camera recognition that automatically captures a stable review draft without recording a game automatically.

## Functional requirements
- REQ-001 must: Start rear-preferred video without audio from an explicit user action. Clean up active and late-arriving streams on capture, cancellation, hidden page, error, and unmount. Preserve photo/manual fallback.
- REQ-002 must: Read at most five fresh frames per second. Capture only after at least five identical complete four-score observations spanning at least 1000 ms, valid units and unique assigned players, and a configured expected sum (default 100000). Reset continuity on invalid or changed readings; prevent stale-frame progression and duplicate capture within a session.
- REQ-003 must: Show progress, capture a local frame exactly once, stop the camera, and present editable score review. Preserve East-seat mapping, one-seat rotation, confirmation reset on edits, and explicit human recording confirmation. Rescanning is explicit.
- REQ-004 must: Verify actual recognizer-to-review integration using the existing real REXX 3 video derivative in browser tests, with test-only synthetic camera input and no product debug API. Cover invalid/unstable observations, cancellation, duplicates, and assignment rotation.

## Non-functional requirements
Keep processing local and bound frame sampling. Remain usable on mobile viewport layouts. Real-device performance and recognition accuracy are deferred, not inferred from desktop results.

## User experience and flows
Start scan → permission → inline camera and recognition progress → stable automatic capture → stopped camera and editable draft → assignment review/rotation → checkbox and explicit record action. Permission denial and unsupported camera environments show recovery and fallback options. Cancellation returns to an idle state without a draft from that session.

## Architecture and interfaces
Keep the stability decision in a pure testable state machine. Keep media acquisition, fresh-frame scheduling, track cleanup, and cancellation-generation handling separate from recognition. Reuse the REXX 3 pixel recognizer and existing parent review/confirmation contract. Test injection belongs exclusively to browser test setup.

## Data and migrations
Not applicable: no server schema, persistent video, or database migration. Existing score draft and recording formats remain authoritative.

## Failure modes and edge cases
Handle denied permissions, missing APIs, unavailable devices, playback/read errors, cancelled pending permissions, stopped/stale frames, invalid sums, changing scores, repeated stable results, hidden tabs, and unmount. A correct total alone does not prove correct individual scores.

## Security, privacy, and permissions
Use browser camera permission on a secure origin. Do not request microphone access, upload images, or add debug hooks to shipped code. Stop media tracks promptly.

## Observability and operations
Expose meaningful scan status and recoverable errors to the user. Store local test evidence without camera uploads. Do not activate deployment or a tunnel.

## Test strategy
Write failing stability and lifecycle tests first. Test UI review, rotation, confirmation, and resets. Exercise the browser with the real-video-derived stream. Run the repository test suite, type checks, build, and independent review; record exact outcomes in evidence.

## Acceptance criteria
- AC-001: Camera lifecycle and fallback tests prove REQ-001, including late permission cleanup.
- AC-002: Deterministic state tests prove REQ-002 thresholds, fresh-frame gating, invalid resets, unit/player validation, expected-total configuration, and single capture.
- AC-003: UI tests prove REQ-003 human confirmation, assignment cycling, camera stop, and review draft behavior.
- AC-004: Browser evidence proves REQ-004 continuous real-video recognition to one draft, mapping, and no automatic record; all required automated gates and independent review complete.

## Traceability
Local camera/privacy outcome → REQ-001 → AC-001. Stable one-time capture acceptance signal → REQ-002 → AC-002. Human review and player mapping outcome → REQ-003 → AC-003. Before-shop evidence outcome → REQ-004 → AC-004.

## Open decisions
None blocking. Actual phone and shop performance remain deferred to the user's later visit.
