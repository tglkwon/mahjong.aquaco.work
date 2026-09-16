# 구현 계획

- 작업 ID: scanner-negative-hud-feedback
- 기준본 리비전(Canonical revision): 3
- 언어(Language): ko
- 영문 기준본(Canonical): plan.md

## 맥락과 목표 결과
실시간 마작 점수판 스캐너에 3가지 주요 개선을 적용한다:
1. 마이너스 점수 인식: 가로형 마이너스 바(`isMinusBar`) CC를 감지하여 최좌측 요소에 `"-"`를 부여하고 들통(하코텐) 국면의 4인 합계 검증을 지원한다.
2. 뷰파인더 HUD: 불필요한 상하 25% 이중 스크림을 제거하고 CSS `object-cover`의 자연스러운 프레이밍을 활용해 전체 화면 4 모서리 L자형 조준 레티클을 배치한다.
3. 3단계 시각 합의 피드백: `stable.count` (0-3)를 3-dot 게이지에 연동하고 조준선 발광 색상(White -> Blue -> Emerald) 및 100ms 가속 화이트 캡처 플래시를 구현한다.

## 저장소 상태와 제약
- 대상 파일: `src/utils/scoreRecognition.ts`, `src/components/PhotoUploadPanel.tsx`.
- 테스트 파일: `src/utils/scoreRecognition.test.ts`, `src/components/PhotoUploadPanel.test.tsx`.
- 품질 게이트: `node node_modules/react-scripts/bin/react-scripts.js test --watchAll=false --runInBand --silent`, `npx tsc --noEmit`.
- 백엔드나 클라우드 변경 없이 순수 클라이언트 로컬에서 실행.

## 변경 지도
- `src/utils/scoreRecognition.ts`:
  - Extend `Box` interface with `isMinus?: boolean`.
  - Add `isMinusBar` filtering condition (`w >= 6 && w <= 28 && h >= 2 && h <= 12 && w >= h * 1.3 && tail >= 12`).
  - Adapt horizontal grouping logic so minus bars group with adjacent digits.
  - Prefix `"-"` when `group[0].isMinus` is true.
  - Guard bottom-seat rank slicing (`!group[0].isMinus`).
- `src/components/PhotoUploadPanel.tsx`:
  - Add `consensusCount` state (0 to 3) and `flashing` state.
  - Remove restrictive top/bottom 25% scrims; open full viewfinder frame.
  - Render 4 corner L-shaped reticles across full viewfinder frame with dynamic color transitions based on `consensusCount`.
  - Add 3-dot consensus gauge HUD component.
  - Execute a 100ms white flash on capture before completing transition.
- `src/utils/scoreRecognition.test.ts`:
  - Add unit tests for negative score detection and total validation.
- `src/components/PhotoUploadPanel.test.tsx`:
  - Add component tests for open viewfinder reticles, consensus count updates, and 100ms flash.

## 의존성 그래프와 병렬화
TASK-001 and TASK-002 are conceptually independent, integrated before TASK-003; TASK-003 precedes TASK-004. REQ-001, REQ-002, REQ-003, REQ-004 and AC-001, AC-002, AC-003, AC-004 are tracked across all lanes.

## 작업
- TASK-001 — Status: done — REQ-001 / AC-001. Implement `isMinusBar` CC detection, horizontal grouping relaxation, and `"-"` sign mapping in `src/utils/scoreRecognition.ts` with TDD unit tests in `src/utils/scoreRecognition.test.ts`.
- TASK-002 — Status: done — REQ-002 / AC-002. Implement open full-frame viewfinder HUD and 4 L-shaped corner reticles in `src/components/PhotoUploadPanel.tsx`.
- TASK-003 — Status: done — REQ-003 / AC-003. Implement `consensusCount` state binding from `onReading`, 3-dot progress gauge, dynamic border/reticle colors (White -> Blue -> Emerald), and 100ms capture flash transition in `src/components/PhotoUploadPanel.tsx`.
- TASK-004 — Status: done — REQ-004 / AC-004. Add component tests in `src/components/PhotoUploadPanel.test.tsx`, verify all repository test suites, and execute artifact chain validation.

## TDD 순서
1. Red 단계 1: Write failing test in `src/utils/scoreRecognition.test.ts` expecting `['-020', '0350', '0350', '0320']` from a synthetic image with a minus bar.
2. Green 단계 1: Implement `isMinusBar` filtering and grouping in `src/utils/scoreRecognition.ts` to pass unit tests.
3. Red 단계 2: Write failing tests in `src/components/PhotoUploadPanel.test.tsx` checking for open viewfinder reticle and 3-dot gauge.
4. Green 단계 2: Implement viewfinder HUD, consensus state binding, and 100ms flash overlay in `src/components/PhotoUploadPanel.tsx`.
5. Refactor 단계: Optimize styling, ensure memory safety for flash timer, and verify complete test suite.

## E2E 시나리오
1. 시나리오 1 (들통/하코텐 국면): 4 scores where Player 1 has -2,000 pts (`-020`) and players 2, 3, 4 have 35,000, 35,000, 32,000 pts (`0350`, `0350`, `0320`). Recognizer extracts all 4 scores correctly, total matches 100,000, and auto-capture succeeds.
2. 시나리오 2 (실시간 조준 및 합의 피드백): Live camera feed shows open framing with corner reticles. Moving camera onto scoreboard shows reticle changing White -> Blue -> Emerald with 3-dot gauge advancing, followed by 100ms white flash upon capture.
3. 시나리오 3 (기존 기능 비파괴 회귀): Existing AMOS REXX 3 positive test fixtures (e.g. `102 / 0266 / 0606 / 0026`) continue to pass without changes.

## 품질 게이트
```powershell
node node_modules/react-scripts/bin/react-scripts.js test --watchAll=false --runInBand --silent
```
```powershell
npx tsc --noEmit
```
```powershell
pwsh.exe -NoProfile -ExecutionPolicy Bypass -File C:\Users\AquaCo\.codex\skills\ai-native-sdlc\scripts\validate-artifact-chain.ps1 -ArtifactDirectory c:\Users\AquaCo\project\mahjong.aquaco.work\docs\ai\scanner-negative-hud-feedback
```

## 위험, 마이그레이션, 롤백
- 위험: 점수판 주변의 우발적 반사광 노이즈를 마이너스 바로 오인식할 위험.
  - 완화: Strict dimension (`w >= 6 && w <= 28 && h >= 2 && h <= 12 && w >= h * 1.3`), density (`tail >= 12`), and position constraints (must be leftmost of a run).
- 위험: 플래시 애니메이션 중 컴포넌트 이탈 시 타이머 메모리 누수.
  - 완화: Store timeout in ref and clear on unmount.
- 롤백: Revert changes to `src/utils/scoreRecognition.ts` and `src/components/PhotoUploadPanel.tsx`.

## 완료 증거
- `src/utils/scoreRecognition.test.ts` passing negative score tests.
- `src/components/PhotoUploadPanel.test.tsx` passing HUD and consensus tests.
- Full test suite passing (12/12 suites).
- Release status confirmed in `evidence.md`.

## 진행 기록
- Phase 1: Intent, spec, plan, preview, and initial evidence contract established.
- Phase 2: All tasks completed (TASK-001 to TASK-004), 12 test suites passing (89 tests), type check clean, production build succeeded.
