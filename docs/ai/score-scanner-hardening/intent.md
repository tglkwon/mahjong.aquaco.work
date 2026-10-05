# Intent

## Metadata
- Work ID: score-scanner-hardening
- Artifact mode: canonical
- Artifact revision: 2
- Language: en
- Status: ready
- Risk: standard
- Created: 2026-09-27
- Updated: 2026-09-27

## Originating request
`테스트 결과를 바탕으로 한 개선 사항을 정리해왔어. /gemini-autonomous-sdlc 
"제가 구현한다면 다음처럼 정하겠습니다.
1. 진단 메타데이터는 실패 원인을 찾는 데 필요한 값만 수집합니다.
   영상과 같은 captureId를 가진 JSON sidecar를 보내고, 단계별 상세값은 영상 프레임마다가 아니라 대표 프레임과 스캔 종료 시점에 기록합니다. 카메라 해상도·FPS·방향, 적용 ROI, 분석 시간, 빨강 후보 픽셀 수, 연결된 숫자 그룹 수, 판독값, 합계 검증, 종료 사유를 담습니다. deviceId는 저장하지 않고 기기 모델은 브라우저가 제공할 때만 선택적으로 포함합니다. 처리 단계는 frame_ready → red_candidates → digit_groups → decoded → score_validated처럼 구분해 실패 지점을 찾겠습니다.
2. 크롭은 더 넓히지 않고 미리보기와 같은 좌표를 쓰게 합니다.
   세로 원본의 중앙 50%를 가로 ROI로 유지합니다. 이 ROI 좌표를 카메라 미리보기와 분석 코드가 함께 사용하게 해서 화면에 보이는 영역과 실제 처리 영역이 같도록 합니다. 미리보기 종횡비는 카메라 크기와 ROI로 계산하고, 내부 80% 테두리 안에 네 점수가 들어오도록 거리를 맞추게 합니다. 가로 입력은 현재처럼 전체 프레임을 ROI로 취급합니다. 이 규칙은 사용자가 정한 가로형 ROI와 80% 가이드 방향에 맞습니다.
3. 빨강 판별은 실패 시에만 프레임 적응형 보정 판독을 추가합니다.
   기존 엄격한 판독을 빠른 1차 경로로 유지합니다. 실패한 프레임에서는 ROI 안의 픽셀별 R - max(G, B) 같은 빨강 우세도 분포를 계산하고, Otsu 임계값을 후보로 사용하겠습니다. 다만 어두운 노이즈나 다른 빨간 물체가 마스크에 들어오지 않도록 임계값 상·하한을 실제 영상으로 조정하고, 기존 숫자 그룹의 크기·배치 조건으로 한 번 더 거릅니다. 이 후보 방식은 현재 데이터에 검증되지 않았으므로, 바로 채택하기보다 저장된 다기종 영상에서 비교할 초기안으로 삼겠습니다.
4. 불확실한 판독은 자동 확정하지 않습니다.
   네 숫자의 배치 판정, 점수 합계 검증, 연속 프레임 일치 조건을 모두 통과한 경우에만 자동 반영합니다. 보정 판독이 여러 해석을 만들거나 조건이 맞지 않으면 미확정 상태로 두고 직접 입력을 안내합니다.
5. 기종별 평가는 실제 성공·실패 영상으로 정합니다.
   촬영 영상의 정답 점수를 붙여 기존 방식과 개선 방식을 같은 데이터에서 비교합니다. 주 지표는 네 자리 전체 정답률, 잘못된 점수 자동 확정률, 인식 시간의 중앙값과 95백분위로 하겠습니다. 가장 중요한 안전 기준은 잘못된 점수 자동 확정이 늘지 않는 것입니다. 합성 밝기·화이트밸런스 변형 영상은 보조 검증에 쓰고, 실제 기종 영상의 결과와 따로 봅니다.
6. 수동 작탁 선택은 자동 감지보다 우선하게 합니다.
   사용자가 수동으로 기종을 선택하면 해당 스캔 세션에서 자동 감지가 currentModel을 바꾸지 못하도록 막겠습니다. 자동 감지는 사용자가 자동 모드를 선택했을 때만 적용합니다.
빨강 보정은 Otsu를 최종 답으로 가정하지 않고, 메타데이터와 테스트 영상으로 기기별 성능을 먼저 확인한 뒤 확정하는 접근을 권합니다. 자동 판독 안전성, 빠른 기존 성공 경로, 데이터로 확인할 수 있는 진단을 함께 챙길 수 있습니다."`

