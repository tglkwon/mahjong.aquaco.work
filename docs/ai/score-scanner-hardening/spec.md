# Specification

## Metadata and source
- Work ID: score-scanner-hardening
- Artifact mode: canonical
- Artifact revision: 2
- Language: en
- Source: intent.md revision 2

## Summary
Define requirements, architecture, and verification criteria for hardening the real-time mahjong scoreboard OCR system in `mahjong.aquaco.work`. Based on field test videos and parlor findings, this specification introduces diagnostic telemetry sidecars, WYSIWYG viewfinder ROI alignment, an adaptive red dominance fallback (Otsu candidate), a strict 3-gate auto-confirmation safety policy, a multi-device video evaluation benchmark, and user manual model selection precedence over auto-classification.

## Functional requirements
- `REQ-001`: In `src/utils/scoreCamera.ts`, implement a diagnostic telemetry recorder that generates a JSON sidecar (`<captureId>.json`) sharing the exact same `captureId` as the recorded video. The telemetry MUST be sampled at representative frames (initial frame, first failure frame) and at session completion (`exitReason`). Stages tracked MUST include: `frame_ready` -> `red_candidates` -> `digit_groups` -> `decoded` -> `score_validated`. Telemetry MUST include camera resolution, FPS, orientation, applied ROI, analysis duration, red candidate count, digit group count, decoded readings, sum validation boolean, and exit reason (`consensus_achieved`, `canceled`, `timeout`, `failed`). The recorder MUST NOT collect persistent `deviceId`.
- `REQ-002`: In `src/components/PhotoUploadPanel.tsx`, align the viewfinder preview container and guide overlays to exactly match the 50% vertical center ROI extracted in `scoreCamera.ts` for portrait camera video. Render an inner 80% boundary guide within the active ROI to instruct users to fit all 4 scores inside the target box. For landscape video inputs, treat the full frame as ROI without clipping.
- `REQ-003`: In `src/utils/scoreRecognition.ts`, retain the existing strict red threshold as a fast 1st-pass path (<2ms). On failed frames where 4 valid scores are not decoded, execute an adaptive red calibration fallback: compute red dominance $D = R - \max(G, B)$ on the ROI, compute an Otsu threshold clamped strictly between 35 and 120, and filter candidate segments using digit bounding-box geometry (height, width, aspect ratio, area).
- `REQ-004`: In `src/utils/scoreCamera.ts` and `src/utils/scoreDraft.ts`, enforce a strict 3-gate safety check before auto-confirming scores (`onCapture`):
  1. Valid 4-score spatial layout (T-shape for AMOS REXX 3, Diamond for AMOS JP-EX).
  2. Exact score sum match (`sum === startingScore * 4`).
  3. Temporal stability (at least 3 consecutive frames with identical readings over >= 200ms).
  If any gate fails or multiple conflicting interpretations exist, do not auto-confirm; display status feedback and guide user to manual input.
- `REQ-005`: Create an offline evaluation benchmark test suite `src/utils/scoreRecognition.benchmark.test.ts` to evaluate recognition on real parlor fixtures and recorded test videos in `research-data/rex 3` with ground truth scores. Benchmark outputs MUST report: 4-score complete recognition accuracy, false-positive auto-confirmation rate (target 0.0%), and recognition latency (median and p95).
- `REQ-006`: In `src/components/PhotoUploadPanel.tsx` and `src/utils/scoreCamera.ts`, provide an explicit "자동 감지 (Auto)" option in the table model selector. When a user manually selects a specific model (`amos_rexx3` or `amos_jp_ex`), auto-detection MUST be completely suppressed in `scoreCamera.ts`, preventing `currentModel` from being overwritten during that scan session.
- `REQ-007`: In `src/utils/mobileDropClient.ts` and `src/components/PhotoUploadPanel.tsx`, support uploading the diagnostic JSON sidecar alongside the video file when mobile-drop is connected.

## Non-functional requirements
- `NFR-001`: Client-Side Privacy & Latency: Zero persistent device identifier collection; fast 1st-pass recognition < 5ms per frame; adaptive fallback < 15ms per frame.
- `NFR-002`: Zero False Positive Confirmation: The rate of auto-confirming incorrect scores on the benchmark dataset MUST remain 0.0%.
- `NFR-003`: Quality and Compatibility: All existing Jest unit tests MUST pass, TypeScript compilation (`npx tsc --noEmit`) MUST succeed with 0 errors, and production build (`npm run build`) MUST complete cleanly.

## User experience and flows
1. User opens the score scanner on mobile. The table model selector shows "자동 감지 (Auto)" by default, or the previously selected model.
2. If set to "자동 감지", the pre-classifier identifies REXX 3 vs JP-EX within the first 1-2 frames and updates the UI badge. If user manually chooses a model, that model remains strictly locked.
3. The viewfinder renders an exact letterbox/ROI viewport with an 80% inner target box. The user aligns the 4 scores inside the guide.
4. Clean frames decode instantly (<2ms) via the strict 1st pass. Dim or washed frames in challenging lighting seamlessly trigger the adaptive Otsu fallback without freezing the UI.
5. Once 3 consecutive frames agree with valid geometry and exact sum verification, the camera auto-captures with a shutter flash, immediately populating the score table.
6. If the scoreboard is obscured, ambiguous, or the sum does not verify, the scanner does NOT commit bogus numbers; it displays clear status feedback ("점수 확인 중... 직접 입력도 가능합니다").
7. Upon scan completion or termination, if mobile-drop is connected, both the video and the diagnostic `<captureId>.json` sidecar are transmitted to the developer workstation.

