# 명세

## 메타데이터와 출처
- 작업 ID: mobile-test-drop
- 기준본 리비전(Canonical revision): 2
- 언어(Language): ko
- 영문 기준본(Canonical): spec.md
- 출처: intent.md 리비전 2
- 상태(Status): ready
- 위험도(Risk): standard
- 생성일: 2026-09-15
- 수정일: 2026-09-15
- 소유자(Owner): root implementation agent

## 요약
`ScorePhotoInputPage` / `PhotoUploadPanel`에 로컬 `mobile-drop` 수신 서버와 연동되는 임시 모바일-PC 테스트 유틸리티를 제공합니다. 실제 모바일 기기에서 테스트할 때 개발자는 점수판 OCR을 실행함과 동시에 테스트 미디어 원본(비디오/사진 파일 또는 캡처된 스캔 프레임)을 인증된 Cloudflare Quick Tunnel을 통해 PC 개발 호스트의 `./uploads/` 경로로 직접 전송할 수 있습니다.

## 기능 요구사항
- `REQ-001`: 바이너리 데이터(Blob 또는 File)를 8 MB 청크로 분할하여 `X-Session-Token` 헤더와 함께 `/upload/chunk`로 HTTP POST 전송하고 `/upload/complete`로 완료 처리하는 모듈식 TypeScript 클라이언트(`src/utils/mobileDropClient.ts`)를 구현합니다.
- `REQ-002`: 터널 연결성 및 세션 토큰 유효성을 확인하기 위한 `GET /status` 기반 헬스체크/핑 기능을 제공합니다.
- `REQ-003`: `PhotoUploadPanel.tsx`에 "PC 전송 모드"를 구성하거나 토글할 수 있는 개발자 패널을 추가하여 Cloudflare Tunnel URL 및 6자리 PIN을 입력받습니다.
- `REQ-004`: URL 쿼리 파라미터(`?dropUrl=...&dropPin=...`)를 통한 접속 정보 자동 채우기 및 `localStorage` 영구 캐싱을 지원합니다.
- `REQ-005`: 파일/카메라 업로드 모드에서 비디오 또는 사진 파일(`accept="video/*,image/*"`)을 선택할 수 있도록 활성화하고, 로컬 점수판 프레임 추출 및 OCR을 수행하면서 원본 파일을 PC `./uploads/`로 스트리밍합니다.
- `REQ-006`: 실시간 카메라 스캔 모드에서 2회 연속 안정적으로 캡처된 고해상도 스냅샷(JPEG)과 후보 점수 JSON 메타데이터를 PC `./uploads/`로 원클릭 또는 자동 전송하는 기능을 제공합니다.
- `REQ-007`: 전송 중 모바일 화면에 실시간 피드백(전송 상태, 진행률 백분율 바, 성공/오류 토스트 알림)을 제공합니다.
- `REQ-008`: `./uploads/` 디렉터리를 대상으로 연속 테스트 세션을 지원하는 로컬 파이썬 수신 서버 및 Cloudflare 터널 오케스트레이션 프로젝트 헬퍼 스크립트(`scripts/start-test-drop.ps1`)를 추가합니다.
- `REQ-009`: `X-Target-Device` HTTP 헤더, CLI 매개변수 및 `PhotoUploadPanel` UI 드롭다운을 통해 다중 기종 대상 라우팅(`rex3` -> `research-data/rex 3`, `jpex` -> `research-data/jp-ex`, `jpcolor` -> `research-data/jp-color`)을 지원합니다.

## 비기능 요구사항
- 보안: 사용자가 명시적으로 PC 전송 모드를 활성화하고 일치하는 PIN을 입력하지 않는 한 원격 전송을 일절 수행하지 않습니다. 모바일 브라우저의 혼합 콘텐츠(Mixed Content) 차단을 방지하기 위해 모든 트래픽은 HTTPS Cloudflare Quick Tunnel을 경유해야 합니다.
- 탄력성: 모바일 기기(iOS Safari 및 Android Chrome)에서 UI 및 OCR 처리가 멈추지 않도록 비차단 비동기 방식으로 청크를 전송합니다.
- 상용 영향 제로: 개발자 토글이나 테스트 쿼리 파라미터를 열지 않는 일반 상용 사용자에게는 기본적으로 비활성화되어 보이지 않아야 합니다.

## 사용자 경험과 흐름
1. **PC 준비**: 개발자가 `pwsh.exe -File scripts/start-test-drop.ps1` 명령을 실행합니다. 스크립트가 수신 서버를 기동하고 클릭 가능한 테스트 URL인 `http://localhost:3000/#/set_score_photo?dropUrl=...&dropPin=...` (또는 터널 주소)를 출력합니다.
2. **모바일 연결**: 개발자가 모바일에서 해당 링크를 엽니다. "PC 전송 모드" 배너에 `🟢 연결됨 (PIN: ******)` 상태가 자동으로 표시됩니다.
3. **촬영 및 인식**:
   - 케이스 A (사진/영상): 개발자가 "📷 점수판 촬영하기"를 누르거나 녹화된 비디오를 선택합니다. 앱이 로컬에서 점수를 분석하고 동시에 미디어를 PC로 즉시 업로드합니다.
   - 케이스 B (실시간 스캔): 개발자가 "실시간 스캔 시작"을 누릅니다. 2프레임 연속 일치가 확인되면 화면을 고정하고 인식 점수를 표시하며, 프레임 JPEG 및 점수 JSON을 PC로 전송합니다.
