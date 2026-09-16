from pathlib import Path

target = Path('docs/ai/mobile-camera-capture')
target.mkdir(parents=True, exist_ok=True)

intent_en = '''# Intent

## Metadata
- Work ID: mobile-camera-capture
- Artifact revision: 1
- Language: en
- Korean mirror: intent.ko.md
- Status: done
- Risk: standard
- Created: 2026-09-11
- Updated: 2026-09-11

## Originating request
Implement dedicated mobile camera capture UI with desktop fallback, provide pre-capture viewfinder guide card, support 90-degree manual rotation with auto re-recognition, and configure Cloudflare HTTPS tunnel for mobile testing.

## Problem and evidence
Scoreboard recognition lacked a single-action camera button, causing extra mobile OS prompts. Rotated photos caused recognition failure. PC `localhost` is inaccessible from mobile devices on separate network segments.

## Desired outcomes
Single-action camera capture using `environment`, visual guide card, 90-degree canvas rotation recovery via `scoreMedia.ts`, and `npm run test:mobile` HTTPS tunnel using `untun` for `test:mobile` device testing.

## Scope
`PhotoUploadPanel.tsx`, `scoreMedia.ts`, `package.json`, and documentation.

## Non-goals
In-app WebRTC stream overlay, Expo migration, cloud media storage.

## Constraints and policies
Browser-only processing with zero server uploads. Maintain existing game codecs.

## Acceptance signals
Dedicated camera button triggers environment capture; viewfinder guide card displays before capture; 90-degree rotation transforms canvas and re-runs recognition; `test:mobile` script is available; all 37 tests and production build pass.

## Assumptions and open questions
Default camera is back-facing (`environment`); desktop browsers fall back to file chooser.

## Decisions
Adopt Alternative A (pre-capture guide card) and Cloudflare Tunnel (`untun`) for mobile testing.
'''

intent_ko = '''# 의도

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
'''

spec_en = '''# Specification

## Metadata and source
- Work ID: mobile-camera-capture
- Artifact revision: 1
- Language: en
- Korean mirror: spec.ko.md
- Source: intent.md revision 1

## Summary
Specification for mobile camera integration in `PhotoUploadPanel.tsx`, rotation support in `scoreMedia.ts`, and tunnel scripting in `package.json`.

## Functional requirements
- REQ-001: Provide a dedicated camera button triggering hidden input with `capture=\"environment\"` and desktop file fallback.
- REQ-002: Display a pre-capture viewfinder guide card in `PhotoUploadPanel.tsx` when no frames are loaded.
- REQ-003: Implement `rotateFrame` in `scoreMedia.ts` and add a 90-degree rotate button with auto re-recognition.
- REQ-004: Add `test:mobile` script running `untun` tunnel for mobile testing.

## Non-functional requirements
- Client-side execution with 0 server uploads.
- Instant canvas rotation under 200ms.

## User experience and flows
1. User enters `/set_score_photo`.
2. Viewfinder guide card advises horizontal framing.
3. User taps camera button to capture photo.
4. User taps rotate button if photo is misaligned.
5. Scores are verified and confirmed.

## Architecture and interfaces
`PhotoUploadPanel.tsx` uses `scoreMedia.ts` for extraction and rotation, feeding `recognizeScoreboard`.

## Data and migrations
No persistent schema changes.

## Failure modes and edge cases
Unsupported codecs or invalid rotations fall back to manual score entry.

## Security, privacy, and permissions
All photos stay in-browser memory.

## Observability and operations
`npm run test:mobile` displays ephemeral URL in console.

## Test strategy
Jest unit tests for `rotateFrame` and `PhotoUploadPanel.tsx` UI interactions.

## Acceptance criteria
- AC-001: Camera button triggers hidden file input with `capture=\"environment\"`.
- AC-002: Guide card renders when frames array is empty.
- AC-003: `rotateFrame` transforms image 90 degrees and re-runs scoreboard recognition.
- AC-004: Running `npm run test:mobile` launches `untun` tunnel to port 3000.

## Traceability
Traces REQ-001, REQ-002, REQ-003, REQ-004 to AC-001, AC-002, AC-003, AC-004.

## Open decisions
None.
'''

spec_ko = '''# 명세

## 메타데이터와 출처
- 작업 ID: mobile-camera-capture
- 기준본 리비전(Canonical revision): 1
- 언어(Language): ko
- 영문 기준본(Canonical): spec.md
- 출처: intent.md 리비전 1

## 요약
`PhotoUploadPanel.tsx` 카메라 연동, `scoreMedia.ts` 회전 지원, `package.json` 터널 스크립트 명세.

## 기능 요구사항
- REQ-001: `capture=\"environment\"` 속성을 가진 숨김 input과 데스크톱 폴백을 지원하는 전용 카메라 버튼 제공.
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
- AC-001: 카메라 버튼이 `capture=\"environment\"`가 설정된 숨김 파일 input을 트리거함.
- AC-002: 프레임 배열이 비어있을 때 가이드 카드가 렌더링됨.
- AC-003: `rotateFrame` 함수가 이미지를 90도 회전하고 점수판 인식을 재실행함.
- AC-004: `npm run test:mobile` 실행 시 3000번 포트로 `untun` 터널이 구동됨.

## 추적성
REQ-001, REQ-002, REQ-003, REQ-004 요구사항을 AC-001, AC-002, AC-003, AC-004 수용 기준과 연결.

## 미결정 사항
없음.
'''

