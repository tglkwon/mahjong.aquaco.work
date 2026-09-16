# Implementation plan

- Work ID: scanner-negative-hud-feedback
- Artifact revision: 3
- Language: en
- Korean mirror: plan.ko.md

## Context and target outcome
The live Mahjong scoreboard scanner needs three major improvements:
1. Negative score recognition: Support hakoten (bankruptcy) situations by detecting horizontal minus bars (`isMinusBar`), assigning `"-"` to leftmost group elements, and validating sums with negative scores.
2. Viewfinder HUD: Remove restrictive 25% scrims and present an open full-frame viewfinder bounded by 4 L-shaped corner reticles, taking advantage of natural CSS `object-cover` framing.
3. 3-stage visual consensus: Bind `stable.count` (0-3) to a 3-dot gauge, shift illumination colors (White -> Blue -> Emerald), and trigger a snappy 100ms white flash before presenting the review draft.

## Repository state and constraints
- Target files: `src/utils/scoreRecognition.ts`, `src/components/PhotoUploadPanel.tsx`.
- Test files: `src/utils/scoreRecognition.test.ts`, `src/components/PhotoUploadPanel.test.tsx`.
- Quality gates: `node node_modules/react-scripts/bin/react-scripts.js test --watchAll=false --runInBand --silent`, `npx tsc --noEmit`.
- No backend/cloud changes. All processing remains strictly client-side.

## Change map
- `src/utils/scoreRecognition.ts`:
  - Extend `Box` interface with `isMinus?: boolean`.
  - Add `isMinusBar` filtering condition (`w >= 6 && w <= 28 && h >= 2 && h <= 12 && w >= h * 1.3 && tail >= 12`).
  - Adapt horizontal grouping logic so minus bars group with adjacent digits.
  - Prefix `"-"` when `group[0].isMinus` is true.
  - Guard bottom-seat rank slicing (`!group[0].isMinus`).
- `src/components/PhotoUploadPanel.tsx`:
  - Add `consensusCount` state (0 to 3) and `flashing` state.
  - Remove restrictive top/bottom 25% scrims; open full viewfinder frame.
  - Render 4 corner L-shaped reticles across full viewfinder frame with dynamic color transitions based on `consensusCount`.
  - Add 3-dot consensus gauge HUD component.
  - Execute a 100ms white flash on capture before completing transition.
- `src/utils/scoreRecognition.test.ts`:
  - Add unit tests for negative score detection and total validation.
- `src/components/PhotoUploadPanel.test.tsx`:
  - Add component tests for open viewfinder reticles, consensus count updates, and 100ms flash.

## Dependency graph and parallelization
TASK-001 and TASK-002 are conceptually independent, integrated before TASK-003; TASK-003 precedes TASK-004. REQ-001, REQ-002, REQ-003, REQ-004 and AC-001, AC-002, AC-003, AC-004 are tracked across all lanes.

## Tasks
- TASK-001 — Status: done — REQ-001 / AC-001. Implement `isMinusBar` CC detection, horizontal grouping relaxation, and `"-"` sign mapping in `src/utils/scoreRecognition.ts` with TDD unit tests in `src/utils/scoreRecognition.test.ts`.
- TASK-002 — Status: done — REQ-002 / AC-002. Implement open full-frame viewfinder HUD and 4 L-shaped corner reticles in `src/components/PhotoUploadPanel.tsx`.
- TASK-003 — Status: done — REQ-003 / AC-003. Implement `consensusCount` state binding from `onReading`, 3-dot progress gauge, dynamic border/reticle colors (White -> Blue -> Emerald), and 100ms capture flash transition in `src/components/PhotoUploadPanel.tsx`.
- TASK-004 — Status: done — REQ-004 / AC-004. Add component tests in `src/components/PhotoUploadPanel.test.tsx`, verify all repository test suites, and execute artifact chain validation.

## TDD sequence
1. Red phase 1: Write failing test in `src/utils/scoreRecognition.test.ts` expecting `['-020', '0350', '0350', '0320']` from a synthetic image with a minus bar.
2. Green phase 1: Implement `isMinusBar` filtering and grouping in `src/utils/scoreRecognition.ts` to pass unit tests.
3. Red phase 2: Write failing tests in `src/components/PhotoUploadPanel.test.tsx` checking for open viewfinder reticle and 3-dot gauge.
4. Green phase 2: Implement viewfinder HUD, consensus state binding, and 100ms flash overlay in `src/components/PhotoUploadPanel.tsx`.
5. Refactor: Optimize styling, ensure memory safety for flash timer, and verify complete test suite.

## End-to-end scenarios
1. Scenario 1 (Hakoten negative game): 4 scores where Player 1 has -2,000 pts (`-020`) and players 2, 3, 4 have 35,000, 35,000, 32,000 pts (`0350`, `0350`, `0320`). Recognizer extracts all 4 scores correctly, total matches 100,000, and auto-capture succeeds.
2. Scenario 2 (Live aiming & consensus feedback): Live camera feed shows open framing with corner reticles. Moving camera onto scoreboard shows reticle changing White -> Blue -> Emerald with 3-dot gauge advancing, followed by 100ms white flash upon capture.
3. Scenario 3 (Non-hakoten regression): Existing AMOS REXX 3 positive test fixtures (e.g. `102 / 0266 / 0606 / 0026`) continue to pass without changes.

## Quality gates
```powershell
node node_modules/react-scripts/bin/react-scripts.js test --watchAll=false --runInBand --silent
```
```powershell
npx tsc --noEmit
```
```powershell
pwsh.exe -NoProfile -ExecutionPolicy Bypass -File C:\Users\AquaCo\.codex\skills\ai-native-sdlc\scripts\validate-artifact-chain.ps1 -ArtifactDirectory c:\Users\AquaCo\project\mahjong.aquaco.work\docs\ai\scanner-negative-hud-feedback
```

## Risks, migration, and rollback
- Risk: False positive minus bar detection from random specular noise.
  - Mitigation: Strict dimension (`w >= 6 && w <= 28 && h >= 2 && h <= 12 && w >= h * 1.3`), density (`tail >= 12`), and position constraints (must be leftmost of a run).
- Risk: Flash effect lingering if unmounted.
  - Mitigation: Store timeout in ref and clear on unmount.
- Rollback: Revert changes to `src/utils/scoreRecognition.ts` and `src/components/PhotoUploadPanel.tsx`.

## Completion proof
- `src/utils/scoreRecognition.test.ts` passing negative score tests.
- `src/components/PhotoUploadPanel.test.tsx` passing HUD and consensus tests.
- Full test suite passing (12/12 suites).
- Release status confirmed in `evidence.md`.

## Progress log
- Phase 1: Intent, spec, plan, preview, and initial evidence contract established.
- Phase 2: All tasks completed (TASK-001 to TASK-004), 12 test suites passing (89 tests), type check clean, production build succeeded.
