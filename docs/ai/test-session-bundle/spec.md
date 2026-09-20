# Specification

## Metadata and source
- Work ID: test-session-bundle
- Artifact mode: canonical
- Artifact revision: 4
- Language: en
- Source: intent.md revision 4

## Summary
Define requirements, architecture, and acceptance criteria for isolating developer testing pages and badges from the public service UI in `mahjong.aquaco.work` prior to production deployment, adding `/queue` (대기열 & 자리 추첨) to public navigation while keeping `/seat` strictly QR-based, and providing an integrated, one-click developer test session workflow ("모바일 테스트 서버 열어줘", "서버 닫아줘") that bundles the React dev server, mobile-drop PC receiver, Cloudflare tunnels, and pre-configured mobile test URLs.

## Functional requirements
- `REQ-001`: In `src/components/Sidebar.tsx`, the `/scan_score_test` (🧪 테스트 스캔) navigation item MUST NOT be rendered in public navigation. Only `/scan_score` (📹 점수판 스캔) MUST be visible to users.
- `REQ-002`: In `src/components/QueuePage.tsx` and `src/components/SeatCheckinPage.tsx`, all buttons and countdown redirects navigating to score scanning MUST route to `/scan_score` rather than `/scan_score_test`.
- `REQ-003`: In `src/components/ScorePhotoInputPage.tsx`, the header tab/link to `/scan_score_test` ("🧪 PC 전송 테스트 Lab 이동") MUST be hidden when viewing the production `/scan_score` page (when neither `isTestMode` prop nor `testMode=true` query param is present), ensuring general users cannot access test mode from the UI.
- `REQ-004`: Direct URL access to `/scan_score_test` AND query parameter `?testMode=true` (e.g., `/scan_score?testMode=true`) MUST remain fully functional, enabling developer access to the complete test lab with PC transfer bridge, table model diagnostics, and live session tools.
- `REQ-005`: `src/components/PhotoUploadPanel.tsx` MUST preserve automatic remote receiver configuration via `dropUrl`, `dropPin`, and `device` query parameters (handling both root URL and `/upload` path variations).
- `REQ-006`: Provide `scripts/start-test-session.ps1` to orchestrate the bundled test environment:
  - Start React dev server on port 3000 in the background.
  - Start `mobile-drop` receiver on port 8899 in the background.
  - Attach Cloudflare Quick Tunnels to both ports.
  - Emit a single pre-configured mobile test URL to the console:
    `https://<web-tunnel>.trycloudflare.com/scan_score_test?dropUrl=https://<drop-tunnel>.trycloudflare.com/upload&dropPin=<pin>&device=<device>`
  - Create session metadata file `.test-session.json` containing process PIDs, tunnel URLs, PIN, and start timestamp.
- `REQ-007`: Provide `scripts/stop-test-session.ps1` to cleanly shut down all background processes (React, Python, and cloudflared) using recorded PIDs and clean up `.test-session.json`.
- `REQ-008`: Update `GEMINI.md` to document the standard operational command phrases ("모바일 테스트 서버 열어줘", "서버 닫아줘") and execution protocols.
- `REQ-009`: Unit tests in `App.test.tsx`, `QueuePage.test.tsx`, `SeatCheckinPage.test.tsx`, and `ScorePhotoInputPage.test.tsx` MUST verify that public routes hide test links, navigate to `/scan_score`, and developer test mode remains accessible on demand.
- `REQ-010`: All automated tests (`npm test`), TypeScript checks (`npx tsc --noEmit`), and production build (`npm run build`) MUST pass.
- `REQ-011`: In `src/components/Sidebar.tsx`, add `/queue` (🀄 대기열 & 자리 추첨) to navigation items with i18n support (`queueTitle`), while `/seat` remains strictly excluded from navigation.

## Non-functional requirements
- General users browsing the deployed service MUST NOT see any testing badges, dev server buttons, or PC drop panels.
- The bundled test session launcher MUST start both services and tunnels within 30 seconds.
- Clean process termination without orphaned Node.js, Python, or cloudflared processes.

## User experience and flows
1. **Public Service Mode (Production)**:
   - User visits `https://mahjong.aquaco.work`.
   - Sidebar shows standard items: Home, Score Page, Score Scan (`/scan_score`), Uma/Oka Record, Queue (`/queue`), About.
   - Queue and Seat check-in pages navigate to `/scan_score`.
   - No developer buttons or PC drop panels appear anywhere.
2. **Developer Test Mode (On Demand)**:
   - Developer enters `/scan_score_test` or `/scan_score?testMode=true` directly.
   - All test features (PC transfer mode, device selector, raw frame rotation, live table session indicators) are displayed and active.
3. **Bundled Test Session Workflow**:
   - Developer says "모바일 테스트 서버 열어줘".
   - Agent runs `scripts/start-test-session.ps1`.
   - Script starts background servers, waits for tunnels, outputs clickable link with pre-filled drop tokens, and records `.test-session.json`.
   - Developer opens link on smartphone. The app opens directly in `/scan_score_test`, connects to the PC drop bridge automatically, and uploads test video/captures to `research-data/<device>/`.
   - When finished, developer says "서버 닫아줘". Agent runs `scripts/stop-test-session.ps1` to cleanly terminate all processes and remove session file.

