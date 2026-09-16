# 구현 계획

## 맥락과 목표 결과
- 작업 ID: mobile-camera-capture
- 기준본 리비전(Canonical revision): 1
- 언어(Language): ko
- 영문 기준본(Canonical): plan.md

`PhotoUploadPanel.tsx` 모바일 카메라 UI 개편, `scoreMedia.ts` 90도 회전 유틸리티, `package.json` 터널 명령어 제공.

## 저장소 상태와 제약
React 19 / CRA / TypeScript 4.9. 서버 전송 0건 클라이언트 아키텍처 유지.

## 변경 지도
- `scoreMedia.ts`: `rotateFrame` 추가
- `PhotoUploadPanel.tsx`: 가이드 카드, 카메라 버튼, 회전 버튼 추가
- `package.json`: `untun` 실행하는 `test:mobile` 추가
- `docs/mobile-score-recognition.md`: 사용법 문서화

## 의존성 그래프와 병렬화
TASK-001, TASK-002, TASK-003, TASK-004 순차 실행.

## 작업
- TASK-001 (REQ-001, AC-001) Status: done: `PhotoUploadPanel.tsx`에 데스크톱 폴백 지원 카메라 버튼 구현.
- TASK-002 (REQ-002, AC-002) Status: done: `PhotoUploadPanel.tsx`에 촬영 전 시각적 가이드 카드 추가.
- TASK-003 (REQ-003, AC-003) Status: done: `scoreMedia.ts`에 `rotateFrame` 구현 및 `PhotoUploadPanel.tsx`에 회전 버튼 추가.
- TASK-004 (REQ-004, AC-004) Status: done: `package.json`에 `test:mobile` 추가 및 문서 갱신.

## TDD 순서
단위 테스트에서 `rotateFrame` 검증, `PhotoUploadPanel.tsx` UI 검증, 타입 검사 및 빌드.

## E2E 시나리오
사진 촬영, 필요 시 90도 회전, 점수 후보 확인, 게임에 기록 추가.

## 품질 게이트
37개 Jest 테스트 전체 통과, TypeScript 컴파일 통과, `npm run build` 성공.

## 위험, 마이그레이션, 롤백
필요 시 `PhotoUploadPanel.tsx` 및 `scoreMedia.ts` 변경 사항 롤백. 저장 데이터 영향 없음.

## 완료 증거
모든 단위 테스트, tsc, 프로덕션 빌드 무결점 통과.

## 진행 기록
- 2026-09-11: `scoreMedia.ts`에 `rotateFrame` 구현.
- 2026-09-11: `PhotoUploadPanel.tsx` 카메라 버튼, 가이드 카드, 회전 버튼 개편.
- 2026-09-11: `package.json`에 `test:mobile` 추가 및 문서 갱신.
