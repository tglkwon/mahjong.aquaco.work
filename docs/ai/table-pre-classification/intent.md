# Intent

## Metadata
- Work ID: table-pre-classification
- Artifact mode: canonical
- Artifact revision: 2
- Language: en
- Status: ready
- Risk: standard
- Created: 2026-09-20
- Updated: 2026-09-20

## Originating request
`위 대화 내용을 정리해서 mvp 1 점수 인식 알고리즘 이전에 기종 자동 판별 알고리즘 추가해줘 /ai-native-sdlc`

English synthesis: Add an automated mahjong table model pre-classification algorithm before running OCR score recognition in MVP 1. Detect the table model (e.g. AMOS REXX 3 vs AMOS JP-EX) automatically from camera frames based on visual hardware characteristics (e.g. CHECK LED color and position: top-left green for REXX 3 vs top-right amber/yellow for JP-EX, faceplate texture, and rank labels). Start with an initial default/persisted model, auto-classify upon camera startup and frame sampling, and allow users to manually override the detected model via the existing UI dropdown if the auto-classification is incorrect.

## Problem and evidence
1. Currently, users must manually choose between `amos_rexx3` and `amos_jp_ex` via a `<select>` dropdown in `PhotoUploadPanel.tsx`. If an offline player unintentionally sits at a JP-EX table while the app is set to REXX 3 (or vice-versa), recognition may fail (specifically when scores drop below 10,000 points where JP-EX uses 2-digit zero-blanking while REXX 3 uses 4 digits) or cause user confusion.
2. An all-in-one unified regex/OCR hypothesis scales poorly as more table models are added ($O(N)$ combinatorics and potential score sum collision ambiguity).
3. AMOS REXX 3 and AMOS JP-EX have distinct, deterministic visual hardware markers:
   - **CHECK LED**: REXX 3 has a bright green LED on the top-left; JP-EX has an amber/yellow LED on the top-right.
   - **Faceplate**: JP-EX has a carbon-weave pattern; REXX 3 has a solid surface with rank arrows (`▼ ◀ ▲ ▶`) and Japanese unit markings (`만`, `천`, `백`).
   - **Branding**: `amos JP-EX` printed at top-left; `AMOS REXX III` at bottom-right.
4. Pre-classifying the table model once or at low frequency before running OCR keeps the core recognition algorithm $O(1)$, deterministic, and decoupled from model selection.

## Desired outcomes
1. Implement a lightweight, client-side pre-classifier function `classifyTableModel(image)` in `tableClassifier.ts`.
2. Detect `amos_rexx3` (green CHECK LED at top-left) vs `amos_jp_ex` (amber/yellow CHECK LED at top-right or carbon-weave presence) from image/canvas pixel data with high precision.
3. Integrate auto-classification into `scoreCamera.ts` and `PhotoUploadPanel.tsx`:
   - Keep current model (or localStorage default) initially.
   - When camera frames arrive, run pre-classification. If confidence is high and differs from current model, seamlessly switch the active model and update the UI selector.
   - Provide clear visual feedback in the UI (e.g. "자동 감지: AMOS JP-EX") while preserving manual override capability.
4. If pre-classification is ambiguous (e.g. extreme close-up where LEDs are out of frame), fall back safely to the current/persisted model without interrupting the user.

## Scope
1. `src/utils/tableClassifier.ts`: Pre-classification logic and color/position heuristic algorithms.
2. `src/utils/tableClassifier.test.ts`: Unit tests using synthetic and real parlor fixtures (`KakaoTalk_20230528_2.jpg`, `jpex_live_screenshot_crop.jpg`, REXX 3 fixtures).
3. `src/utils/scoreCamera.ts`: Integrate pre-classification callback or initial frame evaluation.
4. `src/components/PhotoUploadPanel.tsx`: Auto-detection status indicator and synchronization with manual `<select>` dropdown.

## Non-goals
1. Heavy deep-learning / neural network models (e.g. YOLO/MobileNet tensors running in WASM). Heuristics and color/geometry checks must remain $O(1)$ and under 5ms.
2. Deprecating or removing manual user selection (manual override remains an essential safety escape hatch).
3. Modifying core mahjong score computation or game sharing formats.

## Constraints and policies
1. 100% client-side execution; zero image data transmitted externally.
2. Existing unit tests and recognition accuracy for both REXX 3 and JP-EX must not regress.
3. Fallback behavior: if classification fails or is uncertain, maintain the user's manual selection.

## Acceptance signals
1. `classifyTableModel` correctly classifies real JP-EX images (`KakaoTalk_20230528_2.jpg`, `jpex_live_screenshot_crop.jpg`) as `'amos_jp_ex'` with confidence >= 0.8.
2. `classifyTableModel` correctly classifies real REXX 3 images (`rexx3_scan_2026-09-15T10-57-53-542Z.jpg`, `rexx3_frame_...jpg`) as `'amos_rexx3'` with confidence >= 0.8.
3. `PhotoUploadPanel` updates its active model and UI indicator upon automatic detection while allowing immediate manual override.
4. Full test suite and production build pass without regression.

## Assumptions and open questions
- Assumption: Standard commercial parlor lighting preserves green vs amber hue distinction. Adaptive HSV/RGB color ratios will accommodate moderate ceiling glare.
- Open question: Should auto-classification continuously run every frame or lock in after 1-2 positive detections? Decision: Run during initial camera sampling until 2 consistent detections or user manually overrides, avoiding unnecessary frame flutter during play.

## Decisions
1. Use top-left green LED vs top-right amber LED as primary deterministic heuristic, supplemented by upper-quadrant color histograms.
2. Maintain manual `<select>` dropdown as an authoritative override that disables auto-switching for the remainder of the session if touched by the user.
