# Specification

## Metadata and source
- Work ID: scan-umaoka-input-unification
- Artifact revision: 2
- Language: en
- Korean mirror: spec.ko.md
- Source: intent.md revision 2

## Summary
Unify the real-time score scanning input UI into the Uma/Oka table interface as the single source of manual entry and fine-tuning, remove duplicate input forms and confirm buttons from `PhotoUploadPanel.tsx`, and dynamically bind the target total sum to `startingScore * 4` across recognition and commitment gates.

## Functional requirements
- REQ-001 must: Stream finalized scores from real-time recognition in `PhotoUploadPanel.tsx` directly into the editable active round of `UmaOkaTable.tsx` via a dedicated callback, eliminating the redundant `<fieldset>` input form and duplicate confirm button from `PhotoUploadPanel.tsx`.
- REQ-002 must: Bind target total score dynamically to `startingScore * 4` (default `25000 * 4 = 100000`), ensuring any user change to `startingScore` instantly updates the consensus sum validation in `PhotoUploadPanel.tsx` and the record commitment gate in `ControlPanel.tsx`.
- REQ-003 must: Preserve full manual editing capabilities within `UmaOkaTable.tsx`, including direct numeric typing, `±1000` increment/decrement buttons, player seat assignment, and instant Uma/Oka ranking point calculations.
- REQ-004 must: Centralize game score commitment and share URL generation in `ControlPanel.tsx`, verifying against the dynamic `startingScore * 4` sum before appending records.
- REQ-005 must: Maintain 100% test coverage across `PhotoUploadPanel.test.tsx`, `ScorePhotoInputPage.test.tsx`, and `App.test.tsx`, ensuring zero regressions in production builds.

## Non-functional requirements
- Zero server network transmission for the production service page.
- Real-time score reflection in under 50ms upon scan consensus completion.
- Full backward compatibility with existing `#d=` share URLs.

## User experience and flows
1. User adjusts tournament rules (e.g. `startingScore` 25,000 or 30,000) &rarr; Target total displays 100,000 or 120,000.
2. User taps "실시간 스캔 시작" on `PhotoUploadPanel.tsx` and points camera at scoreboard.
3. Upon 3-dot consensus matching the target total, the 4 scores automatically populate the East, South, West, North inputs of the active editable round in `UmaOkaTable.tsx`.
4. User inspects or tweaks scores using `UmaOkaTable.tsx` inputs or `±1000` buttons if necessary.
5. User taps "기록 추가 및 공유" in `ControlPanel.tsx` to commit the round and update shareable link.

## Architecture and interfaces
- `PhotoUploadPanel.tsx`: Focuses on slot viewfinder, consensus tracking, live HUD, and test lab PC transfer controls. Emits `onScoresRecognized?: (scores: { east: string; south: string; west: string; north: string }) => void` and accepts reactive `targetTotalScore: number`.
- `ScorePhotoInputPage.tsx`: Connects `onScoresRecognized` to populate `currentEditableGame` in `games`.
- `UmaOkaTable.tsx`: Serves as the unified interactive table for score entry and review.
- `ControlPanel.tsx`: Validates against `startingScore * 4`.

## Data and migrations
No data schema migration required. `ShareState` remains fully backward and forward compatible.

## Failure modes and edge cases
- Scoreboard total does not match `startingScore * 4`: Consensus gauge does not lock; HUD displays discrepancy; manual correction remains accessible in `UmaOkaTable.tsx`.
- Starting score changed mid-game: Recalculates expected sum and re-evaluates record addition gate immediately.

## Security, privacy, and permissions
Client-side processing only; zero image or score data leaks.

## Observability and operations
Live HUD and 3-dot consensus gauge provide continuous visual feedback during camera stream.

## Test strategy
1. Unit tests in `PhotoUploadPanel.test.tsx` verifying callback emission on consensus and absence of duplicate input fieldset.
2. Integration tests in `ScorePhotoInputPage.test.tsx` verifying scanned scores immediately populate `UmaOkaTable.tsx` and that changing `startingScore` updates target sum.
3. Full test pass with `npm test -- --watchAll=false` and production build verification with `npm run build`.

## Acceptance criteria
- AC-001: Scanned scoreboard readings directly populate the East, South, West, North inputs in `UmaOkaTable.tsx` without duplicate intermediate forms.
- AC-002: `PhotoUploadPanel.tsx` retains camera slot, consensus gauge, live HUD, and PC bridge, while its redundant input fieldset and duplicate confirm button are removed.
- AC-003: Modifying `startingScore` dynamically adjusts the target total score (`startingScore * 4`) across scan consensus and record commitment.
- AC-004: Manual score entry, increment buttons, and seat assignment in `UmaOkaTable.tsx` operate seamlessly on recognized scores.
- AC-005: All test suites pass 100% and production build succeeds without errors.

## Traceability
Unified input outcome &rarr; REQ-001, REQ-003 &rarr; AC-001, AC-002, AC-004. Dynamic target score outcome &rarr; REQ-002, REQ-004 &rarr; AC-003. Overall verification &rarr; REQ-005 &rarr; AC-005.

## Open decisions
None blocking.
