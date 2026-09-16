# 증거

- 작업 ID: mobile-test-drop
- 기준본 리비전(Canonical revision): 2
- 언어(Language): ko
- 영문 기준본(Canonical): evidence.md

## 변경 요약
Cloudflare Quick Tunnel을 통해 `PhotoUploadPanel`을 로컬 `mobile-drop` 수신 서버에 연결하는 모바일-PC 테스트 드롭 브리지를 구현했습니다. 원본 비디오/사진 파일 및 실시간 스캔 캡처 스냅샷을 `./uploads/` 경로로 자동/수동 청크 분할 전송하는 기능을 제공합니다.

## 요구사항 충족 현황
| 요구사항 | 수용 기준 | 작업 | 계획된 검증 | 결과 |
| --- | --- | --- | --- | --- |
| REQ-001 | AC-001 | TASK-001 | 청크 슬라이싱, 헤더, 완료 알림 단위 테스트 | PASS |
| REQ-002 | AC-002 | TASK-001 | 헬스체크 핑 단위 테스트 | PASS |
| REQ-003 | AC-003 | TASK-002 | 패널 토글 및 UI 설정 통합 테스트 | PASS |
| REQ-004 | AC-003 | TASK-002 | URL 쿼리 파라미터 파싱 및 localStorage 캐싱 테스트 | PASS |
| REQ-005 | AC-004 | TASK-002 | 병렬 비디오/사진 OCR 및 백그라운드 드롭 업로드 테스트 | PASS |
| REQ-006 | AC-005 | TASK-002 | 실시간 스캔 스냅샷 프레임 및 후보 점수 드롭 | PASS |
| REQ-007 | AC-004, AC-005 | TASK-002 | 패널 내 인라인 프로그레스 바 및 오류/성공 피드백 | PASS |
| REQ-008 | AC-001, AC-002 | TASK-003 | 프로젝트 내 지속 세션 로컬 오케스트레이터 스크립트 | PASS |
| REQ-009 | AC-007 | TASK-005 | 다중 기종 대상 라우팅 통합 테스트 | PASS |
| REQ-001 | AC-006 | TASK-004 | 전체 테스트 스위트 및 프로덕션 빌드 품질 게이트 | PASS |

## 테스트와 품질 결과
- `npm test -- --watchAll=false`: 12개 테스트 스위트, 84개 테스트 모두 통과 (신규 클라이언트 단위 테스트 9개 및 패널 브리지 통합 테스트 3개 포함).
- `npm run build`: 성공적으로 컴파일 완료; `main.9cd9c268.js` (111.24 kB gzip), TypeScript 또는 ESLint 오류 `0`건.

## E2E 증거
- `src/utils/mobileDropClient.test.ts` 자동화 테스트를 통해 8MB 청크 슬라이싱, 커스텀 PIN 헤더 전달, 오류 복구, `/upload/complete` 병합 신호를 검증했습니다.
- `src/components/PhotoUploadPanel.test.tsx` 통합 테스트를 통해 UI 토글, `localStorage` 접속 정보 보존, 파일 변경 시 자동 드롭 동작을 검증했습니다.
- 오케스트레이터 `scripts/start-test-drop.ps1` 및 수신 서버 `scripts/test-drop-server.py`가 `./uploads/` 경로를 대상으로 다중 파일 연속 업로드를 지원함을 확인했습니다.

## 리뷰 발견 사항과 해결
- 차단 결함 없음. 모바일 브라우저의 교차 출처 혼합 콘텐츠(Mixed Content) 문제를 Cloudflare HTTPS 터널로 사전에 완화했습니다.

## 배포 또는 인계
- 테스트 유틸리티는 개발자 전용으로 유지되며, 일반 상용 마작 기록 라우트나 최종 사용자에게 영향을 주지 않습니다.

## 릴리스 준비 상태
- 전체 상태(Overall status): READY
- 필수 승인 사항: 없음; 승인된 로컬 테스트 유틸리티 검증 완료.
- 차단 사항: 없음.

## 잔여 위험
- 터널 동작을 위해 Cloudflare Quick Tunnel 아웃바운드 인터넷 접근이 필요합니다. 인터넷이 불가한 경우 메모리 내 로컬 처리 모드로 안전하게 폴백합니다.