## Architecture and interfaces
- `src/utils/scoreDiagnostic.ts`:
  - `export interface DiagnosticTelemetry { captureId: string; timestamp: string; camera: { width: number; height: number; fps?: number; orientation: 'portrait' | 'landscape' }; roi: { x: number; y: number; width: number; height: number }; stages: DiagnosticStageRecord[]; exitReason: 'consensus_achieved' | 'canceled' | 'timeout' | 'failed'; userAgentModel?: string; }`
  - `export interface DiagnosticStageRecord { stage: 'frame_ready' | 'red_candidates' | 'digit_groups' | 'decoded' | 'score_validated'; durationMs: number; redPixels?: number; digitGroups?: number; decoded?: string[]; sumValid?: boolean; success: boolean; }`
- `src/utils/scoreCamera.ts`:
  - `ScanOptions`: Add `autoDetectModel?: boolean`, `onDiagnosticReady?: (diagnostic: DiagnosticTelemetry) => void`.
- `src/utils/scoreRecognition.ts`:
  - `computeOtsuRedThreshold(imageData: ImageData, minBound?: number, maxBound?: number): number`
  - `recognizeScoreboard(image: ImageData, model?: TableModel, options?: RecognitionOptions): ScoreCandidate[]`
- `src/utils/mobileDropClient.ts`:
  - `uploadSidecarJson(data: object, filename: string, options: DropUploadOptions): Promise<DropUploadResult>`

## Data and migrations
- No database migrations or persistent server schemas required.
- Local storage key `mahjong_table_model` stores `'auto' | 'amos_rexx3' | 'amos_jp_ex'`.

## Failure modes and edge cases
- **Severe ceiling glare or tinted lighting**: Fast 1st pass fails; adaptive $R - \max(G, B)$ Otsu fallback extracts digits. Clamped lower bound (35) ensures dark noise is rejected.
- **Incomplete or partially covered score**: Digit group count < 4 or sum validation fails; 3-gate safety policy rejects auto-confirmation.
- **Camera disconnected / permission denied**: Clean error message with direct manual input fallback.
- **Manual override conflict**: Manual selection takes absolute precedence over `classifyTableModel`.

## Security, privacy, and permissions
- Zero personally identifiable information (PII) or hardware IDs (`deviceId`) stored or transmitted.
- Diagnostic telemetry contains only optical dimensions, pipeline timings, and score draft numbers.

## Observability and operations
- Sidecar JSON files saved directly to `research-data/<device>/` when mobile-drop developer session is active.
- Real-time consensus gauge (1-3 dots) and HUD displayed in viewfinder.

## Test strategy
- Unit Tests: `scoreDiagnostic.test.ts`, `scoreRecognition.test.ts` (adaptive Otsu fallback test cases), `scoreCamera.test.ts` (WYSIWYG ROI and manual override precedence).
- Component Tests: `PhotoUploadPanel.test.tsx` (viewfinder guide, auto option, sidecar upload).
- Benchmark Suite: `scoreRecognition.benchmark.test.ts` executing on real fixture images and video frames from `research-data/rex 3`.

## Acceptance criteria
- `AC-001`: Diagnostic telemetry sidecar JSON is generated with `captureId`, camera metrics, stage breakdowns (`frame_ready` -> `score_validated`), and no `deviceId`.
- `AC-002`: Viewfinder in `PhotoUploadPanel.tsx` presents an exact matching 50% ROI coordinate box with an inner 80% boundary guide for portrait streams.
- `AC-003`: `recognizeScoreboard` adaptive fallback successfully resolves dimly lit or low-contrast sample frames that fail the strict threshold pass.
- `AC-004`: Auto-confirmation (`onCapture`) triggers ONLY when spatial layout, sum verification, and 3-frame consensus all pass.
- `AC-005`: Benchmark test suite passes on real fixture frames with 0.0% false-positive auto-confirmation rate.
- `AC-006`: When table model is set to `amos_rexx3` or `amos_jp_ex`, auto-detection is suppressed and cannot change `currentModel`.
- `AC-007`: Mobile-drop client uploads both the video file and the `.json` diagnostic sidecar upon session finish.

## Traceability
- `REQ-001` -> `AC-001`
- `REQ-002` -> `AC-002`
- `REQ-003` -> `AC-003`
- `REQ-004` -> `AC-004`
- `REQ-005` -> `AC-005`
- `REQ-006` -> `AC-006`
- `REQ-007` -> `AC-007`

## Open decisions
- None. Otsu parameter bounds (35 to 120) and 3-gate safety criteria aligned with user design rules.
