# Implementation plan

- Work ID: scan-video-recording
- Artifact revision: 2
- Language: en
- Korean mirror: plan.ko.md

## Context and target outcome
Upgrade live score scanning consensus threshold to 3 frames within 1500ms window (`countThreshold = 3`, `spanMsThreshold = 200`), integrate `MediaRecorder` to record the active camera session from start to finish, and auto-upload the resulting video (`.mp4` / `.webm`) to the PC workspace via `uploadToMobileDrop` on both success and failure/cancellation, replacing redundant still screenshot uploads.

## Repository state and constraints
Maintain existing 10 FPS OCR analysis loop (`scoreCamera.ts`), central 50% ROI cropping, AMOS REX III HUD, and multi-device drop routing (`research-data/<device>/`).

## Change map
1. `src/utils/scoreCamera.ts`: Default stability threshold to 3 frames / 200ms; integrate `MediaRecorder` with auto format detection, periodic slicing, clean lifecycle shutdown, and `onVideoReady` callback.
2. `src/components/PhotoUploadPanel.tsx`: Update status string to `(${count}/3회)`; route `onVideoReady` to `uploadToMobileDrop` for both success and fail outcomes; remove still screenshot drop.
3. `src/utils/scoreCamera.test.ts`: Synchronize timer tick simulations for 3-frame capture; add tests for `MediaRecorder` lifecycle and `onVideoReady`.

## Dependency graph and parallelization
TASK-001 (Threshold) and TASK-002 (MediaRecorder) update `scoreCamera.ts`; TASK-003 hooks into `PhotoUploadPanel.tsx`; TASK-004 verifies via `scoreCamera.test.ts`; TASK-005 executes quality gates.

## Tasks
- TASK-001 — Status: done — REQ-001 / AC-001. Owner: root. Surface: `src/utils/scoreCamera.ts`. Set default stability threshold to `countThreshold = 3` and `spanMsThreshold = 200`. Proof: Jest unit tests.
- TASK-002 — Status: done — REQ-003, REQ-004, REQ-005, REQ-007 / AC-003. Owner: root. Surface: `src/utils/scoreCamera.ts`. Implement `MediaRecorder` session recording, format selection, chunk collection, and `onVideoReady` callback on stop with status (`success` | `canceled` | `failed`). Proof: Jest unit tests with mock MediaRecorder.
- TASK-003 — Status: done — REQ-002, REQ-006 / AC-002. Owner: root. Surface: `src/components/PhotoUploadPanel.tsx`. Update reading status to `(${count}/3회)`, connect `onVideoReady` to `uploadToMobileDrop`, and remove still screenshot upload. Proof: Component tests and build check.
- TASK-004 — Status: done — REQ-008 / AC-004. Owner: root. Surface: `src/utils/scoreCamera.test.ts`. Synchronize 3-frame tick assertions and add unit tests for `MediaRecorder` lifecycle and `onVideoReady`. Proof: `npm test -- --watchAll=false`.
- TASK-005 — Status: done — AC-005. Owner: root. Surface: Repository verification. Run full test suites, production build, and artifact validation. Proof: All quality gates exit 0.

## TDD sequence
1. Red: Update `scoreCamera.test.ts` to assert capture on 3rd tick and test `MediaRecorder` invocation.
2. Green: Implement TASK-001, TASK-002 in `scoreCamera.ts` and TASK-003 in `PhotoUploadPanel.tsx`.
3. Verify all tests pass.

## End-to-end scenarios
Starting live scan begins video recording; reaching 3 matching frames confirms score and transmits video to PC workspace (`research-data/rex 3/`) with floating badge notification.

## Quality gates
- Unit tests: `npm test -- --watchAll=false`
- Build check: `npm run build`
- Chain validation: `pwsh.exe -NoProfile -ExecutionPolicy Bypass -File C:\Users\AquaCo\.codex\skills\ai-native-sdlc\scripts\validate-artifact-chain.ps1 -ArtifactDirectory docs/ai/scan-video-recording`

## Risks, migration, and rollback
If `MediaRecorder` is unavailable on older browsers, the application catches the error and performs standard OCR scanning without interruption. All changes are backward compatible.

## Completion proof
Verified test logs from `npm test`, build output from `npm run build`, and exit 0 from artifact chain validation.

## Progress log
2026-09-15: Revision 1 created to implement 3-frame consensus threshold and full scan video recording to PC drop.
2026-09-15: Tasks completed, test suites passed (85/85), and production build succeeded.
