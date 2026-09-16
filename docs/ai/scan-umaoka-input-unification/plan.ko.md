# 구현 계획

- 작업 ID: scan-umaoka-input-unification
- 기준본 리비전(Canonical revision): 2
- 언어(Language): ko
- 영문 기준본(Canonical): plan.md

## 맥락과 목표 결과
중복된 점수 입력 양식을 `UmaOkaTable.tsx`로 단일화하고, `PhotoUploadPanel.tsx`의 실시간 인식 점수를 `onScoresRecognized` 콜백을 통해 주입하며, 목표 합계 점수를 `startingScore * 4`에 동적으로 연동하여 합의 판독 및 기록 추가 게이트를 일원화합니다.

## 저장소 상태와 제약
슬롯 뷰파인더(`h-52`), 3-dot 합의 추적기, mobile-drop PC 전송 테스트 Lab 브리지, 순수 클라이언트 인메모리 아키텍처를 온전히 보존하면서 UI를 간소화하고 검증 로직을 일치시킵니다.

## 변경 지도
1. `PhotoUploadPanel.tsx`: 중복 점수 검토 `<fieldset>` 제거, 2차 확정 버튼 제거, `onScoresRecognized` 콜백 추가, `expected` 합계 점수의 `initialTotal` 반응형 동기화.
2. `PhotoUploadPanel.test.tsx`: `onScoresRecognized` 호출 및 중복 입력 양식 부재 검증.
3. `ScorePhotoInputPage.tsx`: `onScoresRecognized`를 처리하여 `games` 상태의 `currentEditableGame`에 점수 주입, `targetTotalScore` 반응형 바인딩 전달.
4. `ScorePhotoInputPage.test.tsx`: 스캔 점수가 `UmaOkaTable.tsx`로 직접 주입되고 시작 점수 변경 시 목표 점수가 갱신되는지 검증.
5. `ControlPanel.tsx`: 동적 `startingScore * 4`에 맞춘 단일 기록 추가 검증.
6. `App.test.tsx`: 라우팅 및 내비게이션 무결성 검증.

## 의존성 그래프와 병렬화
TASK-001(`PhotoUploadPanel.tsx`)과 TASK-002(`ScorePhotoInputPage.tsx`)를 순차 구현하고, TASK-003에서 `ControlPanel.tsx`와 연결하며, TASK-004에서 테스트를 갱신하고, TASK-005에서 최종 회귀 및 빌드 게이트를 수행합니다.

## 작업
- TASK-001 — Status: pending — REQ-001, REQ-002 / AC-001, AC-002. 담당: root. 파일: `PhotoUploadPanel.tsx` 및 `PhotoUploadPanel.test.tsx`. 중복 입력 폼을 제거하고 `onScoresRecognized` 콜백 추가. 증거: Jest 단위 테스트.
- TASK-002 — Status: pending — REQ-001, REQ-002 / AC-001, AC-003. 담당: root. 파일: `ScorePhotoInputPage.tsx` 및 `ScorePhotoInputPage.test.tsx`. `onScoresRecognized`를 `UmaOkaTable.tsx`에 연결하고 동적 목표 점수 연동. 증거: Jest 통합 테스트.
- TASK-003 — Status: pending — REQ-003, REQ-004 / AC-003, AC-004. 담당: root. 파일: `ControlPanel.tsx`. 단일 기록 추가 게이트 및 동적 목표 점수 강제 검증. 증거: Jest 컴포넌트 테스트.
- TASK-004 — Status: pending — REQ-005 / AC-005. 담당: root. 파일: 테스트 스위트. `PhotoUploadPanel.test.tsx`, `ScorePhotoInputPage.test.tsx`, `App.test.tsx` 갱신. 증거: Jest 테스트 통과.
- TASK-005 — Status: pending — REQ-005 / AC-005. 담당: root. 파일: 전체 빌드. 전체 테스트 스위트 및 프로덕션 빌드 검증. 증거: `npm test` 및 `npm run build`.

## TDD 순서
1. Red: `PhotoUploadPanel.test.tsx`를 갱신하여 중복 입력 양식 부재 및 `onScoresRecognized` 콜백 호출 단언.
2. Green: `PhotoUploadPanel.tsx`를 수정하여 합의 달성 시 `onScoresRecognized`를 발생시키고 중복 폼/버튼 제거.
3. Red: `ScorePhotoInputPage.test.tsx`를 갱신하여 스캔 점수의 `UmaOkaTable.tsx` 직결 및 동적 목표 점수 재계산 단언.
4. Green: `ScorePhotoInputPage.tsx`에 `onScoresRecognized`를 연결하고 `ControlPanel.tsx` 연동 업데이트.
5. 리팩토링 및 검증: `npm test -- --watchAll=false` 및 `npm run build` 실행.

## E2E 시나리오
플레이어가 시작 점수를 입력하면(예: 25,000 -> 목표 100,000), 실시간 스캔을 시작하여 카메라를 점수판에 비추고, 3-dot 합의 락을 달성하면, 점수가 우마·오카 테이블에 즉시 나타나는 것을 확인하고, 필요시 ±1,000 버튼으로 미세 조정한 뒤, 컨트롤 패널의 기록 추가 버튼을 눌러 게임 대장에 기록합니다.

## 품질 게이트
- `gate-test`: `npm test -- --watchAll=false` (100% 테스트 스위트 통과, 실패 0건)
- `gate-build`: `npm run build` (에러 없는 클린 프로덕션 빌드)
- `gate-sdlc`: `pwsh.exe -NoProfile -ExecutionPolicy Bypass -File C:\Users\AquaCo\.codex\skills\ai-native-sdlc\scripts\validate-artifact-chain.ps1 -ArtifactDirectory "c:\Users\AquaCo\project\mahjong.aquaco.work\docs\ai\scan-umaoka-input-unification"`

## 위험, 마이그레이션, 롤백
컴포넌트 변경 사항은 완전 모듈화되어 있으며, 결함 발생 시 이전 Git 커밋의 컴포넌트 props 및 테스트로 즉시 복구 가능합니다.

## 완료 증거
AC-001부터 AC-005까지의 모든 수용 기준이 통과 테스트 증거로 검증됩니다.

## 진행 기록
2026-09-16: 리비전 1 시작 - 점수 입력 UI 우마·오카 테이블 단일화 및 동적 목표 점수 연동.
