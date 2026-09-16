# 명세

## 메타데이터와 출처
- 작업 ID: score-scan-umaoka-rebuild
- 기준본 리비전(Canonical revision): 2
- 언어(Language): ko
- 영문 기준본(Canonical): spec.md
- 원본 의도 리비전(Source intent revision): 1
- 출처: intent.md 리비전 2

## 요약
점수 스캔 기능을 완전한 우마·오카 계산 엔진 기반으로 재구축하고, 운영 서비스 라우트(`/scan_score`)와 다기종 데이터 수집용 개발자 테스트 Lab 라우트(`/test_scan`)를 분리하며, 구형 수동 사진 촬영 버튼 및 입력을 제거하고, 실시간 스캔에서 결과 공유까지 이어지는 매끄러운 4단계 유저 워크플로우를 확립합니다.

## 기능 요구사항
- REQ-001 must: 점수 스캔 페이지 컴포넌트(`ScorePhotoInputPage.tsx`)를 완전한 우마·오카 상태 관리 파이프라인(`calculateTieAwards`, `tieHandlingMode`, `chomboCounts`, `UmaOkaTable`, 플레이어 풀 관리, 시작/반환 점수 제어)을 기반으로 재구축하여, 인식된 동·남·서·북 4개 점수가 순위 점수에 즉시 반영되도록 구현해야 합니다.
- REQ-002 must: `App.tsx`, `Sidebar.tsx`, `MainPage.tsx`, `Header.tsx`의 URL 라우팅 및 내비게이션을 개편해야 합니다:
  - 일반 사용자를 위한 프로덕션 서비스 라우트 `/scan_score` 제공.
  - 개발자 및 현장 테스터를 위한 테스트 Lab 라우트 `/test_scan` 제공.
  - 기존 주소인 `/set_score_photo` 접속 시 `/scan_score`로의 안전한 자동 리다이렉트 제공.
  - `translations.ts`의 한국어, 영어, 일본어 다국어 메뉴명 및 설명 갱신.
- REQ-003 must: `PhotoUploadPanel.tsx`에 전용 prop을 제공하여 서비스 모드와 테스트 모드를 깔끔하게 분리해야 합니다:
  - `isTestMode=false` (서비스 페이지 `/scan_score`)인 경우: PC 전송 설정 버튼, 연결 상태, 펼침 서랍을 화면에 전혀 노출하지 않음.
  - `isTestMode=true` (테스트 페이지 `/test_scan`)인 경우: PC 전송 브리지(`mobile-drop`) 및 다기종 선택기(`rex3`, `jpex`, `jpcolor`)를 완벽하게 제공.
- REQ-004 must: `PhotoUploadPanel.tsx`에서 수동 카메라 촬영 input과 버튼(`📷 점수판 촬영하기`)을 완전히 제거하고, 실시간 비디오 스트림 스캔을 메인 기능으로 유지하며 수동 숫자 입력을 지연 없는 Fallback으로 보존해야 합니다.
- REQ-005 must: 단순 원점수 기록과 토너먼트 우마·오카 계산 사이의 유저 워크플로우를 통일하여, 좌석 회전(동가 이동), 점수 합의 확인, 즉각적인 압축 URL 생성(`#d=`)이 단일 화면에서 끊김 없이 동작하도록 보장해야 합니다.

## 비기능 요구사항
- 서비스 페이지에서는 외부 서버 전송이 전혀 없는 순수 브라우저 인메모리 처리 원칙 준수.
- 모바일 뷰포트에서 빠른 응답성 유지 (<350ms 프레임 인식 피드백).
- 기존 `#d=` 및 구형 `#data=` 공유 URL 포맷과의 100% 하위 호환성 유지.

## 사용자 경험과 흐름
1. 대국 준비: 사용자 및 토너먼트 룰 확인 (우마 10-30/10-20, 오카 온/오프, 동점 처리 균등/자리순).
2. 스캔 시작: 반장/국 종료 시 동가 플레이어가 스마트폰으로 전면 점수판을 비추고 "실시간 스캔 시작" 탭.
3. Fast-Lock: 3-dot 합의 엔진이 기준 합계(100,000점)를 만족하는 4개 유효 점수를 0.2~0.3초 내 감지하여 셔터 플래시와 함께 자동 캡처.
4. 확인 및 기록: 원점수가 우마·오카 순위 점수로 즉시 환산됨. 동가가 1번 플레이어가 아니면 버튼 한 번으로 좌석 회전. "기록 추가" 클릭 시 대탁 장부에 누적되고 공유 링크 자동 갱신.

