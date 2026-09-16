# 의도

## 메타데이터
- 작업 ID: mobile-camera-capture
- 기준본 리비전(Canonical revision): 1
- 언어(Language): ko
- 영문 기준본(Canonical): intent.md
- 상태(Status): done
- 위험도(Risk): standard
- 생성일: 2026-09-11
- 수정일: 2026-09-11

## 최초 요청
데스크톱 파일 폴백을 유지하면서 모바일 전용 카메라 촬영 UI를 구현하고, 촬영 전 뷰파인더 안내 가이드와 90도 수동 회전 및 자동 재인식을 추가하며, 네트워크가 격리된 환경에서도 스마트폰 실기기 검증이 가능하도록 Cloudflare HTTPS 터널을 구성한다.

## 문제와 근거
기존 점수판 인식 기능은 일반 파일 선택에 의존하여 모바일에서 즉시 카메라를 켜는 명시적 액션이 부족했다. 회전된 사진은 인식 실패를 유발했다. 또한 PC `localhost`는 분리된 네트워크의 모바일 기기에서 접근할 수 없었다.

## 원하는 결과
`environment` 설정을 통한 단일 액션 카메라 촬영, 시각적 안내 가이드 카드, `scoreMedia.ts` 기반 90도 캔버스 회전 복구, `untun` 도구 기반 `npm run test:mobile` HTTPS 터널 및 `test:mobile` 환경 확보.

## 범위
`PhotoUploadPanel.tsx`, `scoreMedia.ts`, `package.json`, 문서.

## 제외 범위
WebRTC 인앱 스트림 오버레이, Expo 마이그레이션, 클라우드 미디어 저장.

## 제약과 정책
서버 업로드 없는 브라우저 전용 처리. 기존 게임 코덱 유지.

## 수용 신호
카메라 전용 버튼 렌더링 및 환경 캡처 트리거 확인, 촬영 전 뷰파인더 가이드 표시, 90도 회전 시 캔버스 변환 및 재인식 수행 확인, `test:mobile` 스크립트 추가 확인, 37개 테스트 및 프로덕션 빌드 통과.

## 가정과 미해결 질문
기본 카메라는 후면(`environment`)이며, 데스크톱 브라우저는 파일 선택으로 폴백된다.

## 결정 사항
대안 A(촬영 전 가이드 카드) 및 모바일 테스트용 Cloudflare Tunnel(`untun`) 채택.
