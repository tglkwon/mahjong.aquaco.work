# 명세

## 메타데이터와 출처
- 작업 ID: mobile-camera-capture
- 기준본 리비전(Canonical revision): 1
- 언어(Language): ko
- 영문 기준본(Canonical): spec.md
- 출처: intent.md 리비전 1

## 요약
`PhotoUploadPanel.tsx` 카메라 연동, `scoreMedia.ts` 회전 지원, `package.json` 터널 스크립트 명세.

## 기능 요구사항
- REQ-001: `capture="environment"` 속성을 가진 숨김 input과 데스크톱 폴백을 지원하는 전용 카메라 버튼 제공.
- REQ-002: 프레임이 없을 때 `PhotoUploadPanel.tsx`에 촬영 전 뷰파인더 가이드 카드 렌더링.
- REQ-003: `scoreMedia.ts`에 `rotateFrame` 구현 및 자동 재인식을 지원하는 90도 회전 버튼 추가.
- REQ-004: 모바일 테스트를 위해 `untun` 터널을 실행하는 `test:mobile` 스크립트 추가.

## 비기능 요구사항
- 서버 전송 0건의 클라이언트 단독 실행.
- 200ms 이내의 즉각적인 캔버스 회전 처리.

## 사용자 경험과 흐름
1. 사용자가 `/set_score_photo`에 진입.
2. 뷰파인더 가이드 카드가 가로 촬영 안내.
3. 카메라 버튼을 눌러 점수판 촬영.
4. 사진 방향이 맞지 않으면 회전 버튼 클릭.
5. 점수 확인 후 최종 확정.

## 아키텍처와 인터페이스
`PhotoUploadPanel.tsx`가 `scoreMedia.ts`를 사용해 추출 및 회전을 수행하고 `recognizeScoreboard`에 전달.

## 데이터와 마이그레이션
영구 스키마 변경 없음.

## 실패 모드와 경계 사례
미지원 코덱이나 회전 실패 시 수동 점수 입력으로 폴백.

## 보안, 개인정보, 권한
모든 사진은 브라우저 메모리에만 유지.

## 관측성과 운영
`npm run test:mobile` 실행 시 콘솔에 임시 URL 출력.

## 테스트 전략
`rotateFrame` 및 `PhotoUploadPanel.tsx` UI 인터랙션에 대한 Jest 단위 테스트.

## 수용 기준
- AC-001: 카메라 버튼이 `capture="environment"`가 설정된 숨김 파일 input을 트리거함.
- AC-002: 프레임 배열이 비어있을 때 가이드 카드가 렌더링됨.
- AC-003: `rotateFrame` 함수가 이미지를 90도 회전하고 점수판 인식을 재실행함.
- AC-004: `npm run test:mobile` 실행 시 3000번 포트로 `untun` 터널이 구동됨.

## 추적성
REQ-001, REQ-002, REQ-003, REQ-004 요구사항을 AC-001, AC-002, AC-003, AC-004 수용 기준과 연결.

## 미결정 사항
없음.
