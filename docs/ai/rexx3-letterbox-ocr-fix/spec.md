# Specification

## Metadata and source
- Work ID: rexx3-letterbox-ocr-fix
- Artifact revision: 2
- Language: en
- Korean mirror: spec.ko.md
- Source: intent.md revision 2

## Summary
Provide mobile video scan viewport clipping into a horizontal slot, restrict canvas recognition to the central 50% ROI, resolve digit 7 vs 3 and 9 vs 8 OCR misclassifications, provide robust X-axis T-layout detection, implement glare-resilient adaptive thresholding, and transition from strict consecutive matching to sliding window frequency consensus for sub-second Fast-Lock under handheld camera shake.

## Functional requirements
- REQ-001 must: Replace full-height unconstrained video presentation with a compact horizontal slot viewport (`overflow-hidden`, bounded height `h-52 sm:h-60`, `object-cover object-center`), physically clipping irrelevant top (tiles) and bottom (trays/knees) regions while saving mobile vertical screen space.
- REQ-002 must: Restrict live video frame canvas drawing and image analysis in `scoreCamera.ts` to the central 50% vertical ROI (y: 25%~75%), reducing per-frame processing load by ~50% and doubling scan throughput (FPS).
- REQ-003 must: Fix digit 7 discrimination in 7-segment OCR in `scoreRecognition.ts` by checking the middle horizontal segment at an offset coordinate away from 7's diagonal stem, differentiating '7' (`1010010`) from '3' (`1011011`).
- REQ-004 must: Ensure 4-digit scores with leading zeroes (e.g. `0097` -> 9,700 points) are properly preserved and converted to valid point totals matching the 100,000 standard sum.
- REQ-005 must: Replace strict consecutive matching in `scoreStability.ts` with sliding window frequency consensus: retain valid readings within a `1500ms` window and trigger `ready: true` when any identical 4-player score set is observed `2` times with minimum span of `100ms`, ignoring intermittent invalid frames.
- REQ-006 must: Shorten frame analysis interval in `scoreCamera.ts` from `200ms` to `100ms` (10 FPS) to achieve 0.2~0.3s fast lock.
- REQ-007 must: Refine OCR geometric probes in `scoreRecognition.ts` (raise `lower-left` probe threshold to `0.38` and `cy` to `0.64` to prevent `9` misclassifying as `8`; tighten digit `1` aspect ratio to `0.33` to prevent `5`/`7` misclassification; implement X-axis layout partition `runsByX` for tilt tolerance; add adaptive red threshold fallback `r > 160 && r > g * 1.4 && r > b * 1.2` for glare resistance).

## Non-functional requirements
Preserve strictly client-side, zero-network image processing. Ensure UI responsiveness on mobile devices so camera slot, live HUD, and draft form fit comfortably within standard mobile viewports.

## User experience and flows
User starts live scan → Camera opens inside compact horizontal slot viewport (h-52) → User points at front panel → Real-time 4-player HUD updates below slot without scrolling → Sliding window consensus detects 2 matching valid score sets within 1.5s window (0.2~0.3s) → Auto-capture triggers → Draft form is populated and ready for confirmation on the same screen without scrolling.

## Architecture and interfaces
- UI Viewport: Tailored CSS classes in `PhotoUploadPanel.tsx` using `object-cover` and container height clipping.
- Camera Pipeline: `drawImage` source coordinate slicing in `scoreCamera.ts` to crop ROI before pixel extraction, throttled to 100ms.
- Consensus Engine: `scoreStability.ts` sliding window frequency histogram tracker.
- Recognizer: `scoreRecognition.ts` segment probe geometry refinement, X-axis geometric partition, and adaptive red thresholding.

## Data and migrations
Not applicable: no database, server storage, or URL schema changes.

## Failure modes and edge cases
If table model is not AMOS REXX 3 or digits fall outside the central ROI, camera falls back to standard retry, manual upload, or manual score entry. If severe glare prevents 2 matching frames within 1500ms, consensus continues buffering fresh readings without crashing.

## Security, privacy, and permissions
All frames remain in browser memory. No telemetry or images transmitted externally.

## Observability and operations
Expose meaningful scan status and slot alignment hints to the user. Store test evidence locally without uploads.

## Test strategy
1. Unit tests in `scoreStability.test.ts` verifying that intermittent non-matching/invalid frames do not reset the consensus count, and 2 valid occurrences within 1500ms trigger ready.
2. Unit tests in `scoreRecognition.test.ts` for digit 7 vs 3 and 9 vs 8 classification, 4-digit `0097` recognition, X-axis layout under tilt, and glare threshold fallback.
3. Component tests in `PhotoUploadPanel.test.tsx` verifying viewport container styling and live HUD rendering.
4. Regression suite across all existing test files.

## Acceptance criteria
- AC-001: Video container in `PhotoUploadPanel.tsx` uses slot clipping (`h-52`, `overflow-hidden`, `object-cover`), avoiding page overflow.
- AC-002: Canvas frame extraction in `scoreCamera.ts` extracts central ROI.
- AC-003: `scoreRecognition.test.ts` passes for North `0097` score returning 9,700 points, resolving the 7 vs 3 bug.
- AC-004: All test suites pass with zero regressions.
- AC-005: `scoreStability.test.ts` verifies sliding window consensus triggers `ready: true` with 2 matching readings despite interleaved invalid frames.
- AC-006: `scoreCamera.ts` operates at 100ms analysis interval.
- AC-007: Handheld glare video recordings (`PXL_20260914_121532649.mp4` and `PXL_20260914_121752679.mp4`) achieve Fast-Lock at 100,000 total score.

## Traceability
Slot clipping outcome → REQ-001 → AC-001. ROI speedup outcome → REQ-002 → AC-002. OCR 7 vs 3 fix outcome → REQ-003, REQ-004 → AC-003. Sliding window consensus outcome → REQ-005, REQ-006 → AC-005, AC-006. Glare OCR and layout outcome → REQ-007 → AC-007. Overall verification → AC-004.

## Open decisions
None blocking. Slot height set to `h-52` (`sm:h-60`) as optimal mobile proportion. Sliding window duration set to `1500ms`.
