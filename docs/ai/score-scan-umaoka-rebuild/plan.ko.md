# 구현 계획

- 작업 ID: score-scan-umaoka-rebuild
- 기준본 리비전(Canonical revision): 2
- 언어(Language): ko
- 영문 기준본(Canonical): plan.md

## 맥락과 목표 결과
점수 스캔 기능을 완전한 우마·오카 계산 엔진 기반으로 재구축하고, 운영 서비스 라우트(`/scan_score`)와 다기종 데이터 수집용 개발자 테스트 Lab 라우트(`/test_scan`)를 분리하며, 구형 수동 사진 촬영 버튼 및 입력을 제거하고, 실시간 스캔에서 결과 공유까지 이어지는 매끄러운 4단계 유저 워크플로우를 확립합니다.

## 저장소 상태와 제약
슬롯 클리핑 카메라 뷰포트(`h-52`), 중앙 50% ROI 추출, AMOS REXX 3 4-player HUD 및 클라이언트 인메모리 아키텍처를 온전히 유지하면서 `UmaOkaTable`, `calculateTieAwards`, `PlayerTotals`, `PlayerManagementAndScores`를 전면 활용합니다.

## 변경 지도
1. `PhotoUploadPanel.tsx`: 수동 사진 촬영 input 및 버튼 제거, 개발자 PC 전송 브리지를 조건부 렌더링하는 `isTestMode?: boolean` 추가.
2. `PhotoUploadPanel.test.tsx`: 수동 사진 촬영 버튼 부재 확인 및 `isTestMode` 렌더링 로직 테스트.
3. `ScorePhotoInputPage.tsx`: `UmaOkaTable`, 동점 처리, 촌보 추적, 플레이어 풀 관리를 사용하는 상태 파이프라인으로 재구축.
4. `ScorePhotoInputPage.test.tsx`: 우마·오카 계산 연동 및 순위 점수 생성 테스트.
5. `App.tsx`, `Sidebar.tsx`, `MainPage.tsx`, `translations.ts`: `/scan_score`, `/test_scan` 라우트 등록 및 `/set_score_photo` 리다이렉트 구현.
6. `Integration.test.tsx`: 통합 워크플로우 엔드투엔드 검증.

## 의존성 그래프와 병렬화
TASK-001 (`PhotoUploadPanel.tsx`)과 TASK-002 (`ScorePhotoInputPage.tsx`)는 순차적으로 준비될 수 있으며, TASK-003 (`App.tsx` 라우팅)이 이들을 연결하고, TASK-004와 TASK-005가 회귀 테스트, 프로덕션 빌드, SDLC 동기화를 수행합니다.

## 작업
- TASK-001 — Status: pending — REQ-003, REQ-004 / AC-001, AC-002, AC-004. 담당: root. 작업 대상: `PhotoUploadPanel.tsx` and `PhotoUploadPanel.test.tsx`. 수동 촬영 버튼 제거 및 `isTestMode` prop 추가. 증적: Jest unit tests.
- TASK-002 — Status: pending — REQ-001 / AC-001. 담당: root. 작업 대상: `ScorePhotoInputPage.tsx` and `ScorePhotoInputPage.test.tsx`. 우마·오카 계산 엔진 기반 페이지 리빌딩. 증적: Jest unit tests.
- TASK-003 — Status: pending — REQ-002 / AC-002, AC-003. 담당: root. 작업 대상: `App.tsx`, `Sidebar.tsx`, `MainPage.tsx`, `translations.ts`. `/scan_score` 및 `/test_scan` 라우트 및 리다이렉트 추가. 증적: Jest route tests.
- TASK-004 — Status: pending — REQ-005 / AC-001, AC-005. 담당: root. 작업 대상: `Integration.test.tsx`. 전체 워크플로우 통합 검증. 증적: Integration test pass.
- TASK-005 — Status: pending — AC-004, AC-005. 담당: root. 작업 대상: Full verification and build. 전체 테스트 스위트 및 프로덕션 빌드 실행. 증적: Production build pass.

## TDD 순서
1. Red: `PhotoUploadPanel.test.tsx`를 수정하여 `📷 점수판 촬영하기` 버튼이 없고 `isTestMode` 토글이 올바르게 동작함을 단언.
2. Green: `PhotoUploadPanel.tsx`에서 파일 촬영 버튼/input을 제거하고 개발자 브리지 제어를 조건부 렌더링.
3. Red: `ScorePhotoInputPage.test.tsx` 및 `App.test.tsx`를 수정하여 우마·오카 테이블 렌더링, `/scan_score`, `/test_scan`, `/set_score_photo` 리다이렉트 단언.
4. Green: `ScorePhotoInputPage.tsx`에 우마·오카 상태 파이프라인을 구현하고 `App.tsx`에 라우트 연결.
5. Refactor & Verify: 전체 테스트 스위트를 실행하고 `npm run build`를 성공시킴.

## E2E 시나리오
동가 플레이어가 실시간 스캔을 탭하고 점수판을 비추면 0.2~0.3초 내에 Fast-Lock 자동 캡처가 완료되며, 동일 화면에서 우마·오카 순위 점수를 확인하고 기록 추가를 눌러 대탁 장부에 반영하고 공유 링크를 갱신합니다.

## 품질 게이트
- `gate-test`: `npm test -- --watchAll=false` (100% test suites pass, 0 failures)
- `gate-build`: `npm run build` (에러 없는 클린 프로덕션 빌드)
- `gate-sdlc`: `pwsh.exe -NoProfile -ExecutionPolicy Bypass -File C:\Users\AquaCo\.codex\skills\ai-native-sdlc\scripts\validate-artifact-chain.ps1 -ArtifactDirectory "c:\Users\AquaCo\project\mahjong.aquaco.work\docs\ai\score-scan-umaoka-rebuild"`

## 위험, 마이그레이션, 롤백
실행 중 회귀가 발생하면 git checkout을 통해 SDLC 아티팩트 체인을 보존하면서 `src/`를 깨끗하게 HEAD로 롤백합니다.

## 완료 증거
AC-001부터 AC-005까지의 모든 수용 기준이 통과 테스트 증적으로 검증됩니다.

## 진행 기록
2026-09-16: 우마·오카 엔진 결합 점수 스캔 리빌딩, 서비스 및 테스트 페이지 분리, 수동 사진 촬영 제거를 위한 개정 1 착수.
