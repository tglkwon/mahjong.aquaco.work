# 증거

- 작업 ID: scanner-negative-hud-feedback
- 기준본 리비전(Canonical revision): 3
- 언어(Language): ko
- 영문 기준본(Canonical): evidence.md

## 변경 요약
`src/utils/scoreRecognition.ts`의 `isMinusBar` Connected Component 필터링을 통한 들통(하코텐) 마이너스 부호 지원, `src/components/PhotoUploadPanel.tsx`의 불필요한 스크림을 제거한 개방형 뷰파인더 HUD 및 모서리 레티클, 그리고 3단계 시각 합의 피드백(White -> Blue -> Emerald 발광, 3-dot 게이지, 100ms 가속 화이트 플래시)을 구현했습니다.

## 요구사항 충족 현황
| 요구사항 | 수용 기준 | 작업 | 예정 증거 | 결과 |
| --- | --- | --- | --- | --- |
| REQ-001 | AC-001 | TASK-001 | Negative score CC extraction and 100k total validation unit tests | PASS |
| REQ-002 | AC-002 | TASK-002 | Open viewfinder corner reticle UI tests without scrims | PASS |
| REQ-003 | AC-003 | TASK-003 | 3-dot gauge, color transition, and 100ms flash UI tests | PASS |
| REQ-004 | AC-004 | TASK-004 | Full regression test suite, type check, and artifact chain validation | PASS |

## 테스트와 품질 결과
- Unit tests (`node node_modules/react-scripts/bin/react-scripts.js test --watchAll=false --runInBand --silent`): exit 0; 12 suites, 89 tests passed (including new negative score and HUD reticle/gauge/100ms flash tests).
- Type check (`npx tsc --noEmit`): exit 0; no type diagnostics.
- Build (`npm run build`): exit 0; production build bundle generated (`main.774a11e8.js`, 112.3 kB gzip).
- Chain validation (`pwsh.exe -NoProfile -ExecutionPolicy Bypass -File C:\Users\AquaCo\.codex\skills\ai-native-sdlc\scripts\validate-artifact-chain.ps1 -ArtifactDirectory c:\Users\AquaCo\project\mahjong.aquaco.work\docs\ai\scanner-negative-hud-feedback`): exit 0; structure and bilingual synchronization valid.

## E2E 증거
- 마이너스 점수 인식: Player 1이 `-020`(-2,000점)이고 2, 3, 4위가 `0350`, `0350`, `0320`인 상태에서 네 점수가 정상 순서로 인식되고 기준 합계 100,000점에 대해 `draft.valid = true`로 검증됨.
- 뷰파인더 HUD: 좁은 상하 마스킹 스크림을 제거하고 CSS `object-cover`의 자연스러운 화각을 온전히 활용하는 개방형 조준 프레임과 4 모서리 L자형 레티클 렌더링.
- 3단계 합의 피드백: `consensusCount` 0, 1, 2, 3 수치에 따라 조준선 발광 및 3-dot 게이지(`● ○ ○` -> `● ● ○` -> `● ● ●`)가 실시간 전이되며 100ms 가속 화이트 플래시 후 신속히 검토 화면 전환.
- 비파괴 호환성: 기존 AMOS REXX 3 양수 점수 픽스처 및 좌석 이동 기능이 100% 정상 작동.

## 리뷰 발견 사항과 해결
- 뷰파인더 시야 개방: 뷰파인더 높이(`h-52 sm:h-60`) 자체가 이미 세로 비디오를 크롭하고 있는 상태에서 상하 25% 스크림을 추가할 경우 104px로 이중 축소되는 문제 발견. 사용자의 날카로운 피드백을 반영하여 스크림을 전면 제거하고 시원한 개방형 조준 프레임으로 전환.
- 플래시 지연 단축: 캡처 플래시 시간을 200ms에서 100ms로 단축하여 연속 스캔 반응 속도 대폭 개선.
- 메모리 안전성: 컴포넌트 언마운트 및 취소 시 플래시 타이머를 ref에서 즉시 해제.
- 하위 호환성: Player 1(내자리) 순위 슬라이스 조건에 `!group[0].isMinus` 가드를 추가하여 음수 부호가 순위 숫자로 잘려나가는 것을 방지.

## 배포 또는 인계
클라이언트 로컬 실행 전용. 실기기 테스트 또는 개발자 PC drop 브리지를 통한 현장 테스트 준비 완료.

## 릴리스 준비 상태
- 전체 상태(Overall status): READY
- 필요한 사람 승인: 사용자 검토 및 승인 완료.
- 차단 항목: 없음.

## 잔여 위험
- 실제 오프라인 마작장 현장 조명 및 반사광 편차 가능성.
