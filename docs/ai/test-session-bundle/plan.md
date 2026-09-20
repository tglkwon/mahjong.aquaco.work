# Implementation plan

## Context and target outcome
- Work ID: test-session-bundle
- Artifact mode: canonical
- Artifact revision: 4
- Language: en

Isolate developer testing pages and UI indicators from the public service UI prior to production deployment, add `/queue` (대기열 & 자리 추첨) to public sidebar navigation while strictly keeping `/seat` QR-isolated, and provide an integrated, one-click developer test session workflow ("모바일 테스트 서버 열어줘", "서버 닫아줘") that automatically launches the React dev server, mobile-drop PC receiver, Cloudflare tunnels, generates pre-configured mobile test URLs, and tracks session state in `.test-session.json`.

## Repository state and constraints
- React 19 / TypeScript 4.9 / Jest.
- Existing routes: `/scan_score` (production), `/scan_score_test` (test lab), `/queue` (queue & seat draw), `/seat` (fixed QR seat check-in).
- `PhotoUploadPanel.tsx` supports `dropUrl`, `dropPin`, and `device` query parameters.
- Cloudflare quick tunnels via `cloudflared` (trycloudflare.com).
- Windows environment running PowerShell 7 (`pwsh`) / Python 3.

## Change map
- `src/i18n/translations.ts`: Add `queueTitle` translation key to `Translation` interface and language maps (`ko`, `en`, `ja`).
- `src/components/Sidebar.tsx`: Remove `/scan_score_test` from default navigation menu and add `/queue`.
- `src/components/QueuePage.tsx`: Change scan button routing to `/scan_score`.
- `src/components/SeatCheckinPage.tsx`: Change scan button and countdown routing to `/scan_score`.
- `src/components/ScorePhotoInputPage.tsx`: Add `testMode=true` query param support and hide test lab switcher tab when not in test mode.
- `src/utils/mobileDropClient.ts`: Clean server URL by stripping trailing `/upload` if present to guarantee correct sub-path resolution.
- `scripts/start-test-session.ps1`: Orchestrate React dev server, mobile-drop server, tunnels, emit bundled mobile link, and save `.test-session.json`.
- `scripts/stop-test-session.ps1`: Cleanly terminate all test session background processes and clean up `.test-session.json`.
- `GEMINI.md`: Document standard prompt triggers ("모바일 테스트 서버 열어줘", "서버 닫아줘") and execution protocols.
- `src/App.test.tsx`, `src/components/QueuePage.test.tsx`, `src/components/SeatCheckinPage.test.tsx`, `src/components/ScorePhotoInputPage.test.tsx`: Update unit tests to assert test mode isolation, sidebar menu items (`/queue` present, `/scan_score_test` and `/seat` absent), and developer on-demand access.

## Dependency graph and parallelization
- LANE-UI (`TASK-001`, `TASK-002`, `TASK-005`): UI clean-up, routing updates, query parameter handling, and component unit tests.
- LANE-ORCHESTRATION (`TASK-003`, `TASK-004`): PowerShell orchestration scripts and documentation.
- LANE-VERIFICATION (`TASK-006`): Full quality gates, typecheck, and production build.

## Tasks
- TASK-001 (REQ-001, REQ-002, REQ-003, REQ-011, AC-001, AC-002, AC-003, AC-009), LANE-UI: Hide test mode links from Sidebar, QueuePage, SeatCheckinPage, and ScorePhotoInputPage, and add /queue to Sidebar with i18n support. Status: pending
- TASK-002 (REQ-004, REQ-005, AC-004, AC-005), LANE-UI: Ensure direct /scan_score_test route and ?testMode=true query param access remain functional, and clean dropUrl in mobileDropClient.ts. Status: pending
- TASK-003 (REQ-006, REQ-007, AC-006, AC-007), LANE-ORCHESTRATION: Create start-test-session.ps1 and stop-test-session.ps1 with .test-session.json tracking. Status: pending
- TASK-004 (REQ-008, AC-008), LANE-ORCHESTRATION: Update GEMINI.md with standard test session command triggers and execution instructions. Status: pending
- TASK-005 (REQ-009, AC-001, AC-002, AC-003, AC-004, AC-009), LANE-UI: Update component unit tests in App.test.tsx, QueuePage.test.tsx, SeatCheckinPage.test.tsx, and ScorePhotoInputPage.test.tsx. Status: pending
- TASK-006 (REQ-010, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009), LANE-VERIFICATION: Run full regression test suite, typecheck, build, and SDLC chain validation. Status: pending

