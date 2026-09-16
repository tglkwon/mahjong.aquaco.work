# Intent
## Metadata
Work ID: mobile-score-recognition; revision: 2; source: user; owner: root; created/updated: 2026-09-05.
Status: done
Risk: standard
## Originating request
Implement mobile scoreboard recognition using PXL_20260902_054136311.mp4 as a real validation sample. Extract video/photo frames locally, propose four scores, validate units and total, append only after confirmation, and allow manual correction. Verify existing records/sharing with tests and build.
## Problem and evidence
PhotoUploadPanel is a placeholder. Sample is a 10.749s 1920×1080 red seven-segment display. Existing records use Game with string scores; shared state has a normal array-score mode.
## Desired outcomes
Local media selection to reviewable four-score draft to confirmed record, with graceful manual fallback.
## Scope
Red LED scoreboard MVP, bounded frame extraction, review, unit/total checks, player mapping and append integration.
## Non-goals
General OCR, cloud processing, automatic recording, production deployment, inference of seat identity.
## Constraints and policies
Never transmit original media or derived pixels. Preserve existing score/share codecs and unrelated untracked research files. No added network recognition dependencies.
## Acceptance signals
Real sample produces reviewable candidates; invalid/incomplete drafts cannot append; corrected valid drafts append once; existing tests and production build pass.
## Assumptions and open questions
Default display unit is 100 points and target total is 100000, both explicitly editable. MVP supports the sample's red LED layout; other layouts fall back to input.
The original sample uses HEVC. Native browser codec support varies: installed headless Edge decodes its audio but reports videoWidth 0. Manual entry/photo selection remains available. An offline H.264 derivative of the same source validates the browser's video extraction path; this is a test fixture, not server-side app processing.
## Decisions
Use native browser media/canvas and a deterministic seven-segment decoder. Keep drafts outside persisted/shared Game data.
