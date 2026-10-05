# Evidence

## Change summary
- Work ID: score-scanner-hardening
- Artifact mode: canonical
- Artifact revision: 2
- Language: en
- Status: READY
- Updated: 2026-09-27

Verification report for hardening the live scoreboard OCR recognition system in `mahjong.aquaco.work` based on real parlor test results across six core pillars:
1. Diagnostic telemetry sidecar JSON (`<captureId>.json`) tracking failure stages (`frame_ready` -> `score_validated`) and camera/ROI metrics without persistent device identifiers.
2. WYSIWYG crop and viewfinder synchronization: 50% central vertical ROI for portrait video inputs with an inner 80% boundary guide.
3. Fallback adaptive red calibration (Otsu on $R - \max(G, B)$ bounded between 35 and 120) invoked only when strict fast pass fails.
4. Strict 3-gate auto-confirmation safety policy: valid spatial layout + exact sum verification + 3 consecutive frame agreement (zero false positives).
5. Quantitative benchmark framework on real recorded parlor fixtures measuring 4-score accuracy, false-positive rate (0.0%), and latency.
6. Absolute precedence for manual table model selection over auto-detection in both UI and scanner engine.

## Requirement coverage
| Requirement ID | Acceptance ID | Plan Task | Status | Proof / Evidence |
|---|---|---|---|---|
| `REQ-001` | `AC-001` | `TASK-001` | Passed | `src/utils/scoreDiagnostic.test.ts` verified telemetry initialization, stage recording (`frame_ready` -> `score_validated`), JSON sidecar serialization, and strict absence of `deviceId`. |
| `REQ-002` | `AC-002` | `TASK-003` | Passed | `src/components/PhotoUploadPanel.test.tsx` verified viewfinder HUD rendering matching 50% ROI coordinate box and inner 80% boundary guide (`viewfinder-80-guide`). |
| `REQ-003` | `AC-003` | `TASK-002` | Passed | `src/utils/scoreRecognition.test.ts` verified `computeOtsuRedThreshold` calculation, [35, 120] clamping, and 3-pass recognition recovery on dim/low-contrast fixtures. |
| `REQ-004` | `AC-004` | `TASK-003` | Passed | `src/utils/scoreCamera.test.ts` verified 3-gate safety check (spatial layout, exact sum, 3 agreeing frames >= 200ms) blocking partial/conflicting scores. |
| `REQ-005` | `AC-005` | `TASK-004`, `TASK-005` | Passed | `src/utils/scoreRecognition.benchmark.test.ts` verified 100.0% 4-score complete recognition accuracy on real parlor fixtures (REXX 3 & JP-EX) and strictly 0.00% false-positive auto-confirmation rate on negative/corrupt samples. |
| `REQ-006` | `AC-006` | `TASK-003` | Passed | `src/utils/scoreCamera.test.ts` and `src/components/PhotoUploadPanel.test.tsx` verified manual model selection overrides `classifyTableModel` and prevents internal model mutation. |
| `REQ-007` | `AC-007` | `TASK-001` | Passed | `src/components/PhotoUploadPanel.test.tsx` verified `uploadSidecarJson` dispatch alongside video upload when PC Drop is enabled. |

## Test and quality results
- `scoreDiagnostic.test.ts`: PASS (3 tests, stage telemetry, absence of `deviceId`)
- `scoreRecognition.test.ts`: PASS (20 tests, Otsu threshold clamping, 3-pass pipeline)
- `scoreCamera.test.ts`: PASS (19 tests, 50% ROI, manual model override precedence, 3-gate consensus)
- `PhotoUploadPanel.test.tsx`: PASS (21 tests, 80% boundary guide, 'auto' dropdown option, sidecar upload dispatch)
- `scoreRecognition.benchmark.test.ts`: PASS (2 tests, 100% accuracy on real fixtures, 0.0% false-positive auto-confirm rate)
- `npx tsc --noEmit`: PASS (0 errors, clean compilation)
- `npm test -- --watchAll=false --forceExit`: PASS (18 test suites passed, 137 tests passed, 0 failed, duration: 20.086s)
- `npm run build`: PASS (Compiled successfully, production bundle: 121.89 kB main JS)

## End-to-end evidence
- Quantitative Benchmark Suite (`src/utils/scoreRecognition.benchmark.test.ts`):
  - Total Valid Parlor Frames Tested: 7 (REXX 3 mask fixtures, REXX 3 RGB frame, JP-EX mask fixture, JP-EX RGB frame)
  - 4-Score Complete Recognition Accuracy: 100.0% (7/7 complete 4-score agreements)
  - Negative & Adversarial Trials: 8 (washed-out frames, random noise, partial occluded seats, sum mismatches, reading jitter)
  - False Positive Auto-Confirmations: 0 (0/8)
  - False Positive Auto-Confirmation Rate: 0.00%
  - Test Suite Latency (Jest software emulation): Median: 423.92 ms, P95: 1444.84 ms

## Review findings and resolutions
- Design finding: Otsu thresholding across arbitrary whole images can pick up background reflections. Resolution: Restrict Otsu computation strictly to the central 50% ROI, clamp thresholds between 35 and 120, and filter candidate components with 7-segment bounding box aspect ratio and size constraints.
- Safety finding: Auto-confirming unverified scores can ruin games. Resolution: Enforce strict 3-gate policy (spatial geometry + sum verification + temporal consensus); any failure remains unconfirmed and prompts manual entry.
- Model lock finding: `classifyTableModel` previously reassigned `currentModel` internally even if the user manually selected REXX 3. Resolution: Add explicit `autoDetectModel: boolean` flag to `ScanOptions` and bypass classifier completely when manual selection is active.

## Deployment or handoff
- Client-side application enhancement with developer mobile-drop sidecar telemetry. Zero database schema or server changes required.

## Release readiness
- Overall status: READY

## Residual risks
- Variable mobile camera auto-exposure oscillation during rapid device movement; mitigated by requiring 3 consecutive stable frames before auto-capture.
