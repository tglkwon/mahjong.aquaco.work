# Specification

## Metadata and source
- Work ID: mobile-test-drop
- Artifact revision: 2
- Language: en
- Korean mirror: spec.ko.md
- Source: intent.md revision 2
- Status: ready
- Risk: standard
- Created: 2026-09-15
- Updated: 2026-09-15
- Owner: root implementation agent

## Summary
Provide an ephemeral mobile-to-PC test utility on `ScorePhotoInputPage` / `PhotoUploadPanel` that interfaces with the local `mobile-drop` receiver. When testing on real mobile devices, developers can execute scoreboard OCR and transmit raw test media (video/photo file or captured scan frame) directly to `./uploads/` on the PC development host over an authenticated Cloudflare Quick Tunnel.

## Functional requirements
- `REQ-001`: Implement a modular TypeScript client (`src/utils/mobileDropClient.ts`) that uploads binary data (Blob or File) in 8 MB chunks via HTTP POST to `/upload/chunk` and finalizes via `/upload/complete` using the `X-Session-Token` header.
- `REQ-002`: Provide health-check/ping verification via `GET /status` to confirm tunnel connectivity and session token validity.
- `REQ-003`: Add a developer toggle/panel in `PhotoUploadPanel.tsx` to configure or toggle "PC Drop Mode", allowing entry of Cloudflare Tunnel URL and 6-digit PIN.
- `REQ-004`: Support automatic credential pre-population via URL query parameters (`?dropUrl=...&dropPin=...`) and persistent caching in `localStorage`.
- `REQ-005`: In file/camera upload mode, enable selecting video or photo files (`accept="video/*,image/*"`), perform local scoreboard frame extraction and OCR, and stream the original file to PC `./uploads/`.
- `REQ-006`: In live camera scan mode, provide a one-click or automatic transfer of the stable captured high-resolution snapshot (JPEG) and accompanied candidate scores JSON metadata to PC `./uploads/`.
- `REQ-007`: Provide real-time UI feedback on mobile during upload (transfer status, progress percentage bar, and success/error toasts).
- `REQ-008`: Add a project helper script (`scripts/start-test-drop.ps1`) to orchestrate the local Python receiver and Cloudflare tunnel with support for a continuous test session targeting `./uploads/`.
- `REQ-009`: Support multi-device destination routing (`rex3` -> `research-data/rex 3`, `jpex` -> `research-data/jp-ex`, `jpcolor` -> `research-data/jp-color`) via `X-Target-Device` HTTP header, CLI arguments, and UI dropdown in `PhotoUploadPanel`.

## Non-functional requirements
- Security: Zero telemetry or network transmission unless the user explicitly enables PC Drop Mode and provides a matching PIN. All traffic must transit over HTTPS Cloudflare Quick Tunnel to prevent browser Mixed Content errors.
- Resilience: Non-blocking async upload so that UI and OCR processing remain responsive on mobile devices (iOS Safari and Android Chrome).
- Zero production impact: The test bridge must be disabled by default and invisible to ordinary production users not opening the developer toggle or test query parameters.

## User experience and flows
1. **PC Preparation**: Developer runs `pwsh.exe -File scripts/start-test-drop.ps1`. The script launches the receiver and prints the clickable test URL: `http://localhost:3000/#/set_score_photo?dropUrl=...&dropPin=...` (or tunneled equivalent).
2. **Mobile Connection**: Developer opens the link on mobile. The "PC 전송 모드" banner automatically displays `🟢 연결됨 (PIN: ******)`.
3. **Capture & Recognition**:
   - Case A (Photo/Video): Developer taps "📷 점수판 촬영하기" or selects a recorded video. The app parses scores locally and immediately uploads the media to PC.
   - Case B (Live Scan): Developer taps "실시간 스캔 시작". Upon stable 2-frame agreement, the app freezes the frame, displays detected scores, and uploads the frame JPEG + scores JSON to PC.
4. **Completion**: A green badge confirms `✅ PC 전송 완료: uploads/<filename>`, and the file is immediately available in the PC workspace.

