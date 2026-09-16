# 증거

## 변경 요약
- 작업 ID: mobile-camera-capture
- 기준본 리비전(Canonical revision): 1
- 언어(Language): ko
- 영문 기준본(Canonical): evidence.md

전용 카메라 촬영, 시각적 뷰파인더 가이드, 90도 프레임 회전 및 자동 재인식, Cloudflare 터널 스크립트 구현 완료.

## 요구사항 충족 현황
- REQ-001 (AC-001, TASK-001): `PhotoUploadPanel.test.tsx`에서 카메라 버튼 및 숨김 input 트리거 검증 완료.
- REQ-002 (AC-002, TASK-002): `PhotoUploadPanel.test.tsx`에서 가이드 카드 렌더링 검증 완료.
- REQ-003 (AC-003, TASK-003): `scoreMedia.test.ts` 및 `PhotoUploadPanel.test.tsx`에서 90도 회전 및 재인식 검증 완료.
- REQ-004 (AC-004, TASK-004): `package.json`에서 `untun`을 실행하는 `test:mobile` 스크립트 검증 완료.

## 테스트와 품질 결과
- Jest: 9개 테스트 스위트 통과, 37개 테스트 통과.
- TypeScript: `npx tsc --noEmit` 0개 에러로 통과.
- Build: `npm run build` 최적화된 프로덕션 번들 생성 성공.

## E2E 증거
카메라 버튼이 데스크톱에서는 파일 선택기, 모바일에서는 네이티브 카메라를 구동함. 회전 버튼이 캔버스 크기를 정상 전환하고 점수 후보를 재계산함.

## 리뷰 발견 사항과 해결
작업 진행 중 직접 입력 버튼에 `disabled` 속성을 제거하여 취소 불가 문제를 해결함.

## 배포 또는 인계
`npm start` 및 `npm run test:mobile`로 로컬 및 실기기 테스트 준비 완료.

## 릴리스 준비 상태
- 전체 상태(Overall status): READY

## 잔여 위험
극단적인 원근 왜곡이 있는 촬영 각도는 수동 점수 입력이 필요함.