```sdlc-routing
{
  "schema": "sdlc-routing/v1",
  "task_ids": ["TASK-001", "TASK-002", "TASK-003", "TASK-004", "TASK-005", "TASK-006"],
  "lanes": [
    {
      "id": "LANE-UI",
      "tasks": ["TASK-001", "TASK-002", "TASK-005"],
      "capability_tier": "standard",
      "reasoning_floor": "medium",
      "risk": "standard",
      "rationale": "Routing and navigation updates across React components, i18n keys, and unit test verification.",
      "required_capabilities": ["react", "ui-forms", "jest-testing"]
    },
    {
      "id": "LANE-ORCHESTRATION",
      "tasks": ["TASK-003", "TASK-004"],
      "capability_tier": "standard",
      "reasoning_floor": "medium",
      "risk": "standard",
      "rationale": "PowerShell orchestration scripts for multi-process management, .test-session.json lifecycle, and Cloudflare tunnel URL composition.",
      "required_capabilities": ["powershell", "devops"]
    },
    {
      "id": "LANE-VERIFICATION",
      "tasks": ["TASK-006"],
      "capability_tier": "advanced",
      "reasoning_floor": "high",
      "risk": "standard",
      "rationale": "Full regression testing across all suites, TypeScript validation, and production build verification.",
      "required_capabilities": ["code-review", "regression-testing"]
    }
  ]
}
```

## TDD sequence
1. Update component tests in `src/components/QueuePage.test.tsx`, `src/components/SeatCheckinPage.test.tsx`, `src/components/ScorePhotoInputPage.test.tsx`, and `src/App.test.tsx` to assert:
   - Absence of `/scan_score_test` and presence of `/queue` in `Sidebar.tsx`.
   - Navigation to `/scan_score` on Queue & Seat check-in pages.
   - Absence of test lab switcher tab on `/scan_score`.
   - Activation of test mode on `/scan_score_test` and `?testMode=true`.
2. Update `translations.ts`, `Sidebar.tsx`, `QueuePage.tsx`, `SeatCheckinPage.tsx`, `ScorePhotoInputPage.tsx`, and `mobileDropClient.ts` until tests pass.
3. Create `scripts/start-test-session.ps1` and `scripts/stop-test-session.ps1`.
4. Update `GEMINI.md`.
5. Run full test suite (`npm test -- --watchAll=false --forceExit`) and production build (`npm run build`).

## End-to-end scenarios
1. General user visits website: Sidebar shows `/queue` and `/scan_score`, but not `/scan_score_test` or `/seat`. Queue/Seat pages route to `/scan_score`, and no test lab badges appear.
2. Developer visits `/scan_score_test` or `/scan_score?testMode=true`: Complete test lab, PC transfer bridge, and diagnostic tools are fully operational.
3. Developer requests "모바일 테스트 서버 열어줘": Agent executes `scripts/start-test-session.ps1` and responds with a single, pre-configured mobile link ready for instant testing and auto-upload.
4. Developer requests "서버 닫아줘": Agent executes `scripts/stop-test-session.ps1` and confirms all processes are cleanly terminated.

## Quality gates
```powershell
npx tsc --noEmit
npm test -- src/App.test.tsx --watchAll=false --forceExit
npm test -- src/components/QueuePage.test.tsx --watchAll=false --forceExit
npm test -- src/components/SeatCheckinPage.test.tsx --watchAll=false --forceExit
npm test -- src/components/ScorePhotoInputPage.test.tsx --watchAll=false --forceExit
npm test -- --watchAll=false --forceExit
npm run build
pwsh.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\AquaCo\.codex\skills\ai-native-sdlc\scripts\validate-artifact-chain.ps1" -ArtifactDirectory "docs/ai/test-session-bundle"
```

## Risks, migration, and rollback
- **Risk**: A developer might accidentally re-introduce test links into production navigation.
- **Mitigation**: Automated unit tests in `App.test.tsx`, `QueuePage.test.tsx`, `SeatCheckinPage.test.tsx`, and `ScorePhotoInputPage.test.tsx` strictly assert that `/scan_score_test` is not present in standard navigation.
- **Rollback**: Git revert of component navigation changes.

## Completion proof
- `evidence.md` will record test logs, execution outputs, and coverage for `REQ-001`~`011` and `TASK-001`~`006`.

## Progress log
- 2026-09-20: Initialized intent, spec, and plan for test mode isolation and bundled test session orchestration.
- 2026-09-21: Refined spec and plan with exact component navigation targets, ?testMode=true query param support, .test-session.json session tracking, and full test suite verification.
- 2026-09-21 (rev 3): Added /queue sidebar menu addition and translations, keeping /seat QR-isolated per user confirmation.
