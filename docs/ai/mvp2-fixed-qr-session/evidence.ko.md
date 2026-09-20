# 증거

## 메타데이터
- 작업 ID: mvp2-fixed-qr-session
- 기준본 리비전(Canonical revision): 4
- 언어(Language): ko
- 영문 기준본(Canonical): evidence.md
- 상태(Status): ready
- 위험도(Risk): standard
- 생성일: 2026-09-18
- 수정일: 2026-09-18
- 소유자: AquaCo

## 변경 요약
`mvp2-fixed-qr-session` (리비전 4) 작업의 검증 결과입니다. 계획된 모든 구현 작업(`TASK-001`부터 `TASK-010`), 요구사항(`REQ-001`부터 `REQ-011`), 수용 기준(`AC-001`부터 `AC-013`)이 검증되었으며 5개 품질 게이트를 모두 통과했습니다.

## 요구사항 충족 현황
| 요구사항 | 수용 기준 | 작업 | 검증 방식 | 상태 |
|---|---|---|---|---|
| `REQ-001` | `AC-001` | `TASK-001` | `src/utils/clientId.test.ts` | `Passed` |
| `REQ-002` | `AC-002` | `TASK-003`, `TASK-004` | `src/components/SeatCheckinPage.test.tsx` | `Passed` |
| `REQ-003` | `AC-003` | `TASK-003`, `TASK-004` | `server/index.test.js` | `Passed` |
| `REQ-004` | `AC-004`, `AC-012` | `TASK-003`, `TASK-005` | `src/components/QueuePage.test.tsx` | `Passed` |
| `REQ-005` | `AC-006` | `TASK-006` | `src/components/ScorePhotoInputPage.test.tsx` | `Passed` |
| `REQ-006` | `AC-005` | `TASK-003`, `TASK-006` | `src/components/ScorePhotoInputPage.test.tsx` | `Passed` |
| `REQ-007` | `AC-007`, `AC-013` | `TASK-003`, `TASK-007` | `src/components/ScorePhotoInputPage.test.tsx` | `Passed` |
| `REQ-008` | `AC-008` | `TASK-002`, `TASK-003` | `server/db.test.js` | `Passed` |
| `REQ-009` | `AC-009` | `TASK-008` | `scripts/setup-backend-service.sh` | `Passed` |
| `REQ-010` | `AC-010` | `TASK-009` | `scripts/cleanup-test-artifacts.sh` | `Passed` |
| `REQ-011` | `AC-011` | `TASK-003`, `TASK-004` | `src/components/SeatCheckinPage.test.tsx` | `Passed` |

## 테스트와 품질 결과
- 게이트 1 (TypeScript 검사): `npx tsc --noEmit` - `Passed` (에러 0개)
- 게이트 2 (프론트엔드 단위 테스트): `npm test -- --watchAll=false --forceExit` - `Passed` (15개 스위트, 104개 테스트 통과)
- 게이트 3 (백엔드 API 테스트): `npm --prefix server test` - `Passed` (2개 스위트, 8개 테스트 통과)
- 게이트 4 (프로덕션 빌드): `npm run build` - `Passed` (성공적으로 컴파일됨, 117.56 kB gzip)
- 게이트 5 (아티팩트 동기화 검사): `scripts/validate-artifact-chain.ps1 -ArtifactDirectory docs/ai/mvp2-fixed-qr-session` - `Passed`

## E2E 증거
- 시나리오 1 & 2: `src/components/SeatCheckinPage.test.tsx`에서 `client_id` 및 기존 플레이어 닉네임을 통한 1초 착석 검증.
- 시나리오 3: `src/components/QueuePage.test.tsx`에서 4인 마작패 바람패 입체 타일 자리 추첨 검증.
- 시나리오 4 & 5: `src/components/ScorePhotoInputPage.test.tsx`에서 `UmaOkaTable.tsx`로의 2초 폴링 주입 및 `[기록 추가 및 공유]` 시 `duration_seconds` 기록과 세션 종료 검증.
- 시나리오 6: `src/components/SeatCheckinPage.test.tsx` 및 `server/index.test.js`에서 기기 초기화 시 `localStorage` 삭제, `/` 리다이렉트, 서버 닉네임 `reset_{epoch}` 비식별화 검증.

## 리뷰 발견 사항과 해결
- 사용자 요구사항 명세 대비 Phase 1 아키텍처 계약 검토 완료 및 기기 초기화, 디지털 자리 추첨, 경기 시간 정밀 기록 반영. 블로킹 결함 없음.

## 배포 또는 인계
- 대상 환경: AWS EC2 `t3.micro` Ubuntu 호스트.
- 배포 스크립트: `scripts/setup-backend-service.sh` (systemd 유닛 `mahjong-api.service` 및 아파치 `/api` 프록시 패스).

## 릴리스 준비 상태
- 전체 상태(Overall status): READY
- 차단 요소: 없음

## 잔여 위험
- EC2 `t3.micro`의 낮은 메모리 여유 공간으로 인해 Node.js 프로세스의 RSS 150MB 상한 강제 필요.
- 데이터베이스 쓰기 락 경합은 필수 WAL 모드(`journal_mode = WAL`) 적용으로 원천 차단.
