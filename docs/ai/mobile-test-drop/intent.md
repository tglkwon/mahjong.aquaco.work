# Intent

## Metadata
- Work ID: mobile-test-drop
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
"mvp 1 의 테스트 사이트를 만들때 영상 인식하는 장면을 매번 수동 스크린샷으로 여기 보내거나, 아니면 비슷한 각도의 영상을 따로 찍어서 그걸 나중에 pc로 전송하는 작업을 하고 있었어. 글로벌 스킬로 mobile-drop을 만들었고, 그걸 살려서 모바일에서 실제 테스트할 때 점수 인식 페이지에서 점수인식 + 이 프로젝트로 영상 전송하는 임시 기능을 만들고 싶어."

English synthesis: Create a temporary test utility inside the score recognition page (`ScorePhotoInputPage` / `PhotoUploadPanel`) that integrates with the existing global `mobile-drop` receiver, enabling testers on real mobile devices to perform scoreboard score recognition while automatically or manually transferring the captured test video/photo and recognition results directly into the local project workspace on PC.

## Problem and evidence
During MVP 1 mobile field testing for mahjong scoreboard recognition, developers/testers have to capture manual screenshots or shoot separate offline test videos to share with the AI agent and PC workspace for debugging. This introduces context switching, tedious manual file transfers, and loss of exact synchronization between the recognizer's input frames and the recorded file. The repository already features client-side frame extraction, REXX 3 OCR, and live camera scanning, but all processing currently remains strictly ephemeral in browser memory with zero upload capability. Meanwhile, a global skill `mobile-drop` provides a local Python chunked receiver server and a Cloudflare Quick Tunnel (`trycloudflare.com`) with PIN verification.

## Desired outcomes
1. Enable an opt-in/temporary developer test bridge on the score recognition page that connects to an active `mobile-drop` session on PC.
2. In photo/video upload mode, allow users to capture/select a video or photo file from the native camera, run local scoreboard recognition, and transfer the media file directly to the PC workspace (`./uploads/` or `research-data/`) via chunked upload.
3. In live scan mode, allow recording the camera stream during active scanning (via `MediaRecorder`) or dropping the captured high-resolution frame image along with recognition candidate metadata.
4. Keep the test bridge completely non-intrusive and reversible, ensuring normal production users are not affected and no data is leaked to third parties without an explicit drop session URL and PIN.

## Scope
- Score recognition UI (`PhotoUploadPanel.tsx` / `ScorePhotoInputPage.tsx`) developer toggle / test bridge.
- Pairing mechanism: Cloudflare Quick Tunnel URL and 6-digit PIN input, persistable in `localStorage` and optionally pre-fillable via query parameters (`?dropUrl=...&dropPin=...`).
- Multi-device target table routing (`rex3` -> `research-data/rex 3`, `jpex` -> `research-data/jp-ex`, `jpcolor` -> `research-data/jp-color`) via CLI and UI selector.
- Upload client module implementing the `mobile-drop` chunked upload protocol (`/upload/chunk`, `/upload/complete`).
- Media transfer support: original video/photo file upload, live scan capture snapshot drop, and optional test clip recording.
- Companion test metadata (detected scores, confidence, timestamp) included in drop payload or filename.
- Developer helper command/script in project to launch a mobile-drop session directly targeted at `./uploads/` or `research-data/`.

## Non-goals
- Permanent cloud storage backend, AWS S3, or third-party database integration.
- Permanent UI clutter or modifying existing production score calculation, Uma/Oka tables, or URL share state formats.
- Rewriting the core REXX 3 OCR algorithm itself.
- Supporting multi-tenant simultaneous test drops.

## Constraints and policies
- Security: Only send media when the user explicitly provides a valid `mobile-drop` Cloudflare Tunnel URL and PIN. Default behavior must remain 100% local in-browser memory.
- Mobile browser compatibility: Must support iOS Safari and Android Chrome without crashing or blocking the UI thread during chunked transfers.
- Reversibility: The temporary test feature must be cleanly isolated so it can be enabled/disabled via a toggle or removed when MVP 1 testing concludes.

## Acceptance signals
1. Connecting with a valid `mobile-drop` tunnel URL and PIN shows an active connection status badge.
2. Selecting or shooting a scoreboard video/photo executes OCR recognition and simultaneously uploads the media file in chunks to the PC `./uploads/` directory.
3. Live scan capture can drop the captured frame image or recorded video clip to the PC `./uploads/` directory upon capture or via a test drop button.
4. Upload progress and completion/error alerts are visible on mobile.
5. All existing 11 test suites (73 tests) and production build continue to pass without regression.

## Assumptions and open questions
- Assumption: The PC runs `mobile-drop` (either via global skill or a convenience project script) to establish a Cloudflare tunnel URL accessible from mobile over HTTPS.
- Open questions resolved: Continuous session mode is adopted as default in project helper for repeatable testing; live scan provides snapshot frame drop with companion score metadata, and full video upload is supported via file/camera input.

## Decisions
- Work ID: `mobile-test-drop`.
- Risk classified as `standard`: Local testing utility using existing ephemeral tunnel, fully reversible, no production data or irreversible state changes.
- Status is marked `ready` following visual preview validation and user approval. Continuous session and snapshot/file drop workflows are confirmed.
