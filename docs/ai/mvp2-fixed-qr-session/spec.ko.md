# 명세

## 메타데이터와 출처
- 작업 ID: mvp2-fixed-qr-session
- 기준본 리비전(Canonical revision): 4
- 언어(Language): ko
- 영문 기준본(Canonical): spec.md
- 출처: intent.md 리비전 4
- 상태(Status): ready
- 위험도(Risk): standard
- 생성일: 2026-09-18
- 수정일: 2026-09-18
- 소유자: AquaCo

## 요약
본 명세는 마작 모임 실전 테스트를 위한 초경량 세션 연동 시스템을 정의합니다. 고정 좌석 QR 코드를 통한 무인증 착석, 온라인 대기열 관리 및 4인 마작패(바람패) 입체 타일 자리 추첨, `UmaOkaTable.tsx`의 실시간 착석자 자동 채움, 정밀한 경기 시간 추적(`started_at`, `finished_at`, `duration_seconds`), `reset_{epoch}` 비식별화를 지원하는 기기 초기화, `/scan_score_test`의 점수 확정 시 세션 종료 및 SQLite(`mahjong.db`) 영구 저장을 지원합니다.

## 기능 요구사항
- `REQ-001` (must): 브라우저 영구 식별자 - 클라이언트는 첫 명시적 등록 또는 착석 액션 시점에만 브라우저 `localStorage`에 고유한 UUID `client_id`를 지연 발급하고 보존해야 합니다.
- `REQ-002` (must): 고정 좌석 QR 착석 - `/seat?table=1&seat=east|south|west|north` 접속 시 닉네임이 존재하면 `[⚡ 마작왕(으)로 착석]` 버튼으로 1초 착석을 제공하고, 최초 방문 시 닉네임 입력 폼을 제공합니다.
- `REQ-003` (must): 동적 닉네임 동기화 - 닉네임을 변경하더라도 불변 `client_id`에 바인딩되어 활성 세션 및 대기열 전반에 일관되게 갱신됩니다.
- `REQ-004` (must): 온라인 대기열 관리 및 디지털 자리 뽑기 - `/queue`에서 FIFO 대기 순번 및 테이블 진행 상태를 표시하며, 대기자 4인 모임 시 마작패(바람패: 동·남·서·북) 입체 타일 UI를 활용한 디지털 자리 뽑기 기능을 제공하고, 대기 중인 인원이 착석하면 상태가 `waiting`에서 `playing`으로 전환됩니다.
- `REQ-005` (must): 기록자 화면 실시간 착석자 동기화 - `ScorePhotoInputPage.tsx`는 `/api/tables/1/status`를 2초 주기로 폴링하여 `UmaOkaTable.tsx`의 동, 남, 서, 북 슬롯에 착석자를 자동 채웁니다.
- `REQ-006` (must): 세션 상태 승격 및 시작 시간 기록 - 4개 좌석(동·남·서·북)이 모두 채워지면 세션 상태가 `waiting_players`에서 `active`로 승격되고 시작 타임스탬프 `started_at`을 기록합니다.
- `REQ-007` (must): 점수 확정 및 소요 시간 산출 종료 - `[기록 추가 및 공유]` 클릭 시 `/api/sessions/:id/finish`를 호출하여 `started_at`, `finished_at`, `duration_seconds`를 포함한 경기 기록을 `mahjong.db`에 저장하고, 세션 상태를 `finished`로 변경하며 테이블을 리셋합니다.
- `REQ-008` (must): 초경량 백엔드 서비스 - `server/` 디렉토리의 Express 서버와 `better-sqlite3` WAL 모드(`journal_mode = WAL`)를 사용하여 RAM 사용량을 150MB 미만으로 유지합니다.
- `REQ-009` (must): 아파치 리버스 프록시 설정 - 아파치는 `/api` 요청을 로컬 Express 서버(`http://127.0.0.1:3001/api`)로 프록시 전달하며, 과거 레거시 잔여물은 `_legacy_backup_2026/`로 격리합니다.
- `REQ-010` (should): 사후 정리 스크립트 - 클린업 스크립트 `cleanup-test-artifacts.sh`는 `mahjong.db`를 안전하게 보존하면서 임시 디버그 코드 및 더미 테스트 DB를 일괄 정리합니다.
- `REQ-011` (must): 기기 등록 정보 초기화 및 좌석 퇴장 - `[기기 등록 정보 초기화]` 클릭 시 `POST /api/client/reset`을 호출하여 `localStorage`를 삭제하고 `/`로 리다이렉트하며, 활성 좌석을 공석화하고 대기열 상태를 `canceled`로 변경하며 서버 닉네임을 고아 레코드 없이 `reset_{epoch}`로 비식별화합니다.

## 비기능 요구사항
- EC2 `t3.micro` 환경에서 Node.js 백엔드의 메모리 점유율은 150MB를 초과하지 않아야 합니다.
- 데이터베이스 작업은 동시성 락 충돌 방지를 위해 `better-sqlite3` WAL 모드와 busy timeout을 적용해야 합니다.
- 폴링 요청 지연 시간은 요청당 200ms 미만을 유지해야 합니다.
- 클라이언트 UI는 앱 설치나 로그인 없이 모바일 브라우저(Safari, Chrome)에서 부드럽게 작동해야 합니다.

