# Intent

## Metadata
- Work ID: adaptive-score-recognition
- Artifact mode: canonical
- Artifact revision: 3
- Language: en
- Status: ready
- Risk: standard
- Created: 2026-10-05
- Updated: 2026-10-05

## Originating request
`다음 개발 계획을 확인하고 진행해봐. /gemini-autonomous-sdlc 
**기존의 크기 조절·숫자 영역 탐색·7세그먼트 해석은 활용하고, ‘고정 RGB 기준으로 빨간 픽셀을 거르는 부분’을 밝기·대비에 적응하는 방식으로 바꾸려는 계획입니다.** 카메라 제어와 기울기 보정은 이번 범위에서 제외합니다.

현재 코드를 확인하면서 한 가지도 발견했습니다. **화면에 표시되는 조준 가이드와 실제 분석 영역이 정확히 연결돼 있지 않습니다.** 이 부분부터 맞춰야 점수판 내부만 보정한다는 의도가 구현됩니다.

**현재 처리와 변경 계획**

| 단계 | 현재 처리 | 개선 계획 |
|---|---|---|
| 분석 영역 | 세로 영상은 중앙 높이 50%, 가로 영상은 전체 사용. 조준 가이드는 별도 표시 | 화면의 조준 창에 해당하는 실제 영상 영역을 분석 |
| 크기 조절 | 분석 영상의 최대 변을 960픽셀로 축소 | 유지. 영역을 먼저 잘라낸 뒤 축소 |
| 방향 처리 | 원본·좌우 90° 회전 방향에서 판독 시도 | 유지. 임의 기울기·원근 보정은 추가하지 않음 |
| 밝기·대비 보정 | 별도 정규화 없음 | 분석 영역의 밝기 분포로 기준값과 보정 범위 계산 |
| 숫자 후보 추출 | 엄격한 빨간색 기준 → 완화 기준 → Otsu 기준 순서로 시도 | 정규화된 밝기·대비에 적응하는 후보 추출로 대체. 색은 보조 정보로 사용 |
| 숫자 영역 탐색 | 마스크를 주변 1픽셀로 확장하고 연결된 영역을 묶어 숫자·점수 그룹 탐색 | 기본 구조 유지 |
| 막대 판정 | 이진 마스크에서 각 막대 영역의 픽셀 밀도로 판정. 중앙 막대만 일부 상대 비교 | 원본 픽셀에서 막대와 주변 배경의 상대 대비로 판정 |
| 점수 해석·검증 | 7세그먼트 패턴, 자리 배정, 합계 검증, 여러 프레임의 결과 일치 확인 | 유지 |

**개선 후에는 다음 흐름으로 처리합니다.**

```text
카메라 프레임
    ↓
조준 창에 해당하는 영역 잘라내기
    ↓
최대 960픽셀로 크기 조절
    ↓
밝기·대비 기준값 계산
    ↓
적응형 후보 마스크 생성
    ↓
기존 방식으로 숫자와 4개 점수 영역 찾기
    ↓
각 점수 영역의 밝기 기준을 세부 조정
    ↓
원본 픽셀의 상대 대비로 7개 막대 판정
    ↓
