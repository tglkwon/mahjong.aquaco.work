# 구현 계획

## 메타데이터
- 작업 ID: mvp2-fixed-qr-session
- 기준본 리비전(Canonical revision): 4
- 언어(Language): ko
- 영문 기준본(Canonical): plan.md
- 상태(Status): ready
- 위험도(Risk): standard
- 생성일: 2026-09-18
- 수정일: 2026-09-18
- 소유자: AquaCo

## 맥락과 목표 결과
본 계획은 마작 오프라인 모임을 위한 무인증 고정 좌석 QR 착석 및 초경량 세션 연동 시스템 구현 절차를 기술합니다. 브라우저 `localStorage`의 `client_id` 지연 생성을 활용한 1초 원클릭 착석, `/queue`에서의 4인 마작패 바람패 입체 타일 자리 추첨, 홈 리다이렉트 및 `reset_{epoch}` 비식별화를 지원하는 기기 초기화, `UmaOkaTable.tsx`로의 실시간 착석자 주입, `/scan_score_test`의 `[기록 추가 및 공유]` 클릭 시 세션 종료 및 경기 소요 시간 지표(`started_at`, `finished_at`, `duration_seconds`)가 포함된 `mahjong.db` 영구 저장, 안전한 사후 정리 보장을 달성합니다.

## 저장소 상태와 제약
- 프론트엔드: `src/` 디렉토리 기반의 React 18 SPA 및 TypeScript.
- 기록자 화면: `/scan_score_test` 라우트에서 `isTestMode={true}`가 활성화된 `ScorePhotoInputPage.tsx`가 렌더링되며 내부에 `UmaOkaTable.tsx`를 포함.
- 백엔드: `server/` 디렉토리에 위치할 초경량 Node.js Express 서비스와 `better-sqlite3` WAL 모드(`journal_mode = WAL`).
- 메모리 제약: EC2 `t3.micro` 환경에서 150MB 미만의 RSS 메모리 점유.
- 테스트 명령어: Jest 실행 시 `--watchAll=false --forceExit` 플래그 사용.

## 변경 지도
- `[NEW]` `src/utils/clientId.ts`: 클라이언트 UUID 지연 발급 및 `localStorage` 영구 보존.
- `[NEW]` `src/utils/clientId.test.ts`: 클라이언트 ID 초기화 및 조회 단위 테스트.
- `[NEW]` `src/components/SeatCheckinPage.tsx`: 좌석 고정 QR 착석 화면 (`/seat`) 및 기기 초기화 버튼.
- `[NEW]` `src/components/SeatCheckinPage.test.tsx`: 좌석 착석 및 기기 초기화 흐름 컴포넌트 테스트.
- `[NEW]` `src/components/QueuePage.tsx`: 대기열 조회 화면 (`/queue`) 및 4인 마작패 입체 타일 자리 뽑기.
- `[NEW]` `src/components/QueuePage.test.tsx`: 대기열 등록 및 자리 추첨 컴포넌트 테스트.
- `server/package.json`: express 및 better-sqlite3 패키지 매니페스트.
- `server/db.js`: `started_at` 및 `duration_seconds`를 지원하는 SQLite 스키마 생성 모듈.
- `server/db.test.js`: 데이터베이스 통합 테스트.
- `server/index.js`: 초기화, 대기열 추첨, 경기 시간을 지원하는 Express REST API 엔드포인트.
- `server/index.test.js`: supertest 기반 API 엔드포인트 테스트.
- `src/App.tsx`: `/seat` 및 `/queue` 라우트 등록.
- `src/components/ScorePhotoInputPage.tsx`: 2초 주기 착석자 폴링 훅 및 `[기록 추가 및 공유]` 시 세션 종료 트리거 추가.
- `scripts/setup-backend-service.sh`: systemd 및 아파치 리버스 프록시 자동 배포 스크립트.
- `scripts/cleanup-test-artifacts.sh`: 안전한 사후 정리 전용 스크립트.

## 의존성 그래프와 병렬화
- 레인 A (프론트엔드 식별자 및 화면): TASK-001 -> TASK-004, TASK-005
- 레인 B (백엔드 서비스): TASK-002 -> TASK-003
- 레인 C (기록자 연동 및 세션 동기화): TASK-006 -> TASK-007
- 레인 D (인프라 및 운영): TASK-008, TASK-009 -> TASK-010

