# Implementation plan
## Context and target outcome
Implement spec revision 1: local media to four reviewed scores to confirmed Game without touching general score/share behavior.
Revision 2 records native HEVC limitation observed in browser testing; original source fallback and same-source H.264 derivative cover the two native-decoder branches. Media/recognizer interfaces unchanged; completed rev1 agent work remains applicable.
## Repository state and constraints
React 19 / CRA / TypeScript 4.9 / Jest. Existing untracked research-data and tools belong to user. No repository AGENTS.md discovered.
## Change map
scoreMedia.ts/tests: frame lifecycle. scoreRecognition.ts/tests/fixtures: red LED candidates. scoreDraft.ts/tests: validation. PhotoUploadPanel.tsx/tests: review. ScorePhotoInputPage.tsx/tests: append and compatibility. Existing codec unchanged.
## Dependency graph and parallelization
TASK-001 media agent and TASK-002 recognition agent run independently against frozen interfaces in spec rev1. Root TASK-003 validation/panel integrates both, then TASK-004 page/regression, then TASK-005 independent review.
## Tasks
- TASK-001 (REQ-001, REQ-004, AC-001, AC-003), media agent, no dependencies: native local extraction with cleanup and tests. Done.
- TASK-002 (REQ-002, AC-001), sample agent, no dependencies: inspect real sample, implement decoder and real fixture tests. Done.
- TASK-003 (REQ-003, REQ-004, AC-002, AC-003), root, depends TASK-001/TASK-002: validation tests first, editable review and cancellation. Done.
- TASK-004 (REQ-005, AC-002, AC-004), root, depends TASK-003: safe append integration, regression tests, browser test, type/build. Done.
- TASK-005 (all requirements/acceptance), independent reviewer, depends TASK-004: review diff and evidence, root fixes findings. Done; final delta review found no remaining blocker.
## TDD sequence
Fail pure draft-validation and confirmation tests, implement, run focused then full suite. Decoder exploratory work uses actual pixel evidence plus synthetic negative tests. Media tests mock native lifecycle; browser validation checks real decoder behavior.
## End-to-end scenarios
Real sample select, extracted preview, candidates, target/unit mismatch blocked, correction/manual entry, confirmation adds one row. Photo path, unsupported file recovery. Existing hash-loaded rows retained and IDs unique.
## Quality gates
Focused tests, tsc, all Jest tests, browser sample journey, production build, independent review, artifact validator.
## Risks, migration, and rollback
LED multiplex/ghosting can misread digits; never auto-confirm. Browser codecs vary; manual fallback. No data migration. Revert feature source files to rollback without altering saved Game format.
## Completion proof
evidence.md will map every requirement/acceptance to command results and actual sample evidence.
## Progress log
2026-09-05: inspected application and sample, froze interfaces, delegated independent media/recognition lanes.
2026-09-05: TASK-001/002/003/004 implemented. Added photo normal-share round trip and distinct participant mapping; enabled main/sidebar entry. Independent TASK-005 review identified last-row deletion and codec number-range issues; both fixed with regression checks. Full 32 tests and tsc passed, build passed. Browser testing identified native HEVC videoWidth=0; compatible same-source fixture covers native video path.
