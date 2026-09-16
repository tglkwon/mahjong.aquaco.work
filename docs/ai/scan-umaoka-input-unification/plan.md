# Implementation plan

- Work ID: scan-umaoka-input-unification
- Artifact revision: 2
- Language: en
- Korean mirror: plan.ko.md

## Context and target outcome
Unify the duplicate score entry forms into `UmaOkaTable.tsx`, stream real-time recognized scores from `PhotoUploadPanel.tsx` via `onScoresRecognized` callback, and dynamically bind target total score to `startingScore * 4` across recognition consensus and record commit gates.

## Repository state and constraints
Retain slot viewfinder (`h-52`), 3-dot consensus tracker, mobile-drop PC transfer lab bridge, and pure client-side architecture while streamlining UI and unifying validation.

## Change map
1. `PhotoUploadPanel.tsx`: Remove duplicate score review `<fieldset>`, remove secondary confirm button, add `onScoresRecognized` callback, and make `expected` total reactive to `initialTotal`.
2. `PhotoUploadPanel.test.tsx`: Test `onScoresRecognized` emission and absence of duplicate fieldset.
3. `ScorePhotoInputPage.tsx`: Connect `onScoresRecognized` to populate `currentEditableGame` in `games` state, and ensure `targetTotalScore` reactive binding.
4. `ScorePhotoInputPage.test.tsx`: Test that recognized scores flow directly into `UmaOkaTable.tsx` and changing starting score recalculates required total.
5. `ControlPanel.tsx`: Validate against dynamic `startingScore * 4`.
6. `App.test.tsx`: Verify routing and navigation integrity.

## Dependency graph and parallelization
TASK-001 (`PhotoUploadPanel.tsx`) and TASK-002 (`ScorePhotoInputPage.tsx`) are prepared sequentially; TASK-003 connects them with `ControlPanel.tsx`; TASK-004 updates tests; TASK-005 runs the final regression and build gates.

## Tasks
- TASK-001 — Status: pending — REQ-001, REQ-002 / AC-001, AC-002. Owner: root. Surface: `PhotoUploadPanel.tsx` and `PhotoUploadPanel.test.tsx`. Remove duplicate fieldset and add `onScoresRecognized` callback. Proof: Jest unit tests.
- TASK-002 — Status: pending — REQ-001, REQ-002 / AC-001, AC-003. Owner: root. Surface: `ScorePhotoInputPage.tsx` and `ScorePhotoInputPage.test.tsx`. Connect `onScoresRecognized` to `UmaOkaTable.tsx` and bind dynamic target sum. Proof: Jest integration tests.
- TASK-003 — Status: pending — REQ-003, REQ-004 / AC-003, AC-004. Owner: root. Surface: `ControlPanel.tsx`. Verify unified single commit gate and dynamic target score enforcement. Proof: Jest component tests.
- TASK-004 — Status: pending — REQ-005 / AC-005. Owner: root. Surface: Test suites. Update tests in `PhotoUploadPanel.test.tsx`, `ScorePhotoInputPage.test.tsx`, and `App.test.tsx`. Proof: Jest test pass.
- TASK-005 — Status: pending — REQ-005 / AC-005. Owner: root. Surface: Full build. Execute full test suite pass and production build verification. Proof: `npm test` and `npm run build`.

## TDD sequence
1. Red: Update `PhotoUploadPanel.test.tsx` to assert absence of duplicate input fieldset and verify `onScoresRecognized` callback.
2. Green: Modify `PhotoUploadPanel.tsx` to emit `onScoresRecognized` on consensus and remove redundant fieldset and button.
3. Red: Update `ScorePhotoInputPage.test.tsx` to assert recognized scores directly populate `UmaOkaTable.tsx` and dynamic target sum recalculation.
4. Green: Wire `onScoresRecognized` into `ScorePhotoInputPage.tsx` and update `ControlPanel.tsx` integration.
5. Refactor & Verify: Run `npm test -- --watchAll=false` and `npm run build`.

## End-to-end scenarios
Player enters starting score (e.g. 25,000 -> target 100,000), starts live scan, points camera at scoreboard, achieves 3-dot consensus lock, observes scores directly appearing in the Uma/Oka table, fine-tunes if desired with ±1,000 buttons, and taps Add Record in the control panel to commit to the ledger.

## Quality gates
- `gate-test`: `npm test -- --watchAll=false` (100% test suites pass, 0 failures)
- `gate-build`: `npm run build` (Clean production build with zero errors)
- `gate-sdlc`: `pwsh.exe -NoProfile -ExecutionPolicy Bypass -File C:\Users\AquaCo\.codex\skills\ai-native-sdlc\scripts\validate-artifact-chain.ps1 -ArtifactDirectory "c:\Users\AquaCo\project\mahjong.aquaco.work\docs\ai\scan-umaoka-input-unification"`

## Risks, migration, and rollback
Component changes are fully modular; in case of regression, restore component props and tests from previous git commit.

## Completion proof
Every acceptance criterion AC-001 through AC-005 verified with passing test evidence.

## Progress log
2026-09-16: revision 1 started to unify score input UI into Uma/Oka table and bind dynamic target sum.
