# Implementation plan

- Work ID: score-scan-umaoka-rebuild
- Artifact revision: 2
- Language: en
- Korean mirror: plan.ko.md

## Context and target outcome
Rebuild the score scanning experience on top of the comprehensive Uma/Oka game calculation engine, separate the production Service route (`/scan_score`) from the developer Test Lab route (`/test_scan`) with multi-machine data acquisition, eliminate the legacy manual photo capture button and input, and establish a cohesive, frictionless 4-step user workflow from live scan to shareable result.

## Repository state and constraints
Retain slot-clipped camera viewport (`h-52`), central 50% ROI extraction, AMOS REXX 3 4-player HUD, and client-side in-memory architecture while fully utilizing `UmaOkaTable`, `calculateTieAwards`, `PlayerTotals`, and `PlayerManagementAndScores`.

## Change map
1. `PhotoUploadPanel.tsx`: Remove manual photo capture input/button and add `isTestMode?: boolean` to conditionally render developer PC transfer bridge.
2. `PhotoUploadPanel.test.tsx`: Verify removal of manual photo capture button and test `isTestMode` rendering logic.
3. `ScorePhotoInputPage.tsx`: Rebuild state pipeline using `UmaOkaTable`, tie handling, chombo tracking, and player pool management.
4. `ScorePhotoInputPage.test.tsx`: Test Uma/Oka calculation integration and rank score generation.
5. `App.tsx`, `Sidebar.tsx`, `MainPage.tsx`, `translations.ts`: Implement routes `/scan_score`, `/test_scan`, and redirect from `/set_score_photo`.
6. `Integration.test.tsx`: End-to-end verification of the unified workflow.

## Dependency graph and parallelization
TASK-001 (`PhotoUploadPanel.tsx`) and TASK-002 (`ScorePhotoInputPage.tsx`) can be prepared sequentially; TASK-003 (`App.tsx` routing) connects them; TASK-004 and TASK-005 perform regression testing, production build, and SDLC synchronization.

## Tasks
- TASK-001 — Status: pending — REQ-003, REQ-004 / AC-001, AC-002, AC-004. Owner: root. Surface: `PhotoUploadPanel.tsx` and `PhotoUploadPanel.test.tsx`. Remove manual capture button and add `isTestMode` prop. Proof: Jest unit tests.
- TASK-002 — Status: pending — REQ-001 / AC-001. Owner: root. Surface: `ScorePhotoInputPage.tsx` and `ScorePhotoInputPage.test.tsx`. Rebuild page on Uma/Oka calculation engine. Proof: Jest unit tests.
- TASK-003 — Status: pending — REQ-002 / AC-002, AC-003. Owner: root. Surface: `App.tsx`, `Sidebar.tsx`, `MainPage.tsx`, `translations.ts`. Add `/scan_score` and `/test_scan` routes with redirect. Proof: Jest route tests.
- TASK-004 — Status: pending — REQ-005 / AC-001, AC-005. Owner: root. Surface: `Integration.test.tsx`. Full workflow integration verification. Proof: Integration test pass.
- TASK-005 — Status: pending — AC-004, AC-005. Owner: root. Surface: Full verification and build. Run all test suites and production build. Proof: Production build pass.

## TDD sequence
1. Red: Update `PhotoUploadPanel.test.tsx` to assert absence of `📷 점수판 촬영하기` and verify `isTestMode` toggle behavior.
2. Green: Modify `PhotoUploadPanel.tsx` to remove the file capture button/input and conditionally render developer bridge controls.
3. Red: Update `ScorePhotoInputPage.test.tsx` and `App.test.tsx` to assert Uma/Oka table rendering, `/scan_score`, `/test_scan`, and redirect from `/set_score_photo`.
4. Green: Implement Uma/Oka state pipeline in `ScorePhotoInputPage.tsx` and configure routes in `App.tsx`.
5. Refactor & Verify: Run the complete test suite and execute `npm run build`.

## End-to-end scenarios
East player taps live scan, points camera at scoreboard, achieves Fast-Lock auto-capture in 0.2~0.3s, reviews Uma/Oka rank points on the same screen, and taps add record to commit to the match ledger and update the shareable link.

## Quality gates
- `gate-test`: `npm test -- --watchAll=false` (100% test suites pass, 0 failures)
- `gate-build`: `npm run build` (Clean production build with zero errors)
- `gate-sdlc`: `pwsh.exe -NoProfile -ExecutionPolicy Bypass -File C:\Users\AquaCo\.codex\skills\ai-native-sdlc\scripts\validate-artifact-chain.ps1 -ArtifactDirectory "c:\Users\AquaCo\project\mahjong.aquaco.work\docs\ai\score-scan-umaoka-rebuild"`

## Risks, migration, and rollback
If regressions occur during execution, git checkout reverts `src/` to HEAD cleanly while preserving the SDLC artifact chain.

## Completion proof
Every acceptance criterion AC-001 through AC-005 verified with passing test evidence.

## Progress log
2026-09-16: revision 1 started to rebuild score scan with Uma/Oka engine, separate service and test pages, and remove manual photo capture.
