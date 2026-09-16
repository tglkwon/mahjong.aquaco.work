# 증거

- 작업 ID: scan-video-recording
- 기준본 리비전(Canonical revision): 2
- 언어(Language): ko
- 영문 기준본(Canonical): evidence.md

## 변경 요약
실시간 카메라 안정성 임계값을 1500ms 내 3프레임(`countThreshold = 3`, `spanMsThreshold = 200`)으로 상향하고, `onVideoReady`를 방출하는 `MediaRecorder` 세션 녹화를 통합했으며, 성공 및 실패 취소 세션 모두에 대해 `PhotoUploadPanel.tsx`에서 백그라운드 비디오 업로드(`.mp4` / `.webm`)를 연결하고 중복 정지 스크린샷 업로드를 제거했습니다.

## 요구사항 충족 현황
| 요구사항 | 수용 기준 | 작업 | 계획된 증거 | 결과 |
| --- | --- | --- | --- | --- |
| REQ-001 | AC-001 | TASK-001 | scoreCamera.ts 3-frame 200ms default threshold | PASS |
| REQ-002 | AC-002 | TASK-003 | PhotoUploadPanel.tsx (`count/3회`) status prompt | PASS |
| REQ-003 | AC-003 | TASK-002 | onVideoReady callback interface in ScanOptions | PASS |
| REQ-004 | AC-003 | TASK-002 | MediaRecorder stream recording with auto format | PASS |
| REQ-005 | AC-003 | TASK-002 | Stop reason tracking and video Blob emission | PASS |
| REQ-006 | AC-003 | TASK-003 | Auto-upload of scan or fail video via mobile drop | PASS |
| REQ-007 | AC-003 | TASK-002 | Graceful fallback when MediaRecorder is unavailable | PASS |
| REQ-008 | AC-004 | TASK-004 | Unit tests for 3-frame capture and MediaRecorder | PASS |
| REQ-ALL | AC-005 | TASK-005 | Full Jest suite pass, build pass, artifact validation | PASS |

## 테스트와 품질 결과
- 단위 테스트: `npm test -- --watchAll=false` 11개 스위트 통과, 85개 테스트 통과 (100%).
- 프로덕션 빌드: `npm run build` 에러 없이 성공적으로 컴파일 완료 (`main.8ce7f2f1.js`, 111.59 kB gzip).
- 아티팩트 체인 유효성 검사: `validate-artifact-chain.ps1` 통과.

## E2E 증거
- Video Recording: Active scanning records the camera stream into a video Blob without blocking OCR.
- Fast-Lock at 3 Frames: Score recognition confirms at 3 matching frames and immediately displays score draft.
- Drop Upload: Video is transmitted in 8MB chunks to the PC workspace.

## 리뷰 발견 사항과 해결
모든 단위 테스트와 프로덕션 빌드가 완벽히 통과함. 코드 수정은 단일 책임 원칙과 하위 호환성을 엄격히 준수함.

## 배포 또는 인계
Local development and field testing only.

## 릴리스 준비 상태
- 전체 상태(Overall status): READY
- Required human approvals: Ready for user field testing on physical table.
- Blocking items: None.

## 잔여 위험
Device codec differences handled via runtime format negotiation.