English synthesis: Harden the live scoreboard OCR recognition system in `mahjong.aquaco.work` based on real parlor test results across six core pillars:
1. **Diagnostic metadata sidecar JSON**: Collect lightweight diagnostic telemetry paired with video uploads using a shared `captureId`. Record telemetry at representative frames (initial frame, first failure sample) and session completion rather than every frame. Track pipeline stages (`frame_ready` -> `red_candidates` -> `digit_groups` -> `decoded` -> `score_validated`), camera resolution/FPS/orientation, ROI, stage latency, red pixel candidate counts, digit groups, decoded readings, sum validation, and exit reason. Exclude persistent device identifiers (`deviceId`), optionally keeping device model only if browser reports it.
2. **WYSIWYG crop and viewfinder synchronization**: Keep the central 50% landscape ROI for portrait video inputs (full frame for landscape). Synchronize the camera preview aspect ratio and viewport with the analyzed ROI coordinates so what users see strictly matches what the OCR canvas analyzes. Display an inner 80% boundary guide for 4-score placement.
3. **Adaptive red calibration fallback (Otsu candidate)**: Maintain the existing strict red threshold as a fast 1st-pass path (<2ms). On failed frames only, evaluate a frame-adaptive calibration pass using pixel-level red dominance `R - max(G, B)` with Otsu thresholding bounded by strict upper/lower limits and digit group geometry constraints. Treat Otsu as an empirical candidate to be validated on multi-device test videos.
4. **Strict auto-confirmation safety gate**: Never automatically commit uncertain readings. Require passing all three gates: valid 4-score spatial layout, exact score sum verification (`startingScore * 4`), and temporal consensus (e.g. 3 consecutive agreeing frames). If any check fails or reading is ambiguous, remain unconfirmed and guide user to manual entry.
5. **Real-video multi-device evaluation benchmark**: Benchmark recognition accuracy on real parlor videos (success and failure cases) with labeled ground truth scores. Primary evaluation metrics: 4-score accuracy, false-positive auto-confirmation rate (strictly 0.0%), and recognition latency (median & p95). Separate synthetic lighting/white-balance tests as secondary stress checks.
6. **Manual table model override precedence**: If user manually selects a table model from the UI selector, prevent auto-detection from altering `currentModel` in `scoreCamera.ts` and `PhotoUploadPanel.tsx` during that session. Auto-detection only applies when set to "Auto".

## Problem and evidence
1. **Diagnostic Telemetry Gap**: When mobile score recognition fails in real parlors (e.g. `rex3_fail_...mp4`), developers only receive the raw video. Diagnosing which exact stage failed (e.g. red mask threshold too high? digit segments fragmented? layout non-T-shape? sum mismatch?) requires manual debugging without frame-level metadata.
2. **Viewfinder vs Canvas ROI Discrepancy**: The UI viewfinder in `PhotoUploadPanel.tsx` uses a fixed height with `object-cover` and arbitrary guide overlays, whereas `scoreCamera.ts` extracts the central 50% vertical slice of the portrait stream (`sy = 0.25 * H, sHeight = 0.50 * H`). Users often align the scoreboard visually in the viewfinder, but top/bottom digits are clipped in the actual analyzed canvas.
3. **Red Segment Detection Brittleness under Variable Parlor Lighting**: Some parlors have dim lighting or intense warm chandeliers causing camera auto-white-balance to mute red saturation, causing the strict `r > 180 && r > g * 1.6` test to miss segments. Conversely, overly relaxed global thresholds admit wooden table glare.
4. **Safety Against False Confirmations**: Automatically recording an incorrect score in competitive/financial mahjong corrupts the game. A zero false-positive auto-confirmation rate is paramount.
5. **Manual Selection Hijacking**: In `scoreCamera.ts`, `classifyTableModel` previously reassigned `currentModel = detected.model` internally even when the user intentionally chose a specific table model in `PhotoUploadPanel.tsx`.