## 사용자 경험과 흐름
1. 플레이어는 테이블에 도착하여 `/queue`에서 디지털 자리 뽑기를 수행하거나 물리적 패로 자리를 뽑고(예: 동), 해당 좌석의 고정 QR(`/seat?table=1&seat=east`)을 스캔합니다.
2. 최초 방문 시 닉네임을 입력하여 착석하며 이때 `client_id`가 지연 생성되고, 기존 방문자는 `[⚡ 마작왕(으)로 착석]` 버튼을 1초 만에 누릅니다.
3. 대기 플레이어는 `/queue`에 접속하여 닉네임을 등록하고 대기 순번을 확인하며, 4명이 모이면 자리 뽑기를 진행합니다.
4. 4인이 모두 착석을 완료하면 `started_at`이 기록되고 세션이 `active` 상태가 되며 기록자의 `/scan_score_test` 화면 내 `UmaOkaTable.tsx`에 4명의 이름이 자동으로 채워집니다.
5. 반장이 끝나면 기록자는 카메라 OCR 또는 수동 조정을 통해 점수를 검증합니다.
6. 기록자가 `[기록 추가 및 공유]`를 클릭하면 순수 플레이 시간(`duration_seconds`)이 계산되어 `mahjong.db`에 저장되고 세션이 종료(`finished`)되며 Table 1이 다음 반장을 위해 즉시 리셋됩니다.
7. 기기 데이터를 지우고 싶은 플레이어는 `[기기 등록 정보 초기화]`를 클릭하여 확인 후 스토리지를 지우고, 서버 레코드는 `reset_{epoch}`로 비식별화되며 좌석이 공석화된 채 홈 화면(`/`)으로 이동합니다.

## 아키텍처와 인터페이스
- 프론트엔드 라우트:
  - `/seat`: `src/components/SeatCheckinPage.tsx`
  - `/queue`: `src/components/QueuePage.tsx`
  - `/scan_score_test`: `src/components/ScorePhotoInputPage.tsx`
- 백엔드 API (`server/index.js`):
  - `POST /api/client/register` (`{ client_id, nickname }`)
  - `GET /api/client/:client_id`
  - `POST /api/client/reset` (`{ client_id }`)
  - `GET /api/tables/:table_id/status`
  - `POST /api/seat/join` (`{ table_id, seat, client_id, nickname }`)
  - `GET /api/queue`
  - `POST /api/queue/join` (`{ client_id, nickname }`)
  - `POST /api/queue/leave` (`{ client_id }`)
  - `POST /api/queue/draw-seats` (`{ table_id }`)
  - `POST /api/sessions/:session_id/finish` (`{ table_id, scores, participants, raw_payload }`)
  - `POST /api/admin/reset` (`{ table_id }`)

## 데이터와 마이그레이션
- 데이터베이스: `server/data/mahjong.db`
- 테이블 목록:
  - `clients`: `client_id` (TEXT PK), `nickname` (TEXT), `created_at` (TEXT), `updated_at` (TEXT)
  - `queue`: `client_id` (TEXT PK), `status` (TEXT), `enqueued_at` (TEXT), `updated_at` (TEXT)
  - `tables`: `table_id` (INTEGER PK), `name` (TEXT), `current_session_id` (INTEGER)
  - `sessions`: `session_id` (INTEGER PK AUTOINCREMENT), `table_id` (INTEGER), `session_number` (INTEGER), `status` (TEXT), `created_at` (TEXT), `started_at` (TEXT), `finished_at` (TEXT)
  - `session_seats`: `session_id` (INTEGER), `seat` (TEXT), `client_id` (TEXT), `joined_at` (TEXT), PK(`session_id`, `seat`)
  - `game_records`: `record_id` (INTEGER PK AUTOINCREMENT), `session_id` (INTEGER), `table_id` (INTEGER), `east_client_id` (TEXT), `east_score` (INTEGER), `south_client_id` (TEXT), `south_score` (INTEGER), `west_client_id` (TEXT), `west_score` (INTEGER), `north_client_id` (TEXT), `north_score` (INTEGER), `started_at` (TEXT), `finished_at` (TEXT), `duration_seconds` (INTEGER), `recorded_at` (TEXT), `raw_payload` (TEXT)

## 실패 모드와 경계 사례
- 네트워크 단절: 백엔드 폴링이 실패하더라도 `/scan_score_test`는 로컬 상태를 유지하여 기존 수동 기록이 정상 동작합니다.
- 중복 좌석 스캔: 이미 점유된 좌석을 다른 플레이어가 스캔할 경우 좌석 변경 확인 모달 또는 안내 메시지를 표시합니다.
- 동일 테이블 내 좌석 이동: 플레이어가 동일 테이블의 다른 좌석으로 이동 스캔 시 기존 좌석은 자동으로 공석 처리됩니다.
- 게임 중 초기화: 착석 중인 플레이어가 초기화할 경우 좌석은 공석 처리되며 이전 판 기록은 `reset_{epoch}`로 안전하게 보존됩니다.