숫자 해석 → 합계 검증 → 프레임 간 결과 확인
```

**밝기 보정은 두 단계로 하겠습니다.**

처음에는 정확한 숫자 위치를 모르므로 **조준 창 전체에서 대략적인 밝기 기준**을 구합니다. 이 기준으로 숫자 후보를 찾고, 찾은 뒤에는 **네 점수 표시 영역별로 기준을 다시 계산**합니다. 한쪽 점수판에만 반사가 있거나 밝기가 다른 경우, 네 점수에 같은 보정값을 강제로 적용하지 않기 위해서입니다.

보정된 컬러 영상을 새로 만드는 대신, 판독에 사용할 **밝기 값과 상대 대비 값만 계산**합니다. RGB 채널을 각각 강제로 늘려 색을 바꾸기보다는, 원래 색 정보는 보조 정보로 남깁니다.

여기서 ‘점수판 내부’는 처음부터 자동으로 정확한 테두리를 찾는다는 뜻은 아닙니다. **처음에는 사용자가 맞춘 조준 창, 이후에는 검출된 점수 표시 영역**으로 범위를 좁히는 방식입니다.

**막대 판정은 위치 탐색용 마스크와 분리합니다.**

위치 탐색에는 이진 마스크가 편리하므로 계속 사용합니다. 하지만 최종 판정에서는 그 마스크만 보지 않고 원본 픽셀로 돌아가서 다음을 비교합니다.

- 막대 중심 영역이 주변 배경보다 얼마나 밝은지
- 그 차이가 해당 점수 영역의 밝기 범위에서 얼마나 뚜렷한지
- 막대 중심과 양옆의 대비가 실제 막대인지, 퍼진 빛인지 구분할 만큼 충분한지

특히 `0`의 중앙에 번진 빛을 `8`의 켜진 막대로 읽는 문제가 검증 대상입니다. 대비가 거의 없는 영역은 보정 강도를 제한하고 불확실한 결과로 처리합니다.

**처리 부담을 줄이는 방식도 함께 적용합니다.**

밝기 통계는 샘플링으로 구하고, 같은 프레임에서 재사용합니다. 숫자를 찾은 뒤의 정밀 비교는 작은 막대 영역에만 수행합니다. 기존 세 가지 임계값 방식에 새 방식을 하나 더 덧붙여 반복 횟수를 늘리는 대신, **후보 추출과 막대 판정을 교체하는 구조**로 진행합니다. 기존 방식은 비교 검증의 기준으로 남깁니다.

검증에서는 같은 원본 영상으로 기존·개선 방식의 **네 점수 전체 정확도, 잘못된 자동 채택, 처리시간**을 비교합니다. 밝기 변화로 위치 탐색부터 실패하는 경우와, 위치는 찾지만 `0/8` 등을 잘못 읽는 경우를 나눠 확인해야 합니다.

현재는 이 변경안을 정리한 단계이며, 소스 코드는 아직 수정하지 않았습니다.`

English synthesis: Upgrade the scoreboard OCR engine in `mahjong.aquaco.work` to be robust against ambient lighting variations and LED bloom without increasing CPU latency:
1. **Viewfinder - Analysis ROI synchronization**: Connect the on-screen viewfinder ROI (`data-testid="viewfinder-roi"`) directly to the frame crop logic before resizing to max 960px. Crop only the exact viewfinder region seen by the user rather than blindly taking the vertical 50% slice.
2. **Two-stage brightness/contrast normalization**:
   - Stage 1: Estimate coarse brightness/contrast statistics across the cropped viewfinder window via fast pixel sampling. Generate an adaptive candidate mask where red dominance and local luminance serve as primary cues and color as auxiliary validation.
   - Stage 2: After identifying the 4 score display clusters via existing connected-component geometry, recalibrate brightness/contrast baselines individually for each of the 4 score clusters.
3. **Decoupled 7-segment evaluation using raw pixel relative contrast**:
   - Retain binary masks solely for coarse digit localization.
   - For 7-segment on/off classification, evaluate raw pixel values directly against the surrounding background cavity, testing whether the segment center exceeds background luminance, whether the difference is distinct within the cluster's dynamic range, and whether peak contrast differentiates a genuine middle bar from light flare (e.g. `0` vs `8`). Regions lacking contrast are flagged as uncertain.
4. **Efficiency and architecture consolidation**:
   - Replace the legacy 3-pass threshold cascade (`strict` -> `glare` -> `otsu`) with the adaptive candidate extraction and raw contrast pipeline as the primary engine.
   - Retain the legacy implementation for benchmark comparison.
   - Compute brightness statistics via grid sampling and reuse within the frame. Limit high-resolution contrast checks to small segment probe zones.
5. **Verification and benchmarks**:
   - Compare old vs new engines across all test fixtures and research videos measuring 4-score accuracy, false-positive auto-commit rate (must be 0.0%), and median/p95 latency.

## Problem and evidence
1. **Viewfinder Mismatch**: In `PhotoUploadPanel.tsx`, the camera preview is rendered in a CSS container with `object-cover`, overlaid with a viewfinder bounding box. However, `scoreCamera.ts` unconditionally takes `video.videoHeight * 0.25` to `0.75` across full width. As a result, extraneous table elements outside the viewfinder enter analysis, and scoreboard digits framed near the viewfinder edges get cut off or misaligned.
2. **Fixed RGB Threshold Brittleness**: The legacy cascade relies on fixed RGB ratios (`r > 180 && r > g * 1.6`) or global Otsu. When parlor illumination varies across the table (e.g. one score display sits under direct spotlight glare while another is shadowed), a single global threshold fails on at least one display.
3. **LED Bloom False Positive (`0` read as `8`)**: Segment G (middle bar) in digit `0` receives scattered red light from segments A, B, C, D, E, and F. In binary mask density checks, this bloom often exceeds density thresholds, causing `0` to be incorrectly classified as `8`.
4. **Performance Overhead of Multi-Pass Cascade**: Running up to 3 separate thresholding passes across multiple orientations adds computational latency on mobile devices.

