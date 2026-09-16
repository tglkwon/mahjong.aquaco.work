# 의도

## 메타데이터
- 작업 ID: scanner-negative-hud-feedback
- 기준본 리비전(Canonical revision): 3
- 언어(Language): ko
- 영문 기준본(Canonical): intent.md
- 요청자: 사용자 요청 및 후속 피드백
- 상태(Status): ready
- 위험도(Risk): standard
- 생성일: 2026-09-16
- 수정일: 2026-09-16
- 담당: 주 구현 에이전트

## 최초 요청
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

한국어 요약:
마작 점수판 스캐너에서 들통(하코텐) 국면의 마이너스 부호를 인식할 수 있도록 가로형 바 Connected Component를 감지하고, 비디오 화면에 불필요한 이중 마스킹 스크림을 제거한 개방형 조준 레티클을 제공하며, 3회 연속 일치 수렴 과정을 3단계 발광 색상(White -> Blue -> Emerald), 3-dot 게이지, 100ms 가속 화이트 플래시 효과로 시각화한다.

## 문제와 근거
1. 마이너스 점수 들통(하코텐) 결함: 실전 경기 중 점수가 음수(예: -2,000점, 100점 단위 표시 시 "-020")가 되는 경우가 발생하나, 기존 인식기는 높이가 12px 미만이거나 너비가 높이보다 큰 가로 막대를 노이즈로 필터링하여 음수 부호를 인식하지 못하고 4인 합계 불일치로 타임아웃이 발생함.
2. 뷰파인더 과도한 시야 제한: 뷰파인더 컨테이너(`h-52 sm:h-60`)는 CSS `object-cover`를 통해 세로 비디오의 상하 35%씩을 이미 자연스럽게 잘라내고 있음. 여기에 추가로 상하 25% 반투명 스크림을 덧씌워 실제 조준 창이 104px로 지나치게 좁아져 4개 점수판을 담기에 조준 피로도가 가중됨.
3. 시각적 수렴 피드백 부재: `PhotoUploadPanel.tsx`의 `onReading` 콜백에서 오는 `stable.count`(0~3) 수렴 상태가 하단 텍스트로만 전달되어 사용자가 카메라를 얼마나 안정적으로 유지해야 하는지 직관적으로 인지하기 어려움.
4. 플래시 지연: 기존 200ms 플래시는 전환이 다소 지연되므로 100ms로 단축하여 즉각적인 캡처 반응성을 제공함.

## 원하는 결과
1. `isMinusBar` Connected Component를 감지하여 점수 런의 맨 앞 요소가 마이너스 바인 경우 `"-"` 부호를 부여하고 draft 변환 시 정상적인 음수 점수(예: `"-020"` -> `-2000`)로 처리.
2. 비디오 뷰파인더에 상하 스크림을 제거한 개방형 전체 프레임과 4개 모서리 L자형 조준 레티클(Corner Reticle)을 렌더링하여 쾌적한 조준 환경 제공.
3. `stable.count`(0~3) 수치를 바인딩하여 상단 3-dot 게이지(`● ○ ○` -> `● ● ○` -> `● ● ●`), 테두리 및 레티클 발광 색상(White -> Blue -> Emerald), 3회 도달 시 100ms 화이트 플래시 효과 제공.

## 범위
- `src/utils/scoreRecognition.ts`: `isMinusBar` connected component filtering, grouping compatibility, leftmost minus sign binding, rank slice preservation (`!group[0].isMinus`), unit test coverage.
- `src/components/PhotoUploadPanel.tsx`: Open full-frame viewfinder overlay, corner reticles, `consensusCount` state binding from `onReading`, 3-dot progress indicator, dynamic border/reticle colors, 100ms capture flash transition.
- Unit and UI regression tests for negative score recognition and viewfinder visual state bindings.

## 제외 범위
- 브라우저 `getUserMedia` 물리 해상도/파라미터 변경.
- `scoreStability.ts`의 슬라이딩 윈도우 합의 알고리즘 자체 수정.
- 사용자 최종 확인 없는 자동 DB 기록.
- 클라우드 배포 또는 백엔드 마이그레이션.

## 제약과 정책
- 모든 이미지 처리는 클라이언트 로컬에서만 수행하며 서버 업로드 금지.
- 기존 AMOS REXX 3 양수 점수 인식 및 순위 슬라이스 로직과의 100% 하위 호환성 유지.
- 모바일 뷰포트에서 레이아웃 깨짐 없이 반응형으로 동작.
- 기존 테스트 스위트 100% 무결점 통과 유지.

## 수용 신호
- Recognizer unit tests verify `isMinusBar` detection and `-020` draft validation with 100,000 total score.
- Live video viewfinder visually marks the 50% ROI with top/bottom 25% scrims and corner reticles.
- Frame readings with consensus counts 0, 1, 2, 3 update the 3-dot gauge and border colors cleanly.
- Reaching count 3 triggers a 200ms white flash before completing the capture and transitioning to the review draft.

## 가정과 미해결 질문
- The minus bar occupies the vertical center level of adjacent digits and is strictly the leftmost element of a score run.
- When the bottom seat (Player 1 / East) is negative, the leftmost element is a minus sign, not a rank digit.

## 결정 사항
- Work ID is set to `scanner-negative-hud-feedback`.
- The 200ms flash is managed via component state in `PhotoUploadPanel.tsx` to ensure smooth visual transition before showing the review draft.
- Standard risk classification. Human review gate required prior to source modifications.
