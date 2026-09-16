# 의도

## 메타데이터
- 작업 ID: scan-video-recording
- 기준본 리비전(Canonical revision): 2
- 언어(Language): ko
- 영문 기준본(Canonical): intent.md
- 상태(Status): ready
- 위험도(Risk): standard
- 생성일: 2026-09-15
- 수정일: 2026-09-15
- 요청자: user conversation
- 소유자: root implementation agent

## 최초 요청
"지금 점수 인식 알고리즘이 1.5초 이내에 같은 점수들을 인식한 것이 2건 있으면 확정하는 방식인 걸로 아는데, 테스트 결과가 매우 빠르게 잘 되는거 같으니 1.5초 내 3건으로 올려봐도 될지 점검해봐."
"그러면 인식 판독 알고리즘 수정하는김에 인식 시작 누를때부터 인식될때까지 영상을 pc로 보내는 걸로 수정하자. 결과 스샷만으로는 알 수 있는 정보가 의미가 없어."
"질문 1 옵션 a, 질문 2 옵션 b로 결정할께. 영상의 가장 마지막 장면이 3회 일치 판정이니 굳이 이미지를 따로 보낼 필요 없어. 그렇게 진행해줘."

요청 핵심 요약: 실시간 카메라 점수 인식의 안정성 확정 요구 조건을 `1500ms` 슬라이딩 윈도우 내 2회에서 3회 일치(`countThreshold = 3`, `spanMsThreshold = 200ms`)로 상향 조정합니다. 동시에, 정지화면 스크린샷 단독 전송을 대체하여 스캔 시작부터 점수 인식 확정 또는 취소 실패까지의 카메라 스트림 전체를 `MediaRecorder` 및 `uploadToMobileDrop`을 통해 PC 작업공간(`research-data/<device>/`)으로 자동 전송하도록 구현합니다.

## 문제와 근거
실제 마장 AMOS REX III 작탁 현장 테스트 결과 점수 인식이 약 `120ms` 만에 극도로 빠르게 완료되어 사용자가 시각적으로 프로그레스를 인지하기 전에 캡처가 이루어졌으며 카메라 조준 찰나의 플루크 우연한 일치 가능성이 남아 있었습니다. 또한 기존 정지 스크린샷(`.jpg`) 전송 방식은 최종 프레임 1장만 전달되므로 카메라 조준 진입 궤적 조명 반사 글레어 손떨림 등 판독 지연이나 실패의 원인을 사후 분석하기에 정보가 부족했습니다. 스캔 시작부터 종료까지의 전체 세션 영상을 녹화해 전송하면 마장 조명과 각도에 따른 OCR 판독 과정을 완벽하게 역추적할 수 있습니다. 영상의 마지막 프레임이 곧 3회 일치 확정 장면이므로 중복 `.jpg` 스크린샷 파일은 별도 전송하지 않습니다.

## 원하는 결과
1. `scoreCamera.ts`의 점수 안정성 임계값을 `1500ms` 내 3회 일치(`countThreshold = 3`, `spanMsThreshold = 200ms`)로 상향하고 `PhotoUploadPanel.tsx`의 UI 안내 문구를 `(${count}/3회)`로 갱신.
2. 표준 브라우저 `MediaRecorder`(`video/mp4` 및 `video/webm`)를 사용하여 OCR 분석 루프 FPS나 UI 성능 저하 없이 전체 스캔 세션을 백그라운드 녹화.
3. 녹화된 스캔 영상을 `uploadToMobileDrop`을 통해 PC의 `research-data/<device>/` 디렉터리로 자동 청크 전송:
   - 성공 시: `${device}_scan_${timestamp}.${ext}`
   - 취소 실패 시: `${device}_fail_${timestamp}.${ext}`
4. 중복 정지화면 스크린샷 전송을 생략하고 비디오 파일을 단일 표준 진단 데이터로 정립.
5. `MediaRecorder`가 지원되지 않는 환경 구형 브라우저 또는 테스트 환경에서도 오류 없이 안전하게 동작.
6. 모든 테스트 스위트 및 프로덕션 빌드 무결성 검증 (`npm test`).

## 범위
- `src/utils/scoreCamera.ts`: 기본 임계값 3회 / 200ms 적용, `MediaRecorder` 생명주기 제어 및 `ScanOptions`에 `onVideoReady` 콜백 추가.
- `src/components/PhotoUploadPanel.tsx`: UI label update to `(${count}/3회)` and video auto-drop handler wiring.
- `src/utils/scoreCamera.test.ts`: Updated 3-frame assertions and `MediaRecorder` unit test coverage.
- AI-Native SDLC artifact chain in `docs/ai/scan-video-recording/`.

## 제외 범위
- 오프라인 사진 동영상 파일 선택 수동 업로드 모드 변경.
- OCR 숫자 세그멘테이션 및 판독 코어 알고리즘 수정.
- 외부 제3자 클라우드 저장소 연동.
- 비디오 전송 시 중복 정지화면 스크린샷 추가 전송.

## 제약과 정책
- `MediaRecorder`는 비동기 백그라운드에서 실행되어 10 FPS OCR 분석 루프를 방해하지 않아야 합니다.
- 점수 확정 시 사용자의 검토 화면 드래프트 UI 전환은 비디오 압축이나 네트워크 전송을 기다리지 않고 즉시 이루어져야 합니다.
- 파일명 명명 규칙 및 다중 기기 폴더 분기(`rex 3`, `jp-ex`, `jp-color`)는 기존 규칙을 엄격히 준수합니다.

## 수용 신호
1. 점수 안정성 판정에 `1500ms` 이내 200ms 이상의 간격을 둔 3회의 유효 일치 프레임이 요구됨.
2. 상태 텍스트에 `(${count}/3회)`가 표시됨.
3. 실시간 스캔 시작 시 `MediaRecorder`가 시작되고 중단 캡처 취소 타임아웃 시 비디오 Blob이 생성되어 방출됨.
4. mobile-drop 설정이 활성화된 경우 비디오가 청크 단위로 PC 수신 서버로 자동 전송됨.
5. All test suites pass cleanly (`npm test`).

## 가정과 미해결 질문
- 사용자가 질문 1의 옵션 A와 질문 2의 옵션 B를 선택함.
- `MediaRecorder` 기본 컨테이너는 iOS Safari에서 `video/mp4` 및 Android Chrome에서 `video/webm` 또는 MP4.

## 결정 사항
- 3프레임 빈도 합의 임계값(`countThreshold = 3`, `spanMsThreshold = 200ms`)을 채택함.
- 성공 및 취소 실패 스캔 영상 전체 스트림을 PC로 전송함.
- 영상 녹화 활성화 시 중복 정지화면 스크린샷 전송은 생략함.
