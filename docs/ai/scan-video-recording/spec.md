# Specification

## Metadata and source
- Work ID: scan-video-recording
- Artifact revision: 2
- Language: en
- Korean mirror: spec.ko.md
- Source: intent.md revision 2

## Summary
Upgrade the live scoreboard camera scanning pipeline to enforce a 3-frame temporal stability consensus (`count = 3`, `span >= 200ms` within `1500ms`) and record the entire active camera scanning session using standard `MediaRecorder`. When mobile-drop is active, transmit the full session video (`.mp4` or `.webm`) automatically to the PC receiver (`research-data/<device>/`) upon recognition or cancellation/failure, superseding static freeze-frame `.jpg` uploads.

## Functional requirements
- REQ-001 must: Set default stability options in `src/utils/scoreCamera.ts` to `countThreshold = 3` and `spanMsThreshold = 200`.
- REQ-002 must: Update live scan progress feedback text in `src/components/PhotoUploadPanel.tsx` to show `점수 확인 중 (${count}/3회). 잠시 유지해 주세요.`.
- REQ-003 must: Extend `ScanOptions` in `src/utils/scoreCamera.ts` with an optional callback `onVideoReady`.
- REQ-004 must: Attach a `MediaRecorder` instance to the acquired `MediaStream` in `src/utils/scoreCamera.ts` whenever supported, selecting the optimal supported MIME type (`video/mp4` > `video/webm;codecs=vp9` > `video/webm`) and collecting periodic slices.
- REQ-005 must: Track session stop reason in `src/utils/scoreCamera.ts`, assemble the final video Blob upon recorder stop, and invoke `onVideoReady`.
- REQ-006 must: Wire `onVideoReady` to `uploadToMobileDrop` in `src/components/PhotoUploadPanel.tsx` to upload `${device}_scan_${timestamp}.${ext}` on success and `${device}_fail_${timestamp}.${ext}` on canceled or failed, removing redundant still snapshot frame `.jpg` upload on live capture.
- REQ-007 must: Ensure graceful fallback when `MediaRecorder` is undefined or throws during initialization so that live scanning and OCR capture operate without disruption.
- REQ-008 must: Update stability test assertions in `src/utils/scoreCamera.test.ts` to verify capture at 3 frames, and add test cases covering `MediaRecorder` lifecycle and `onVideoReady` callback invocation.

## Non-functional requirements
Video recording runs off the main thread in native media pipelines; OCR canvas extraction and frame analysis loop maintain 10 FPS without dropped frames. UI transition to the review/draft state must occur immediately upon score capture (0ms delay), running video finalization and upload asynchronously in the background. Standard support for iOS Safari producing MP4 and Android Chrome producing WebM or MP4. Leverages the established 8MB chunked upload protocol (`uploadToMobileDrop`) with PIN authentication and automatic progress feedback.

## User experience and flows
1. Tester taps "실시간 스캔 시작" on mobile.
2. Camera activates and background video recording begins silently.
3. As the tester aligns the camera with the AMOS REX III scoreboard:
   - Frame 1: Status displays `점수 확인 중 (1/3회)...`
   - Frame 2: Status displays `점수 확인 중 (2/3회)...`
   - Frame 3: 3-frame consensus reached. UI immediately freezes final frame and opens score draft review.
4. Concurrently in background:
   - Video recording stops and produces video Blob (`.mp4` / `.webm`).
   - If PC drop is connected, uploads `${device}_scan_${timestamp}.${ext}` in chunks to `research-data/rex 3/`.
   - Floating badge displays upload progress and confirms PC drop completion.
5. If tester taps "스캔 취소" before capture or camera times out:
   - Video recording stops and produces video Blob.
   - If PC drop is connected, uploads `${device}_fail_${timestamp}.${ext}` to `research-data/rex 3/` for post-mortem debugging.

## Architecture and interfaces
- `src/utils/scoreCamera.ts`:
  - `ScanOptions` with `onVideoReady`
  - `MediaRecorder` integration with auto MIME discovery and timeslice buffering.
- `src/components/PhotoUploadPanel.tsx`:
  - `onVideoReady` upload bridge targeting `research-data/<device>/`.

## Data and migrations
Not applicable: no database, server storage, or URL schema changes.

## Failure modes and edge cases
If `MediaRecorder` is unsupported, catch error and proceed with camera OCR. If network upload fails, show toast notification while preserving the captured score draft in UI.

## Security, privacy, and permissions
Camera stream recorded only during explicit user-initiated scan session. Videos transmitted only when PC drop mode is explicitly enabled with matching 6-digit PIN over authenticated HTTPS tunnel.

## Observability and operations
Upload progress percentages, success notices, and error toasts reported via existing mobile UI drop status badge.

## Test strategy
1. Unit tests in `scoreCamera.test.ts` verifying 3-frame capture timing and thresholding.
2. Unit tests in `scoreCamera.test.ts` mocking `MediaRecorder` to verify start, stop, chunk aggregation, and `onVideoReady` invocation.
3. Component tests in `PhotoUploadPanel.test.tsx` verifying scan status text and options passing.
4. Full regression suite across repository (`npm test`).

## Acceptance criteria
- AC-001: `scoreCamera.ts` defaults require 3 matching frames spanning at least 200ms within `1500ms` to trigger capture.
- AC-002: `PhotoUploadPanel.tsx` displays `점수 확인 중 (${count}/3회)` during active consensus building.
- AC-003: `scoreCamera.ts` initializes `MediaRecorder` and invokes `onVideoReady` upon capture completion or session stop with status.
- AC-004: Unit tests in `scoreCamera.test.ts` pass for 3-frame capture and `MediaRecorder` lifecycle.
- AC-005: Full test suite (`npm test`) and production build (`npm run build`) pass cleanly.

## Traceability
Stability threshold upgrade → REQ-001, REQ-002 → AC-001, AC-002. Video recording lifecycle → REQ-003, REQ-004, REQ-005, REQ-007 → AC-003. Mobile drop auto-upload → REQ-006 → AC-003. Unit tests and quality verification → REQ-008 → AC-004, AC-005.

## Open decisions
None blocking. User explicitly decided Option 1-A and Option 2-B.
