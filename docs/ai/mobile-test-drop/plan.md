# Implementation plan

- Work ID: mobile-test-drop
- Artifact revision: 2
- Language: en
- Korean mirror: plan.ko.md

## Context and target outcome
Provide an integrated mobile-to-PC test bridge on `PhotoUploadPanel` using the `mobile-drop` architecture, so developers testing scoreboard recognition on real smartphones can stream/drop original video files, captured frames, and OCR metadata directly into `./uploads/` on the PC development host.

## Repository state and constraints
- React 19 + TypeScript 4.9.5 with `react-scripts`.
- Existing 11 test suites (73 tests) all passing.
- `PhotoUploadPanel.tsx` currently handles frame extraction (`extractLocalFrames`), OCR recognition (`recognizeScoreboard`), and camera streaming (`startScoreCamera`) strictly in-memory.
- Global skill `mobile-drop` has server on port 8899 accepting `/upload/chunk` and `/upload/complete` with PIN header `X-Session-Token`.

## Change map
- `src/utils/mobileDropClient.ts`: Core upload logic (chunking, headers, progress, health check).
- `src/utils/mobileDropClient.test.ts`: TDD unit tests for upload client.
- `src/components/PhotoUploadPanel.tsx`: Developer bridge panel, URL query/local storage sync, video/image file drop, live scan capture drop, status alerts.
- `src/components/PhotoUploadPanel.test.tsx`: Integration test for developer bridge toggle and drop integration.
- `scripts/start-test-drop.ps1`: Convenience PowerShell orchestrator for continuous session and tunnel URL generation.

## Dependency graph and parallelization
- Lane 1: `TASK-001` (Create `mobileDropClient.ts` with TDD tests in `mobileDropClient.test.ts`).
- Lane 2: `TASK-002` (Update `PhotoUploadPanel.tsx` and integration tests). Depends on Lane 1.
- Lane 3: `TASK-003` (Create `scripts/start-test-drop.ps1`). Independent.
- Integration & Quality Gates: `TASK-004` (Run Jest tests, TypeScript build, end-to-end evidence recording, update artifact sync).

## Tasks
- TASK-001 — Status: done — REQ-001, REQ-002 / AC-001, AC-002. Dependencies: none. Owner: root. Surface: `src/utils/mobileDropClient.ts` and `src/utils/mobileDropClient.test.ts`. Implement chunk slicing, header generation, error handling, status ping, and progress notifications. Proof: 8 passing unit tests.
- TASK-002 — Status: done — REQ-003, REQ-004, REQ-005, REQ-006, REQ-007 / AC-003, AC-004, AC-005. Dependencies: TASK-001. Owner: root. Surface: `src/components/PhotoUploadPanel.tsx` and `src/components/PhotoUploadPanel.test.tsx`. Integrate developer test bridge UI, URL query pre-population, video/photo auto-drop, and live scan capture frame drop. Proof: 15 passing component integration tests.
- TASK-003 — Status: done — REQ-008 / AC-001, AC-002. Dependencies: none. Owner: root. Surface: `scripts/start-test-drop.ps1` and `scripts/test-drop-server.py`. Implement local session runner with continuous session support for seamless multi-file drop into `./uploads/`. Proof: local session orchestrator.
- TASK-004 — Status: done — AC-006. Dependencies: TASK-001, TASK-002, TASK-003. Owner: root. Surface: test suite and build verification. Execute full test suite (`npm test -- --watchAll=false`), verify production build (`npm run build`), produce `evidence.md` / `evidence.ko.md`, and initialize `artifact-sync.json`. Proof: 12 test suites (83 tests) and production build compile successfully.
- TASK-005 — Status: done — REQ-009 / AC-007. Dependencies: TASK-002, TASK-003. Owner: root. Surface: `scripts/test-drop-server.py`, `scripts/start-test-drop.ps1`, `src/utils/mobileDropClient.ts`, `src/components/PhotoUploadPanel.tsx`, and `.gitignore`. Support multi-device destination routing (`rex3` -> `research-data/rex 3`, `jpex` -> `research-data/jp-ex`, `jpcolor` -> `research-data/jp-color`) via CLI and UI selection with git ignore protection. Proof: 16 passing component integration tests and 9 unit tests.

## TDD sequence
1. Red: Write `src/utils/mobileDropClient.test.ts` asserting chunking, header format, error handling, and ping. Tests fail (module does not exist).
2. Green: Implement `src/utils/mobileDropClient.ts` to satisfy all tests.
3. Refactor: Polish abort signal handling and edge cases.
4. Integrate: Connect to `PhotoUploadPanel.tsx` and run component tests.

## End-to-end scenarios
1. **URL Credential Injection**: Open `/set_score_photo?dropUrl=https://test.trycloudflare.com&dropPin=123456`. The test panel automatically expands and sets status to active.
2. **Video File Upload & OCR**: Select a video file. Local OCR runs across extracted frames while the original video file is transferred in 8MB chunks to the PC host.
3. **Live Scan Capture Drop**: Start camera scan. When 4 stable scores match expected total, the auto-captured frame JPEG and OCR metadata JSON are transmitted to PC.

## Quality gates
- `npm test -- --watchAll=false` must pass all test suites.
- `npm run build` must compile without TypeScript or ESLint errors.
- Validator `validate-artifact-chain.ps1` must pass cleanly.

## Risks, migration, and rollback
- Risk: Cross-Origin / Mixed Content blocking. Mitigation: Cloudflare Quick Tunnel guarantees HTTPS endpoint matching the web application protocol.
- Risk: Mobile memory pressure from large video. Mitigation: 8MB chunk slicing with Blob.slice avoids loading whole files into memory.
- Rollback: Reversible by reverting `PhotoUploadPanel.tsx` changes and removing newly added utility files.

## Completion proof
- Passing test logs for `mobileDropClient.test.ts` and `PhotoUploadPanel.test.tsx`.
- Successful production build output.
- Complete synchronized artifact chain with initialized `artifact-sync.json`.

## Progress log
- 2026-09-15: Initialized intent, spec, and implementation plan for mobile-test-drop.