## Desired outcomes
1. Implement diagnostic metadata collection in `scoreCamera.ts` and upload it alongside recorded video as a `.json` sidecar sharing the same `captureId`.
2. Align viewfinder aspect ratio and boundary guides in `PhotoUploadPanel.tsx` with the exact ROI extraction logic in `scoreCamera.ts` (central 50% for portrait, inner 80% boundary guide).
3. Introduce an adaptive red dominance fallback `R - max(G, B)` with bounded Otsu thresholding for failed frames, preserving the strict fast path for clean frames.
4. Enforce strict multi-gate validation before auto-confirming scores: layout validity + sum verification + temporal consensus (3 frames).
5. Build an automated offline evaluation script/benchmark to evaluate recognition against real fixture videos in `research-data/` with ground truth metrics.
6. Provide an explicit "Auto" option in the table model selector and enforce that manual model selection takes absolute precedence over auto-detection throughout the scan session.

## Scope
1. `src/utils/scoreCamera.ts`: Diagnostic metadata collector, WYSIWYG ROI alignment, auto-detection override guard.
2. `src/utils/scoreRecognition.ts`: Fallback adaptive red calibration (Otsu on $R - \max(G, B)$ with bounds), pipeline stage telemetry hooks.
3. `src/components/PhotoUploadPanel.tsx`: WYSIWYG preview container with 80% boundary guide, model dropdown ("자동 감지" option + manual override lock), sidecar JSON upload integration.
4. `src/utils/mobileDropClient.ts`: Sidecar JSON payload upload support.
5. `scripts/evaluate-recognition.ts` (or `.js` / `.test.ts`): Video/image fixture evaluation suite measuring accuracy, false-positive rate, and latency.

## Non-goals
1. Transmitting continuous per-frame telemetry over the network (telemetry is captured in-memory and sent once at session end as a sidecar).
2. Heavy neural network (YOLO/WASM) models; all heuristics remain client-side, lightweight, and deterministic.
3. Loosening the auto-confirmation safety threshold; uncertainty always yields to manual input.

## Constraints and policies
1. Privacy: No persistent `deviceId` or tracking tokens; only optional browser model name if exposed by standard APIs.
2. Performance: 1st-pass recognition must execute under 5ms; adaptive fallback under 15ms.
3. Zero false-positive auto-confirmations allowed on benchmark dataset.

## Acceptance signals
1. Mobile-drop uploads include both `<captureId>.mp4` (or `.webm`) and `<captureId>.json` sidecar with stage diagnostics.
2. Viewfinder visually matches the exact 50% ROI extracted by the canvas with the 80% guide line.
3. Adaptive red fallback successfully decodes dim/washed frames where pass 1 fails without increasing false positives.
4. Manual selection of `amos_rexx3` or `amos_jp_ex` remains locked even if auto-detection sees other cues.
5. All test suites and TypeScript checks pass.

## Assumptions and open questions
- Assumption: Capturing sidecar at start, 1 failure sample, and end introduces negligible (<1MB) memory footprint.
- Open Question: What are the optimal lower/upper bounds for Otsu threshold on $R - \max(G, B)$? Preliminary range: lower bound 35, upper bound 120, to be refined against multi-device recordings.

## Decisions
- D-001: Sidecar JSON uses ISO timestamp and UUID-based `captureId`, bundled with video file drop.
- D-002: Model dropdown default is "자동 감지 (Auto)" if not previously persisted; choosing a specific model suppresses classifier completely for that session.
- D-003: Otsu fallback is only invoked when pass 1 and pass 2 yield incomplete candidates.
