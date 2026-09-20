# Intent

## Metadata
- Work ID: jp-ex-score-recognition
- Artifact mode: canonical
- Artifact revision: 2
- Language: en
- Status: done
- Risk: standard
- Created: 2026-09-20
- Updated: 2026-09-20

## Originating request
`/ai-native-sdlc 오프 마장 영상 자료, 역곡을 중심으로 jp-ex 모델의 점수 인식기능을 개발할 수 있는 것을 진행하려고 해.`

English synthesis: Develop and verify AMOS JP-EX scoreboard recognition capabilities using real offline mahjong parlor photos, centered on the Yeokgok parlor dataset (`202305 역곡` and `202208 역곡`). Fix the OCR pipeline to handle real JP-EX hardware characteristics (3-digit 100-point units, 2-digit scores under 10,000 points without leading zeros, minus scores, and Diamond layout without rank slicing), replace the existing mock test with real JP-EX fixtures, and enable table model routing in the UI and camera scan pipeline.

## Problem and evidence
1. The current `scoreRecognition.test.ts` reuses an AMOS REXX 3 fixture (`fixtures[0]`) for `amos_jp_ex`, which does not validate actual JP-EX hardware recognition.
2. In `scoreRecognition.ts`, `groups.filter(g => g.length >= 3 && g.length <= 4)` discards 2-digit scores under 10,000 points (such as `97` in `202305 역곡/KakaoTalk_20230528_2.jpg` or `26` in `202208 역곡/KakaoTalk_20220814_103209346.jpg`), causing immediate recognition failure (`empty()`).
3. The table model is hardcoded to `'amos_rexx3'` in `PhotoUploadPanel.tsx` and `scoreCamera.ts`, preventing users from scanning JP-EX scoreboards in production.
4. Photos with manual phone stickers (`KakaoTalk_20230528_1.jpg`) must be distinguished from clean raw LED photos (`KakaoTalk_20230528_2.jpg`) to avoid training or testing on artificial text overlays.

## Desired outcomes
1. Support reliable OCR recognition for AMOS JP-EX scoreboards in `scoreRecognition.ts`.
2. Allow scores between 2 and 4 boxes (`g.length >= 2 && g.length <= 4`), correctly handling 2-digit scores (< 10,000 points) and minus scores.
3. Validate Diamond layout counter-clockwise seat ordering (`[bottom, right, top, left]`) without rank slicing for JP-EX.
4. Replace the fake JP-EX unit test with real ground-truth fixtures generated from clean Yeokgok photos (`KakaoTalk_20230528_2.jpg`).
5. Provide table model selection (`amos_rexx3` vs `amos_jp_ex`) in `PhotoUploadPanel.tsx` and route it through `startScoreCamera`.

## Scope
1. `src/utils/scoreRecognition.ts`: Adjust digit group length filter (`g.length >= 2 && g.length <= 4`) and ensure robust Diamond layout parsing.
2. `src/utils/scoreRecognition.test.ts` and fixtures: Create real JP-EX test fixtures from Yeokgok data and add comprehensive test cases.
3. `src/utils/scoreCamera.ts`: Accept `model: TableModel` parameter in `ScanOptions` and pass it to `recognizeScoreboard`.
4. `src/components/PhotoUploadPanel.tsx`: Add table model selection UI (or preserve user selection via state/localStorage) and pass the selected model to the camera and recognition pipeline.

## Non-goals
1. Supporting user-drawn text stickers or phone graffiti overlays as valid score inputs.
2. Automatic machine-learning table model classification from single frames (model selection will be user-selected or config-driven).
3. Altering the core Game data structures, sharing format, or scoring math.
4. Modifying unrelated parlor datasets (e.g. Shinrim non-AMOS tables).

## Constraints and policies
1. Processing must remain entirely client-side; no image data or pixels may be transmitted externally.
2. Existing AMOS REXX 3 recognition accuracy, portrait orientation support, and unit tests must not regress.
3. Keep changes minimal and adhere to TypeScript strictness and existing ESLint/Jest configurations.

## Acceptance signals
1. Real JP-EX test fixture from Yeokgok (`KakaoTalk_20230528_2.jpg`: `[220, 483, 200, 97]` -> 22000, 48300, 20000, 9700, sum 100,000) passes recognition with 100% accuracy in `scoreRecognition.test.ts`.
2. AMOS REXX 3 fixtures continue to pass without any regression.
3. `PhotoUploadPanel` allows selecting AMOS JP-EX and successfully feeds the model parameter into `scoreCamera`.
4. Production build (`npm run build`) and all unit tests (`npm test`) pass cleanly.

## Assumptions and open questions
1. AMOS JP-EX uses 100-point units (`unit = 100`) and standard 100,000-point target totals by default.
2. Yeokgok parlor photos represent typical commercial JP-EX installations with carbon-weave faceplates and yellow CHECK LEDs.

## Decisions
1. Reject the 6-digit / 5-digit full-score hypothesis based on evidence that 5-digit text was manual phone graffiti. JP-EX hardware natively displays 3 digits (or 2 digits when < 10,000).
2. Set group length filter lower bound to 2: `g.length >= 2 && g.length <= 4`.
3. Use `KakaoTalk_20230528_2.jpg` as the primary Yeokgok ground-truth fixture.
