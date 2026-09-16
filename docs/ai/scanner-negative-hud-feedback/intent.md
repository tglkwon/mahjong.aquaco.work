# Intent

## Metadata
- Work ID: scanner-negative-hud-feedback
- Artifact revision: 3
- Language: en
- Korean mirror: intent.ko.md
- Originator: user request & follow-up feedback
- Status: ready
- Risk: standard
- Created: 2026-09-16
- Updated: 2026-09-16
- Owner: root implementation agent

## Originating request
# 실행 프롬프트: 마작 점수판 스캐너 고도화 (마이너스 부호 지원, 뷰파인더 조준선, 3단계 시각 수렴 피드백)
/ai-native-sdlc 

## 1. 목표
- 실전 마작 들통(하코텐) 국면의 마이너스 점수(`-`)를 감지하지 못해 합계 불일치로 타임아웃되던 결함을 해결한다.
- 뷰파인더 컨테이너(`h-52 sm:h-60`)의 불필요한 이중 상하 스크림을 제거하고 전체 프레임 L자형 조준 HUD를 제공하여 넓고 쾌적한 조준 환경을 제공한다.
- 3회 연속 일치(Consensus) 수렴 과정을 진동 없이 뷰파인더 모서리 발광 색상 변화(White -> Blue -> Emerald) 및 3단계 도트 인디케이터(`● ○ ○` -> `● ● ○` -> `● ● ●`), 100ms 가속 확정 캡처 플래시 효과로 시각화한다.

## 2. 세부 구현 범위
1. `src/utils/scoreRecognition.ts`:
   - Connected Component 필터링에 가로형 단일 바(`isMinusBar`: `w >= 6 && w <= 28 && h >= 2 && h <= 12 && w >= h * 1.3 && tail >= 12`) 추가.
   - 가로 그룹 런 최좌측 요소가 `isMinusBar`인 경우 숫자 대신 `"-"` 부호 부여 (`"-020"` -> draft 변환 시 `-2000`).
   - AMOS REX III 전면 패널 및 기타 작탁 모델의 마이너스 점수 4인 합계 검증 지원.
2. `src/components/PhotoUploadPanel.tsx`:
   - 뷰파인더 HUD: 좁은 상하 25% 마스킹 스크림을 제거하고 전체 프레임에 4 모서리 L자형 조준 레티클(Corner Reticle) 렌더링.
   - `onReading` 콜백의 `stable.count` 수치(0~3)를 React 상태로 바인딩하여 뷰파인더 상단 3-dot 게이지 및 테두리 색상 실시간 연동.
   - 3회 달성(`count === 3`) 시 100ms 가속 화이트 캡처 플래시 오버레이 실행 후 자동 캡처 완료.

English synthesis:
Enhance the Mahjong scoreboard scanner by supporting negative scores (hakoten) via horizontal minus bar connected components, providing an open full-frame viewfinder HUD with corner reticles (removing restrictive 25% scrims), and delivering 3-stage visual consensus convergence feedback (white to blue to emerald illumination, 3-dot gauge, and a 100ms white flash upon capture).

## Problem and evidence
1. Negative score bankruptcy (hakoten): During actual games, a player score can be negative (e.g. -2,000 pts displayed as "-020" in 100-pt units). The existing recognizer filters out horizontal single bars as noise because height is below 12px or width exceeds height, failing to recognize the "-" sign and causing score sum mismatches (timeout).
2. Viewfinder over-constriction: The viewfinder container (`h-52 sm:h-60`) already crops vertical video via `object-cover`. Adding extra 25% top/bottom scrims double-cropped the visible view down to ~104px, making it unnecessarily cramped and frustrating to frame all 4 scores.
3. Lack of visual convergence feedback: `stable.count` (0 to 3) from `onReading` callback in `PhotoUploadPanel.tsx` is communicated only via plain status text. Users cannot intuitively perceive how close the scanner is to consensus lock, leading to premature camera movement before capture.
4. Flash latency: The original 200ms flash delayed transition to the review state; 100ms provides a snappier response.

## Desired outcomes
1. Correctly recognize negative signs via `isMinusBar` connected components, prepending `"-"` when positioned at the leftmost position of a digit run (e.g., `"-020"` converted to `-2000`).
2. Provide a clear HUD over the video feed: open full-frame viewfinder with 4 L-shaped corner reticles, removing restrictive upper/lower scrim masks.
3. Bind `stable.count` (0 to 3) to visual feedback: 3-dot gauge (`● ○ ○` -> `● ● ○` -> `● ● ●`), border and reticle illumination color transitions (White -> Blue -> Emerald), and a snappy 100ms white flash overlay upon consensus capture.

## Scope
- `src/utils/scoreRecognition.ts`: `isMinusBar` connected component filtering, grouping compatibility, leftmost minus sign binding, rank slice preservation (`!group[0].isMinus`), unit test coverage.
- `src/components/PhotoUploadPanel.tsx`: Open full-frame viewfinder overlay, corner reticles, `consensusCount` state binding from `onReading`, 3-dot progress indicator, dynamic border/reticle colors, 100ms capture flash transition.
- Unit and UI regression tests for negative score recognition and viewfinder visual state bindings.

## Non-goals
- Modifying physical camera resolutions or browser `getUserMedia` constraints.
- Changing `scoreStability.ts` sliding window consensus algorithms.
- Automatic recording without explicit human confirmation.
- Cloud deployment or external backend migrations.

## Constraints and policies
- Local client-side processing only: no video or image upload to remote servers.
- Preserve backward compatibility with existing AMOS REXX 3 positive score recognition and rank slicing.
- Keep UI accessible, responsive, and performant on mobile viewports.
- Maintain test coverage across all existing test suites without regressions.

## Acceptance signals
- Recognizer unit tests verify `isMinusBar` detection and `-020` draft validation with 100,000 total score.
- Live video viewfinder visually marks the 50% ROI with top/bottom 25% scrims and corner reticles.
- Frame readings with consensus counts 0, 1, 2, 3 update the 3-dot gauge and border colors cleanly.
- Reaching count 3 triggers a 200ms white flash before completing the capture and transitioning to the review draft.

## Assumptions and open questions
- The minus bar occupies the vertical center level of adjacent digits and is strictly the leftmost element of a score run.
- When the bottom seat (Player 1 / East) is negative, the leftmost element is a minus sign, not a rank digit.

## Decisions
- Work ID is set to `scanner-negative-hud-feedback`.
- The 200ms flash is managed via component state in `PhotoUploadPanel.tsx` to ensure smooth visual transition before showing the review draft.
- Standard risk classification. Human review gate required prior to source modifications.
