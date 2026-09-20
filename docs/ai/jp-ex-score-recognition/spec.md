# Specification

## Metadata and source
- Work ID: jp-ex-score-recognition
- Artifact mode: canonical
- Artifact revision: 2
- Language: en
- Source: intent.md revision 2

## Summary
Define requirements and acceptance criteria for AMOS JP-EX scoreboard OCR recognition in `mahjong.aquaco.work`. This includes handling 2-digit scores under 10,000 points without leading zeros, Diamond layout seat mapping, real ground-truth fixture tests from Yeokgok parlor photos, and model routing in the camera scan pipeline and user interface.

## Functional requirements
- `REQ-001`: In `scoreRecognition.ts`, digit runs MUST accept between 2 and 4 boxes (`g.length >= 2 && g.length <= 4`) to allow 2-digit scores (e.g. `97` for 9,700 points or `26` for 2,600 points) and minus scores without discarding valid score displays.
- `REQ-002`: In `scoreRecognition.ts`, when `model === 'amos_jp_ex'`, the recognition engine MUST parse the Diamond/Cross layout into counter-clockwise turn order `[bottom, right, top, left]` (East, South, West, North) without slicing the first digit on the bottom seat (no rank segment exists on JP-EX).
- `REQ-003`: In `scoreRecognition.test.ts`, the fake JP-EX test that reuses AMOS REXX 3 fixtures MUST be replaced by real ground-truth test fixtures extracted from clean Yeokgok parlor photos (`202305 역곡/KakaoTalk_20230528_2.jpg`).
- `REQ-004`: In `scoreCamera.ts` and `PhotoUploadPanel.tsx`, the camera scan options MUST allow passing `model: TableModel` (`'amos_rexx3'` or `'amos_jp_ex'`), with user-facing model selection in the UI.
- `REQ-005`: All recognized scores MUST produce valid 100-point unit values that sum to the expected total (100,000 points) through `validateScoreDraft`, and existing AMOS REXX 3 recognition MUST NOT regress.

## Non-functional requirements
- Processing MUST remain 100% client-side inside the browser using HTML5 Canvas; no images or pixel arrays may be transmitted to external servers.
- Recognition latency per frame MUST remain under 100ms on modern mobile and desktop browsers.
- TypeScript compilation (`npx tsc --noEmit`) MUST succeed with zero errors.

## User experience and flows
1. User opens the Score Recognition / Camera Scan panel in `PhotoUploadPanel`.
2. User selects the table model (default: `AMOS REXX 3`, selectable: `AMOS JP-EX`).
3. User points the camera at an AMOS JP-EX scoreboard or uploads a photo.
4. The system detects the 4 scores in Diamond layout, correctly reading 2-digit scores (e.g. `97`) as 9,700 points and 3-digit scores (e.g. `220`, `483`, `200`) as 22,000, 48,300, 20,000 points.
5. The sum of 100,000 points matches the expected total, prompting the user to confirm and append the record.

## Architecture and interfaces
- `TableModel`: `'amos_rexx3' | 'amos_jp_ex' | 'amos_jp_color'` in `scoreRecognition.ts`.
- `ScanOptions`: Add `model?: TableModel` (defaulting to `'amos_rexx3'`) in `scoreCamera.ts`.
- `PhotoUploadPanelProps`: Add optional `defaultTableModel?: TableModel` or allow internal state selection.

## Data and migrations
- No database migrations or schema alterations required.
- Game record data structure and URL sharing format remain completely unchanged.

## Failure modes and edge cases
- **2-digit score (< 10,000 points)**: JP-EX blanks leading zero. Filter must permit `g.length >= 2`.
- **Negative score (tobi / 들통)**: Displays minus sign and digits (e.g. `-12` for -1,200 points). Must parse minus box properly.
- **Ceiling light glare / reflections**: Glossy faceplate reflections handled by existing adaptive glare threshold.
- **Photos with graffiti/stickers**: Clearly separated in test suite; only raw clean LED photos used as fixtures.

## Security, privacy, and permissions
- Zero camera stream or photo frame data leaves the user device.
- No new external network requests or third-party libraries added.

## Observability and operations
- Console logging preserved for test and debug environments.
- Stability tracker logs recognition count and consensus frames.

## Test strategy
- Unit tests: Add real JP-EX fixture tests in `scoreRecognition.test.ts` testing `KakaoTalk_20230528_2.jpg` (`['220', '483', '200', '97']`).
- Regression tests: Ensure all existing AMOS REXX 3 video/RGB fixture tests pass.
- Integration tests: Verify `scoreCamera.ts` and `PhotoUploadPanel.tsx` model passing.

## Acceptance criteria
- `AC-001`: `scoreRecognition.ts` recognizes 2-digit scores (`97`, `26`) without returning `empty()`, with `g.length >= 2 && g.length <= 4`.
- `AC-002`: `scoreRecognition.test.ts` contains real JP-EX fixtures and passes recognition for Yeokgok ground truth (`[220, 483, 200, 97]`) without rank slicing.
- `AC-003`: `scoreCamera.ts` and `PhotoUploadPanel.tsx` correctly support and pass `model: 'amos_jp_ex'`.
- `AC-004`: `npm test` and `npm run build` pass cleanly without any TypeScript, Jest, or ESLint errors.

## Traceability
- `REQ-001` -> `AC-001`
- `REQ-002` -> `AC-002`
- `REQ-003` -> `AC-002`
- `REQ-004` -> `AC-003`
- `REQ-005` -> `AC-004`

## Open decisions
- None. The 5-digit/6-digit hypothesis was disproved by visual evidence of user photo stickers, and 100-point unit scaling with 2~3 digits is confirmed.
