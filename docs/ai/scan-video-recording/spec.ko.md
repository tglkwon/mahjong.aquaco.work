# 명세

## 메타데이터와 출처
- 작업 ID: scan-video-recording
- 기준본 리비전(Canonical revision): 2
- 언어(Language): ko
- 영문 기준본(Canonical): spec.md
- 출처: intent.md 리비전 2

## 요약
실시간 점수판 카메라 스캔 파이프라인을 개선하여 `1500ms` 슬라이딩 윈도우 내 3프레임 시계열 합의(`count = 3`, `span >= 200ms`)를 요구하도록 강화하고, 표준 `MediaRecorder`를 활용하여 활성 스캔 세션 전체를 무손실 녹화합니다. mobile-drop 설정이 활성화되어 있을 경우, 점수 판독 확정 또는 취소 실패 시 전체 세션 비디오(`.mp4` 또는 `.webm`)를 PC 수신 서버(`research-data/<device>/`)로 자동 백그라운드 전송하며, 기존의 중복 정지 스크린샷(`.jpg`) 전송을 대체합니다.

## 기능 요구사항
- REQ-001 필수: `src/utils/scoreCamera.ts`에서 기본 안정성 옵션을 `countThreshold = 3` 및 `spanMsThreshold = 200`으로 설정.
- REQ-002 필수: `src/components/PhotoUploadPanel.tsx`에서 실시간 스캔 진행 피드백 텍스트를 `점수 확인 중 (${count}/3회). 잠시 유지해 주세요.`로 갱신.
- REQ-003 필수: `src/utils/scoreCamera.ts`의 `ScanOptions` 인터페이스에 선택적 콜백 `onVideoReady` 추가.
- REQ-004 필수: `src/utils/scoreCamera.ts`에서 지원 환경일 경우 획득한 `MediaStream`에 `MediaRecorder` 인스턴스를 연결하고 최적의 MIME 타입(`video/mp4` > `video/webm;codecs=vp9` > `video/webm`)을 선택하여 주기적 청크 수집.
- REQ-005 필수: `src/utils/scoreCamera.ts`에서 세션 종료 원인을 추적하고, 녹화 중단 시 최종 비디오 Blob을 취합하여 `onVideoReady` 호출.
- REQ-006 필수: `src/components/PhotoUploadPanel.tsx`에서 `onVideoReady`를 `uploadToMobileDrop`에 연결하여 success 시 `${device}_scan_${timestamp}.${ext}`, canceled 또는 failed 시 `${device}_fail_${timestamp}.${ext}`로 업로드하고 기존 정지화면 스크린샷(`.jpg`) 전송 로직 제거.
- REQ-007 필수: `MediaRecorder`가 정의되지 않았거나 초기화 중 예외가 발생할 때 실시간 스캔과 OCR 판독이 중단 없이 정상 작동하도록 우아한 폴백 보장.
- REQ-008 필수: `src/utils/scoreCamera.test.ts`에서 3프레임 캡처 동작을 검증하도록 테스트 어설션을 갱신하고, `MediaRecorder` 생명주기 및 `onVideoReady` 콜백 방출을 검증하는 단위 테스트 추가.

## 비기능 요구사항
비디오 인코딩은 네이티브 미디어 파이프라인에서 비동기로 수행되어 OCR 캔버스 추출 및 분석 루프가 프레임 드랍 없이 10 FPS를 유지합니다. 점수 확정 시 사용자 검토 드래프트 UI 전환은 비디오 완성이나 네트워크 전송을 기다리지 않고 즉시 이루어지며, 업로드는 백그라운드에서 비동기로 진행됩니다. iOS Safari의 MP4 출력 및 Android Chrome의 WebM 또는 MP4 출력을 표준 지원합니다. PIN 인증 및 진행률 피드백이 포함된 8MB 청크 스트리밍 프로토콜(`uploadToMobileDrop`)을 재사용합니다.

