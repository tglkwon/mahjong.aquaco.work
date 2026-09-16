# 구현 계획

- 작업 ID: rexx3-letterbox-ocr-fix
- 기준본 리비전(Canonical revision): 2
- 언어(Language): ko
- 영문 기준본(Canonical): plan.md
## 맥락과 목표 결과
스마트폰 손떨림 환경에서도 무관용 제로 리셋 없이 지체 없이 Fast-Lock을 체결할 수 있도록 `scoreStability.ts`에 슬라이딩 윈도우 빈도 합의를 구현하고, `scoreCamera.ts`의 프레임 분석 쓰로틀을 100ms로 단축하며, 9 vs 8 분리, 1/5/7 종횡비 보호, X축 T자형 레이아웃 분할 및 천장 조명 Glare(빛 반사) 내성을 갖춘 적응형 적색 임계값으로 `scoreRecognition.ts`를 고도화합니다.

## 저장소 상태와 제약
슬롯 클리핑 카메라 뷰포트(`h-52`), 중앙 50% ROI 추출, AMOS REXX 3 4인 HUD 및 클라이언트 인메모리 아키텍처를 온전히 유지합니다.

## 변경 지도
1. `scoreStability.ts`: 엄격한 연속 일치 트래커를 `1500ms` 윈도우 동안 유효 관측값을 버퍼링하는 슬라이딩 윈도우 빈도 합의로 대체.
2. `scoreStability.test.ts`: 중간에 삽입된 비유효 프레임이 합의 카운트를 리셋하지 않으며, 2회 유효 발생 시 `ready: true`가 발동함을 검증.
3. `scoreCamera.ts`: 분석 쓰로틀 간격을 `200ms`에서 `100ms`로 단축하고 윈도우 합의 파라미터 연동.
4. `scoreRecognition.ts`: 9 vs 8 분리를 위해 `lower-left` 프로브를 `cy=0.64, dy=0.05, threshold=0.38`로 조정; 숫자 `1` 종횡비를 `0.33`으로 엄격화; T자형 레이아웃을 X축(`runsByX`)으로 정렬; 빛 반사 프레임용 적응형 적색 임계값 폴백(`r > 160 && r > g * 1.4 && r > b * 1.2`) 추가.
5. `scoreRecognition.test.ts`: 9 vs 8 판별, 틸트 레이아웃 및 빛 반사 내성 테스트 픽스처 추가.

## 의존성 그래프와 병렬화
TASK-005(안정성 트래커)와 TASK-007(OCR 기하 및 빛 반사)은 독립적으로 개발 가능하며, TASK-006(카메라 쓰로틀)이 이를 연결하고, TASK-008이 자동화 게이트 전반을 종합 검증합니다.

## 작업
- TASK-001 — Status: done — REQ-003, REQ-004 / AC-003. 담당: root. 작업 대상: `scoreRecognition.ts` 및 테스트. 북가 `0097`(9,700점) 테스트 추가, 프로브 좌표 조정 및 통과 확인. 증적: Jest 단위 테스트.
- TASK-002 — Status: done — REQ-002 / AC-002. 담당: root. 작업 대상: `scoreCamera.ts`. `drawImage` 시 중앙 50% 수직 ROI 슬라이스 적용으로 픽셀 부하 약 50% 절감. 증적: 카메라 프레임 추출 테스트.
- TASK-003 — Status: done — REQ-001 / AC-001. 담당: root. 작업 대상: `PhotoUploadPanel.tsx`. 비디오 컨테이너 높이를 `h-52 sm:h-60 overflow-hidden`으로 제한하고 `<video>`에 `w-full h-full object-cover object-center` 적용. 증적: 컴포넌트 테스트 및 레이아웃 검증.
- TASK-004 — Status: done — AC-004. 담당: root. 작업 대상: 종합 검증 및 SDLC 아티팩트. 10개 테스트 스위트, TypeScript 컴파일러, 프로덕션 빌드 실행 및 `artifact-sync.json` 갱신. 증적: 테스트 로그 및 검증 스크립트.
- TASK-005 — Status: done — REQ-005 / AC-005. 담당: root. 작업 대상: `scoreStability.ts` 및 `scoreStability.test.ts`. 슬라이딩 윈도우 빈도 합의 트래커 구현 및 TDD를 통한 간헐적 노이즈 내성 검증. 증적: Jest 단위 테스트.
- TASK-006 — Status: done — REQ-006 / AC-006. 담당: root. 작업 대상: `scoreCamera.ts`. 분석 쓰로틀 간격을 200ms에서 100ms로 단축. 증적: Jest 타이머 테스트.
- TASK-007 — Status: done — REQ-007 / AC-007. 담당: root. 작업 대상: `scoreRecognition.ts` 및 `scoreRecognition.test.ts`. 9 vs 8 프로브 조정, 0.33 숫자 1 종횡비, X축 레이아웃 분할 및 적응형 적색 임계값 폴백 구현. 증적: Jest 단위 테스트 및 픽셀 테스트.
- TASK-008 — Status: done — AC-004, AC-007. 담당: root. 작업 대상: 종합 검증 및 비디오 평가. `PXL_20260914_121532649.mp4` 및 `PXL_20260914_121752679.mp4` 전체 비디오 스트림 평가 실행, 10개 Jest 스위트 실행, 프로덕션 빌드 및 아티팩트 동기화. 증적: Python 스크립트 로그 및 검증 스크립트.


## TDD 순서
1. Red: `scoreStability.test.ts`에 비유효 프레임이 중간에 끼어들어도 슬라이딩 윈도우 합의가 동작하는 실패 테스트 작성.
2. Green: `scoreStability.ts`에 슬라이딩 윈도우 구현 및 테스트 통과.
3. Red: `scoreRecognition.test.ts`에 9 vs 8 구분 및 틸트된 X축 레이아웃 실패 테스트 작성.
4. Green: `scoreRecognition.ts`에 프로브 조정, X축 분할 및 적응형 임계값 구현 및 테스트 통과.
5. `scoreCamera.ts`에 100ms 쓰로틀 연동.
6. 전체 종합 검증 실행.

## E2E 시나리오
손떨림 및 천장 조명의 강한 Glare(빛 반사)가 존재하는 실기기 촬영 영상에서 0.2~0.4 seconds 내에 기준 합계 100,000점으로 Fast-Lock이 정상 체결됩니다.

## 품질 게이트
Jest 테스트 스위트(10개 스위트), TypeScript 컴파일, 프로덕션 빌드(`npm run build`), Python 전체 비디오 평가, SDLC 아티팩트 검증 스크립트.

## 위험, 마이그레이션, 롤백
슬라이딩 윈도우 TTL이 너무 길면 이전 점수가 남을 수 있으나, `1500ms`는 손떨림 흡수와 빠른 소멸 사이의 명확한 균형을 제공합니다. 모든 변경은 순수 클라이언트 측이며 하위 호환됩니다.

## 완료 증거
AC-001부터 AC-007까지의 모든 완료 판정 기준이 통과 테스트 증적으로 검증됩니다.

## 진행 기록
2026-09-14: 개정 1 구현 및 검증 완료.
2026-09-15: 슬라이딩 윈도우 빈도 합의 및 빛 반사 내성 OCR 강화를 위한 개정 2 착수.
