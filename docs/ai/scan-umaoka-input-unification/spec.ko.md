# 명세

## 메타데이터와 출처
- 작업 ID: scan-umaoka-input-unification
- 기준본 리비전(Canonical revision): 2
- 언어(Language): ko
- 영문 기준본(Canonical): spec.md
- 출처: intent.md 리비전 2

## 요약
실시간 점수 스캔의 점수 입력 UI를 우마·오카 점수 기록표 인터페이스로 통합하여 수동 입력 및 미세 조정의 단일 기준으로 삼고, `PhotoUploadPanel.tsx`의 중복 입력 양식과 확정 버튼을 제거하며, 목표 합계 점수를 `startingScore * 4`에 동적으로 연동합니다.

## 기능 요구사항
- REQ-001 must: `PhotoUploadPanel.tsx`의 실시간 인식 완료 점수를 전용 콜백을 통해 `UmaOkaTable.tsx`의 편집 중인 라운드로 직접 전달하여 주입하고, `PhotoUploadPanel.tsx` 내 중복된 `<fieldset>` 입력 양식 및 2차 확정 버튼을 제거해야 합니다.
- REQ-002 must: 목표 합계 점수를 `startingScore * 4`(기본값 `25000 * 4 = 100000`)에 동적으로 연동하여, 사용자가 `startingScore`를 변경하면 `PhotoUploadPanel.tsx`의 합의 검증 및 `ControlPanel.tsx`의 기록 추가 검증 게이트가 즉시 동기화되도록 구현해야 합니다.
- REQ-003 must: 직접 숫자 입력, `±1000` 증감 버튼, 플레이어 좌석 배정 순환, 우마/오카 순위 점수 자동 계산 등 `UmaOkaTable.tsx`의 모든 수동 편집 기능을 완전하게 보존해야 합니다.
- REQ-004 must: 게임 기록 확정 및 공유 URL 생성을 `ControlPanel.tsx`로 단일화하고, 동적으로 계산된 `startingScore * 4` 합계가 일치할 때만 기록 추가가 허용되도록 일원화해야 합니다.
- REQ-005 must: `PhotoUploadPanel.test.tsx`, `ScorePhotoInputPage.test.tsx`, `App.test.tsx` 전반의 테스트 커버리지를 100% 유지하고 프로덕션 빌드 결함이 발생하지 않도록 해야 합니다.

## 비기능 요구사항
- 운영 서비스 페이지의 순수 클라이언트 브라우저 인메모리 연산 유지.
- 스캔 합의 완료 후 50ms 미만 지연으로 우마·오카 테이블에 점수 반영.
- 기존 `#d=` 공유 URL 하위 호환성 100% 보장.

## 사용자 경험과 흐름
1. 사용자가 룰 설정에서 `startingScore`(25,000 또는 30,000) 설정 &rarr; 목표 합계가 100,000 또는 120,000으로 표시.
2. 사용자가 `PhotoUploadPanel.tsx`의 "실시간 스캔 시작"을 누르고 점수판을 촬영.
3. 3-dot 합의가 목표 합계와 일치하는 즉시, 4개 점수가 `UmaOkaTable.tsx`의 현재 편집 행(동, 남, 서, 북)으로 자동 입력.
4. 필요시 사용자가 `UmaOkaTable.tsx`의 인풋 또는 `±1000` 버튼으로 점수를 미세 수정.
5. `ControlPanel.tsx`의 "기록 추가 및 공유" 버튼을 눌러 게임을 확정하고 공유 링크 갱신.

## 아키텍처와 인터페이스
- `PhotoUploadPanel.tsx`: 슬롯 뷰파인더, 합의 추적, 라이브 HUD, 테스트 Lab PC 브리지에 집중. `onScoresRecognized?: (scores: { east: string; south: string; west: string; north: string }) => void` 콜백 전달 및 반응형 `targetTotalScore: number` 수신.
- `ScorePhotoInputPage.tsx`: `onScoresRecognized`를 수신하여 `games`의 `currentEditableGame` 점수를 업데이트.
- `UmaOkaTable.tsx`: 점수 입력 및 검토의 단일 통합 인터페이스로 활용.
- `ControlPanel.tsx`: `startingScore * 4`를 기준으로 기록 추가 검증.

## 데이터와 마이그레이션
데이터 스키마 마이그레이션 불필요. `ShareState`의 전후방 호환성 완전 유지.

## 실패 모드와 경계 사례
- 점수판 합계가 `startingScore * 4`와 불일치: 합의 게이지가 락온되지 않으며 HUD에 차이가 표시되고, `UmaOkaTable.tsx`에서 수동 입력 가능.
- 게임 도중 시작 점수 변경: 예상 합계가 즉시 재계산되며 기록 추가 게이트에 즉시 반영.

## 보안, 개인정보, 권한
클라이언트 단독 처리; 외부 서버로 이미지 또는 점수 유출 없음.

## 관측성과 운영
카메라 스트림 중 라이브 HUD 및 3-dot 합의 게이지를 통한 지속적인 시각 피드백 제공.

## 테스트 전략
1. `PhotoUploadPanel.test.tsx`에서 합의 완료 시 콜백 호출 및 중복 입력 폼 부재 검증.
2. `ScorePhotoInputPage.test.tsx`에서 스캔 점수가 `UmaOkaTable.tsx`로 즉시 주입되고 `startingScore` 변경 시 목표 합계가 갱신되는지 통합 검증.
3. `npm test -- --watchAll=false` 및 `npm run build`를 통한 전체 회귀 검증.

## 수용 기준
- AC-001: 스캔 판독 점수가 중복 폼 없이 `UmaOkaTable.tsx`의 동, 남, 서, 북 입력 필드에 직접 주입된다.
- AC-002: `PhotoUploadPanel.tsx`는 카메라 슬롯, 합의 게이지, 라이브 HUD, PC 브리지를 유지하고 중복 입력 양식 및 2차 확정 버튼은 제거된다.
- AC-003: `startingScore`를 변경하면 스캔 합의와 기록 추가 게이트 모두에서 목표 합계 점수(`startingScore * 4`)가 동적으로 연동된다.
- AC-004: `UmaOkaTable.tsx` 내 직접 입력, 증감 버튼, 좌석 배정 변경이 인식된 점수 위에서 정상 작동한다.
- AC-005: 모든 테스트 스위트가 100% 통과하고 프로덕션 빌드가 에러 없이 완료된다.

## 추적성
점수 입력 단일화 성과 &rarr; REQ-001, REQ-003 &rarr; AC-001, AC-002, AC-004. 동적 목표 점수 연동 성과 &rarr; REQ-002, REQ-004 &rarr; AC-003. 전체 검증 성과 &rarr; REQ-005 &rarr; AC-005.

## 미결정 사항
차단 사안 없음.
