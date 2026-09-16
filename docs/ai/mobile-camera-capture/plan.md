# Implementation plan

## Context and target outcome
- Work ID: mobile-camera-capture
- Artifact revision: 1
- Language: en
- Korean mirror: plan.ko.md

Deliver dedicated mobile camera UI in `PhotoUploadPanel.tsx`, 90-degree rotation utility in `scoreMedia.ts`, and tunnel command in `package.json`.

## Repository state and constraints
React 19 / CRA / TypeScript 4.9. Maintain zero-upload client-side architecture.

## Change map
- `scoreMedia.ts`: add `rotateFrame`
- `PhotoUploadPanel.tsx`: add guide card, camera button, and rotation button
- `package.json`: add `test:mobile` running `untun`
- `docs/mobile-score-recognition.md`: document usage

## Dependency graph and parallelization
TASK-001, TASK-002, TASK-003, and TASK-004 executed in order.

## Tasks
- TASK-001 (REQ-001, AC-001) Status: done: Implement camera button with desktop fallback in `PhotoUploadPanel.tsx`.
- TASK-002 (REQ-002, AC-002) Status: done: Add pre-capture visual guide card in `PhotoUploadPanel.tsx`.
- TASK-003 (REQ-003, AC-003) Status: done: Implement `rotateFrame` in `scoreMedia.ts` and UI button in `PhotoUploadPanel.tsx`.
- TASK-004 (REQ-004, AC-004) Status: done: Add `test:mobile` in `package.json` and update documentation.

## TDD sequence
Test `rotateFrame` in unit tests, test `PhotoUploadPanel.tsx` UI, run typecheck and build.

## End-to-end scenarios
Capture photo, rotate 90 degrees if needed, verify candidate scores, append to game.

## Quality gates
All 37 Jest tests pass, TypeScript compiles, `npm run build` succeeds.

## Risks, migration, and rollback
Revert changes in `PhotoUploadPanel.tsx` and `scoreMedia.ts` if needed. No persisted data impact.

## Completion proof
Pass all unit tests, tsc, and production build without errors.

## Progress log
- 2026-09-11: Implemented `rotateFrame` in `scoreMedia.ts`.
- 2026-09-11: Refactored `PhotoUploadPanel.tsx` with camera button, guide card, and rotation.
- 2026-09-11: Added `test:mobile` to `package.json` and updated docs.
