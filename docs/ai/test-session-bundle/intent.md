# Intent

## Metadata
- Work ID: test-session-bundle
- Artifact mode: canonical
- Artifact revision: 4
- Language: en
- Status: ready
- Risk: standard
- Created: 2026-09-20
- Updated: 2026-09-21
- Owner: agent

## Originating request
The user requested:
"스킬: gemini-autonomous-sdlc
# 작업 목표: 테스트 기능 일반 서비스 격리 및 원클릭 모바일 테스트 세션 번들 구축

## 1. 일반 서비스 UI에서 테스트 기능 완전 은닉
- 사이드바(`Sidebar.tsx`) 메뉴에서 `/scan_score_test` 제거.
- 대기열(`QueuePage.tsx`) 및 좌석 체크인(`SeatCheckinPage.tsx`) 화면의 점수 인식 진입 링크를 프로덕션 경로인 `/scan_score`로 변경.
- 프로덕션 점수 입력 화면(`ScorePhotoInputPage.tsx`)에서 테스트 랩 전환 탭 버튼 비노출 처리.

## 2. 개발자 온디맨드 접근성 및 기능 보존
- 브라우저 주소창 직접 접속(`/scan_score_test` 및 `?testMode=true`) 시 개발자 랩, 진단 도구, PC 전송 브리지 정상 동작 유지.
- `PhotoUploadPanel.tsx`의 `dropUrl`, `dropPin`, `device` 쿼리 파라미터를 통한 원격 수신기 자동 연동 보존.

## 3. 원클릭 모바일 테스트 세션 번들 오케스트레이션
- `scripts/start-test-session.ps1`:
  - React 개발 서버(포트 3000) 및 `mobile-drop` 수신기(포트 8899) 백그라운드 구동.
  - Cloudflare 터널을 통해 웹 및 파일 전송용 공개 URL 발급.
  - 파라미터가 사전 주입된 모바일 전용 원클릭 URL(`https://<web-tunnel>.trycloudflare.com/scan_score_test?dropUrl=https://<drop-tunnel>.trycloudflare.com/upload&dropPin=...&device=...`)을 콘솔에 즉시 출력.
  - 세션 메타데이터(`.test-session.json`) 생성 및 프로세스 PID 기록.
- `scripts/stop-test-session.ps1`:
  - "서버 닫아줘" 또는 "테스트 종료" 요청 시 관련 백그라운드 프로세스들을 일괄 안전 종료 및 세션 파일 정리.

## 4. 운영 문서화 및 품질 게이트
- `GEMINI.md`에 표준 트리거 키워드("모바일 테스트 서버 열어줘", "서버 닫아줘") 및 실행 절차 명시.
- 컴포넌트 네비게이션 격리 검증 단위 테스트 추가 (`App.test.tsx`, `QueuePage.test.tsx`, `SeatCheckinPage.test.tsx`, `ScorePhotoInputPage.test.tsx`).
- 전체 단위 테스트, TypeScript 검사, 프로덕션 빌드, SDLC 체인 검증 통과."

User additional requirement:
"현재 진행 중인 SDLC 계획서에 대기열(/queue) 사이드바 메뉴 추가하고 반영해서 진행해줘."

## Problem and evidence
- During MVP 1 development, the developer test lab (`/scan_score_test`), PC drop bridge, and test badges were directly linked in the public sidebar and sub-pages.
- With MVP 1 verified, the application is preparing for production deployment. Public users must not see developer tools, test lab links, or PC drop transfer interfaces.
- The queue page (`/queue`) provides valuable offline parlor and casual match seat drawing utility without requiring query parameters, so it belongs in the public navigation.
- The seat check-in page (`/seat`) strictly requires query parameters (`?table=1&seat=east`) and must remain accessible only via physical table QR codes.
- Developers still require frictionless on-demand access to test features and a bundled workflow to spin up the test environment ("모바일 테스트 서버 열어줘") that automatically connects mobile scanning to the PC drop receiver without manual URL/PIN configuration.