plan_en = '''# Implementation plan

## Context and target outcome
- Work ID: mobile-camera-capture
- Artifact revision: 1
- Language: en
- Korean mirror: plan.ko.md

Deliver dedicated mobile camera UI in `PhotoUploadPanel.tsx`, 90-degree rotation utility in `scoreMedia.ts`, and tunnel command in `package.json`.

## Repository state and constraints
React 19 / CRA / TypeScript 4.9. Maintain zero-upload client-side architecture.

## Change map
- `scoreMedia.ts`: add `rotateFrame`
- `PhotoUploadPanel.tsx`: add guide card, camera button, and rotation button
- `package.json`: add `test:mobile` running `untun`
- `docs/mobile-score-recognition.md`: document usage

## Dependency graph and parallelization
TASK-001, TASK-002, TASK-003, and TASK-004 executed in order.

## Tasks
- TASK-001 (REQ-001, AC-001) Status: done: Implement camera button with desktop fallback in `PhotoUploadPanel.tsx`.
- TASK-002 (REQ-002, AC-002) Status: done: Add pre-capture visual guide card in `PhotoUploadPanel.tsx`.
- TASK-003 (REQ-003, AC-003) Status: done: Implement `rotateFrame` in `scoreMedia.ts` and UI button in `PhotoUploadPanel.tsx`.
- TASK-004 (REQ-004, AC-004) Status: done: Add `test:mobile` in `package.json` and update documentation.

## TDD sequence
Test `rotateFrame` in unit tests, test `PhotoUploadPanel.tsx` UI, run typecheck and build.

## End-to-end scenarios
Capture photo, rotate 90 degrees if needed, verify candidate scores, append to game.

## Quality gates
All 37 Jest tests pass, TypeScript compiles, `npm run build` succeeds.

## Risks, migration, and rollback
Revert changes in `PhotoUploadPanel.tsx` and `scoreMedia.ts` if needed. No persisted data impact.

## Completion proof
Pass all unit tests, tsc, and production build without errors.

## Progress log
- 2026-09-11: Implemented `rotateFrame` in `scoreMedia.ts`.
- 2026-09-11: Refactored `PhotoUploadPanel.tsx` with camera button, guide card, and rotation.
- 2026-09-11: Added `test:mobile` to `package.json` and updated docs.
'''

plan_ko = '''# 구현 계획

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
'''

evidence_en = '''# Evidence

## Change summary
- Work ID: mobile-camera-capture
- Artifact revision: 1
- Language: en
- Korean mirror: evidence.ko.md

Implemented dedicated camera capture, visual viewfinder guide, 90-degree frame rotation with auto re-recognition, and Cloudflare tunnel script.

## Requirement coverage
- REQ-001 (AC-001, TASK-001): Verified in `PhotoUploadPanel.test.tsx` by triggering camera button and hidden input.
- REQ-002 (AC-002, TASK-002): Verified in `PhotoUploadPanel.test.tsx` by checking guide card rendering.
- REQ-003 (AC-003, TASK-003): Verified in `scoreMedia.test.ts` and `PhotoUploadPanel.test.tsx` with 90-degree rotation and score re-read.
- REQ-004 (AC-004, TASK-004): Verified in `package.json` with `test:mobile` script running `untun`.

## Test and quality results
- Jest: 9 test suites passed, 37 tests passed.
- TypeScript: `npx tsc --noEmit` exited with code 0.
- Build: `npm run build` succeeded creating optimized production bundle.

## End-to-end evidence
Camera button invokes file chooser on desktop and native camera on mobile. Rotation swaps dimensions and re-evaluates scoreboard candidates accurately.

## Review findings and resolutions
Fixed in-flight cancellation behavior by removing `disabled` state from manual button during active jobs.

## Deployment or handoff
Ready for local testing with `npm start` and `npm run test:mobile`.

## Release readiness
- Overall status: READY

## Residual risks
Camera angles exceeding extreme perspective distortion require manual score entry.
'''

evidence_ko = '''# 증거

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
'''

files = {
    'intent.md': intent_en,
    'intent.ko.md': intent_ko,
    'spec.md': spec_en,
    'spec.ko.md': spec_ko,
    'plan.md': plan_en,
    'plan.ko.md': plan_ko,
    'evidence.md': evidence_en,
    'evidence.ko.md': evidence_ko,
}

for name, content in files.items():
    p = target / name
    p.write_text(content.strip() + '\n', encoding='utf-8')
    print('Wrote:', name)
