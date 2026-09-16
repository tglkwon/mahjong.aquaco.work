# 구현 계획

- 작업 ID: mobile-test-drop
- 기준본 리비전(Canonical revision): 2
- 언어(Language): ko
- 영문 기준본(Canonical): plan.md

## 맥락과 목표 결과
`PhotoUploadPanel`에 `mobile-drop` 아키텍처를 활용한 통합 모바일-PC 테스트 브리지를 제공하여, 실제 스마트폰에서 점수판 인식을 테스트하는 개발자가 원본 비디오 파일, 캡처된 프레임, OCR 메타데이터를 PC 개발 호스트의 `./uploads/` 경로로 직접 스트리밍/드롭할 수 있도록 합니다.

## 저장소 상태와 제약
- `react-scripts` 기반 React 19 + TypeScript 4.9.5 환경.
- 기존 11개 테스트 스위트(73개 테스트) 모두 통과 상태.
- `PhotoUploadPanel.tsx`는 현재 프레임 추출(`extractLocalFrames`), OCR 인식(`recognizeScoreboard`), 카메라 스트리밍(`startScoreCamera`)을 메모리 내에서만 엄격히 로컬로 처리합니다.
- 글로벌 스킬 `mobile-drop`은 포트 8899에서 `X-Session-Token` PIN 헤더를 요구하는 `/upload/chunk` 및 `/upload/complete` 수신 서버를 갖추고 있습니다.

## 변경 지도
- `src/utils/mobileDropClient.ts`: 핵심 업로드 로직(청크 분할, 헤더, 진행률, 헬스체크).
- `src/utils/mobileDropClient.test.ts`: 업로드 클라이언트 TDD 단위 테스트.
- `src/components/PhotoUploadPanel.tsx`: 개발자 브리지 패널, URL 쿼리/로컬 스토리지 동기화, 비디오/사진 파일 드롭, 실시간 스캔 캡처 드롭, 상태 알림.
- `src/components/PhotoUploadPanel.test.tsx`: 개발자 브리지 토글 및 드롭 연동 통합 테스트.
- `scripts/start-test-drop.ps1`: 지속 세션 및 터널 URL 생성을 지원하는 편의 PowerShell 오케스트레이터.

## 의존성 그래프와 병렬화
- 레인 1: `TASK-001` (`mobileDropClient.test.ts` TDD 테스트와 함께 `mobileDropClient.ts` 생성).
- 레인 2: `TASK-002` (`PhotoUploadPanel.tsx` 및 통합 테스트 갱신). 레인 1에 의존.
- 레인 3: `TASK-003` (`scripts/start-test-drop.ps1` 생성). 독립 실행 가능.
- 통합 및 품질 게이트: `TASK-004` (Jest 테스트, TypeScript 빌드, E2E 증거 기록, 아티팩트 동기화 갱신).

