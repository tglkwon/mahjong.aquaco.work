# Intent

## Metadata
- Work ID: live-score-scan
- Artifact revision: 1
- Language: en
- Korean mirror: intent.ko.md
- Originator: user conversation
- Status: ready
- Risk: standard
- Created: 2026-09-13
- Updated: 2026-09-13
- Owner: root implementation agent

## Originating request
오늘은 가게 갈 일이 없으니 가게 방문 전: 기존 점수판 영상으로 연속 인식·자동 캡처·중복 방지·플레이어 배정을 검증을 해보자.

English synthesis: Implement and verify the previously discussed mobile-web live scan flow using existing scoreboard video before an eventual shop visit.

## Problem and evidence
The conversation establishes photo-based input, a reusable REXX 3 recognizer, local sample video, and an intended live-camera workflow. Previous reports of passing tests do not establish current live scan behavior or real-phone accuracy.

## Desired outcomes
Stream the rear camera into the mobile webpage, recognize consecutive frames locally, capture one stable result automatically, and preserve human review and player mapping before recording.

## Scope
REXX 3 only; camera lifecycle; consecutive-frame stability; automatic draft capture; duplicate prevention; one-seat assignment rotation; photo/manual fallback; browser evidence using the existing real-video derivative.

## Non-goals
No other table presets, automatic final recording, phone/shop validation today, deployment, or tunnel activation.

## Constraints and policies
Request video only with no audio, prefer the rear camera, and process canvas pixels locally without video upload. Use at most five fresh-frame readings per second. Stop all tracks after capture, cancellation, hidden-page transition, or unmount, including a permission response arriving after cancellation.

## Acceptance signals
At least five identical four-score readings spanning at least 1000 ms, matching the configured expected total (default 100000), correct score units, and distinct assigned players produce one editable draft. Human confirmation remains required. Unstable, invalid, stale, or cancelled sessions do not capture. Rotation cycles player assignments and requires renewed confirmation.

## Assumptions and open questions
Desktop browser video playback can prove integration and deterministic behavior, but cannot prove smartphone autofocus, LED bloom tolerance, battery use, or real-phone frame rate. Those checks are explicitly deferred. No blocking product question remains.

## Decisions
The embedded intent grill reconciled the accepted conversation: REXX 3 MVP; East-seat recorder; local video processing; stable automatic capture followed by human confirmation. The visual preview is inapplicable because this task implements and tests the already explained and accepted scan-to-review flow; no new visual approval is required. Standard local reversible work is authorized. Independent review will inspect correctness and camera cleanup.
