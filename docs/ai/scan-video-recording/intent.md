# Intent

## Metadata
- Work ID: scan-video-recording
- Artifact revision: 2
- Language: en
- Korean mirror: intent.ko.md
- Originator: user conversation
- Status: ready
- Risk: standard
- Created: 2026-09-15
- Updated: 2026-09-15
- Owner: root implementation agent

## Originating request
"지금 점수 인식 알고리즘이 1.5초 이내에 같은 점수들을 인식한 것이 2건 있으면 확정하는 방식인 걸로 아는데, 테스트 결과가 매우 빠르게 잘 되는거 같으니 1.5초 내 3건으로 올려봐도 될지 점검해봐."
"그러면 인식 판독 알고리즘 수정하는김에 인식 시작 누를때부터 인식될때까지 영상을 pc로 보내는 걸로 수정하자. 결과 스샷만으로는 알 수 있는 정보가 의미가 없어."
"질문 1 옵션 a, 질문 2 옵션 b로 결정할께. 영상의 가장 마지막 장면이 3회 일치 판정이니 굳이 이미지를 따로 보낼 필요 없어. 그렇게 진행해줘."

English synthesis: Upgrade the live camera score stability confirmation requirement from 2 to 3 matching frames within the `1500ms` sliding window (`countThreshold = 3`, `spanMsThreshold = 200ms`). In parallel, replace the static final frame screenshot upload with automatic recording and transmission of the entire camera scan stream from start until recognition (or cancellation/failure) via `MediaRecorder` and `uploadToMobileDrop` directly to the PC workspace (`research-data/<device>/`).

## Problem and evidence
During field testing on physical AMOS REX III tables, the recognizer performed so quickly (`120ms`) that 2 matching frames triggered capture before the user could visually perceive progress, creating a minor risk of early fluke capture during initial camera alignment. Furthermore, transferring only a single static freeze-frame (`.jpg`) to the PC yields insufficient diagnostic data: it is impossible to see why certain angles or frames suffered glare or flickered before stabilization. Recording the full camera session from scan start to completion provides complete temporal insight into table lighting, camera trajectory, glare angles, and OCR transitions. Because the final frame of the video corresponds precisely to the 3-frame consensus state, sending redundant `.jpg` snapshots is unnecessary.

## Desired outcomes
1. Raise the camera score recognition consensus threshold to 3 matching frames (`countThreshold = 3`, `spanMsThreshold = 200ms`) within the `1500ms` window in `scoreCamera.ts` and update the UI progress indicator to `(${count}/3회)` in `PhotoUploadPanel.tsx`.
2. Capture the full camera stream during active scanning using standard browser `MediaRecorder` (`video/mp4` preferred on iOS Safari, `video/webm` on Android Chrome) without degrading OCR frame rates or blocking UI.
3. Automatically transfer the recorded scan video to the PC development host via `uploadToMobileDrop` into `research-data/<device>/`:
   - Success scans: `${device}_scan_${timestamp}.${ext}`
   - Canceled or failed scans: `${device}_fail_${timestamp}.${ext}`
4. Cease redundant still snapshot image transfers, keeping the video file as the single canonical diagnostic test record.
5. Provide graceful fallback in browsers/environments lacking `MediaRecorder` (such as legacy test environments).
6. Verify all test suites and production build pass cleanly (`npm test`).

## Scope
- `src/utils/scoreCamera.ts`: Default threshold update to 3 frames / 200ms, `MediaRecorder` lifecycle integration, and `onVideoReady` callback in `ScanOptions`.
- `src/components/PhotoUploadPanel.tsx`: UI label update to `(${count}/3회)` and video auto-drop handler wiring.
- `src/utils/scoreCamera.test.ts`: Updated 3-frame assertions and `MediaRecorder` unit test coverage.
- AI-Native SDLC artifact chain in `docs/ai/scan-video-recording/`.

## Non-goals
- Modifying offline file/photo manual upload mode.
- Changing OCR digit slicing or neural model weights.
- Storing scan videos on third-party cloud services.
- Sending redundant still images when video upload is enabled.

## Constraints and policies
- `MediaRecorder` must execute asynchronously without degrading the ~10 FPS OCR analysis loop.
- UI draft review transition must occur immediately upon score stability without waiting for video compression or network upload.
- File naming and device directory routing must preserve existing multi-device rules (`rex 3`, `jp-ex`, `jp-color`).

## Acceptance signals
1. Stability consensus requires 3 matching valid frames spanning >= 200ms within `1500ms`.
2. Status prompt displays `(${count}/3회)`.
3. When live scan starts, `MediaRecorder` commences recording; upon stop (capture, cancel, or timeout), a complete video Blob is generated and emitted.
4. When mobile-drop is configured, the video is automatically uploaded to the PC receiver in chunks.
5. All test suites pass cleanly (`npm test`).

## Assumptions and open questions
- The user explicitly chose Option 1-A (record and send both successful and canceled/failed scans) and Option 2-B (send video only, omit redundant still images).
- `MediaRecorder` default container on iOS Safari is MP4 (`video/mp4`) and on Android Chrome is WebM (`video/webm`) or MP4.

## Decisions
- Adopt 3-frame consensus threshold (`countThreshold = 3`, `spanMsThreshold = 200ms`).
- Transmit full video stream for both success and canceled/failed scans.
- Omit separate still screenshot transfers when video recording is active.
