# 구현 계획

- 작업 ID: scan-video-recording
- 기준본 리비전(Canonical revision): 2
- 언어(Language): ko
- 영문 기준본(Canonical): plan.md

## 맥락과 목표 결과
실시간 점수 스캔 합의 임계값을 1500ms 윈도우 내 3프레임(`countThreshold = 3`, `spanMsThreshold = 200`)으로 상향하고, `MediaRecorder`를 통합하여 활성 카메라 세션의 시작부터 종료까지 전체를 녹화한 뒤, 성공 및 실패/취소 시 모두 결과 비디오(`.mp4` / `.webm`)를 `uploadToMobileDrop`을 통해 PC 작업공간으로 자동 업로드하며, 기존의 중복 정지 스크린샷 업로드를 대체합니다.

## 저장소 상태와 제약
기존 10 FPS OCR 분석 루프(`scoreCamera.ts`), 중앙 50% ROI 크롭, AMOS REX III HUD, 다중 기기 드롭 라우팅(`research-data/<device>/`)을 그대로 유지합니다.

## 변경 지도
1. `src/utils/scoreCamera.ts`: 기본 안정성 임계값을 3프레임 / 200ms로 설정; 포맷 자동 감지, 주기적 청크 수집, 안전한 생명주기 종료, `onVideoReady` 콜백을 포함한 `MediaRecorder` 연동.
2. `src/components/PhotoUploadPanel.tsx`: 상태 안내 문구를 `(${count}/3회)`로 갱신; 성공 및 실패 결과 모두에 대해 `onVideoReady`를 `uploadToMobileDrop`에 연결; 정지화면 스크린샷 드롭 제거.
3. `src/utils/scoreCamera.test.ts`: 3프레임 캡처에 맞게 타이머 틱 시뮬레이션 동기화; `MediaRecorder` 생명주기 및 `onVideoReady` 테스트 추가.

## 의존성 그래프와 병렬화
TASK-001(임계값)과 TASK-002(MediaRecorder)는 `scoreCamera.ts`를 수정; TASK-003은 `PhotoUploadPanel.tsx`에 연결; TASK-004는 `scoreCamera.test.ts`를 통해 검증; TASK-005는 품질 게이트를 실행합니다.

## 작업
- TASK-001 — Status: done — REQ-001 / AC-001. Owner: root. Surface: `src/utils/scoreCamera.ts`. Set default stability threshold to `countThreshold = 3` and `spanMsThreshold = 200`. Proof: Jest unit tests.
- TASK-002 — Status: done — REQ-003, REQ-004, REQ-005, REQ-007 / AC-003. Owner: root. Surface: `src/utils/scoreCamera.ts`. Implement `MediaRecorder` session recording, format selection, chunk collection, and `onVideoReady` callback on stop with status (`success` | `canceled` | `failed`). Proof: Jest unit tests with mock MediaRecorder.
- TASK-003 — Status: done — REQ-002, REQ-006 / AC-002. Owner: root. Surface: `src/components/PhotoUploadPanel.tsx`. Update reading status to `(${count}/3회)`, connect `onVideoReady` to `uploadToMobileDrop`, and remove still screenshot upload. Proof: Component tests and build check.
- TASK-004 — Status: done — REQ-008 / AC-004. Owner: root. Surface: `src/utils/scoreCamera.test.ts`. Synchronize 3-frame tick assertions and add unit tests for `MediaRecorder` lifecycle and `onVideoReady`. Proof: `npm test -- --watchAll=false`.
- TASK-005 — Status: done — AC-005. Owner: root. Surface: Repository verification. Run full test suites, production build, and artifact validation. Proof: All quality gates exit 0.

## TDD 순서
1. Red: `scoreCamera.test.ts`를 수정하여 3번째 틱 시점 캡처 확인 및 `MediaRecorder` 호출을 검증하도록 설정.
2. Green: `scoreCamera.ts`에 TASK-001, TASK-002 구현 및 `PhotoUploadPanel.tsx`에 TASK-003 구현.
3. 모든 테스트 통과 확인.

## E2E 시나리오
실시간 스캔을 시작하면 비디오 녹화가 시작되고, 3프레임 일치에 도달하면 점수가 확정되고 비디오가 PC 작업공간(`research-data/rex 3/`)으로 전송되며 플로팅 배지 알림이 표시됩니다.

## 품질 게이트
- Unit tests: `npm test -- --watchAll=false`
- Build check: `npm run build`
- Chain validation: `pwsh.exe -NoProfile -ExecutionPolicy Bypass -File C:\Users\AquaCo\.codex\skills\ai-native-sdlc\scripts\validate-artifact-chain.ps1 -ArtifactDirectory docs/ai/scan-video-recording`

## 위험, 마이그레이션, 롤백
구형 브라우저에서 `MediaRecorder`를 사용할 수 없는 경우, 앱이 예외를 안전하게 처리하고 중단 없이 일반 OCR 스캔을 수행합니다. 모든 변경 사항은 하위 호환됩니다.

## 완료 증거
Verified test logs from `npm test`, build output from `npm run build`, and exit 0 from artifact chain validation.

## 진행 기록
2026-09-15: Revision 1 created to implement 3-frame consensus threshold and full scan video recording to PC drop.
2026-09-15: Tasks completed, test suites passed (85/85), and production build succeeded.
