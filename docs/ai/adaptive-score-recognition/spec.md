# Specification

## Metadata and source
- Work ID: adaptive-score-recognition
- Artifact mode: canonical
- Artifact revision: 3
- Language: en
- Source: intent.md revision 3

## Summary
This specification defines the migration of the scoreboard OCR recognition engine in `mahjong.aquaco.work` from a fixed RGB threshold cascade to a two-stage adaptive brightness/contrast normalization and raw pixel relative contrast segment classification pipeline. Additionally, it specifies connecting the on-screen camera viewfinder (`data-testid="viewfinder-roi"`) directly to the video crop logic, ensuring that the canvas analyzes precisely the region visible within the user's framing window.

## Functional requirements
- REQ-001: The system SHALL map the client viewfinder box coordinates (`PhotoUploadPanel.tsx`) to the native video pixel dimensions considering CSS `object-cover` scaling and letterboxing, cropping only this viewfinder ROI prior to scaling to a maximum dimension of 960px.
- REQ-002: The system SHALL compute coarse ambient background ($L_{bg}$) and LED foreground ($L_{fg}$) luminance statistics across the cropped ROI using grid sampling ($4 \times 4$ pixel stride) to generate an adaptive binary candidate mask where luminance and red dominance are normalized, using color as an auxiliary verification cue.
- REQ-003: Following connected-component clustering of the 4 score display clusters, the system SHALL recalculate local background and foreground baselines individually for each of the 4 score clusters to prevent localized glare, reflections, or shadows from contaminating other clusters.
- REQ-004: For 7-segment digit classification, the system SHALL evaluate the raw pixel values of the scaled image directly rather than solely checking binary mask density. Each segment SHALL be evaluated by testing whether the segment center probe exceeds its adjacent inner cavity background relative to the cluster's dynamic range ($L_{fg} - L_{bg}$). Segment G (middle bar) SHALL be evaluated for contrast peak relative to upper and lower cavities to reject scattered optical flare in digit `0`.
- REQ-005: The system SHALL consolidate the recognition pipeline into a single adaptive pass, replacing the iterative 3-pass loop (`strict` -> `glare` -> `otsu`), while preserving the legacy multi-pass algorithm as an accessible baseline comparator for regression benchmarking.

## Non-functional requirements
- NFR-001 (Latency): Per-frame recognition latency SHALL not exceed 25ms on modern desktop and mobile browsers.
- NFR-002 (Safety): The false-positive auto-confirmation rate SHALL remain strictly 0.0% across all negative, glare, and partially occluded frames.
- NFR-003 (Backward Compatibility): The exported API signature `recognizeScoreboard(image, model, metrics)` SHALL be preserved.

## User experience and flows
1. The user aligns the Mahjong table scoreboard within the on-screen viewfinder box in `PhotoUploadPanel.tsx`.
2. The camera capture loop reads the precise bounding rectangle of the viewfinder and crops the underlying video frame to those coordinates.
3. The adaptive OCR engine processes the cropped frame through coarse sampling, digit grouping, local baseline re-estimation, and raw contrast segment reading.
4. If a valid reading satisfying the starting score total is confirmed across 3 consecutive frames, scores are auto-populated into the score table with visual green flash confirmation.
5. If lighting contrast is insufficient or ambiguity exists (e.g. unresolvable glare), the system leaves the reading uncommitted and prompts for manual entry.

## Architecture and interfaces
### Viewfinder ROI Extraction
```typescript
export interface ViewfinderRect {
  x: number; // Normalized [0, 1] relative to container
  y: number;
  width: number;
  height: number;
}
```
In `scoreCamera.ts`:
Given container dimensions $(W_c, H_c)$ and video stream dimensions $(W_v, H_v)$, calculate object-cover scale $S = \max(W_c / W_v, H_c / H_v)$, offsets $O_x = (W_c - W_v \cdot S) / 2$, $O_y = (H_c - H_v \cdot S) / 2$, and transform viewfinder bounds into video pixel coordinates $(X_v, Y_v, W_{sub}, H_{sub})$.

### Adaptive Recognition Pipeline in `scoreRecognition.ts`
1. `estimateGlobalLuminance(image, stride = 4)`: Returns $\{ bg: number, fg: number \}$.
2. `createAdaptiveCandidateMask(image, stats)`: Returns binary `Uint8Array` mask for connected component discovery.
3. `recalibrateClusterLuminance(image, box)`: Returns $\{ localBg: number, localFg: number \}$.
4. `evaluateSegmentsRawContrast(image, box, localStats)`: Compares center probes against inner cavity background in raw pixel array.

## Data and migrations
No persistent database schema changes. LocalStorage key `mahjong_table_model` remains unchanged.

## Failure modes and edge cases
- **Extreme Over-Exposure / Total Whiteout**: Local dynamic range $(L_{fg} - L_{bg}) < 25$. Segments are rejected; function returns empty candidates.
- **Extreme Under-Exposure**: Peak red luminance $L_{fg} < 40$. Candidate mask yields zero digit boxes; function returns empty candidates.
- **Digit 0 Optical Flare**: High red scattering into segment G cavity. Raw contrast check verifies that $(I_{center} - I_{cavity}) / (L_{fg} - L_{bg}) < \theta_{flare}$, correctly classifying G as off (`0`).
- **Static Image Upload**: When container DOM is absent, fallback to default centered ROI ($94\%$ width, $80\%$ height).

## Security, privacy, and permissions
Client-side processing only. No image or video pixels are transmitted to external servers without explicit user-initiated mobile-drop transfer.

## Observability and operations
Diagnostic telemetry records:
- `viewfinderRoi`: Normalized crop coordinates $[x, y, w, h]$.
- `globalLuminance`: $\{ bg, fg \}$.
- `clusterLuminance`: Array of local $\{ bg, fg \}$ for detected groups.
- `flareRejections`: Count of segment G flare rejections.

## Test strategy
- Unit tests in `src/utils/scoreRecognition.test.ts`:
  - Verify existing fixtures (`fixtures.json`, `rgb.fixture.json`, `jpex.fixture.json`) pass.
  - Verify synthetic digit `0` with blooming center is recognized as `0` and not `8`.
  - Verify washed-out white frames produce empty candidates.
- Benchmarks in `src/utils/scoreRecognition.benchmark.test.ts`:
  - Side-by-side comparison of accuracy, latency, and false-positive rates between legacy and adaptive engines.

## Acceptance criteria
- AC-001: Video frame analysis crops strictly the area defined by the viewfinder UI element instead of full-width 50% vertical center.
- AC-002: Adaptive candidate mask dynamically adjusts threshold without relying on hardcoded `r > 180` constant.
- AC-003: In test cases with simulated or real optical bloom on digit `0`, middle bar is recognized as unlit (`0`), achieving 0% `0` -> `8` error rate.
- AC-004: Negative and washed-out image trials produce 0 false-positive auto-confirmations.
- AC-005: Benchmark tests show average latency <= 25ms per frame.

## Traceability
- REQ-001 traced to AC-001
- REQ-002 traced to AC-002
- REQ-003 traced to AC-002
- REQ-004 traced to AC-003
- REQ-005 traced to AC-004, AC-005

## Open decisions
None. Architectural and scope decisions resolved during Phase 1 specification.
