# Specification

## Metadata and source
- Work ID: table-pre-classification
- Artifact mode: canonical
- Artifact revision: 2
- Language: en
- Source: intent.md revision 2

## Summary
Define requirements and acceptance criteria for an automated mahjong table model pre-classifier in `mahjong.aquaco.work`. The pre-classifier inspects camera frames upon scan startup to determine whether the table is an AMOS REXX 3 or an AMOS JP-EX based on hardware characteristics (CHECK LED color and location), automatically setting the active recognition model while preserving user manual override capability in the UI.

## Functional requirements
- `REQ-001`: Implement `classifyTableModel(image: { width: number; height: number; data: Uint8ClampedArray }): TableClassificationResult` in `src/utils/tableClassifier.ts`. The result MUST return `{ model: TableModel | null; confidence: number; reason?: string }`.
- `REQ-002`: The classifier MUST identify AMOS REXX 3 (`amos_rexx3`) by detecting a bright green LED cluster in the upper-left quadrant of the scoreboard area, yielding `confidence >= 0.8`.
- `REQ-003`: The classifier MUST identify AMOS JP-EX (`amos_jp_ex`) by detecting an amber/yellow LED cluster in the upper-right quadrant of the scoreboard area, yielding `confidence >= 0.8`.
- `REQ-004`: The classifier MUST return `{ model: null, confidence: 0 }` when neither characteristic LED is detected (such as when the user zooms in exclusively on the digit segments or in dark frames), ensuring the system does not make arbitrary false-positive switches.
- `REQ-005`: In `src/utils/scoreCamera.ts`, `ScanOptions` MUST support an `onModelDetected?: (model: TableModel) => void` callback. During the initial sampling period, if `classifyTableModel` detects a model with confidence >= 0.8, it MUST invoke `onModelDetected` and update the recognizer's active model.
- `REQ-006`: In `src/components/PhotoUploadPanel.tsx`, the UI MUST reflect the auto-detected model in the `<select>` dropdown and display an indicator (e.g. "자동 감지됨: AMOS JP-EX"). If the user manually changes the dropdown, auto-detection MUST be disabled for the remainder of that scan session to honor user preference.

## Non-functional requirements
- Processing MUST remain 100% client-side inside the browser using HTML5 Canvas; no images or pixel arrays may be transmitted to external servers.
- Pre-classification per frame MUST execute in less than 5 milliseconds on standard mobile browsers (using simple bounding-box sampling and HSV/RGB thresholding without external libraries or neural networks).
- TypeScript compilation (`npx tsc --noEmit`) MUST succeed with zero errors.

## User experience and flows
1. User opens the score scan panel on mobile or desktop.
2. The UI initializes with the default or previously persisted table model (e.g. `AMOS REXX 3`).
3. User points the camera at the scoreboard.
4. Within the first 1-2 frames, `classifyTableModel` detects the hardware markers (e.g. amber LED on top-right for AMOS JP-EX).
5. The UI dropdown automatically switches to `AMOS JP-EX` and displays an auto-detected badge (`✨ 자동 감지됨: AMOS JP-EX`).
6. If the user intentionally changes the dropdown manually, auto-detection is suppressed for the rest of that session.

## Architecture and interfaces
- `src/utils/tableClassifier.ts`:
  - `export interface TableClassificationResult { model: TableModel | null; confidence: number; reason?: string; }`
  - `export function classifyTableModel(image: { width: number; height: number; data: Uint8ClampedArray }): TableClassificationResult;`
- `src/utils/scoreCamera.ts`:
  - `ScanOptions`: add `onModelDetected?: (model: TableModel) => void`.
- `src/components/PhotoUploadPanel.tsx`:
  - Internal state: `detectedModel: TableModel | null`, `manualOverride: boolean`.

## Data and migrations
- No database migrations or schema alterations required.
- `localStorage['mahjong_table_model']` persists user choice across sessions.

## Failure modes and edge cases
- **Extreme close-up (LED out of frame)**: Pre-classifier returns `model: null, confidence: 0`. The system gracefully falls back to the current active model without interrupting scanning.
- **Ceiling light glare over LED**: Evaluates hue ratio and saturation to distinguish pure white glare from saturated green/amber LED emission.
- **Manual override conflict**: Manual selection takes strict precedence over auto-detection.

## Security, privacy, and permissions
- Zero frame or pixel data leaves the user device.
- All heuristics run entirely in-memory on the client canvas.

## Observability and operations
- Console debug logging in development environment.
- Auto-detection events emitted to `onModelDetected` for component monitoring.

## Test strategy
- Unit tests: `tableClassifier.test.ts` with real REXX 3 and JP-EX fixtures and edge-case blank/glare frames.
- Integration tests: `scoreCamera.test.ts` verifying `onModelDetected` trigger and `PhotoUploadPanel.test.tsx` verifying UI state sync and manual override precedence.
- Regression tests: Full Jest test suite and production build.

## Acceptance criteria
- `AC-001`: Real REXX 3 sample frames (`rexx3_scan_2026-09-15T10-57-53-542Z.jpg`, `frame_PXL_20260914_121752679.jpg`) are classified as `amos_rexx3` with confidence >= 0.8.
- `AC-002`: Real JP-EX sample frames (`KakaoTalk_20230528_2.jpg`, `jpex_live_screenshot_crop.jpg`) are classified as `amos_jp_ex` with confidence >= 0.8.
- `AC-003`: Ambiguous/featureless frames return `model: null` with confidence < 0.5 without throwing exceptions.
- `AC-004`: `PhotoUploadPanel` tests verify that `onModelDetected` updates state and manual dropdown interaction takes precedence over auto-detection.

## Traceability
- `REQ-001` -> `AC-001`, `AC-002`
- `REQ-002` -> `AC-001`
- `REQ-003` -> `AC-002`
- `REQ-004` -> `AC-003`
- `REQ-005` -> `AC-004`
- `REQ-006` -> `AC-004`

## Open decisions
- None. LED position and hue thresholding confirmed by real parlor photo evidence.
