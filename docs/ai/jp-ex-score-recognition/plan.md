# Implementation plan

## Context and target outcome
- Work ID: jp-ex-score-recognition
- Artifact mode: canonical
- Artifact revision: 2
- Language: en

Implement AMOS JP-EX scoreboard recognition based on real parlor data from Yeokgok (`202305 역곡/KakaoTalk_20230528_2.jpg`). Correct the digit grouping lower bound in `scoreRecognition.ts` to support 2-digit scores under 10,000 points, create real ground-truth fixtures replacing the fake REXX 3 reuse test, and route the table model through `scoreCamera.ts` and `PhotoUploadPanel.tsx`.

## Repository state and constraints
- React 19 / TypeScript 4.9 / Jest.
- Existing tests: `scoreRecognition.test.ts`, `scoreCamera.test.ts`, `PhotoUploadPanel.test.tsx`.
- Client-side only Canvas processing; zero external data leakage.

## Change map
- `src/utils/scoreRecognition.ts`: Update `groups.filter(g => g.length >= 2 && g.length <= 4)` and ensure Diamond layout parsing handles 2-digit scores.
- `src/utils/scoreRecognition.test.ts` & fixtures: Add real JP-EX fixture generated from `KakaoTalk_20230528_2.jpg` (`['220', '483', '200', '97']`).
- `src/utils/scoreCamera.ts`: Add `model?: TableModel` to `ScanOptions` and pass it to `recognizeScoreboard`.
- `src/components/PhotoUploadPanel.tsx`: Add UI selector for table model (`amos_rexx3` vs `amos_jp_ex`) and pass selected model to camera and recognizer.

## Dependency graph and parallelization
- LANE-RECOGNITION (`TASK-001`, `TASK-002`): Core recognition algorithm and test fixture generation.
- LANE-INTEGRATION (`TASK-003`, `TASK-004`): Camera options and UI model selection dropdown, depends on `TASK-001`.
- LANE-VERIFICATION (`TASK-005`): Regression test suite and build verification, depends on `TASK-002` and `TASK-004`.

## Tasks
- TASK-001 (REQ-001, AC-001), LANE-RECOGNITION: Fix digit run filter to `g.length >= 2 && g.length <= 4` in `scoreRecognition.ts`. Status: done
- TASK-002 (REQ-002, REQ-003, AC-002), LANE-RECOGNITION: Generate real JP-EX fixture from `KakaoTalk_20230528_2.jpg` and update `scoreRecognition.test.ts`. Status: done
- TASK-003 (REQ-004, AC-003), LANE-INTEGRATION: Add `model?: TableModel` to `ScanOptions` in `scoreCamera.ts`. Status: done
- TASK-004 (REQ-004, AC-003), LANE-INTEGRATION: Add table model selector in `PhotoUploadPanel.tsx`. Status: done
- TASK-005 (REQ-005, AC-004), LANE-VERIFICATION: Run full test suite, build, and verify non-regression. Status: done

```sdlc-routing
{
  "schema": "sdlc-routing/v1",
  "task_ids": ["TASK-001", "TASK-002", "TASK-003", "TASK-004", "TASK-005"],
  "lanes": [
    {
      "id": "LANE-RECOGNITION",
      "tasks": ["TASK-001", "TASK-002"],
      "capability_tier": "advanced",
      "reasoning_floor": "high",
      "risk": "standard",
      "rationale": "Core OCR digit segmentation, Diamond layout geometry, and real JP-EX clean fixtures require careful vision algorithm tuning.",
      "required_capabilities": ["vision-algorithm", "jest-testing", "fixture-generation"]
    },
    {
      "id": "LANE-INTEGRATION",
      "tasks": ["TASK-003", "TASK-004"],
      "capability_tier": "standard",
      "reasoning_floor": "medium",
      "risk": "standard",
      "rationale": "Camera scan options and UI model selection dropdown routing.",
      "required_capabilities": ["react", "ui-forms"]
    },
    {
      "id": "LANE-VERIFICATION",
      "tasks": ["TASK-005"],
      "capability_tier": "advanced",
      "reasoning_floor": "high",
      "risk": "standard",
      "rationale": "Comprehensive regression testing and quality gate verification.",
      "required_capabilities": ["code-review", "regression-testing"]
    }
  ]
}
```

## TDD sequence
1. Write failing test in `scoreRecognition.test.ts` for 2-digit score `97` on JP-EX and real Yeokgok fixture.
2. Update `scoreRecognition.ts` filter to `g.length >= 2 && g.length <= 4` and verify test turns green.
3. Update `scoreCamera.ts` and `PhotoUploadPanel.tsx` tests to verify model routing.
4. Run full test suite (`npm test`) and production build (`npm run build`).

## End-to-end scenarios
1. User selects AMOS JP-EX table model in `PhotoUploadPanel`.
2. Real Yeokgok photo is processed; bottom (`220`), right (`483`), top (`200`), left (`97`) are recognized.
3. All scores are converted to 100-point units: 22,000, 48,300, 20,000, 9,700, totaling exactly 100,000 points.
4. Total passes `validateScoreDraft`, enabling confirmation.

## Quality gates
- `npx tsc --noEmit`
- `npm test -- --watchAll=false --forceExit`
- `npm run build`
- `scripts/validate-artifact-chain.ps1 -ArtifactDirectory docs/ai/jp-ex-score-recognition`

## Risks, migration, and rollback
- **Risk**: Lowering the group filter to 2 digits could theoretically capture noise boxes as digit runs if glare creates false segments.
- **Mitigation**: Layout geometry checks (Diamond/T-layout alignment) and total score sum validation (`validateScoreDraft`) reject spurious false-positive groupings.
- **Rollback**: Simple Git revert of the modified files restores original behavior.

## Completion proof
- `evidence.md` will record execution logs, test outputs, and coverage for all `REQ-*`, `AC-*`, and `TASK-*`.

## Progress log
- 2026-09-20: Discovered user photo sticker overlay vs raw hardware LED distinction. Created canonical Phase 1 artifacts (`intent.md`, `expected-outcome.html`, `spec.md`, `plan.md`, `evidence.md`).
- 2026-09-20: Executed Phase 2. Updated digit group length filter (`TASK-001`), generated real JP-EX fixture from Yeokgok photo and verified 17/17 tests (`TASK-002`), added model options to `scoreCamera.ts` and verified (`TASK-003`), added UI dropdown and guide text to `PhotoUploadPanel.tsx` and verified 16/16 tests (`TASK-004`), passed full Jest test suite (15 suites, 107 tests), TypeScript check (`npx tsc --noEmit`), and production build (`npm run build`) (`TASK-005`).
