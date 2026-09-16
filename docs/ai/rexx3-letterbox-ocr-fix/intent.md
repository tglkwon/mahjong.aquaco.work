# Intent

## Metadata
- Work ID: rexx3-letterbox-ocr-fix
- Artifact revision: 2
- Language: en
- Korean mirror: intent.ko.md
- Originator: user conversation
- Status: ready
- Risk: standard
- Created: 2026-09-14
- Updated: 2026-09-15
- Owner: root implementation agent

## Originating request
로직이 의도된 거로는 거의 순식간 0.2~0.3초에 점수 인식이 되어야 하는데, 실제는 그렇지 않고 있어.
원인을 테스트해보면서 생각해보니 사람이 손으로 들고 촬영한다는 점말고는 너가 영상을 분석하고 인식할 때와 다른 점을 모르겠어. 지금 영상에서 점수 인식을 하는 영상에서 '정확히' 똑같은 이미지가 몇장 찍히는 게 필요한 구조 같은데, 실제로 필요한건 똑같은 이미지 자체가 중요한게 아니라 인식된 점수가 영상 인식 중에 여러 번 나와서 같은 점수를 제대로 인식한게 맞다라고 판단되는 시스템이어야 한다고 생각해. 지금 점수 확정하는 로직을 알려주고 내 생각이 얼마나 일리 있는지 점검해봐. /ai-native-sdlc
빛 반사가 심한 2자리에서 사람이 앉아서 점수 표시를 촬영하는 영상 2개를 추가했어 확인해봐.

English synthesis: The user reported that while real-time score recognition should occur almost instantaneously (in 0.2~0.3 seconds), manual testing with a handheld smartphone is lagging or failing to lock. The user pointed out that the current gate seems to require exactly identical readings consecutively, which breaks easily under real-world handheld camera shake. The user proposed that rather than demanding consecutive identical frames, the system should confirm scores based on frequency consensus: recognizing the same valid score set multiple times within a temporal window. Additionally, the user provided two real handheld video recordings taken from seats with heavy ceiling glare (`PXL_20260914_121532649.mp4` and `PXL_20260914_121752679.mp4`), requesting validation and algorithm refinement under /ai-native-sdlc.

## Problem and evidence
1. The current stability tracker in `scoreStability.ts` implements a zero-tolerance consecutive streak gate. If even a single frame suffers from camera shake, momentary glare, or minor OCR failure, the counter resets immediately to `0`, leaving the user stuck at `점수 확인 중 (1/2회)`.
2. Frame analysis in `scoreCamera.ts` was throttled to `200ms` (5 FPS), imposing an artificial latency barrier on fast locking.
3. Analysis of the user's two new videos (`PXL_20260914_121532649.mp4` and `PXL_20260914_121752679.mp4`) revealed that heavy overhead glare causes washout on digits (e.g. `0248`), where strict color filtering (`r > g * 1.6`) fragments segment segments into broken components.
4. Digit `9` was misclassified as `8` in North's `0097` due to bottom horizontal bar bleed into the `lower-left` probe (reaching `28%`, exceeding the `25%` threshold).
5. The T-shape layout detector relied on Y-sorting, which misordered seats when the smartphone was tilted by even 2~3 degrees.

## Desired outcomes
1. Replace the strict consecutive streak in `scoreStability.ts` with a sliding window frequency consensus tracker: within a `1500ms` window, when any valid 4-score set (summing to `100000`) is observed at least `2` times, trigger `ready: true` (Fast-Lock).
2. Reduce frame analysis throttling in `scoreCamera.ts` from `200ms` to `100ms` (10 FPS) for sub-second responsiveness.
3. Fix OCR geometric probes in `scoreRecognition.ts`: raise `lower-left` probe threshold to `0.38` and offset `cy` to `0.64` to cleanly separate `9` from `8`. Tighten digit `1` aspect ratio to `0.33` to prevent misclassifying `5` or `7`.
4. Switch T-shape layout detection to robust X-axis partition (`left`: North, `right`: South, `topCenter`: West, `bottomCenter`: East) to endure roll/tilt up to `15` degrees.
5. Add adaptive red threshold fallback (`r > 160 && r > g * 1.4 && r > b * 1.2`) for glare-washed frames.

## Scope
- `scoreStability.ts`: sliding window frequency consensus algorithm and unit tests.
- `scoreCamera.ts`: throttle interval reduction and consensus tracker integration.
- `scoreRecognition.ts`: probe tuning, X-based layout detection, and adaptive red thresholding.
- Unit and regression tests in `scoreStability.test.ts` and `scoreRecognition.test.ts`.
- SDLC chain artifacts in `docs/ai/rexx3-letterbox-ocr-fix/`.

## Non-goals
- No server-side video uploads or remote processing.
- No changes to manual editing UI or sharing URL schemes.

## Constraints and policies
- Client-side in-memory processing only.
- Strict backward compatibility with existing tests and table models.
- Single-shell PowerShell execution for Windows.

## Acceptance signals
1. Handheld video streams achieve fast lock within `0.2~0.4s` even when intermittent non-matching frames occur.
2. Both glare video files (`PXL_20260914_121532649.mp4` and `PXL_20260914_121752679.mp4`) reliably trigger Fast-Lock at `100000` total points.
3. All Jest tests pass (100% green across all suites).
4. Full build succeeds (`npm run build`).
5. Artifact chain validation passes.

## Assumptions and open questions
- The sliding window TTL is set to `1500ms`, which is long enough to bridge momentary camera shake while short enough to prevent cross-contamination between games.
- Required consensus count is `2` observations with a minimum span of `100ms`.

## Decisions
- User proposal of frequency-based consensus over strict consecutive frames is formally adopted.
- Revision 2 instantiated under work ID `rexx3-letterbox-ocr-fix`.
