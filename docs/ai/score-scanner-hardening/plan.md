# Implementation plan

## Context and target outcome
- Work ID: score-scanner-hardening
- Artifact mode: canonical
- Artifact revision: 2
- Language: en

Harden the live scoreboard OCR recognition system in `mahjong.aquaco.work` based on real parlor test results across six core pillars:
1. Diagnostic telemetry sidecar JSON (`<captureId>.json`) tracking failure stages (`frame_ready` -> `score_validated`) and camera/ROI metrics without persistent device identifiers.
2. WYSIWYG crop and viewfinder synchronization: 50% central vertical ROI for portrait video inputs with an inner 80% boundary guide.
3. Fallback adaptive red calibration (Otsu on $R - \max(G, B)$ bounded between 35 and 120) invoked only when strict fast pass fails.
4. Strict 3-gate auto-confirmation safety policy: valid spatial layout + exact sum verification + 3 consecutive frame agreement (zero false positives).
5. Quantitative benchmark framework on real recorded parlor fixtures measuring 4-score accuracy, false-positive rate (0.0%), and latency.
6. Absolute precedence for manual table model selection over auto-detection in both UI and scanner engine.

## Repository state and constraints
- React 19 / TypeScript 4.9 / Jest test runner.
- Camera and recognition engine: `scoreCamera.ts`, `scoreRecognition.ts`, `scoreStability.ts`, `scoreDraft.ts`, `PhotoUploadPanel.tsx`.
- Real test data: `research-data/rex 3/` with MP4 video and JPG scan fixtures.
- 100% client-side execution; zero image/video data transmitted to external servers except optional local mobile-drop developer sessions.

## Change map
- `src/utils/scoreDiagnostic.ts` (new): Diagnostic telemetry session recorder and stage tracking.
- `src/utils/scoreDiagnostic.test.ts` (new): Unit tests for telemetry aggregation and serialization.
- `src/utils/scoreRecognition.ts`: Add `computeOtsuRedThreshold`, adaptive red calibration pass, and telemetry instrumentation.
- `src/utils/scoreRecognition.test.ts`: Tests for adaptive red fallback under low-contrast/washed-out lighting.
- `src/utils/scoreCamera.ts`: Coordinate WYSIWYG ROI extraction, integrate diagnostic telemetry recording, enforce 3-gate confirmation, and guard manual model selection from auto-detection overwrite.
- `src/components/PhotoUploadPanel.tsx`: Update viewfinder CSS/aspect ratio to match analysis ROI with 80% boundary guide, add "자동 감지 (Auto)" dropdown option, and upload `.json` sidecar alongside video drop.
- `src/components/PhotoUploadPanel.test.tsx`: Tests for WYSIWYG guide rendering, model override precedence, and sidecar upload dispatch.
- `src/utils/mobileDropClient.ts`: Add `uploadSidecarJson` helper.
- `src/utils/scoreRecognition.benchmark.test.ts` (new): Automated quantitative benchmark testing real parlor image/video frames.

## Dependency graph and parallelization
- LANE-TELEMETRY (`TASK-001`): Build diagnostic telemetry recorder and sidecar upload transport.
- LANE-RECOGNITION (`TASK-002`): Implement adaptive Otsu red fallback in recognizer. Depends on `TASK-001` for stage metrics types.
- LANE-SCANNER (`TASK-003`): Wire WYSIWYG ROI, 3-gate auto-confirmation, and model override isolation in `scoreCamera.ts` and `PhotoUploadPanel.tsx`. Depends on `TASK-001`, `TASK-002`.
- LANE-BENCHMARK (`TASK-004`): Construct offline evaluation benchmark with real fixture frames. Depends on `TASK-002`.
- LANE-VERIFICATION (`TASK-005`): Run regression test suites, typechecks, build, and artifact validation. Depends on all tasks.

## Tasks
- TASK-001 (REQ-001, REQ-007, AC-001, AC-007), LANE-TELEMETRY: Implement diagnostic telemetry recorder in `scoreDiagnostic.ts` and sidecar upload in `mobileDropClient.ts`. Status: pending
- TASK-002 (REQ-003, AC-003), LANE-RECOGNITION: Implement 2-stage red detection with adaptive Otsu red dominance fallback and stage telemetry in `scoreRecognition.ts`. Status: pending
- TASK-003 (REQ-002, REQ-004, REQ-006, AC-002, AC-004, AC-006), LANE-SCANNER: Update `scoreCamera.ts` and `PhotoUploadPanel.tsx` with WYSIWYG 50% ROI crop/preview synchronization, 80% boundary guide, strict 3-gate auto-confirmation, and manual model override priority. Status: pending
- TASK-004 (REQ-005, AC-005), LANE-BENCHMARK: Build offline evaluation benchmark `src/utils/scoreRecognition.benchmark.test.ts` across real test fixtures and recorded frames measuring 4-score accuracy, false positive rate (0.0%), and latency. Status: pending
- TASK-005 (NFR-001, NFR-002, NFR-003), LANE-VERIFICATION: Run full regression test suite, typecheck, build validation, and artifact chain verification. Status: pending