## 사용자 경험과 흐름
1. 테스터가 모바일에서 실시간 스캔 시작 버튼을 터치.
2. 카메라가 열리며 백그라운드 비디오 녹화가 조용히 시작됨.
3. 테스터가 AMOS REX III 점수판을 조준함:
   - 1프레임 일치: `점수 확인 중 (1/3회)...` 표시
   - 2프레임 일치: `점수 확인 중 (2/3회)...` 표시
   - 3프레임 일치: 3-frame consensus reached. UI 즉시 마지막 정지화면을 고정하고 점수 배정 검토 화면으로 전환.
4. 백그라운드 동시 동작:
   - 비디오 녹화가 정지되고 비디오 Blob(`.mp4` / `.webm`) 생성.
   - PC 드롭 모드가 켜져 있는 경우 `${device}_scan_${timestamp}.${ext}` 파일이 `research-data/rex 3/`으로 청크 업로드됨.
   - 플로팅 배지에 업로드 진행률이 표시되고 PC 드롭 완료 확인.
5. 테스터가 도중에 스캔 취소를 누르거나 타임아웃이 발생한 경우:
   - 비디오 녹화가 정지되고 비디오 Blob 생성.
   - PC 드롭 모드가 켜져 있는 경우 `${device}_fail_${timestamp}.${ext}` 파일이 `research-data/rex 3/`으로 전송되어 사후 디버깅 가능.

## 아키텍처와 인터페이스
- `src/utils/scoreCamera.ts`:
  - `ScanOptions` with `onVideoReady`
  - `MediaRecorder` 자동 MIME 판별 및 타임슬라이스 버퍼링 연동.
- `src/components/PhotoUploadPanel.tsx`:
  - `research-data/<device>/`를 대상으로 하는 `onVideoReady` 업로드 브리지.

## 데이터와 마이그레이션
해당 사항 없음: 데이터베이스, 서버 저장소, URL 스키마 변경 없음.

## 실패 모드와 경계 사례
`MediaRecorder` 미지원 시 에러를 안전하게 catch하고 카메라 OCR을 지속합니다. 네트워크 업로드 실패 시 점수 드래프트 UI를 보존하면서 토스트 알림을 표시합니다.

## 보안, 개인정보, 권한
카메라 영상은 사용자가 명시적으로 스캔을 시작한 세션 동안에만 녹화됩니다. 영상은 6자리 일치 PIN을 통한 인증된 HTTPS 터널을 통해서만 전송됩니다.

## 관측성과 운영
업로드 진행률, 성공 안내, 에러 토스트가 기존 모바일 UI 드롭 상태 배지를 통해 노출됩니다.

## 테스트 전략
1. `scoreCamera.test.ts`에서 3프레임 캡처 타이밍 및 임계값 검증.
2. `scoreCamera.test.ts`에서 모의 `MediaRecorder`를 활용하여 시작, 중지, 청크 취합, `onVideoReady` 호출 검증.
3. `PhotoUploadPanel.test.tsx`에서 스캔 상태 텍스트 및 옵션 전달 검증.
4. 저장소 전체 회귀 테스트 (`npm test`).

## 수용 기준
- AC-001: `scoreCamera.ts` 기본 설정이 1500ms 내 200ms 이상의 간격을 둔 3회의 일치 프레임을 요구하여 `1500ms` 내 캡처 발동.
- AC-002: `PhotoUploadPanel.tsx`가 빈도 합의 진행 중 `점수 확인 중 (${count}/3회)` 표시.
- AC-003: `scoreCamera.ts`가 `MediaRecorder`를 초기화하고 캡처 완료 또는 세션 중단 시 상태와 함께 `onVideoReady` 호출.
- AC-004: `scoreCamera.test.ts`의 3프레임 캡처 및 `MediaRecorder` 생명주기 단위 테스트 통과.
- AC-005: 전체 테스트 스위트(`npm test`) 및 프로덕션 빌드(`npm run build`) 통과.

## 추적성
안정성 임계값 상향 → REQ-001, REQ-002 → AC-001, AC-002. 비디오 녹화 생명주기 → REQ-003, REQ-004, REQ-005, REQ-007 → AC-003. 모바일 드롭 자동 업로드 → REQ-006 → AC-003. 단위 테스트 및 품질 검증 → REQ-008 → AC-004, AC-005.

## 미결정 사항
차단 요소 없음. 질문 1의 옵션 A와 질문 2의 옵션 B 확정 반영.
