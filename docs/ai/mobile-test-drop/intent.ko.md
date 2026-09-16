# 의도

## 메타데이터
- 작업 ID: mobile-test-drop
- 기준본 리비전(Canonical revision): 2
- 언어(Language): ko
- 영문 기준본(Canonical): intent.md
- 출처: 사용자 대화
- 상태(Status): ready
- 위험도(Risk): standard
- 생성일: 2026-09-15
- 수정일: 2026-09-15
- 소유자(Owner): root implementation agent

## 최초 요청
"mvp 1 의 테스트 사이트를 만들때 영상 인식하는 장면을 매번 수동 스크린샷으로 여기 보내거나, 아니면 비슷한 각도의 영상을 따로 찍어서 그걸 나중에 pc로 전송하는 작업을 하고 있었어. 글로벌 스킬로 mobile-drop을 만들었고, 그걸 살려서 모바일에서 실제 테스트할 때 점수 인식 페이지에서 점수인식 + 이 프로젝트로 영상 전송하는 임시 기능을 만들고 싶어."

영문 요약(English synthesis): Create a temporary test utility inside the score recognition page (`ScorePhotoInputPage` / `PhotoUploadPanel`) that integrates with the existing global `mobile-drop` receiver, enabling testers on real mobile devices to perform scoreboard score recognition while automatically or manually transferring the captured test video/photo and recognition results directly into the local project workspace on PC.

## 문제와 근거
MVP 1 마작 점수판 영상/사진 인식을 모바일 현장에서 테스트할 때, 개발자/테스터는 AI 에이전트와 PC 환경에 테스트 장면을 전달하기 위해 매번 스마트폰 화면을 수동으로 스크린샷 캡처하여 전송하거나, 별도로 비슷한 각도의 영상을 촬영해 나중에 PC로 옮겨야 했습니다. 이로 인해 작업 컨텍스트가 끊기고 번거로운 수동 전송 과정이 수반되며, 실제 OCR 인식기가 처리한 프레임과 사후 촬영 영상 사이의 시점 불일치가 발생합니다. 현재 리포지토리에는 클라이언트 단 프레임 추출, REXX 3 OCR, 실시간 카메라 스캔이 구현되어 있으나 모든 처리가 브라우저 메모리 내에서만 로컬로 동작하며 업로드 기능이 일절 없습니다. 한편 글로벌 스킬로 구축된 `mobile-drop`은 로컬 파이썬 청크 수신 서버와 Cloudflare Quick Tunnel(`trycloudflare.com`), PIN 인증 구조를 완비하고 있습니다.

## 원하는 결과
1. 점수 인식 페이지에서 PC의 활성 `mobile-drop` 세션과 연동할 수 있는 개발자 전용 임시 테스트 브리지(PC 전송 모드)를 활성화합니다.
2. 사진/영상 촬영 업로드 시, 모바일 기본 카메라로 동영상 또는 사진을 선택/촬영하여 로컬 점수판 인식을 수행함과 동시에 해당 미디어 원본을 청크 단위로 PC 워크스페이스(`./uploads/` or `research-data/`)에 즉시 전송합니다.
3. 실시간 스캔 모드 시, 스캔 중인 카메라 스트림(`MediaRecorder`) 클립 또는 자동 캡처된 고해상도 판독 프레임 이미지와 OCR 후보 메타데이터를 PC 워크스페이스로 전송할 수 있도록 지원합니다.
4. 이 테스트 브리지는 100% 옵트인(선택적) 및 가역적(임시 기능)으로 동작하여, 일반 상용 사용자에게 영향을 주지 않고 명시적인 드롭 세션 URL과 PIN 없이는 어떠한 데이터도 외부로 유출되지 않도록 보장합니다.