4. **완료**: 초록색 뱃지로 `✅ PC 전송 완료: uploads/<filename>` 알림이 표시되며, PC 워크스페이스에서 해당 파일을 즉시 열어볼 수 있습니다.

## 아키텍처와 인터페이스
- `src/utils/mobileDropClient.ts`:
  - `checkDropStatus(serverUrl: string, pin: string): Promise<{ ok: boolean; message?: string }>`
  - `uploadToMobileDrop(fileOrBlob: Blob | File, filename: string, options: DropUploadOptions): Promise<DropUploadResult>`
  - `DropUploadOptions`: `{ serverUrl: string; pin: string; onProgress?: (percent: number) => void; signal?: AbortSignal }`
- `src/components/PhotoUploadPanel.tsx`:
  - 상태: `dropConfig: { enabled: boolean; url: string; pin: string; autoUpload: boolean }`
  - 상태: `uploadState: { uploading: boolean; progress: number; message: string; status: 'idle' | 'success' | 'error' }`
- `scripts/start-test-drop.ps1`:
  - 지속 모드와 Cloudflare 터널을 지원하는 파이썬 `server.py` 래퍼 PowerShell 스크립트.

## 데이터와 마이그레이션
- 저장 설정: `{ url, pin, enabled, autoUpload }`를 포함하는 `localStorage.getItem('mahjong_drop_config')`.
- 대상 PC 디렉터리: `./uploads/`.
- 파일 명명 규칙: `rexx3_<type>_<timestamp>.<ext>` 및 동봉 메타데이터 `rexx3_<type>_<timestamp>.json`.

## 실패 모드와 경계 사례
- 유효하지 않은 PIN / 401 권한 없음: "PIN 번호 불일치 또는 세션 만료" 안내 메시지를 인라인으로 명확히 표시합니다.
- 네트워크 단절 / 터널 끊김: 청크 업로드를 안전하게 중단하고 사용자에게 알리며 로컬 OCR 초안은 손실 없이 보존합니다.
- 대용량 비디오 파일(50MB 초과): 8MB 청크 스트리밍으로 Cloudflare의 100MB 본문 크기 제한을 우회하고 모바일 브라우저의 메모리 고갈을 방지합니다.
- 카메라 부재 또는 권한 거부: 기존 카메라 오류 핸들러를 통해 안정적으로 처리합니다.

## 보안, 개인정보, 권한
- 하드코딩된 토큰, 비밀번호, 인증정보를 일절 두지 않습니다.
- Cloudflare 터널을 통한 종단간 HTTPS 암호화 통신을 보장합니다.
- 모든 청크 요청 헤더(`X-Session-Token`)에 세션 PIN을 요구합니다.

## 관측성과 운영
- UI 상에 인라인 전송 진행률, 업로드 백분율 및 오류 메시지를 투명하게 노출합니다.
- `test-drop-server.py`의 로컬 stderr를 통해 서버의 청크 수신 상황을 로깅합니다.
- `-Stop` 또는 프로세스 종료 시 좀비 프로세스 잔류 없이 안전하게 정리합니다.

## 테스트 전략
- 목(mock) `fetch`를 활용하여 `src/utils/mobileDropClient.test.ts` 단위 테스트를 구현하고 청크 분할, 헤더, 진행률 추적, 오류 분기를 검증합니다.
- `src/components/PhotoUploadPanel.test.tsx`에서 토글 확장, URL 쿼리 파싱 자동 채우기, 업로드 버튼 호출을 검증하는 컴포넌트 통합 테스트를 추가합니다.
- 회귀 테스트: 저장소 전체 테스트 스위트(`npm test -- --watchAll=false`) 및 프로덕션 빌드(`npm run build`)를 완벽히 통과합니다.

## 수용 기준
- `AC-001`: `uploadToMobileDrop` 함수가 8MB를 초과하는 Blob을 올바른 헤더와 함께 다중 청크로 분할 전송하고 `/upload/complete`로 완료합니다.
- `AC-002`: `checkDropStatus` 함수가 서버 응답 200 시 `ok: true`를 반환합니다.
- `AC-003`: `PhotoUploadPanel`이 PC 전송 토글을 렌더링하고 `dropUrl`, `dropPin` 쿼리 파라미터를 파싱하며 `localStorage`에 설정을 보존합니다.
- `AC-004`: 사진/영상 파일 업로드 시 로컬 점수 인식이 트리거되며 OCR 작업을 차단하지 않고 병렬로 청크 업로드를 실행합니다.
- `AC-005`: 실시간 스캔 자동 캡처 시 캡처된 프레임 이미지와 동봉 점수 메타데이터를 구성된 엔드포인트로 전송합니다.
- `AC-006`: 저장소 단위 테스트(73개 이상)가 통과하고 프로덕션 빌드가 오류 없이 성공합니다.
- `AC-007`: 대상 기기 선택을 통해 업로드를 중복 방지 및 git ignore 보호 하에 `research-data/rex 3`, `research-data/jp-ex`, `research-data/jp-color` 디렉터리로 동적 라우팅합니다.

## 추적성
- `REQ-001` -> `AC-001`
- `REQ-002` -> `AC-002`
- `REQ-003` -> `AC-003`
- `REQ-004` -> `AC-003`
- `REQ-005` -> `AC-004`
- `REQ-006` -> `AC-005`
- `REQ-007` -> `AC-004`, `AC-005`
- `REQ-008` -> `AC-001`, `AC-002`
- `REQ-009` -> `AC-007`

## 미결정 사항
- 없음. 모든 요구사항과 워크플로가 확인되어 일치되었습니다.
