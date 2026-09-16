# Intent

## Metadata
- Work ID: score-scan-umaoka-rebuild
- Artifact revision: 2
- Language: en
- Korean mirror: intent.ko.md
- Status: ready
- Risk: standard
- Created: 2026-09-16
- Updated: 2026-09-16
- Originator: user conversation
- Owner: root implementation agent

## Originating request
mvp 1.4 전체 ui 개선
1. 현재 영상 점수 인식 베타 페이지를 우마 오카에 점수 인식 기능 및 ui를 추가한 방식으로 리빌딩할 수 있어?
2. 하는 김에 주소가 set_score_photo 말고 점수인식, 영상 인식과 관련된 단어로 바꾸고 싶어. 추천해줘.
3. 사이트의 전체적인 ui를 개선해보려고 해. set_score 페이지에서 set_score_umaoka로 바뀔 때 UI/UX 유저 워크플로우를 고려해서 개선 방향성을 정리해봐.
4. 서비스하는 페이지와 테스트하는 페이지를 만들어서 개발을 하려고 해. 둘의 차이는 pc 전송 모드의 유무야. 테스트 페이지에서만 pc 전송 모드가 있고, 현재의 렉스 3을 넘어 다양한 기종에 대한 지원하기 위한 자료를 모으려고 해.
5. 점수판을 직접 촬영하는 기능 및 버튼을 제거해줘. 실시간 스캔이 더 쉽고 빠르고, 정확해졌어.

English synthesis: The user requested a comprehensive UI/UX refactoring and workflow rebuild for MVP 1.4:
1. Rebuild the video score recognition beta page by embedding score recognition and its UI into the complete Uma/Oka tracking system.
2. Recommend and replace the legacy route `/set_score_photo` with intuitive routing names related to score scanning and video recognition.
3. Establish a coherent UI/UX workflow transition from the raw score tracker (`/set_score`) to the comprehensive Uma/Oka tracker (`/set_score_umaoka`).
4. Separate into a production Service Page (clean end-user UI without developer debug bridge) and a Test/Lab Page (equipped with the `mobile-drop` PC transfer bridge and multi-machine target selector for collecting Rexx 3, JP-EX, JP-Color, and future table models).
5. Remove the legacy manual photo capture button and input, dedicating the scanner entirely to high-speed real-time video stream scanning while retaining manual typing as a fallback.

## Problem and evidence
1. `ScorePhotoInputPage.tsx` currently only renders the legacy raw `Table`, lacking tournament Uma/Oka rank calculation, tie-breaking rules (`split`/`seatOrder`), player pool management beyond 4 seats, chombo penalty handling, and compressed `#d=` game records.
2. The route `/set_score_photo` implies static photo upload, contradicting the 0.2~0.3s real-time live video stream scanning engine introduced in MVP 1.3/1.4.
3. Navigating between raw `/set_score` and `/set_score_umaoka` creates workflow friction, as modern Riichi Mahjong matches universally use Uma and Oka rules.
4. Developers need `mobile-drop` and multi-device dataset gathering (Rexx 3, JP-EX, JP-Color) during field tests, but regular players should not see complex PC transfer bridge controls, tunnel URLs, or PIN inputs.
5. The manual photo capture button (`📷 점수판 촬영하기`) is redundant, slower, and inferior to the real-time sliding window consensus scanner.

## Desired outcomes
1. Rebuild score recognition directly on top of the Uma/Oka system so recognized raw scores seamlessly map to seats (East, South, West, North), calculate Uma/Oka rank scores, and commit into the shared session state.
2. Migrate route `/set_score_photo` to `/scan_score` for the production service and `/test_scan` for the test laboratory, with automatic backward-compatible redirection to `/scan_score`.
3. Provide a clear user workflow from seat assignment to live scan, instant consensus confirmation, score allocation, and one-touch shareable link generation.
4. Cleanly separate the Service Page (`/scan_score` - without PC transfer panel) and the Test Page (`/test_scan` - with PC transfer panel and multi-machine selector).
5. Eliminate the manual camera file capture element and button, promoting the real-time scanner as the primary interface and manual typing as the fallback.

## Scope
- Rebuilt components: `ScorePhotoInputPage.tsx` -> enhanced Uma/Oka scanning engine.
- Routing & Navigation: `App.tsx`, `Sidebar.tsx`, `MainPage.tsx`, `Header.tsx`, `i18n/translations.ts`.
- Service vs Test separation: `/scan_score` (Production) vs `/test_scan` (Lab/Test with `mobile-drop`).
- Scanner UI: Remove manual photo capture button and input from `PhotoUploadPanel.tsx`.
- Tests and verification suites.
- SDLC documentation and visual preview in `docs/ai/score-scan-umaoka-rebuild/`.

## Non-goals
- Modifying underlying OCR 7-segment core algorithms or threshold probes (already verified in `rexx3-letterbox-ocr-fix`).
- Introducing server-side database storage or user authentication.

## Constraints and policies
- Client-side in-memory processing only.
- Strict backward compatibility for existing `#d=` and legacy `#data=` share URLs.
- Single-shell PowerShell execution for Windows.

## Acceptance signals
1. Live scan results automatically flow into Uma/Oka score distribution and calculate correct tournament ranking points.
2. Route `/scan_score` presents a clean user experience with no PC transfer controls visible.
3. Route `/test_scan` displays the PC transfer configuration panel with multi-machine selection options (Rexx 3, JP-EX, JP-Color).
4. Navigating to `/set_score_photo` redirects seamlessly to `/scan_score`.
5. Manual photo capture button and input are completely removed from the UI.
6. All automated tests pass and production build succeeds.

## Assumptions and open questions
- The production route is `/scan_score` and test route is `/test_scan`.
- Legacy URL redirection ensures existing shared bookmarks do not break.

## Decisions
- Rebuilding the score scanning page on top of the full Uma/Oka calculation pipeline.
- Distinguishing Service vs Test via dedicated routes and clean component props.
