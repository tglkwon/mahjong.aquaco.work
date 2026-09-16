# Specification

## Metadata and source
- Work ID: mobile-camera-capture
- Artifact revision: 1
- Language: en
- Korean mirror: spec.ko.md
- Source: intent.md revision 1

## Summary
Specification for mobile camera integration in `PhotoUploadPanel.tsx`, rotation support in `scoreMedia.ts`, and tunnel scripting in `package.json`.

## Functional requirements
- REQ-001: Provide a dedicated camera button triggering hidden input with `capture="environment"` and desktop file fallback.
- REQ-002: Display a pre-capture viewfinder guide card in `PhotoUploadPanel.tsx` when no frames are loaded.
- REQ-003: Implement `rotateFrame` in `scoreMedia.ts` and add a 90-degree rotate button with auto re-recognition.
- REQ-004: Add `test:mobile` script running `untun` tunnel for mobile testing.

## Non-functional requirements
- Client-side execution with 0 server uploads.
- Instant canvas rotation under 200ms.

## User experience and flows
1. User enters `/set_score_photo`.
2. Viewfinder guide card advises horizontal framing.
3. User taps camera button to capture photo.
4. User taps rotate button if photo is misaligned.
5. Scores are verified and confirmed.

## Architecture and interfaces
`PhotoUploadPanel.tsx` uses `scoreMedia.ts` for extraction and rotation, feeding `recognizeScoreboard`.

## Data and migrations
No persistent schema changes.

## Failure modes and edge cases
Unsupported codecs or invalid rotations fall back to manual score entry.

## Security, privacy, and permissions
All photos stay in-browser memory.

## Observability and operations
`npm run test:mobile` displays ephemeral URL in console.

## Test strategy
Jest unit tests for `rotateFrame` and `PhotoUploadPanel.tsx` UI interactions.

## Acceptance criteria
- AC-001: Camera button triggers hidden file input with `capture="environment"`.
- AC-002: Guide card renders when frames array is empty.
- AC-003: `rotateFrame` transforms image 90 degrees and re-runs scoreboard recognition.
- AC-004: Running `npm run test:mobile` launches `untun` tunnel to port 3000.

## Traceability
Traces REQ-001, REQ-002, REQ-003, REQ-004 to AC-001, AC-002, AC-003, AC-004.

## Open decisions
None.
