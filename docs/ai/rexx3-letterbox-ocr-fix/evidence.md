# Evidence

- Work ID: rexx3-letterbox-ocr-fix
- Artifact revision: 2
- Language: en
- Korean mirror: evidence.ko.md

## Change summary
Implemented CSS Viewport Slot Clipping (`h-52 sm:h-60 overflow-hidden`, `object-cover object-center`) on live camera view, restricted portrait canvas analysis in `scoreCamera.ts` to central 50% ROI (y: 25%~75%), resolved digit 7 vs 3 and 9 vs 8 OCR misclassifications on AMOS REXX 3, implemented sliding window frequency consensus in `scoreStability.ts` for camera shake tolerance, and added overhead glare-resilient adaptive thresholding.

## Requirement coverage
| Requirement | Acceptance | Task | Planned proof | Result |
| --- | --- | --- | --- | --- |
| REQ-001 | AC-001 | TASK-003 | Bounded viewport height, overflow-hidden, object-cover clipping | PASS |
| REQ-002 | AC-002 | TASK-002 | Portrait 50% ROI vertical slicing in scoreCamera.ts | PASS |
| REQ-003 | AC-003 | TASK-001 | Probe geometry separating 7 and 3 | PASS |
| REQ-004 | AC-003 | TASK-001 | North 0097 score recognized as 9700 (100,000 standard total) | PASS |
| REQ-005 | AC-005 | TASK-005 | Sliding window frequency consensus in scoreStability.ts with interleaved noise | PASS |
| REQ-006 | AC-006 | TASK-006 | 100ms analysis throttle interval in scoreCamera.ts | PASS |
| REQ-007 | AC-007 | TASK-007 | 9 vs 8 probe, 0.33 digit 1 ratio, X-axis layout, adaptive glare fallback | PASS |
| REQ-ALL | AC-004 | TASK-004 | Full Jest suite pass, TypeScript check, production build pass | PASS |
| REQ-ALL | AC-007 | TASK-008 | Real handheld glare video stream evaluation | PASS |

## Test and quality results
- `npm test -- --watchAll=false src/utils/scoreRecognition.test.ts`: 15/15 passed (100%), including North `0097` recognition test.
- `npm test -- --watchAll=false`: 10/10 suites, 71/71 tests passed (100%).
- `npm run build`: Compiled successfully with zero TypeScript/ESLint errors (`main.3145ed3f.js`, 108.1 kB gzip).
- Real video stream evaluation: `PXL_20260914_121532649.mp4` (52 perfect matches, 11 Fast-Locks) and `PXL_20260914_121752679.mp4` (36 perfect matches, 9 Fast-Locks).
- Background tasks: strictly monitored and 100% clean (0 running tasks).

## End-to-end evidence
- Camera Slot: The camera preview is bounded to `h-52` (208px height), preventing 600px overflow and keeping camera, 4-player live HUD, draft confirmation, and submit button visible without scrolling.
- OCR Accuracy: North's `0097` is read as `0097` (9,700 points) instead of `0093`. Sum: 35,200 (East) + 25,000 (South) + 30,100 (West) + 9,700 (North) = 100,000 points.
- Sliding Window Fast-Lock: 2 matching observations within 1500ms window trigger auto-capture in 0.2~0.3s even with intermittent hand-shake noise.

## Review findings and resolutions
Tested Red-Green cycle on digit 7 and 0097, sliding window stability, and glare threshold fallback. Background tasks were cleared and single-task invariant strictly enforced. Production build verified clean compilation.

## Deployment or handoff
Local work only. Production build verified locally. Live deployment deferred to explicit user deployment action.

## Release readiness
- Overall status: READY
- Required human approvals: None blocking for local software delivery.
- Blocking items: None. All revision 2 tasks (TASK-001 through TASK-008) verified and green.

## Residual risks
Real shop lighting variations and camera angles will be field-validated by the user during table play.

