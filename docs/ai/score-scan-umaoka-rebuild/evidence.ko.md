# 증거

- 작업 ID: score-scan-umaoka-rebuild
- 기준본 리비전(Canonical revision): 2
- 언어(Language): ko
- 영문 기준본(Canonical): evidence.md

## 변경 요약
점수 스캔 페이지 컴포넌트(`ScorePhotoInputPage.tsx`)를 완전한 우마·오카 계산 파이프라인으로 재구축하고, `App.tsx`에서 운영 라우트(`/scan_score`)와 개발자 테스트 Lab 라우트(`/test_scan`)를 분리하며, `/set_score_photo`로부터의 하위 호환 리다이렉트를 제공하고, `PhotoUploadPanel.tsx`에서 수동 사진 촬영 버튼 및 입력을 제거하며, 모든 테스트 스위트를 검증합니다.

## 요구사항 충족 현황
| 요구사항 | 수용 기준 | 작업 | 계획된 증거 | 결과 |
| --- | --- | --- | --- | --- |
| REQ-001 | AC-001 | TASK-002 | `npm test -- src/components/ScorePhotoInputPage.test.tsx --watchAll=false` | PASS (2/2 passed) |
| REQ-002 | AC-002, AC-003 | TASK-003 | `npm test -- src/App.test.tsx --watchAll=false` | PASS (4/4 passed) |
| REQ-003 | AC-001, AC-002 | TASK-001 | `npm test -- src/components/PhotoUploadPanel.test.tsx --watchAll=false` | PASS (16/16 passed) |
| REQ-004 | AC-004 | TASK-001 | `npm test -- src/components/PhotoUploadPanel.test.tsx --watchAll=false` | PASS (16/16 passed) |
| REQ-005 | AC-001, AC-005 | TASK-004 | `npm test -- --watchAll=false` | PASS (89/89 passed) |
| REQ-ALL | AC-005 | TASK-005 | `npm run build` | PASS (Compiled successfully) |

## 테스트와 품질 결과
- 실행 결과: `npm test -- --watchAll=false` 실행으로 11개 테스트 스위트 89개 테스트 전체 통과(실패 0건).
- 실행 결과: `npm run build` 프로덕션 번들 빌드 성공(경고 0건, 에러 0건).
- 실행 결과: 아티팩트 체인 검증 스크립트 통과.

## E2E 증거
- 실시간 점수 스캔이 인식된 4개 원점수를 동, 남, 서, 북 좌석에 자동 매핑하고 우마·오카 순위를 계산합니다.
- 프로덕션 라우트 `/scan_score`는 PC 전송 제어가 노출되지 않는 깔끔한 사용자 경험을 제공합니다.
- 테스트 라우트 `/test_scan`은 PC 전송 설정 패널 및 다기종 선택기(`rex3`, `jpex`, `jpcolor`)를 제공합니다.
- 라우트 `/set_score_photo`는 `/scan_score`로 자동 리다이렉트됩니다.
- 수동 사진 촬영 버튼(`📷 점수판 촬영하기`)이 완전히 부재합니다.

## 리뷰 발견 사항과 해결
Phase 1 및 Phase 2 구현과 검증이 완료되었습니다. 모든 단위 테스트, 라우트 리다이렉트 및 프로덕션 번들 빌드가 통과되었습니다.

## 배포 또는 인계
로컬 전달이 완료되었습니다. 프로덕션 빌드가 로컬에서 검증되었습니다.

## 릴리스 준비 상태
- 전체 상태(Overall status): READY
- 필수 승인: 사용자의 릴리스 확인 승인.
- 차단 항목: 없음.

## 잔여 위험
특정 모바일 브라우저의 기기 카메라 권한 허용 여부는 수동 테스트 중 현장 확인합니다.