## Architecture and interfaces
- `src/utils/mobileDropClient.ts`:
  - `checkDropStatus(serverUrl: string, pin: string): Promise<{ ok: boolean; message?: string }>`
  - `uploadToMobileDrop(fileOrBlob: Blob | File, filename: string, options: DropUploadOptions): Promise<DropUploadResult>`
  - `DropUploadOptions`: `{ serverUrl: string; pin: string; onProgress?: (percent: number) => void; signal?: AbortSignal }`
- `src/components/PhotoUploadPanel.tsx`:
  - State: `dropConfig: { enabled: boolean; url: string; pin: string; autoUpload: boolean }`
  - State: `uploadState: { uploading: boolean; progress: number; message: string; status: 'idle' | 'success' | 'error' }`
- `scripts/start-test-drop.ps1`:
  - PowerShell script wrapping Python `server.py` with continuous mode and Cloudflare tunnel.

## Data and migrations
- Stored settings: `localStorage.getItem('mahjong_drop_config')` containing `{ url, pin, enabled, autoUpload }`.
- Target PC directory: `./uploads/`.
- File naming convention: `rexx3_<type>_<timestamp>.<ext>` and companion metadata `rexx3_<type>_<timestamp>.json`.

## Failure modes and edge cases
- Invalid PIN / 401 Unauthorized: Display clear inline alert "PIN 번호 불일치 또는 세션 만료".
- Network interruption / Tunnel disconnect: Abort chunk upload cleanly, notify user, and retain local OCR draft without data loss.
- Large video file (>50MB): Chunked 8MB streaming avoids Cloudflare 100MB body limit and prevents mobile browser memory exhaustion.
- Missing camera or permission: Handled gracefully by existing score camera error handlers.

## Security, privacy, and permissions
- No hardcoded tokens, passwords, or credentials.
- HTTPS encryption end-to-end via Cloudflare tunnel.
- Session PIN required on every chunk request header (`X-Session-Token`).

## Observability and operations
- Expose inline transfer progress, upload percentage, and error messages in the UI.
- Log server chunk receipt to local stderr in `test-drop-server.py`.
- Graceful shutdown on `-Stop` or process exit without lingering zombie processes.

## Test strategy
- Unit test `src/utils/mobileDropClient.test.ts` using mock `fetch` to verify chunking, headers, progress tracking, and error branches.
- Component integration test in `src/components/PhotoUploadPanel.test.tsx` verifying toggle expansion, URL query auto-population, and upload button invocation.
- Regression testing: Run full repository test suite (`npm test -- --watchAll=false`) and production build (`npm run build`).

## Acceptance criteria
- `AC-001`: `uploadToMobileDrop` successfully splits Blobs > 8MB into multiple chunks with correct headers and finishes with `/upload/complete`.
- `AC-002`: `checkDropStatus` returns `ok: true` when server responds with 200.
- `AC-003`: `PhotoUploadPanel` renders the PC Drop toggle, parses query parameters `dropUrl` and `dropPin`, and saves configuration in `localStorage`.
- `AC-004`: Uploading a photo/video file triggers local score recognition and concurrent chunk upload without blocking OCR.
- `AC-005`: Live scan auto-capture drops the captured frame image and companion score metadata to the configured endpoint.
- `AC-006`: Repository unit tests (73+ tests) pass and production build succeeds without error.
- `AC-007`: Target device selection dynamically routes uploads into `research-data/rex 3`, `research-data/jp-ex`, or `research-data/jp-color` with duplicate prevention and git ignore protection.

## Traceability
- `REQ-001` -> `AC-001`
- `REQ-002` -> `AC-002`
- `REQ-003` -> `AC-003`
- `REQ-004` -> `AC-003`
- `REQ-005` -> `AC-004`
- `REQ-006` -> `AC-005`
- `REQ-007` -> `AC-004`, `AC-005`
- `REQ-008` -> `AC-001`, `AC-002`
- `REQ-009` -> `AC-007`

## Open decisions
- None. All requirements and workflows are reconciled and confirmed.
