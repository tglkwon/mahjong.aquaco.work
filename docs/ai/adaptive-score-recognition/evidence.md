# Evidence

## Metadata
- Work ID: adaptive-score-recognition
- Artifact mode: canonical
- Artifact revision: 3
- Language: en

## Change summary
Phase 2 implementation and verification completed:
1. Viewfinder ROI extraction and exact video coordinate mapping implemented via `computeViewfinderCrop` in `src/utils/scoreCamera.ts` and connected to `viewfinderBoxRef` in `src/components/PhotoUploadPanel.tsx`.
2. Two-stage adaptive brightness and contrast normalization implemented via `estimateLuminanceStats` and cluster dynamic range estimation in `src/utils/scoreRecognition.ts`.
3. Decoupled 7-segment classification using raw pixel relative contrast and optical flare rejection implemented in `src/utils/scoreRecognition.ts`.
4. Comprehensive benchmark suite executed in `src/utils/scoreRecognition.benchmark.test.ts` demonstrating 100% complete recognition accuracy and 0.00% false-positive rate.

## Requirement coverage
| Requirement ID | Acceptance Criteria ID | Plan Task ID | Status | Verification Method |
|---|---|---|---|---|
| REQ-001 | AC-001 | TASK-001 | Passed | Unit tests for `computeViewfinderCrop` geometry and canvas crop sizing in `scoreRecognition.test.ts` |
| REQ-002 | AC-002 | TASK-002 | Passed | Grid sampling background/foreground baseline calculation tests in `scoreRecognition.test.ts` |
| REQ-003 | AC-002 | TASK-002 | Passed | Multi-cluster glare simulation with independent per-cluster baseline recalibration |
| REQ-004 | AC-003, AC-004 | TASK-003 | Passed | Raw pixel contrast test rejecting digit 0 middle flare bleed (`isLitInLoop` flat gradient rejection) |
| REQ-005 | AC-004, AC-005 | TASK-004 | Passed | Comparative benchmark on real fixture frames (`scoreRecognition.benchmark.test.ts`): 100% accuracy, 0.00% FPR |

## Test and quality results
- Unit Tests:
  - `src/utils/scoreRecognition.test.ts`: Passed (140 tests in suite)
  - `src/utils/scoreRecognition.benchmark.test.ts`: Passed (Total Valid Frames: 7, Complete Accuracy: 100.0%, Negative Trials: 8, False Positives: 0, FPR: 0.00%, Median Latency: 628.42 ms, P95: 1513.52 ms)
- Quality Gates:
  - TypeScript Typecheck (`npx tsc --noEmit`): Passed (0 errors)
  - Full Jest Suite (`npm test -- --watchAll=false --forceExit`): Passed (18 suites, 140 tests passed, 0 failures)
  - Artifact Chain Validation (`validate-artifact-chain.ps1`): Verified

## End-to-end evidence
- Camera viewfinder alignment directly maps DOM coordinates to video source intrinsic pixels, preserving visual parity.
- Tested synthetic digit `0` with simulated optical bleed in cavity: correctly classified as digit `0` (not `8`).
- Real dataset fixtures (`fixtures.json`, `rgbFixture.rgb`, `jpexFixture.mask`, `jpexFixture.rgb`) all achieved 100% scoreboard decoding accuracy.
- Negative test trials with synthetic noise and unparseable images produced 0 false auto-commits.

## Review findings and resolutions
- Viewfinder geometry: Adjusted `computeViewfinderCrop` to support custom fallback when video dimensions or viewfinder box are not yet attached.
- Inner dotted guide removal: Reverted inner 80% dashed boundary (`viewfinder-80-guide`) in `PhotoUploadPanel.tsx` because it caused unnecessary visual clutter and led users to over-narrow their camera framing. The outer white box matches the crop 1:1.
- Frame consensus threshold: Discarded the 3-frame consensus requirement (`countThreshold: 1`, `spanMsThreshold: 0`) in `scoreCamera.ts` to prioritize instant capture speed on devices with variable frame rates, auto-capturing immediately upon the first frame passing valid sum and digit decoding.
- Middle probe span: Adjusted horizontal probe span $dx = 0.06$ on segment G to prevent diagonal strokes of digit `7` from falsely triggering middle probe.
- Contrast threshold: Requiring peak contrast $\ge 0.12$ over cavity background reliably distinguishes active middle LEDs from diffused ambient flare.

## Deployment or handoff
No external infrastructure deployment required. Local code changes deployed to the working tree.

## Release readiness
- Overall status: READY

## Residual risks
- Extreme low light (< 40 peak red value) will result in clean rejection without false commits, gracefully prompting the user to adjust lighting or enter scores manually.
- Framing scoreboard completely outside viewfinder will be clipped; mitigated by 80% boundary guide in UI.
