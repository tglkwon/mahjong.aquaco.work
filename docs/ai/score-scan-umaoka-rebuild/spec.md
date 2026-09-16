# Specification

## Metadata and source
- Work ID: score-scan-umaoka-rebuild
- Artifact revision: 2
- Language: en
- Korean mirror: spec.ko.md
- Source: intent.md revision 2

## Summary
Rebuild the score scanning experience on top of the comprehensive Uma/Oka game calculation engine, separate the production Service route (`/scan_score`) from the developer Test Lab route (`/test_scan`) with multi-machine data acquisition, eliminate the legacy manual photo capture button and input, and establish a cohesive, frictionless 4-step user workflow from live scan to shareable result.

## Functional requirements
- REQ-001 must: Rebuild the score scanning page component (`ScorePhotoInputPage.tsx`) using the full Uma/Oka state management pipeline (`calculateTieAwards`, `tieHandlingMode`, `chomboCounts`, `UmaOkaTable`, player pool management, and starting/return score controls), mapping recognized East/South/West/North scores directly into game rankings.
- REQ-002 must: Restructure URL routing and navigation in `App.tsx`, `Sidebar.tsx`, `MainPage.tsx`, and `Header.tsx`:
  - Provide production route `/scan_score` for end-users.
  - Provide test route `/test_scan` for developers and testers.
  - Provide automatic backward-compatible navigation redirect from `/set_score_photo` to `/scan_score`.
  - Update localized titles and descriptions across Korean, English, and Japanese in `translations.ts`.
- REQ-003 must: Provide dedicated props to `PhotoUploadPanel.tsx` to cleanly separate Service and Test modes:
  - When `isTestMode=false` (Service Page `/scan_score`), hide the PC transfer configuration button, status, and expandable drawer completely.
  - When `isTestMode=true` (Test Page `/test_scan`), display the PC transfer bridge (`mobile-drop`) along with target machine selector options (`rex3`, `jpex`, `jpcolor`).
- REQ-004 must: Remove the manual camera photo capture input and button (`📷 점수판 촬영하기`) from `PhotoUploadPanel.tsx`, maintaining real-time video stream scanning as the primary action and manual numeric typing as the zero-latency fallback.
- REQ-005 must: Unify the user workflow between raw score recording and tournament Uma/Oka ranking, ensuring seat rotation (East shift), score consensus confirmation, and instant compressed URL generation (`#d=`) operate seamlessly in a single view.

## Non-functional requirements
- Preserve strictly client-side, in-browser execution with zero network transmission for the production service page.
- Maintain fast responsiveness on mobile viewports (<350ms frame recognition feedback).
- Maintain 100% backward compatibility for existing `#d=` and legacy `#data=` URL formats.

## User experience and flows
1. Setup: User confirms players and tournament rules (Uma 10-30/10-20, Oka on/off, tie-break split/seatOrder).
2. Scan: At hand/game end, East player points camera at the front scoreboard and taps "실시간 스캔 시작".
3. Fast-Lock: 3-dot consensus tracker confirms 4 valid scores totaling the standard sum (100,000) within 0.2~0.3s and auto-captures.
4. Review & Commit: Raw scores convert instantly into Uma/Oka rank points; if dealer is not player 1, a single tap rotates seats; user taps "기록 추가" to append to the match ledger and update the shareable link.

## Architecture and interfaces
- Routing: `react-router-dom` `Routes` in `App.tsx` defining `/scan_score`, `/test_scan`, and redirect from `/set_score_photo`.
- Component: Refactored `ScorePhotoInputPage.tsx` integrating `UmaOkaTable`, `PlayerTotals`, and `PlayerManagementAndScores`.
- Scanning Panel: `PhotoUploadPanel.tsx` parameterized with `isTestMode?: boolean`, removing manual capture inputs.
- Translations: New translation keys for scanner service/test titles and guidance in `translations.ts`.

## Data and migrations
- Share State: Fully compatible with existing `ShareState` schema in `shareState.ts`.
- Route migration: URL `/set_score_photo` redirects to `/scan_score` preserving hash parameters `#d=...`.

## Failure modes and edge cases
- Camera permission denied or unsupported browser: Graceful fallback to manual numeric entry with clear inline instructions.
- Scoreboard total mismatch: HUD displays discrepancy and blocks recording until scores sum to expected target.
- Test mode without active `mobile-drop` server: Shows disconnected status gracefully without freezing scanner.

## Security, privacy, and permissions
- Service page never uploads video or image data to any external server.
- Test page only connects to user-configured local `mobile-drop` tunnels protected by 6-digit PIN.

## Observability and operations
- Status text reflects consensus progress (0/3, 1/3, 2/3, 3/3).
- Test page logs upload progress and connection state to screen.

## Test strategy
1. Unit and integration tests for route redirection and page rendering in `App.test.tsx` and `ScorePhotoInputPage.test.tsx`.
2. Component tests verifying `PhotoUploadPanel.test.tsx` has no photo capture input and conditionally renders PC transfer controls based on `isTestMode`.
3. Verification that recognized scores correctly calculate Uma/Oka ranking in `ScorePhotoInputPage.tsx`.
4. Full regression pass with `npm test -- --watchAll=false` and production build with `npm run build`.

## Acceptance criteria
- AC-001: Navigating to `/scan_score` renders the complete Uma/Oka score table, player management, and live scan interface without PC transfer controls.
- AC-002: Navigating to `/test_scan` renders the scan interface with the PC transfer configuration panel and multi-machine selector (`rex3`, `jpex`, `jpcolor`).
- AC-003: Navigating to `/set_score_photo` automatically redirects to `/scan_score`.
- AC-004: In `PhotoUploadPanel.tsx`, the manual photo capture button (`📷 점수판 촬영하기`) and `<input type="file" capture="environment">` are absent.
- AC-005: All unit and integration test suites pass, and production build completes without errors.

## Traceability
Uma/Oka rebuilt scanning outcome → REQ-001 → AC-001. Route migration and navigation outcome → REQ-002 → AC-002, AC-003. Service vs Test separation outcome → REQ-003 → AC-001, AC-002. Photo button removal outcome → REQ-004 → AC-004. Overall unified workflow and testing → REQ-005 → AC-001, AC-005.

## Open decisions
None blocking. Service route set to `/scan_score` and test lab route set to `/test_scan`.