## 범위
- 점수 인식 UI (`PhotoUploadPanel.tsx` / `ScorePhotoInputPage.tsx`) 개발자 토글 / 테스트 전송 UI.
- 페어링 메커니즘: Cloudflare Quick Tunnel URL 및 6자리 PIN 입력, `localStorage` 보존 및 URL 쿼리 파라미터(`?dropUrl=...&dropPin=...`) 자동 채우기 지원.
- CLI 및 UI 선택을 통한 다중 기기 대상 작탁 라우팅(`rex3` -> `research-data/rex 3`, `jpex` -> `research-data/jp-ex`, `jpcolor` -> `research-data/jp-color`).
- `mobile-drop` 청크 업로드 프로토콜(`/upload/chunk`, `/upload/complete`)을 준수하는 클라이언트 전송 모듈.
- 미디어 전송 지원: 원본 비디오/사진 파일 업로드, 실시간 스캔 캡처 스냅샷 드롭, 선택적 테스트 녹화 클립 전송.
- 판독 결과 메타데이터(추출된 원시 점수, 신뢰도, 타임스탬프) 파일명 또는 페이로드 동봉.
- 개발 편의를 위해 `./uploads/` or `research-data/` 경로로 세션을 여는 프로젝트 헬퍼 명령/스크립트 제공.

## 제외 범위
- 영구 클라우드 스토리지 백엔드, AWS S3, 또는 서드파티 DB 연동.
- 상용 화면 영구 UI 오염 또는 기존 점수 계산, 우마/오카 테이블, URL 공유 상태 포맷의 임의 변경.
- REXX 3 OCR 알고리즘 코어 자체 재작성.
- 다중 사용자 동시 드롭 수신 세션 지원.

## 제약과 정책
- 보안: 사용자가 유효한 `mobile-drop` Cloudflare 터널 URL 및 PIN을 명시적으로 입력했을 때만 미디어를 전송하며, 기본 상태는 100% 브라우저 메모리 로컬 처리를 유지합니다.
- 모바일 브라우저 호환성: 청크 업로드 중 UI 스레드가 멈추거나 충돌하지 않도록 iOS Safari 및 Android Chrome 환경을 완벽히 지원해야 합니다.
- 가역성(임시성): MVP 1 테스트 완료 후 손쉽게 제거하거나 끌 수 있도록 코드가 깔끔하게 격리되어야 합니다.

## 수용 신호
1. 유효한 `mobile-drop` 터널 URL 및 PIN으로 연결 시 활성 연결 상태 뱃지가 표시됩니다.
2. 점수판 비디오/사진을 선택 또는 촬영하면 OCR 인식이 정상 수행되고 동시에 PC의 `./uploads/` 디렉터리에 청크 업로드로 저장됩니다.
3. 실시간 스캔 캡처 시, 캡처된 프레임 이미지 또는 녹화 클립이 PC `./uploads/` 디렉터리로 정상 전달됩니다.
4. 모바일 화면에 전송 진행률(프로그레스 바)과 성공/오류 피드백이 명확히 표시됩니다.
5. 기존 11개 테스트 스위트(73개 테스트) 및 프로덕션 빌드가 회귀 없이 모두 통과합니다.

## 가정과 미해결 질문
- 가정: PC에서 `mobile-drop`(글로벌 스킬 또는 프로젝트 헬퍼)을 실행하여 모바일에서 HTTPS로 접근 가능한 Cloudflare 터널 URL을 발급받아 테스트를 진행합니다.
- 미해결 질문 해결: 반복 테스트를 위해 프로젝트 헬퍼 스크립트에서 다중 연속 세션 모드를 기본값으로 채택하고, 실시간 스캔은 판독 프레임 스냅샷과 점수 메타데이터를 전송하며 파일/카메라 입력을 통해 풀 비디오 원본 전송을 지원합니다.

## 결정 사항
- 작업 ID: `mobile-test-drop`.
- 표준 위험도(`standard`): 기존 임시 터널을 활용한 로컬 테스트 도구이며, 프로덕션 데이터나 비가역적 상태 변경이 없는 완전 가역적 작업.
- 시각적 프리뷰 검토 및 사용자 승인에 따라 상태를 `ready`로 전환하고, 연속 세션 및 스냅샷/파일 전송 워크플로를 확정합니다.