## 작업
- TASK-001 (Status: done, REQ: REQ-001, AC: AC-001): `src/utils/clientId.ts` 지연 생성 및 `src/utils/clientId.test.ts` 구현.
- TASK-002 (Status: done, REQ: REQ-008, AC: AC-008): WAL 모드 및 `started_at`, `duration_seconds` 지원 `server/db.js` 작성.
- TASK-003 (Status: done, REQ: REQ-002, REQ-003, REQ-004, REQ-006, REQ-007, REQ-011, AC: AC-002, AC-003, AC-004, AC-005, AC-007, AC-011, AC-012, AC-013): `/api/client/reset` 및 자리 추첨을 포함한 `server/index.js` 구현.
- TASK-004 (Status: done, REQ: REQ-002, REQ-003, REQ-011, AC: AC-002, AC-003, AC-011): `/` 리다이렉트 초기화 액션을 포함한 `src/components/SeatCheckinPage.tsx` 구현.
- TASK-005 (Status: done, REQ: REQ-004, AC: AC-004, AC-012): 4인 마작패 입체 타일 자리 추첨을 지원하는 `src/components/QueuePage.tsx` 구현.
- TASK-006 (Status: done, REQ: REQ-005, REQ-006, AC: AC-005, AC-006): `src/components/ScorePhotoInputPage.tsx`에 2초 주기 폴링을 연동하여 `UmaOkaTable.tsx`에 착석자 자동 주입.
- TASK-007 (Status: done, REQ: REQ-007, AC: AC-007, AC-013): `src/components/ScorePhotoInputPage.tsx`의 `[기록 추가 및 공유]` 버튼 클릭과 `/api/sessions/:id/finish` 호출 결합 및 `duration_seconds` 기록.
- TASK-008 (Status: done, REQ: REQ-009, AC: AC-009): 아파치 `/api` 프록시 및 systemd 설정을 위한 `scripts/setup-backend-service.sh` 작성.
- TASK-009 (Status: done, REQ: REQ-010, AC: AC-010): 사후 정리를 위한 `scripts/cleanup-test-artifacts.sh` 작성.
- TASK-010 (Status: done, REQ: REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-010, REQ-011, AC: AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013): E2E 검증, 품질 게이트 수행 및 증거 기록.

## TDD 순서
1. `npm test -- --watchAll=false --forceExit src/utils/clientId.test.ts`
2. `node --test server/db.test.js`
3. `node --test server/index.test.js`
4. `npm test -- --watchAll=false --forceExit src/components/SeatCheckinPage.test.tsx`
5. `npm test -- --watchAll=false --forceExit src/components/QueuePage.test.tsx`
6. `npm test -- --watchAll=false --forceExit src/components/ScorePhotoInputPage.test.tsx`

## E2E 시나리오
- 시나리오 1: 신규 플레이어가 `/seat?table=1&seat=east`에 접속하여 닉네임 `마작왕`을 입력하고 착석하여 좌석 배정 확인.
- 시나리오 2: 기존 플레이어가 `/seat?table=1&seat=south`에 접속하여 `[⚡ 마작왕(으)로 착석]` 버튼을 누르고 1초 만에 착석.
- 시나리오 3: 4명의 대기 플레이어가 `/queue`에 모여 디지털 자리 뽑기를 누르고 배정된 동, 남, 서, 북 좌석을 마작패 바람패 입체 타일 UI로 확인.
- 시나리오 4: 4명이 착석을 완료하면 `started_at`이 기록되고 세션이 `active`가 되며 `/scan_score_test`의 `UmaOkaTable.tsx`에 4명의 이름이 자동으로 표시.
- 시나리오 5: 기록자가 `/scan_score_test`에서 OCR 점수를 확인하고 `[기록 추가 및 공유]` 클릭 시 세션이 `finished` 상태로 종료되고 `duration_seconds`와 함께 `mahjong.db`에 저장되며 Table 1이 리셋.
- 시나리오 6: 플레이어가 `[기기 등록 정보 초기화]`를 클릭하면 `localStorage`가 삭제되고 `/`로 리다이렉트되며 서버 닉네임이 `reset_{epoch}`로 비식별화.

## 품질 게이트
- 품질 게이트 1: `npx tsc --noEmit`을 통한 TypeScript 컴파일 무결성 검증
- 품질 게이트 2: `npm test -- --watchAll=false --forceExit`을 통한 React 프론트엔드 테스트
- 품질 게이트 3: `npm --prefix server test`를 통한 Node.js 백엔드 테스트
- 품질 게이트 4: `npm run build`를 통한 프로덕션 프론트엔드 빌드 검증
- 품질 게이트 5: `scripts/validate-artifact-chain.ps1 -ArtifactDirectory docs/ai/mvp2-fixed-qr-session`을 통한 아티팩트 체인 동기화 검증

## 위험, 마이그레이션, 롤백
- 위험: `t3.micro` 메모리 부족. 완화책: Node.js RSS 150MB 상한 관리 및 SQLite WAL 모드로 테이블 락 배제.
- 위험: 게임 도중 네트워크 단절. 완화책: `/scan_score_test`가 API 연결 실패 시에도 로컬 수동 기록을 정상 유지.
- 롤백: Git을 통해 `src/` 변경사항을 롤백하고 `mahjong-api.service`를 중단하면 기존 정적 사이트로 즉시 복구.

## 완료 증거
- `TDD sequence`에 명시된 모든 테스트 통과.
- 품질 게이트 1부터 5까지 전체 합격.
- `mahjong.db` 내 유효한 `started_at` 및 `duration_seconds` 기록 행 생성 확인.

## 진행 기록
- 2026-09-18: Phase 1 계획 수립 착수 및 아티팩트 체인 작성.
- 2026-09-18: 리비전 2에 기기 초기화, 디지털 자리 추첨, 경기 시간 정밀 기록 반영.
- 2026-09-18: 리비전 3에 4인 자리 뽑기 마작패 입체 타일 디자인 명세 반영.
