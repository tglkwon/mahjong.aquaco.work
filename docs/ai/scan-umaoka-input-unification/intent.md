# Intent

## Metadata
- Work ID: scan-umaoka-input-unification
- Artifact revision: 2
- Language: en
- Korean mirror: intent.ko.md
- Status: draft
- Risk: standard
- Created: 2026-09-16
- Updated: 2026-09-16
- Originator: user conversation
- Owner: root implementation agent

## Originating request
```text
1. UI 개선 작업을 진행해보자. 우마 오카 실시간 스캔 페이지가 
실시간 스캔의 현재 점수 인식해서 점수 입력되는 부분(수동 수정 가능)과
우마 오카의 점수 입력 부분이 역할이 겹쳐서 하나오 합치려고 해. 기능적으로 양쪽 모두 반영하고 싶고, ui적으로는 우마 오카의 점수 입력(점수 기록) 부분의 ui를 기준으로 하려고 해. 
2. 총합 점수를 지금은 디폴트로 100000점으로 되어 있는데, 이걸 '시작 점수'로 계산된 목표 합계 값을 반영할 수 있게 하고 싶어. 시작 점수(25000), 목표 합계 = 총합 점수(100000)을 기본값으로 두되, 수정하면 기록할 때 맞춰야 하는 값이 바뀌게 해줘.
```

English synthesis:
1. Unify the score input interface: The current real-time score scan page has redundant score input forms (the review fieldset inside `PhotoUploadPanel.tsx` and the active round input row inside `UmaOkaTable.tsx`). Eliminate the duplicate form in `PhotoUploadPanel.tsx` and make `UmaOkaTable.tsx` the single UI standard for entering and fine-tuning scores, streaming recognized scores directly into the active editable round.
2. Bind the target total score dynamically to `startingScore * 4`: Instead of hardcoding `100000` as the target score sum, dynamically calculate it from `startingScore * 4` (default `25000 * 4 = 100000`), so modifying the starting score immediately updates the consensus verification and record commitment gates.

## Problem and evidence
1. `PhotoUploadPanel.tsx` currently displays a manual score review `<fieldset>` with 4 seat fields, display units, and a confirmation button, while `UmaOkaTable.tsx` directly beneath it displays another set of East, South, West, North score input fields with `±1000` buttons and player selectors.
2. Users are confused by having two separate places to inspect and modify scores on the same screen, and having two separate commit buttons.
3. The scanner expects a static `100000` total score regardless of the configured starting score, blocking games with non-standard rules (e.g. `30000` start with `120000` target).

## Desired outcomes
1. Stream recognized scores from `PhotoUploadPanel.tsx` directly into `UmaOkaTable.tsx` via a dedicated `onScoresRecognized` callback upon 3-dot consensus.
2. Remove the redundant `<fieldset>` manual input form and secondary confirm button from `PhotoUploadPanel.tsx`.
3. Retain `UmaOkaTable.tsx` as the primary interactive surface for score inspection, manual editing, `±1000` adjustments, and seat shifts.
4. Dynamically compute the required total score as `startingScore * 4` and bind it to both the scanner consensus gate and `ControlPanel.tsx` commitment gate.

## Scope
- `PhotoUploadPanel.tsx` and `PhotoUploadPanel.test.tsx`
- `ScorePhotoInputPage.tsx` and `ScorePhotoInputPage.test.tsx`
- `ControlPanel.tsx`
- `App.test.tsx`
- SDLC artifacts under `docs/ai/scan-umaoka-input-unification/`

## Non-goals
- Modifying OCR core recognition algorithms.
- Changing server-side logic (purely client-side application).

## Constraints and policies
- Strictly client-side in-memory execution.
- Maintain 100% backward compatibility for `#d=` share links.
- Single-shell PowerShell execution.

## Acceptance signals
1. Camera consensus directly injects 4 scores into `UmaOkaTable.tsx` without an intermediate form.
2. `PhotoUploadPanel.tsx` contains only the slot viewfinder, consensus gauge, live HUD, and PC transfer panel.
3. Adjusting `startingScore` updates the required total score across scanner and commitment controls.
4. All unit and integration test suites pass with zero regressions.

## Assumptions and open questions
- The default `startingScore` is `25000` and default target sum is `100000`.
- Both `/scan_score` and `/scan_score_test` utilize the unified table UI.

## Decisions
- `UmaOkaTable.tsx` is selected as the single UI standard for score input and review.
- `PhotoUploadPanel.tsx` acts as a pure camera HUD sensor emitting `onScoresRecognized`.
