# 의도

## 메타데이터
- 작업 ID: scan-umaoka-input-unification
- 기준본 리비전(Canonical revision): 2
- 언어(Language): ko
- 영문 기준본(Canonical): intent.md
- 상태(Status): draft
- 위험도(Risk): standard
- 생성일: 2026-09-16
- 수정일: 2026-09-16
- 발주자: user conversation
- 담당자: root implementation agent

## 최초 요청
```text
1. UI 개선 작업을 진행해보자. 우마 오카 실시간 스캔 페이지가 
실시간 스캔의 현재 점수 인식해서 점수 입력되는 부분(수동 수정 가능)과
우마 오카의 점수 입력 부분이 역할이 겹쳐서 하나오 합치려고 해. 기능적으로 양쪽 모두 반영하고 싶고, ui적으로는 우마 오카의 점수 입력(점수 기록) 부분의 ui를 기준으로 하려고 해. 
2. 총합 점수를 지금은 디폴트로 100000점으로 되어 있는데, 이걸 '시작 점수'로 계산된 목표 합계 값을 반영할 수 있게 하고 싶어. 시작 점수(25000), 목표 합계 = 총합 점수(100000)을 기본값으로 두되, 수정하면 기록할 때 맞춰야 하는 값이 바뀌게 해줘.
```

영어 종합:
1. 점수 입력 인터페이스 단일화: 현재 실시간 점수 스캔 페이지에서 `PhotoUploadPanel.tsx`의 검토 입력 폼과 `UmaOkaTable.tsx`의 활성 라운드 입력 행이 중복되어 역할을 수행하고 있습니다. `PhotoUploadPanel.tsx`의 중복 양식을 제거하고 `UmaOkaTable.tsx`를 점수 수동 입력 및 미세 조정의 단일 UI 표준으로 삼아, 인식 완료된 점수를 활성 편집 행으로 즉시 주입합니다.
2. 목표 합계 점수를 `startingScore * 4`에 동적으로 연동: 고정된 `100000` 점수 합계 대신 `startingScore * 4`(기본값 `25000 * 4 = 100000`)로 동적 계산하여, 시작 점수가 변경되면 스캔 합의 검증과 기록 추가 조건이 즉시 동기화되도록 합니다.

## 문제와 근거
1. `PhotoUploadPanel.tsx`에 4개 좌석 입력 필드, 단위 선택, 확정 버튼을 갖춘 수동 검토 `<fieldset>`이 표시되고, 바로 아래 `UmaOkaTable.tsx`에도 `±1000` 증감 버튼과 플레이어 선택기를 갖춘 동·남·서·북 점수 입력 필드가 중복 표시됩니다.
2. 사용자가 같은 화면에서 점수를 확인하고 수정하는 영역이 두 곳으로 나뉘어 있고, 확정 버튼도 두 개여서 워크플로우 혼선이 발생합니다.
3. 스캐너가 설정된 시작 점수와 관계없이 정적 `100000` 점수를 요구하여, 비표준 룰(`30000` 점 시작, `120000` 점 목표 등)에서 점수 검증이 불일치합니다.

## 원하는 결과
1. 3-dot 합의 달성 시 `PhotoUploadPanel.tsx`에서 `onScoresRecognized` 콜백을 통해 `UmaOkaTable.tsx`로 인식 점수를 직접 주입합니다.
2. `PhotoUploadPanel.tsx` 내 중복된 수동 입력 `<fieldset>` 양식 및 2차 확정 버튼을 제거합니다.
3. `UmaOkaTable.tsx`를 점수 확인, 직접 타이핑 수정, `±1000` 증감 버튼 조정, 좌석 배정 이동을 위한 단일 상호작용 표로 유지합니다.
4. 필요한 총합 점수를 `startingScore * 4`로 동적 계산하여 스캐너 합의 판독 게이트 및 `ControlPanel.tsx`의 기록 추가 게이트에 연동합니다.

## 범위
- `PhotoUploadPanel.tsx` 및 `PhotoUploadPanel.test.tsx`
- `ScorePhotoInputPage.tsx` 및 `ScorePhotoInputPage.test.tsx`
- `ControlPanel.tsx`
- `App.test.tsx`
- `docs/ai/scan-umaoka-input-unification/` 경로의 SDLC 아티팩트

## 제외 범위
- OCR 핵심 판독 알고리즘 변경.
- 서버 측 로직 변경(순수 클라이언트 인메모리 앱 유지).

## 제약과 정책
- 브라우저 클라이언트 인메모리 단독 실행.
- 기존 `#d=` 공유 링크의 100% 하위 호환성 유지.
- Windows pwsh 단일 셸 실행 원칙.

## 수용 신호
1. 카메라 판독 합의가 중간 폼 없이 `UmaOkaTable.tsx`로 직접 4개 점수를 주입합니다.
2. `PhotoUploadPanel.tsx`는 슬롯 뷰파인더, 합의 게이지, 라이브 HUD, PC 전송 패널만 포함합니다.
3. `startingScore`를 변경하면 스캐너와 기록 추가 제어 전반에서 목표 점수 합계가 동적으로 반영됩니다.
4. 모든 단위 및 통합 테스트 스위트가 결함 없이 통과합니다.

## 가정과 미해결 질문
- 기본 `startingScore`는 `25000`이며 기본 목표 합계는 `100000`입니다.
- `/scan_score`와 `/scan_score_test` 양쪽 모두 단일화된 테이블 UI를 사용합니다.

## 결정 사항
- `UmaOkaTable.tsx`를 점수 입력 및 검토를 위한 단일 UI 표준으로 결정합니다.
- `PhotoUploadPanel.tsx`는 순수 카메라 HUD 센서 역할을 하며 `onScoresRecognized`를 발생시키도록 결정합니다.