## 작업
- TASK-001 — Status: done — REQ-001, REQ-002 / AC-001, AC-002. Dependencies: none. Owner: root. Surface: `src/utils/mobileDropClient.ts` 및 `src/utils/mobileDropClient.test.ts`. 청크 슬라이싱, 헤더 생성, 오류 처리, 핑 및 진행률 알림 구현. 증거: 단위 테스트 8개 통과.
- TASK-002 — Status: done — REQ-003, REQ-004, REQ-005, REQ-006, REQ-007 / AC-003, AC-004, AC-005. Dependencies: TASK-001. Owner: root. Surface: `src/components/PhotoUploadPanel.tsx` 및 `src/components/PhotoUploadPanel.test.tsx`. 개발자 테스트 브리지 UI, URL 쿼리 자동 주입, 비디오/사진 자동 드롭, 실시간 스캔 프레임 드롭 연동. 증거: 컴포넌트 통합 테스트 15개 통과.
- TASK-003 — Status: done — REQ-008 / AC-001, AC-002. Dependencies: none. Owner: root. Surface: `scripts/start-test-drop.ps1` 및 `scripts/test-drop-server.py`. 매끄러운 다중 파일 드롭을 위해 지속 세션을 지원하는 로컬 세션 오케스트레이터 구현 (`./uploads/`). 증거: 로컬 세션 실행 스크립트.
- TASK-004 — Status: done — AC-006. Dependencies: TASK-001, TASK-002, TASK-003. Owner: root. Surface: 테스트 스위트 및 빌드 검증. 전체 테스트 스위트 실행 (`npm test -- --watchAll=false`), 프로덕션 빌드 검증 (`npm run build`), `evidence.md` / `evidence.ko.md` 작성 및 `artifact-sync.json` 초기화. 증거: 12개 테스트 스위트 (83개 테스트) 및 프로덕션 빌드 성공.
- TASK-005 — Status: done — REQ-009 / AC-007. Dependencies: TASK-002, TASK-003. Owner: root. Surface: `scripts/test-drop-server.py`, `scripts/start-test-drop.ps1`, `src/utils/mobileDropClient.ts`, `src/components/PhotoUploadPanel.tsx` 및 `.gitignore`. CLI 및 UI 선택을 통해 다중 기기 대상 라우팅(`rex3` -> `research-data/rex 3`, `jpex` -> `research-data/jp-ex`, `jpcolor` -> `research-data/jp-color`) 지원 및 git ignore 보호. 증거: 컴포넌트 통합 테스트 16개 및 단위 테스트 9개 통과.

## TDD 순서
1. Red: 청크 분할, 헤더 형식, 오류 처리, 핑을 검증하는 `src/utils/mobileDropClient.test.ts`를 작성합니다. (모듈 부재로 실패)
2. Green: 모든 테스트를 통과하도록 `src/utils/mobileDropClient.ts`를 구현합니다.
3. Refactor: AbortSignal 처리 및 경계 조건을 다듬습니다.
4. Integrate: `PhotoUploadPanel.tsx`에 연결하고 컴포넌트 테스트를 실행합니다.

## E2E 시나리오
1. **URL 접속정보 자동 주입**: Open `/set_score_photo?dropUrl=https://test.trycloudflare.com&dropPin=123456`. 테스트 패널이 자동으로 확장되고 연결 활성 상태로 전환됩니다.
2. **비디오 파일 업로드 및 OCR**: 비디오 파일 선택 시 추출된 프레임에 대해 로컬 OCR이 동작함과 동시에 원본 비디오 파일이 8MB 청크 단위로 PC 호스트에 전송됩니다.
3. **실시간 스캔 캡처 드롭**: 카메라 스캔을 시작하여 4개 점수가 안정적으로 일치할 때, 자동 캡처된 프레임 JPEG 및 OCR 메타데이터 JSON이 PC로 전송됩니다.

## 품질 게이트
- `npm test -- --watchAll=false`가 모든 테스트 스위트를 통과해야 합니다.
- `npm run build`가 TypeScript 및 ESLint 오류 없이 컴파일되어야 합니다.
- 검증 스크립트 `validate-artifact-chain.ps1`이 오류 없이 통과해야 합니다.

## 위험, 마이그레이션, 롤백
- 위험: 교차 출처(Cross-Origin) 및 혼합 콘텐츠(Mixed Content) 차단. 완화책: Cloudflare Quick Tunnel이 웹 애플리케이션 프로토콜과 일치하는 HTTPS 엔드포인트를 보장합니다.
- 위험: 대용량 비디오로 인한 모바일 메모리 부하. 완화책: Blob.slice를 사용한 8MB 청크 슬라이싱으로 전체 파일을 한 번에 메모리에 로드하지 않습니다.
- 롤백: `PhotoUploadPanel.tsx` 변경 사항을 되돌리고 새로 추가된 유틸리티 파일을 삭제하여 안전하게 복원 가능합니다.

## 완료 증거
- `mobileDropClient.test.ts` 및 `PhotoUploadPanel.test.tsx` 통과 테스트 로그.
- 성공적인 프로덕션 빌드 출력.
- 초기화된 `artifact-sync.json`을 포함한 완전 동기화 아티팩트 체인.

## 진행 기록
- 2026-09-15: mobile-test-drop에 대한 의도, 명세 및 구현 계획 수립 완료.
