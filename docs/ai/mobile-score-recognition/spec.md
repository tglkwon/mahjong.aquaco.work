# Specification
## Metadata and source
Revision 2; source intent.md; 2026-09-05. Clarifies observed native HEVC compatibility boundary without adding a transcoding service.
## Summary
Replace placeholder with local score review and explicit confirmation.
## Functional requirements
- REQ-001 must: decode browser-supported photos/videos and sample multiple bounded video frames, show selectable previews; unsupported native codecs use the manual recovery path.
- REQ-002 must: return four ordered editable candidates with uncertainty; unsupported/failed recognition enables manual entry.
- REQ-003 must: explicitly select display units, require four integer scores in 100-point increments and matching editable target total, confirm player mapping, append only once per confirmation.
- REQ-004 must: no network media processing, release source object URLs and cancel stale selection/unmount work.
- REQ-005 must: retain Game string-array representation, existing records and share codec; unique record IDs and regression tests/build.
## Non-functional requirements
Bound media to 150MB, five frames and 1920px maximum dimension. Mobile-friendly native controls with labels and visible status.
## User experience and flows
Choose file → extract/recognize → choose frame → edit four labeled positions → choose distinct players/unit/total → review normalized scores → explicit check and confirm. Manual input available throughout, including failed decoding.
## Architecture and interfaces
scoreMedia exports LocalFrame {url,time,width,height}, extractLocalFrames(File, AbortSignal?) and framePixels(LocalFrame). scoreRecognition exports recognizeScoreboard(pixel image) returning four {raw,confidence} candidates ordered left/top/right/bottom. Panel owns transient drafts; page owns records.
## Data and migrations
No migration. Only confirmed point values enter Game. No media in URL or persistent storage.
## Failure modes and edge cases
Unsupported codecs, empty/non-media/large files, canceled jobs, incomplete LEDs, negative scores, unit mismatch, duplicate player assignments, repeated confirmation, existing loaded record IDs.
## Security, privacy, and permissions
User-selected local media only; no upload/API/remote model. No production or external mutations.
## Observability and operations
Inline status and manual recovery. No media logging or telemetry.
## Test strategy
Pure validation and real pixel recognition tests, component lifecycle/confirmation tests, media resource tests, page record/share regression, real-browser sample exercise, full suite/type/build.
## Acceptance criteria
- AC-001: actual sample image pixels and browser-supported sample video frames generate four reviewable candidates; original HEVC on unsupported browsers and other decode failures remain editable (REQ-001,002). Validate compatible video path using a local H.264 derivative from the same source when the test browser lacks HEVC.
- AC-002: invalid totals/units/mapping cannot append; valid confirmed draft appends exactly once (REQ-003,005).
- AC-003: media remains local; resource/stale-job tests pass (REQ-004).
- AC-004: existing record/share tests and production build pass (REQ-005).
## Traceability
Local sample flow → REQ-001/002 → AC-001; checked confirmation → REQ-003 → AC-002; privacy → REQ-004 → AC-003; compatibility → REQ-005 → AC-002/004.
## Open decisions
None blocking. Recognition is deliberately limited to red seven-segment displays and always requires human review.
