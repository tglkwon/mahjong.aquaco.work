# Implementation plan

- Work ID: rexx3-letterbox-ocr-fix
- Artifact revision: 2
- Language: en
- Korean mirror: plan.ko.md

## Context and target outcome
Implement sliding window frequency consensus in `scoreStability.ts` to allow Fast-Lock under handheld camera shake without zero-tolerance resets, reduce frame analysis throttle to 100ms in `scoreCamera.ts`, and refine `scoreRecognition.ts` with 9 vs 8 discrimination, 1/5/7 aspect ratio protection, X-axis T-layout partition, and adaptive red thresholding for overhead glare resilience.

## Repository state and constraints
Retain slot-clipped camera viewport (`h-52`), central 50% ROI extraction, AMOS REXX 3 4-player HUD, and client-side in-memory architecture.

## Change map
1. `scoreStability.ts`: Replace strict consecutive tracker with sliding window frequency consensus buffering valid readings over `1500ms` window.
2. `scoreStability.test.ts`: Test that interleaved invalid frames do not reset consensus count, and 2 valid occurrences trigger `ready: true`.
3. `scoreCamera.ts`: Lower analysis throttle from `200ms` to `100ms` and connect window consensus parameters.
4. `scoreRecognition.ts`: Tune `lower-left` probe to `cy=0.64, dy=0.05, threshold=0.38` for 9 vs 8 separation; tighten digit `1` aspect ratio to `0.33`; sort T-layout by X-axis (`runsByX`); add adaptive red threshold fallback (`r > 160 && r > g * 1.4 && r > b * 1.2`) for glare frames.
5. `scoreRecognition.test.ts`: Add test fixtures for 9 vs 8 discrimination, tilted layout, and glare resilience.

## Dependency graph and parallelization
TASK-005 (Stability tracker) and TASK-007 (OCR geometry and glare) can be developed independently; TASK-006 (Camera throttle) connects them; TASK-008 performs full verification across automated gates.

## Tasks
- TASK-001 — Status: done — REQ-003, REQ-004 / AC-003. Owner: root. Surface: `scoreRecognition.ts` and tests. Added test for North's `0097` (9,700 points), adjusted probe coordinates, verified green. Proof: Jest unit tests.
- TASK-002 — Status: done — REQ-002 / AC-002. Owner: root. Surface: `scoreCamera.ts`. Sliced central 50% vertical ROI during `drawImage`, cutting pixel processing by ~50%. Proof: Camera frame extraction tests.
- TASK-003 — Status: done — REQ-001 / AC-001. Owner: root. Surface: `PhotoUploadPanel.tsx`. Restricted video container height to `h-52 sm:h-60 overflow-hidden` and `<video>` to `w-full h-full object-cover object-center`. Proof: Component tests and layout verification.
- TASK-004 — Status: done — AC-004. Owner: root. Surface: Full verification and SDLC artifacts. Ran all 10 test suites, TypeScript compiler, production build, generated evidence artifacts, and updated `artifact-sync.json`. Proof: Test logs and validation script.
- TASK-005 — Status: done — REQ-005 / AC-005. Owner: root. Surface: `scoreStability.ts` and `scoreStability.test.ts`. Implement sliding window frequency consensus tracker and verify intermittent noise tolerance via TDD. Proof: Jest unit tests.
- TASK-006 — Status: done — REQ-006 / AC-006. Owner: root. Surface: `scoreCamera.ts`. Reduce analysis throttle from 200ms to 100ms. Proof: Jest timer tests.
- TASK-007 — Status: done — REQ-007 / AC-007. Owner: root. Surface: `scoreRecognition.ts` and `scoreRecognition.test.ts`. Implement 9 vs 8 probe tuning, 0.33 digit 1 ratio, X-axis layout partition, and adaptive red threshold fallback. Proof: Jest unit tests and pixel tests.
- TASK-008 — Status: done — AC-004, AC-007. Owner: root. Surface: Full verification and video evaluation. Run full video stream evaluations on `PXL_20260914_121532649.mp4` and `PXL_20260914_121752679.mp4`, run all 10 Jest suites, production build, and sync artifacts. Proof: Python script logs and validation script.


## TDD sequence
1. Red: Write failing unit test in `scoreStability.test.ts` for sliding window consensus with interleaved invalid frames.
2. Green: Implement sliding window in `scoreStability.ts`.
3. Red: Write failing unit test in `scoreRecognition.test.ts` for 9 vs 8 discrimination and tilted X-axis layout.
4. Green: Implement probe tuning, X-axis partition, and adaptive threshold in `scoreRecognition.ts`.
5. Connect 100ms throttle in `scoreCamera.ts`.
6. Run full verification.

## End-to-end scenarios
Handheld video recordings with camera shake and heavy overhead glare achieve Fast-Lock within 0.2~0.4 seconds at 100,000 total score.

## Quality gates
Jest test suites (10 suites), TypeScript compile, production build (`npm run build`), Python full video evaluation, SDLC artifact validation script.

## Risks, migration, and rollback
If sliding window TTL is too long, stale readings could linger; `1500ms` provides clean balance between shake absorption and rapid decay. All changes are strictly client-side and backward-compatible.

## Completion proof
Every acceptance criterion AC-001 through AC-007 verified with passing test evidence.

## Progress log
2026-09-14: revision 1 implementation completed and verified.
2026-09-15: revision 2 started to implement sliding window frequency consensus and glare-resistant OCR.