## 아키텍처와 인터페이스
- 라우팅: `App.tsx`의 `react-router-dom` `Routes`에 `/scan_score`, `/test_scan`, 그리고 `/set_score_photo` 리다이렉트 정의.
- 컴포넌트: `UmaOkaTable`, `PlayerTotals`, `PlayerManagementAndScores`가 통합된 `ScorePhotoInputPage.tsx`.
- 스캔 패널: `isTestMode?: boolean` 속성이 추가되고 수동 촬영 요소가 제거된 `PhotoUploadPanel.tsx`.
- 다국어: `translations.ts`에 스캔 서비스 및 테스트 관련 신규 번역 키 추가.

## 데이터와 마이그레이션
- 공유 상태: `shareState.ts`의 기존 `ShareState` 스키마와 100% 호환.
- 라우트 마이그레이션: `/set_score_photo` 접속 시 기존 해시 파라미터(`#d=...`)를 유지한 채 `/scan_score`로 이동.

## 실패 모드와 경계 사례
- 카메라 권한 거부 또는 미지원 브라우저: 명확한 안내 문구와 함께 직접 숫자 입력 모드로 자연스럽게 전환.
- 점수판 합계 불일치: HUD에 불일치 상태를 표시하고 기준 합계가 맞을 때까지 기록을 차단하여 오입력 방지.
- 테스트 모드에서 `mobile-drop` 서버 미연결: 스캐너 동작을 멈추지 않고 연결 대기 상태만 우아하게 표시.

## 보안, 개인정보, 권한
- 서비스 페이지는 영상이나 이미지를 어떠한 외부 서버로도 전송하지 않음.
- 테스트 페이지는 6자리 PIN으로 보호되는 로컬 `mobile-drop` 터널에만 통신.

## 관측성과 운영
- 합의 진행 상황(0/3, 1/3, 2/3, 3/3)을 화면에 명확히 표시.
- 테스트 페이지에서 업로드 진행률(%) 및 연결 상태를 실시간 표시.

## 테스트 전략
1. `App.test.tsx` 및 `ScorePhotoInputPage.test.tsx`에서 라우트 리다이렉트 및 우마·오카 점수판 렌더링 검증.
2. `PhotoUploadPanel.test.tsx`에서 촬영 버튼 미존재 및 `isTestMode`에 따른 PC 전송 제어판 조건부 렌더링 검증.
3. `ScorePhotoInputPage.tsx`에서 스캔된 점수가 우마·오카 순위 계산 및 총점에 정확히 반영되는지 통합 검증.
4. `npm test -- --watchAll=false` 및 `npm run build`를 통한 전체 회귀 테스트 통과.

## 수용 기준
- AC-001: `/scan_score` 접속 시 완전한 우마·오카 점수 테이블, 플레이어 관리, 실시간 스캔 UI가 렌더링되며 PC 전송 제어판은 노출되지 않아야 함.
- AC-002: `/test_scan` 접속 시 PC 전송 설정 패널 및 기종 선택기(`rex3`, `jpex`, `jpcolor`)가 포함된 스캔 UI가 렌더링되어야 함.
- AC-003: `/set_score_photo` 접속 시 `/scan_score`로 자동 리다이렉트되어야 함.
- AC-004: `PhotoUploadPanel.tsx`에서 수동 사진 촬영 버튼(`📷 점수판 촬영하기`) 및 `<input type="file" capture="environment">` 요소가 완전히 제거되어야 함.
- AC-005: 모든 단위 및 통합 테스트 스위트가 통과하고 프로덕션 빌드가 에러 없이 완료되어야 함.

## 추적성
우마·오카 리빌딩 결과 → REQ-001 → AC-001. 라우트 마이그레이션 결과 → REQ-002 → AC-002, AC-003. 서비스 및 테스트 분리 결과 → REQ-003 → AC-001, AC-002. 사진 촬영 버튼 제거 결과 → REQ-004 → AC-004. 종합 워크플로우 통일 및 검증 → REQ-005 → AC-001, AC-005.

## 미결정 사항
차단성 이슈 없음. 서비스 라우트는 `/scan_score`, 테스트 Lab 라우트는 `/test_scan`으로 확정.
