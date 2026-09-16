# Implementation plan

- Work ID: live-score-scan
- Artifact revision: 1
- Language: en
- Korean mirror: plan.ko.md

## Context and target outcome
Implement the mobile live scan flow defined in intent and specification revision 1, then prove continuous recognition, one-time automatic draft capture, duplicate protection, and player mapping using existing video. Keep human final confirmation.

## Repository state and constraints
Reuse the existing REXX 3 recognizer, review component, one-seat rotation, and photo/manual input. Preserve unrelated working-tree edits. Do not deploy, activate tunnels, or claim physical phone validation.

## Change map
Camera component and media helpers: acquisition, inline video, fresh-frame scheduling and cleanup. Pure stability utility: observation validation and one-shot decision. Photo/review integration: draft handoff and explicit restart. Tests and browser tooling: real-video-derived input and reproducible evidence. Root owns implementation surfaces; this artifact lane owns only this new artifact directory.

## Dependency graph and parallelization
TASK-001 and TASK-002 are conceptually independent, integrated by root before TASK-003; TASK-003 precedes TASK-004. Artifact preparation may run in parallel with implementation. Shared contract: four ordered score observations plus assigned player identities, frame identity/time, configured expected total, and a one-shot accepted result. Root serializes overlapping application edits. Independent review begins after integration. All delegated work consumes revision 1; changed shared contracts require replanning.

## Tasks
- TASK-001 — Status: done — REQ-001 / AC-001. Dependencies: none. Owner: root. Surface: camera component and media helpers. Implement explicit rear-preferred video acquisition, errors/fallback, cancellation generations, hidden-page/unmount cleanup, and late stream disposal. Proof: lifecycle tests including delayed permission resolution.
- TASK-002 — Status: done — REQ-002 / AC-002. Dependencies: none. Owner: root. Surface: pure stability utility and tests. Validate fresh observations, sample rate, units, players, expected sum, five matches over 1000 ms, resets, and one-shot output. Proof: deterministic positive and negative state tests.
- TASK-003 — Status: done — REQ-003 / AC-003. Dependencies: TASK-001, TASK-002. Owner: root. Surface: scan and existing photo/review UI. Show live progress; capture and stop exactly once; preserve editing, mapping rotation, explicit confirmation, and restart. Proof: component and integration tests.
- TASK-004 — Status: done — REQ-004 / AC-004. Dependencies: TASK-003. Owner: root; independent reviewer owns read-only review. Surface: browser test harness and evidence. Inject a real-video-derived synthetic stream only in tests, prove recognizer-to-draft behavior, run required gates, and resolve review findings. Proof: browser logs/screenshots and recorded command results.

## TDD sequence
First run new failing tests for stability and camera lifecycle, then implement minimal state/media logic. Add UI behavior tests before wiring review handoff. Refactor only while green. Record exact red and green results; do not infer a red phase from unexecuted test code.

## End-to-end scenarios
Real REXX 3 video yields four stable scores and exactly one review draft with camera stopped; no game is recorded without confirmation. Rotation shifts each player once and four shifts restore the original mapping. Invalid or changing observations cannot capture. Cancel and hidden/unmount paths prevent later capture and dispose all tracks, including late permissions. A rescan creates a fresh session.

## Quality gates
Run focused tests, full Jest suite, TypeScript check, production build, browser scenario, independent review, bilingual structural validation, and final synchronization validation. Record unavailable checks with concrete reasons and impact. Real phone accuracy is outside this pre-visit gate.

## Risks, migration, and rollback
Repeated identical misreads may satisfy stability and total; retain human confirmation. Stale or overlapping media callbacks can leak cameras or duplicate drafts; generation guards and lifecycle tests detect this. No migration is required. Roll back only the live scan changes while preserving photo/manual fallback and unrelated local work.

## Completion proof
Every acceptance criterion maps to its task and named test or browser evidence. Evidence must include exact command outcomes, independent review resolution, and remaining mobile limitations before readiness is changed.

## Progress log
2026-09-13: revision 1 implementation and verification completed; 11 suites and 66 tests, type check, build, browser evidence and independent follow-up review passed. Physical phone testing remains deferred.
