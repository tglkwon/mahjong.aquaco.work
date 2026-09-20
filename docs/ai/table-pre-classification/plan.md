# Implementation plan

## Context and target outcome
- Work ID: table-pre-classification
- Artifact mode: canonical
- Artifact revision: 2
- Language: en

Implement an automated mahjong table model pre-classifier (`classifyTableModel`) to automatically detect whether a camera frame shows an AMOS REXX 3 or an AMOS JP-EX table (via CHECK LED color and location). Integrate this into `scoreCamera.ts` and `PhotoUploadPanel.tsx` so the UI automatically syncs with the detected table model while allowing manual user override.

## Repository state and constraints
- React 19 / TypeScript 4.9 / Jest.
- Existing tests: `scoreRecognition.test.ts`, `scoreCamera.test.ts`, `PhotoUploadPanel.test.tsx`.
- Client-side only Canvas/pixel processing; zero external dependencies.

## Change map
- `src/utils/tableClassifier.ts`: Implement `classifyTableModel` with green vs amber LED color/quadrant detection.
- `src/utils/tableClassifier.test.ts`: TDD unit tests with real REXX 3 and JP-EX fixtures.
- `src/utils/scoreCamera.ts`: Add `onModelDetected` to `ScanOptions` and evaluate pre-classifier during initial frame acquisition.
- `src/components/PhotoUploadPanel.tsx`: Auto-sync detected model to `tableModel` state, display auto-detection badge, and disable auto-sync on manual dropdown override.
- `src/components/PhotoUploadPanel.test.tsx`: Integration tests for auto-detection and manual override precedence.

## Dependency graph and parallelization
- LANE-CLASSIFIER (`TASK-001`, `TASK-002`): Core pre-classifier algorithm and unit tests.
- LANE-INTEGRATION (`TASK-003`, `TASK-004`): Camera scan loop callback and UI auto-sync / manual override. Depends on `TASK-001`.
- LANE-VERIFICATION (`TASK-005`): Full regression test suite, TypeScript check, and production build. Depends on `TASK-002`, `TASK-004`.

## Tasks
- TASK-001 (REQ-001, REQ-002, REQ-003, REQ-004, AC-001, AC-002, AC-003), LANE-CLASSIFIER: Implement `classifyTableModel` in `tableClassifier.ts`. Status: pending
- TASK-002 (REQ-001, AC-001, AC-002, AC-003), LANE-CLASSIFIER: Create `tableClassifier.test.ts` with real REXX 3 and JP-EX fixtures. Status: pending
- TASK-003 (REQ-005, AC-004), LANE-INTEGRATION: Add `onModelDetected` to `ScanOptions` in `scoreCamera.ts`. Status: pending
- TASK-004 (REQ-006, AC-004), LANE-INTEGRATION: Connect auto-detection to `PhotoUploadPanel.tsx` with manual override precedence and tests. Status: pending
- TASK-005 (NFR-001, NFR-002), LANE-VERIFICATION: Run full regression test suite, typecheck, and build. Status: pending

```sdlc-routing
{
  "schema": "sdlc-routing/v1",
  "task_ids": ["TASK-001", "TASK-002", "TASK-003", "TASK-004", "TASK-005"],
  "lanes": [
    {
      "id": "LANE-CLASSIFIER",
      "tasks": ["TASK-001", "TASK-002"],
      "capability_tier": "advanced",
      "reasoning_floor": "high",
      "risk": "standard",
      "rationale": "Color-space thresholding (HSV green vs amber) and quadrant geometry heuristics require careful computer vision calibration.",
      "required_capabilities": ["computer-vision", "jest-testing"]
    },
    {
      "id": "LANE-INTEGRATION",
      "tasks": ["TASK-003", "TASK-004"],
      "capability_tier": "standard",
      "reasoning_floor": "medium",
      "risk": "standard",
      "rationale": "Integrating callback into camera frame sampling loop and UI state management with manual override protection.",
      "required_capabilities": ["react", "ui-forms"]
    },
    {
      "id": "LANE-VERIFICATION",
      "tasks": ["TASK-005"],
      "capability_tier": "advanced",
      "reasoning_floor": "high",
      "risk": "standard",
      "rationale": "Comprehensive regression testing across all 15 suites and production build validation.",
      "required_capabilities": ["code-review", "regression-testing"]
    }
  ]
}
```

## TDD sequence
1. Write failing tests in `tableClassifier.test.ts` against real REXX 3 and JP-EX fixture frames.
2. Implement `tableClassifier.ts` with green top-left and amber top-right LED detectors until tests pass.
3. Update `scoreCamera.test.ts` to assert `onModelDetected` is called when a model is identified.
4. Update `PhotoUploadPanel.test.tsx` to assert model dropdown syncs automatically and manual override works.
5. Run full test suite (`npm test`) and production build (`npm run build`).

## End-to-end scenarios
1. User starts camera on an AMOS JP-EX table. The classifier detects the amber CHECK LED on the top-right, fires `onModelDetected('amos_jp_ex')`, switches the dropdown to JP-EX, and shows "✨ 자동 감지됨: AMOS JP-EX".
2. User starts camera on an AMOS REXX 3 table. The classifier detects the green CHECK LED on the top-left, keeping or setting the model to REXX 3.
3. User manually selects a model from the dropdown. Auto-detection is suppressed for the rest of the scan, honoring user choice.

## Quality gates
- `npx tsc --noEmit`
- `npm test -- --watchAll=false --forceExit`
- `npm run build`
- `scripts/validate-artifact-chain.ps1 -ArtifactDirectory docs/ai/table-pre-classification`

## Risks, migration, and rollback
- **Risk**: Ambient reflections or colored parlor lights could false-trigger LED detection.
- **Mitigation**: Strict saturation/brightness thresholds, relative quadrant position checks, and requiring minimum cluster pixel count.
- **Rollback**: Reverting `PhotoUploadPanel.tsx` and `scoreCamera.ts` restores manual-only selection.

## Completion proof
- `evidence.md` will record all test logs, execution outputs, and coverage for `REQ-001`~`006` and `TASK-001`~`005`.

## Progress log
- 2026-09-20: Formulated intent, spec, and plan based on live parlor testing feedback where JP-EX was scanned under REXX 3 mode.