## Desired outcomes
- Public service navigation (`Sidebar.tsx`, `QueuePage.tsx`, `SeatCheckinPage.tsx`, `ScorePhotoInputPage.tsx`) completely hides all test lab links, developer badges, and switcher tabs.
- Sidebar menu adds `/queue` (`🀄 대기열 & 자리 추첨`), while strictly keeping `/seat` isolated to QR entry.
- Developers can access `/scan_score_test` and `?testMode=true` directly via URL whenever needed, with full diagnostics and PC transfer bridge active.
- `PhotoUploadPanel.tsx` continues to support query parameter auto-configuration (`dropUrl`, `dropPin`, `device`).
- A single launcher script (`scripts/start-test-session.ps1`) spins up the React dev server (port 3000), `mobile-drop` Python receiver (port 8899), and Cloudflare tunnels, outputting a single pre-configured mobile link with pre-filled `dropUrl`, `dropPin`, and `device` parameters, and recording `.test-session.json`.
- A single cleanup script (`scripts/stop-test-session.ps1`) cleanly terminates all test session processes and cleans up session files.
- Operational triggers documented in `GEMINI.md`.
- Automated test coverage in `App.test.tsx`, `QueuePage.test.tsx`, `SeatCheckinPage.test.tsx`, and `ScorePhotoInputPage.test.tsx`.

## Scope
- Hide `/scan_score_test` from `Sidebar.tsx` standard menu and add `/queue` (`🀄 대기열 & 자리 추첨`) with i18n support.
- Update `QueuePage.tsx` and `SeatCheckinPage.tsx` scan buttons to route to `/scan_score`.
- Hide test switcher tabs in `ScorePhotoInputPage.tsx` when on `/scan_score` without `testMode=true`.
- Retain `/scan_score_test` route and test lab functionality in `App.tsx` and `PhotoUploadPanel.tsx`, adding `?testMode=true` query param support.
- Create `scripts/start-test-session.ps1` and `scripts/stop-test-session.ps1`.
- Document standard triggers in `GEMINI.md`.
- Unit test suite updates and full quality gates.

## Non-goals
- Adding `/seat` to public sidebar (must remain strictly QR-based).
- Modifying OCR score recognition or table classification algorithms.
- Removing `mobile-drop` client or PC transfer code from the repository.
- Modifying database schemas or external backends.

## Constraints and policies
- Must remain 100% offline-capable on the client side.
- Tunnels use ephemeral Cloudflare Quick Tunnels (`trycloudflare.com`).
- Zero sensitive credentials committed to the repository.

## Acceptance signals
- Public navigation contains zero links to `/scan_score_test` and contains `/queue`.
- Direct navigation to `/scan_score_test` or `?testMode=true` opens the developer test lab with PC drop bridge.
- `start-test-session.ps1` outputs a functional, pre-configured mobile URL and `.test-session.json`.
- `stop-test-session.ps1` safely terminates all processes.
- All automated tests pass (`App.test.tsx`, `QueuePage.test.tsx`, `SeatCheckinPage.test.tsx`, `ScorePhotoInputPage.test.tsx`), `npx tsc --noEmit` passes, and production build succeeds.

## Assumptions and open questions
- Assumptions: The developer operates on Windows with PowerShell and Python available for `mobile-drop`.
- Open questions: None.

## Decisions
- Hide test links via client-side routing rather than completely removing the test page, allowing on-demand access via direct URL and `?testMode=true`.
- Expose `/queue` in `Sidebar.tsx` to facilitate offline parlor queueing and casual match seat drawing, while omitting `/seat` to avoid session corruption.
- Pre-fill `dropUrl`, `dropPin`, and `device` in the emitted mobile URL so mobile testing requires zero manual configuration.
- Store session metadata in `.test-session.json` in the workspace root for deterministic process teardown.
