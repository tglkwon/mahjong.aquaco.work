# 명세

## 메타데이터와 출처
- 작업 ID: scanner-negative-hud-feedback
- 기준본 리비전(Canonical revision): 3
- 언어(Language): ko
- 영문 기준본(Canonical): spec.md
- 출처: intent.md 리비전 3

## 요약
마작 점수판 스캐너에 들통(하코텐) 마이너스 부호 인식 기능, 불필요한 이중 스크림을 제거한 개방형 조준선(Reticle) HUD, 3단계 시각 수렴(Consensus) 피드백 및 100ms 가속 확정 플래시 효과를 제공한다.

## 기능 요구사항
- REQ-001: Filter horizontal single-bar connected components matching `isMinusBar` (`w >= 6 && w <= 28 && h >= 2 && h <= 12 && w >= h * 1.3 && tail >= 12`) in `scoreRecognition.ts`. When `isMinusBar` is the leftmost element of a digit group run, assign `"-"` to produce signed score drafts (e.g. `"-020"` -> `-2000`). Preserve 4-player sum validation for games with negative scores.
- REQ-002: In `PhotoUploadPanel.tsx`, overlay an open full-frame viewfinder HUD with four L-shaped corner reticles, removing restrictive 25% top/bottom scrim masks to leverage natural CSS `object-cover` framing while providing a generous targeting area.
- REQ-003: Bind `stable.count` (0 to 3) from `startScoreCamera`'s `onReading` callback to React state `consensusCount`. Transition reticle/border illumination colors across consensus stages (Count 0: White -> Count 1: Blue -> Count 2-3: Emerald) and render a 3-dot gauge (`● ○ ○` -> `● ● ○` -> `● ● ●`). Upon reaching count 3, display a 100ms white flash overlay before stopping the camera and presenting the editable draft.
- REQ-004: Maintain 100% backward compatibility with AMOS REXX 3 positive score recognition, bottom-seat rank slicing (`!group[0].isMinus`), player seat rotation, manual entry fallback, and developer PC drop bridges.

## 비기능 요구사항
이미지 분석은 100% 브라우저 메모리(canvas) 상에서 로컬 처리한다. 다양한 모바일 화면 비율에서 가로 스크롤 없이 유연하게 반응해야 하며, 시각적 상태 변화는 가볍고 빠른 CSS 스타일로 처리한다.

## 사용자 경험과 흐름
1. 스캔 시작: 뷰파인더가 열리며 시야를 가리는 스크림 없이 4 모서리 L자형 조준 레티클과 `○ ○ ○` 게이지가 깔끔하게 표시된다.
2. 조준 및 일치: 사용자가 점수판을 뷰파인더 화면에 맞추면, 1회 일치 시 Blue 발광과 `● ○ ○`, 2회 일치 시 Emerald 발광과 `● ● ○`로 실시간 수렴 상태가 표시된다.
3. 자동 캡처: 3회 일치(`● ● ●`) 달성 즉시 경쾌한 100ms 화이트 플래시가 번쩍이고, 카메라가 닫히며 마이너스 점수가 정확히 반영된 점수 검토 화면으로 전환된다.

## 아키텍처와 인터페이스
- `scoreRecognition.ts`: Introduce `isMinus?: boolean` property on `Box`. Allow `isMinusBar` boxes to group with adjacent digits horizontally. Map leftmost minus box to `"-"`. Guard rank slice on Player 1 seat (`!group[0].isMinus`).
- `PhotoUploadPanel.tsx`: Manage `consensusCount` and `flashing` states. Render full-frame corner reticle classes and 100ms flash timer inside the video container.

## 데이터와 마이그레이션
해당 없음: 클라이언트 전용 UI 및 인식 로직이며, 서버 스키마나 API 변경 사항은 없다.

## 실패 모드와 경계 사례
- 숫자 중간에 나타난 잡음 바: 최좌측 위치가 아닌 마이너스 바는 점수 런에서 배제하거나 오류 처리.
- 순위 슬라이스 충돌: 내자리가 마이너스 점수인 경우 첫 글자 마이너스 부호를 순위 숫자로 잘못 잘라내지 않도록 방어.
- 플래시 도중 빠른 언마운트: 타이머를 정리하여 메모리 누수 및 언마운트 후 상태 업데이트를 방지.

## 보안, 개인정보, 권한
카메라 영상은 브라우저 로컬에서만 처리되며 외부로 전송되지 않는다. 오디오 권한을 요구하지 않으며, 캡처/중지/이탈 시 트랙을 즉시 해제한다.

## 관측성과 운영
3-dot 게이지와 동적 안내 텍스트를 통해 사용자가 현재 인식 합의 진행 상황과 오류를 직관적으로 파악할 수 있다.

## 테스트 전략
1. Add unit tests in `scoreRecognition.test.ts` for horizontal minus bar detection, grouping, and negative draft validation.
2. Add component tests in `PhotoUploadPanel.test.tsx` verifying full-frame reticle rendering, reticle classes, consensus count state binding, and 100ms flash transition.
3. Run full regression test suite (`react-scripts test --watchAll=false`).

## 수용 기준
- AC-001: 단위 테스트에서 isMinusBar를 정상 추출하고 마이너스 점수를 포함한 4인 점수가 기준 합계 100,000점으로 검증됨을 확인.
- AC-002: UI 테스트에서 스캔 중 불필요한 스크림 없이 4 모서리 L자형 조준 레티클이 렌더링됨을 확인.
- AC-003: UI 테스트에서 consensusCount 0~3 변화에 따른 3-dot 게이지, 테두리 색상 변화, 100ms 플래시 호출을 확인.
- AC-004: 기존 AMOS REXX 3 양수 테스트 및 순환 이동 테스트가 기존대로 100% 통과함을 확인.

## 추적성
- 들통(하코텐) 결함 해결 -> REQ-001 -> AC-001
- 개방형 조준선 HUD -> REQ-002 -> AC-002
- 3단계 수렴 피드백 및 100ms 플래시 -> REQ-003 -> AC-003
- 기존 기능 호환성 보존 -> REQ-004 -> AC-004

## 미결정 사항
None blocking. 100ms 플래시 타이머와 개방형 뷰파인더 레티클은 `PhotoUploadPanel.tsx`에 캡슐화됨.
