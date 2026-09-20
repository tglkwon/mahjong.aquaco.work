# Evidence

## Change summary
- Work ID: jp-ex-score-recognition
- Artifact mode: canonical
- Artifact revision: 2
- Language: en
- Status: READY
- Updated: 2026-09-20

Phase 2 implementation and verification completed successfully. All requirements and acceptance criteria satisfied with real Parlor data fixtures and full test suite regression passing.

## Requirement coverage
| Requirement ID | Acceptance ID | Plan Task | Status | Proof / Evidence |
|---|---|---|---|---|
| `REQ-001` | `AC-001` | `TASK-001` | Satisfied | `scoreRecognition.test.ts` passes with 2-digit group `97` recognized without being discarded |
| `REQ-002` | `AC-002` | `TASK-002` | Satisfied | `scoreRecognition.test.ts` passes JP-EX Diamond layout test without rank slicing |
| `REQ-003` | `AC-002` | `TASK-002` | Satisfied | `scoreRecognition.jpex.fixture.json` created from `KakaoTalk_20230528_2.jpg`; mask and RGB tests pass with `['220', '483', '200', '97']` |
| `REQ-004` | `AC-003` | `TASK-003`, `TASK-004` | Satisfied | `scoreCamera.test.ts` verifies `options.model` passed to `recognizeScoreboard`; `PhotoUploadPanel.test.tsx` (16 passed) verifies UI selection and persistence |
| `REQ-005` | `AC-004` | `TASK-005` | Satisfied | Full Jest suite: 15 suites passed, 107 tests passed; `npx tsc --noEmit` passed (0 errors); `npm run build` compiled successfully |

## Test and quality results
- `npm test -- src/utils/scoreRecognition.test.ts --watchAll=false --forceExit`: Exit code 0 (1 passed, 17 tests passed)
- `npm test -- src/components/PhotoUploadPanel.test.tsx --watchAll=false --forceExit`: Exit code 0 (1 passed, 16 tests passed)
- `npm test -- src/utils/scoreCamera.test.ts --watchAll=false --forceExit`: Exit code 0 (1 passed, 15 tests passed)
- `npx tsc --noEmit`: Exit code 0 (0 type errors)
- `npm test -- --watchAll=false --forceExit`: Exit code 0 (15 suites passed, 107 tests passed)
- `npm run build`: Exit code 0 (Production bundle compiled successfully: 118.41 kB JS, 302 B CSS)

## End-to-end evidence
- Ground truth Yeokgok parlor photo (`e:\동영상\마작\오프 마장\202305 역곡\KakaoTalk_20230528_2.jpg`) was processed into binary mask and RGB image fixtures.
- Recognizer output:
  - Bottom: `220` (22,000 pts)
  - Right: `483` (48,300 pts)
  - Top: `200` (20,000 pts)
  - Left: `97` (9,700 pts)
  - Total: 100,000 pts.
- UI table model dropdown defaults to `'amos_rexx3'`, supports switching to `'amos_jp_ex'`, persists to `localStorage['mahjong_table_model']`, and routes selected model to score camera scan sessions.

## Review findings and resolutions
- Red Team Finding: `KakaoTalk_20230528_1.jpg` 5-digit scores were user-edited photo stickers. Resolved by selecting clean raw LED photo `KakaoTalk_20230528_2.jpg` as the primary ground truth.

## Deployment or handoff
- Client-side application update ready for production deployment.

## Release readiness
- Overall status: READY

## Residual risks
- Minor ambient lighting variations on glossy JP-EX bezels in real offline parlors; covered by adaptive glare thresholding.