## 보안, 개인정보, 권한
- 무인증(Zero-Auth) 모델: 비밀번호, 이메일, 개인 식별 정보는 일체 저장하지 않습니다.
- 기기 초기화 시 닉네임이 `reset_{epoch}`로 완전 비식별화되어 감사 추적성과 프라이버시를 동시에 보호합니다.
- CORS 정책은 로컬 환경 및 지정 도메인 `mahjong.aquaco.work`로 제한합니다.
- SQLite 파라미터 바인딩을 통해 SQL Injection을 원천 방지합니다.
- 아파치 레벨의 User-Agent 필터링 및 Rate Limit 방어선이 그대로 유지됩니다.

## 관측성과 운영
- Express morgan 및 커스텀 로거를 통해 타임스탬프가 포함된 경량 JSON 로그를 출력합니다.
- `GET /api/health` 헬스체크 엔드포인트를 제공합니다.
- 백엔드 서비스는 systemd 유닛 `mahjong-api.service`를 통해 관리됩니다.

## 테스트 전략
- supertest를 활용한 백엔드 엔드포인트 단위 및 통합 테스트.
- `SeatCheckinPage.tsx` 및 `QueuePage.tsx` 컴포넌트 렌더링 및 인터랙션 테스트.
- `ScorePhotoInputPage.tsx`의 세션 폴링 및 확정 트리거 통합 테스트.
- `t3.micro` 환경 메모리 사용량이 150MB 이하인지 점검.

## 수용 기준
- `AC-001`: `localStorage`에 `client_id`를 생성하고 저장하는 작업이 첫 제출 시 지연 수행되며 새로고침 후에도 유지된다.
- `AC-002`: `/seat?table=1&seat=east` 접속 시 1초 원클릭 착석 버튼 `[⚡ 마작왕(으)로 착석]`이 표시된다.
- `AC-003`: 닉네임 수정 시 `client_id` 변경 없이 기존 레코드가 업데이트된다.
- `AC-004`: 대기열이 FIFO 순서로 표시되며 착석한 플레이어의 상태가 `waiting`에서 `playing`으로 전환된다.
- `AC-005`: 4개 좌석 착석 완료 시 세션 상태가 `active`로 전환되고 `started_at`이 기록된다.
- `AC-006`: `UmaOkaTable.tsx`에 4명의 플레이어 닉네임이 2초 이내에 자동 반영된다.
- `AC-007`: `[기록 추가 및 공유]` 클릭 시 `duration_seconds`가 포함된 경기 기록이 `mahjong.db`에 저장되고 Table 1이 리셋된다.
- `AC-008`: 백엔드가 `better-sqlite3` WAL 모드에서 150MB 미만의 RSS 메모리로 구동된다.
- `AC-009`: 아파치 리버스 프록시가 `/api/*` 경로를 Node.js 백엔드로 정상 라우팅한다.
- `AC-010`: `cleanup-test-artifacts.sh` 실행 시 `mahjong.db`를 보존한 채 테스트 파일이 정리된다.
- `AC-011`: `[기기 등록 정보 초기화]` 클릭 시 `localStorage`가 삭제되고 `POST /api/client/reset`을 호출하며 `/`로 이동하고 좌석 공석화 및 닉네임이 `reset_{epoch}`로 갱신된다.
- `AC-012`: `/queue`에서 대기 4인에 대한 마작패(바람패: 동·남·서·북) 3D 입체 타일 UI 기반 디지털 자리 뽑기 기능을 제공한다.
- `AC-013`: 종료된 경기 기록 행에 유효한 `started_at`, `finished_at`, `duration_seconds` 값이 저장된다.

## 추적성
- Desired Outcome 1 (1-second check-in): `REQ-001`, `REQ-002`, `AC-001`, `AC-002`
- Desired Outcome 2 (Nickname sync): `REQ-003`, `AC-003`
- Desired Outcome 3 (Device reset): `REQ-011`, `AC-011`
- Desired Outcome 4 (Waiting queue & seat draw): `REQ-004`, `AC-004`, `AC-012`
- Desired Outcome 5 (Game start timing): `REQ-006`, `AC-005`
- Desired Outcome 6 (Auto-fill scorekeeper): `REQ-005`, `AC-006`
- Desired Outcome 7 (Score submission & duration): `REQ-007`, `AC-007`, `AC-013`
- Desired Outcome 8 (Lightweight EC2 infra): `REQ-008`, `REQ-009`, `AC-008`, `AC-009`
- Desired Outcome 9 (Post-launch cleanup): `REQ-010`, `AC-010`

## 미결정 사항
- 해당 없음(Not applicable): 모든 아키텍처 및 운영 세부 사항이 사용자에 의해 확정되었습니다.
