# Evidence

- Work ID: scanner-negative-hud-feedback
- Artifact revision: 3
- Language: en
- Korean mirror: evidence.ko.md

## Change summary
Implemented negative score (hakoten) recognition via `isMinusBar` Connected Component filtering in `src/utils/scoreRecognition.ts`, open full-frame viewfinder HUD with 4 corner reticles (removing restrictive 25% scrims) in `src/components/PhotoUploadPanel.tsx`, and 3-stage visual consensus feedback (White -> Blue -> Emerald illumination, 3-dot gauge, and snappy 100ms white flash).

## Requirement coverage
| Requirement | Acceptance | Task | Planned proof | Result |
| --- | --- | --- | --- | --- |
| REQ-001 | AC-001 | TASK-001 | Negative score CC extraction and 100k total validation unit tests | PASS |
| REQ-002 | AC-002 | TASK-002 | Open viewfinder corner reticle UI tests without scrims | PASS |
| REQ-003 | AC-003 | TASK-003 | 3-dot gauge, color transition, and 100ms flash UI tests | PASS |
| REQ-004 | AC-004 | TASK-004 | Full regression test suite, type check, and artifact chain validation | PASS |

## Test and quality results
- Unit tests (`node node_modules/react-scripts/bin/react-scripts.js test --watchAll=false --runInBand --silent`): exit 0; 12 suites, 89 tests passed (including new negative score and HUD reticle/gauge/100ms flash tests).
- Type check (`npx tsc --noEmit`): exit 0; no type diagnostics.
- Build (`npm run build`): exit 0; production build bundle generated (`main.774a11e8.js`, 112.3 kB gzip).
- Chain validation (`pwsh.exe -NoProfile -ExecutionPolicy Bypass -File C:\Users\AquaCo\.codex\skills\ai-native-sdlc\scripts\validate-artifact-chain.ps1 -ArtifactDirectory c:\Users\AquaCo\project\mahjong.aquaco.work\docs\ai\scanner-negative-hud-feedback`): exit 0; structure and bilingual synchronization valid.

## End-to-end evidence
- Negative score recognition: Player 1 with `-020` (-2,000 pts) and players 2, 3, 4 with `0350`, `0350`, `0320` recognized in order and validated against 100,000 expected sum with `draft.valid = true`.
- Viewfinder HUD: Viewport provides open full-frame framing bounded by 4 L-shaped corner reticles, removing restrictive scrim masks to leverage natural CSS `object-cover` framing.
- 3-stage consensus: `consensusCount` 0, 1, 2, 3 transitions corner illumination and 3-dot gauge (`● ○ ○` -> `● ● ○` -> `● ● ●`), triggering a snappy 100ms white flash before presenting the review draft.
- Non-breaking compatibility: All existing AMOS REXX 3 positive fixtures and seat rotation flows remain 100% functional.

## Review findings and resolutions
- Viewfinder openness: User pointed out that adding 25% scrims on top of an already cropped container (`h-52 sm:h-60`) resulted in a double-crop down to ~104px. Removed the scrims to give full viewport clearance while keeping the corner reticles.
- Flash latency: Reduced flash timer from 200ms to 100ms for a snappier transition.
- Memory safety: Flash timer stored in ref and cleared on component unmount and session cancellations.
- Backward compatibility: Player 1 rank slice explicitly guarded with `!group[0].isMinus` so negative score signs are never truncated as ranks.

## Deployment or handoff
Client-only local execution. Ready for manual real-device verification or testing via developer PC drop bridge.

## Release readiness
- Overall status: READY
- Required human approvals: User review and approval completed.
- Blocking items: None.

## Residual risks
- Minor lighting/glare variation under physical mahjong parlor table conditions.