```sdlc-routing
{
  "schema": "sdlc-routing/v1",
  "task_ids": ["TASK-001", "TASK-002", "TASK-003", "TASK-004", "TASK-005"],
  "lanes": [
    {
      "id": "LANE-TELEMETRY",
      "tasks": ["TASK-001"],
      "capability_tier": "standard",
      "reasoning_floor": "medium",
      "risk": "standard",
      "rationale": "Lightweight diagnostic session recorder and JSON sidecar transport.",
      "required_capabilities": ["typescript", "telemetry"]
    },
    {
      "id": "LANE-RECOGNITION",
      "tasks": ["TASK-002"],
      "capability_tier": "advanced",
      "reasoning_floor": "high",
      "risk": "standard",
      "rationale": "Computer vision thresholding with Otsu histogram analysis on red dominance and geometry filtering.",
      "required_capabilities": ["computer-vision", "algorithm-design"]
    },
    {
      "id": "LANE-SCANNER",
      "tasks": ["TASK-003"],
      "capability_tier": "advanced",
      "reasoning_floor": "high",
      "risk": "standard",
      "rationale": "WYSIWYG camera preview/ROI coordinate alignment, 3-gate safety consensus logic, and model override isolation.",
      "required_capabilities": ["react", "camera-apis", "ui-ux"]
    },
    {
      "id": "LANE-BENCHMARK",
      "tasks": ["TASK-004"],
      "capability_tier": "standard",
      "reasoning_floor": "medium",
      "risk": "standard",
      "rationale": "Automated quantitative benchmark runner evaluating real recorded parlor fixtures.",
      "required_capabilities": ["jest-testing", "benchmarking"]
    },
    {
      "id": "LANE-VERIFICATION",
      "tasks": ["TASK-005"],
      "capability_tier": "standard",
      "reasoning_floor": "medium",
      "risk": "standard",
      "rationale": "Full test suite, typecheck, build, and artifact synchronization validation.",
      "required_capabilities": ["regression-testing", "code-review"]
    }
  ]
}
```

## TDD sequence
1. Implement `scoreDiagnostic.test.ts` testing telemetry initialization, stage recording, and JSON sidecar formatting.
2. Implement `src/utils/scoreDiagnostic.ts`.
3. Add unit test cases in `scoreRecognition.test.ts` for adaptive Otsu red dominance calibration on washed/dim frames.
4. Implement `computeOtsuRedThreshold` and adaptive fallback in `src/utils/scoreRecognition.ts`.
5. Update `scoreCamera.test.ts` to test 50% ROI calculation, manual model selection persistence, and 3-gate auto-confirmation.
6. Update `PhotoUploadPanel.test.tsx` to verify viewfinder 80% boundary guide, "자동 감지" selector option, and sidecar upload dispatch.
7. Implement `scoreRecognition.benchmark.test.ts` to verify 0.0% false positive auto-confirmation rate on real parlor fixture samples.
8. Execute regression checks: `npx tsc --noEmit` and `npm test -- --watchAll=false --forceExit`.

## End-to-end scenarios
1. **Clean lighting scan**: Camera opens in portrait mode with WYSIWYG 50% ROI and 80% guide; strict 1st pass decodes 4 scores in <2ms; 3 consecutive frames verify sum (100,000 pts); shutter flashes and scores auto-populate without activating adaptive fallback.
2. **Dim/challenging lighting scan**: Strict 1st pass fails to decode; adaptive Otsu red dominance fallback activates, extracts segments within clamped bounds, and reaches 3-frame consensus; sidecar JSON records stage transitions and exit reason `consensus_achieved`.
3. **Ambiguous/partial scan**: User covers one seat; digit count is 3 and sum fails; 3-gate safety prevents auto-confirmation; UI guides user to adjust or enter manually; sidecar JSON records exit reason `canceled` with failure stage `score_validated`.
4. **Manual model selection override**: User manually selects `amos_rexx3`; camera frame pre-classifier does not alter `currentModel`; REXX 3 recognition runs continuously without interruption.
5. **Mobile-drop test upload**: Mobile test session finishes; video file (`rex3_scan_...mp4`) and sidecar telemetry (`rex3_scan_...json`) are both uploaded to the workstation.

## Quality gates
- `npx tsc --noEmit`
- `npm test -- --watchAll=false --forceExit`
- `npm run build`
- `& 'C:\Users\AquaCo\.codex\skills\ai-native-sdlc\scripts\validate-artifact-chain.ps1' -ArtifactDirectory docs/ai/score-scanner-hardening`

## Risks, migration, and rollback
- **Risk**: Otsu thresholding on noisy background might introduce stray red noise pixels.
- **Mitigation**: Clamped threshold limits [35, 120] and existing connected-component digit bounding box geometry filters (aspect ratio, height, minimum pixel area) discard non-digit clusters.
- **Risk**: Viewfinder CSS changes causing layout shift on diverse screen sizes.
- **Mitigation**: Responsive aspect-ratio container with CSS letterboxing matching `videoWidth / (videoHeight * 0.5)` dynamically once metadata is loaded.
- **Rollback**: Git revert of modified files cleanly restores previous behavior without state or schema corruption.

## Completion proof
- `evidence.md` will document test execution outputs, benchmark scores, requirement traceability, and release readiness.

## Progress log
- 2026-09-27: Completed Phase 1 pre-implementation specification, architectural design, and verification contract based on user's 6 field improvement rules.
