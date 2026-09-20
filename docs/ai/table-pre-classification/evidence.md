# Evidence

## Change summary
- Work ID: table-pre-classification
- Artifact mode: canonical
- Artifact revision: 2
- Language: en
- Status: READY
- Updated: 2026-09-20

Implemented automated mahjong table model pre-classifier (`classifyTableModel`) before OCR scoreboard recognition in MVP 1. The pre-classifier detects physical CHECK LED indicators (green LED cluster on left for AMOS REXX 3 vs amber/yellow LED cluster on top-right for AMOS JP-EX) with sub-5ms latency and > 0.8 confidence. Integrated into `scoreCamera.ts` (`onModelDetected` callback) and `PhotoUploadPanel.tsx` (auto-syncing model state and displaying `✨ 자동 감지됨` badge while strictly honoring user manual override).

## Requirement coverage
| Requirement ID | Acceptance ID | Plan Task | Status | Proof / Evidence |
|---|---|---|---|---|
| `REQ-001` | `AC-001`, `AC-002` | `TASK-001`, `TASK-002` | Satisfied | `src/utils/tableClassifier.ts` implements `classifyTableModel` returning `TableClassificationResult`. Tested in `src/utils/tableClassifier.test.ts`. |
| `REQ-002` | `AC-001` | `TASK-001`, `TASK-002` | Satisfied | `classifyTableModel` identifies AMOS REXX 3 (`amos_rexx3`) on real RGB fixture with confidence = 0.98 via green CHECK LED cluster at (204, 377). |
| `REQ-003` | `AC-002` | `TASK-001`, `TASK-002` | Satisfied | `classifyTableModel` identifies AMOS JP-EX (`amos_jp_ex`) on real RGB fixture with confidence = 0.98 via amber CHECK LED cluster at (686, 308). |
| `REQ-004` | `AC-003` | `TASK-001`, `TASK-002` | Satisfied | Tested in `tableClassifier.test.ts`: empty images, zero-length data, white glare, and black frames return `model: null` with confidence = 0 without throwing errors. |
| `REQ-005` | `AC-004` | `TASK-003` | Satisfied | `scoreCamera.ts` supports `onModelDetected` in `ScanOptions`. Verified in `scoreCamera.test.ts`: fires with `'amos_jp_ex'` and updates active recognizer model. |
| `REQ-006` | `AC-004` | `TASK-004`, `TASK-005` | Satisfied | `PhotoUploadPanel.tsx` auto-syncs dropdown to detected model, shows `✨ 자동 감지됨` badge, and manual user dropdown interaction suppresses auto-detection. Verified in `PhotoUploadPanel.test.tsx`. |

## Test and quality results
- `npx tsc --noEmit`: Exit code 0, 0 errors.
- `npm test -- src/utils/tableClassifier.test.ts --watchAll=false --forceExit`: 1 suite passed, 5 tests passed (10.355s).
- `npm test -- src/utils/scoreCamera.test.ts --watchAll=false --forceExit`: 1 suite passed, 17 tests passed (2.914s).
- `npm test -- src/components/PhotoUploadPanel.test.tsx --watchAll=false --forceExit`: 1 suite passed, 18 tests passed (6.755s).
- `npm test -- --watchAll=false --forceExit`: 16 suites passed, 116 tests passed, 0 failures (16.996s).
- `npm run build`: Compiled successfully (main bundle 119.47 kB, gzip).

## End-to-end evidence
- Evaluated against real parlor fixtures (`scoreRecognition.rgb.fixture.json` for REXX 3 and `scoreRecognition.jpex.fixture.json` for JP-EX):
  - REXX 3 classified as `amos_rexx3` (confidence 0.98, green LED cluster at 204, 377).
  - JP-EX classified as `amos_jp_ex` (confidence 0.98, amber LED cluster at 686, 308).
- Portrait/rotated frames verified: 90° CCW/CW rotation fallback correctly detects table model when mobile camera is held in vertical portrait orientation.

## Review findings and resolutions
- Red Team finding: User noted that evaluating multiple model hypotheses during OCR scales poorly as more models are introduced ($O(N)$). Resolved by introducing this lightweight pre-classifier before OCR ($O(1)$, < 5ms).
- Ambiguity prevention: Bounding box compactness check (`compW <= 35, compH <= 35`) and pixel count thresholds (`4 <= count <= 150`) successfully prevent green table felt mats or wooden table borders from triggering false-positive LED detections.

## Deployment or handoff
- Client-side application update only. No schema or database migrations required.

## Release readiness
- Overall status: READY

## Residual risks
- Extreme close-up shots where the user frames only the digits and completely excludes the LED area; mitigated by falling back gracefully to the current/persisted model (`model: null, confidence: 0`) without interrupting or blocking the user.