## Architecture and interfaces
- `src/components/Sidebar.tsx`: Remove `/scan_score_test` and add `/queue`.
- `src/i18n/translations.ts`: Add `queueTitle` translation key.
- `src/components/QueuePage.tsx`, `src/components/SeatCheckinPage.tsx`: Change navigation target from `/scan_score_test` to `/scan_score`.
- `src/components/ScorePhotoInputPage.tsx`: Calculate `effectiveTestMode = isTestMode || searchParams.get('testMode') === 'true'`. Only render test lab switcher when in test mode.
- `src/utils/mobileDropClient.ts`: Clean server URL handling trailing `/upload` suffix to ensure `/status` and `/upload/chunk` endpoints are invoked correctly.
- `scripts/start-test-session.ps1`: Multi-process orchestrator for dual-service + dual-tunnel setup.
- `scripts/stop-test-session.ps1`: Safe process termination and `.test-session.json` cleanup script.

## Data and migrations
- No database migrations or schema alterations required.
- `.test-session.json` schema:
  ```json
  {
    "started_at": "2026-09-21T00:00:00.000Z",
    "web_port": 3000,
    "drop_port": 8899,
    "web_tunnel_url": "https://<web-id>.trycloudflare.com",
    "drop_tunnel_url": "https://<drop-id>.trycloudflare.com",
    "pin": "123456",
    "device": "rex3",
    "mobile_test_url": "https://<web-id>.trycloudflare.com/scan_score_test?dropUrl=https://<drop-tunnel>.trycloudflare.com/upload&dropPin=123456&device=rex3",
    "pids": {
      "web_server": 1234,
      "drop_server": 5678,
      "web_cloudflared": 9012,
      "drop_cloudflared": 3456
    }
  }
  ```

## Failure modes and edge cases
- **Port conflicts (3000 or 8899 already in use)**: Launcher detects existing processes and cleans them up before starting fresh.
- **Cloudflare tunnel timeout**: Launcher checks tunnel log for up to 20 seconds, reporting clear error if timeout occurs.
- **Trailing `/upload` in dropUrl**: `mobileDropClient.ts` trims `/upload` so that `/status` and `/upload/chunk` remain valid endpoints.

## Security, privacy, and permissions
- Zero camera video or pixel data is sent to third-party servers.
- `mobile-drop` requires a 6-digit session PIN and communicates exclusively over temporary encrypted HTTPS tunnels.
- Clean shutdown stops all listening ports and tunnels.

## Observability and operations
- Console logging of tunnel URLs, PINs, and upload progress.
- `.test-session.json` records active session state.

## Test strategy
- Unit tests: Update `App.test.tsx`, `QueuePage.test.tsx`, `SeatCheckinPage.test.tsx`, and `ScorePhotoInputPage.test.tsx` to assert test mode isolation, `/queue` presence in sidebar, and developer on-demand access.
- Quality gates: `npx tsc --noEmit`, full Jest test suite (`npm test -- --watchAll=false --forceExit`), and `npm run build`.

## Acceptance criteria
- `AC-001`: `Sidebar` does NOT contain `/scan_score_test` in navigation items.
- `AC-002`: `QueuePage` and `SeatCheckinPage` scan buttons navigate to `/scan_score`.
- `AC-003`: `ScorePhotoInputPage` on `/scan_score` does NOT show the test lab switcher tab.
- `AC-004`: Navigating directly to `/scan_score_test` or with `?testMode=true` renders the test lab and PC transfer bridge.
- `AC-005`: `PhotoUploadPanel` correctly accepts `dropUrl`, `dropPin`, and `device` query parameters.
- `AC-006`: `scripts/start-test-session.ps1` starts services and tunnels, creates `.test-session.json`, and outputs the pre-configured mobile URL.
- `AC-007`: `scripts/stop-test-session.ps1` safely terminates all test session processes and removes `.test-session.json`.
- `AC-008`: `GEMINI.md` documents trigger keywords ("모바일 테스트 서버 열어줘", "서버 닫아줘") and execution procedure.
- `AC-009`: `Sidebar` contains `/queue` (`🀄 대기열 & 자리 추첨`) and strictly omits `/seat`.

## Traceability
- `REQ-001` -> `AC-001`
- `REQ-002` -> `AC-002`
- `REQ-003` -> `AC-003`
- `REQ-004` -> `AC-004`
- `REQ-005` -> `AC-005`
- `REQ-006` -> `AC-006`
- `REQ-007` -> `AC-007`
- `REQ-008` -> `AC-008`
- `REQ-009` -> `AC-001`, `AC-002`, `AC-003`, `AC-004`, `AC-009`
- `REQ-010` -> `AC-001`, `AC-002`, `AC-003`, `AC-004`, `AC-005`, `AC-006`, `AC-007`, `AC-008`, `AC-009`
- `REQ-011` -> `AC-009`

## Open decisions
- None. All requirements and behaviors are fully specified.