## Desired outcomes
1. Exact WYSIWYG crop: the analyzed canvas corresponds strictly to the viewfinder box visible on the mobile display, then scaled to max dimension 960px.
2. Two-stage adaptive brightness baseline: initial coarse sampling across the viewfinder crop, followed by localized baseline re-estimation for each of the 4 identified score displays.
3. Raw pixel contrast segment classifier: segment activation determined by comparing center probe luminance against adjacent inner cavity background relative to local dynamic range, eliminating `0` vs `8` middle-bar flare errors.
4. Preserved legacy recognizer as a baseline benchmark comparator.
5. Benchmark suite proving:
   - 100% regression pass on existing fixtures (`fixtures.json`, `rgb.fixture.json`, `jpex.fixture.json`).
   - 0.0% false-positive auto-confirmation rate.
   - Recognition latency <= 25ms per frame on typical mobile/desktop CPU.

## Scope
1. `src/utils/scoreCamera.ts`: Viewfinder-synchronized crop calculation from video element geometry and container bounds.
2. `src/utils/scoreRecognition.ts`:
   - Two-stage sampled brightness/contrast distribution estimation.
   - Adaptive candidate mask generation with color as auxiliary filter.
   - Raw pixel segment contrast evaluation with middle-bar flare discrimination.
   - Primary adaptive recognition pipeline replacing the 3-pass loop, retaining legacy mode for benchmark comparison.
3. `src/components/PhotoUploadPanel.tsx`: Viewfinder coordinate transmission to `startScoreCamera`.
4. `src/utils/scoreRecognition.benchmark.test.ts`: Side-by-side benchmark comparing legacy vs adaptive engine (accuracy, false positives, latency).

## Non-goals
1. Camera hardware control (exposure, focus, zoom APIs).
2. Arbitrary perspective distortion / homography warp correction beyond existing 90-degree card rotations.
3. Changes to downstream score drafting, consensus tracking (`scoreStability.ts`), or mobile-drop bridge protocols.
4. Altering the 7-segment digit pattern definitions (`patterns`) or table layout geometric clustering.

## Constraints and policies
1. **Rule of Least Surprise**: Preserve public function signatures (`recognizeScoreboard`) so existing consumers in `scoreCamera.ts`, `scoreMedia.ts`, and test suites remain compatible.
2. **Zero False Auto-Confirmation**: False readings must never be confirmed. Low-contrast or ambiguous scores must yield empty candidate strings rather than guesses.
3. **Performance Budget**: Sampling and contrast checks must not degrade frame processing rate; latency must remain below 30ms per frame.
4. **Self-Contained Browser Execution**: No external WASM or heavyweight ML runtimes; standard TypeScript canvas image processing only.

## Acceptance signals
1. Existing fixture tests in `scoreRecognition.test.ts` pass without regression.
2. Viewfinder coordinates accurately map CSS `object-cover` viewport into native video frame pixel coordinates.
3. Benchmark suite demonstrates equal or higher recognition rate on real fixtures with reduced flare susceptibility on digit `0`.
4. False-positive auto-commitment remains strictly 0.0% across all negative and glare test trials.

## Assumptions and open questions
1. *Assumption*: The viewfinder UI box maintains a fixed centered aspect ratio relative to the video container, allowing deterministic geometric projection onto native video pixel coordinates.
2. *Open question*: For static image uploads or test fixtures where DOM elements do not exist, a default centered ROI (matching the default viewfinder proportion ~94% width, ~80% height) will be applied.

## Decisions
1. **Adaptive as Primary Engine**: The new adaptive brightness and raw contrast recognizer will be the default implementation in `recognizeScoreboard`. The prior 3-pass implementation will be preserved under an internal function / flag (`recognizeScoreboardLegacy`) for benchmarking.
2. **Two-Stage Brightness Estimation**: Stage 1 uses a 4-pixel grid stride to compute coarse background/foreground percentiles across the whole ROI. Stage 2 refines background level $L_{bg}$ and foreground level $L_{fg}$ inside each of the 4 bounding boxes before testing segment contrast.
3. **Flare Rejection Logic**: Middle bar G is evaluated not just for absolute brightness, but for contrast peak against adjacent cavity pixels $(y \pm \Delta y)$ normalized by local range $(L_{fg} - L_{bg})$.
