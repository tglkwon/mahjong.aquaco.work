# Evidence
## Change summary
Replaced PhotoUploadPanel placeholder with bounded native media extraction, red seven-segment candidates, per-frame selection, manual correction, explicit unit/total/player checks and human confirmation. Confirmed Game records retain string-array scores, unique IDs, player mapping and existing share codec. Main/sidebar expose the beta. Original media and frames remain transient browser memory.
## Requirement coverage
| Requirement / acceptance | Task | Proof | Result |
| --- | --- | --- | --- |
| REQ-001 / AC-001 | TASK-001,004 | scoreMedia tests; browser-results.json five-frame native H.264 derivative and original JPG | PASS; native HEVC caveat below |
| REQ-002 / AC-001 | TASK-002,003 | scoreRecognition tests on actual frames 0,64,129,232 and full RGB frame129; browser source-derived video/photo | PASS |
| REQ-003 / AC-002 | TASK-003,004 | scoreDraft tests; PhotoUploadPanel tests; browser mismatch/check/confirm | PASS |
| REQ-004 / AC-003 | TASK-001,003,004 | six lifecycle/privacy tests, canceled stale job test; browser HTTP request count 0 during original and derived media processing | PASS |
| REQ-005 / AC-002, AC-004 | TASK-004, TASK-005 | page loaded-record/mapping/delete/share/startingScore tests; existing Integration, tieHandling, shareState suites; tsc/build | PASS |
## Test and quality results
- Red: `node node_modules/react-scripts/bin/react-scripts.js test --watchAll=false --runInBand --runTestsByPath src/utils/scoreDraft.test.ts src/components/PhotoUploadPanel.test.tsx` failed for missing validator and missing review UI (three expected behavior failures).
- Green/final: `node node_modules/react-scripts/bin/react-scripts.js test --watchAll=false --runInBand --silent`: 9 suites, 33 tests passed.
- `node node_modules/typescript/bin/tsc --noEmit`: passed.
- `node node_modules/react-scripts/bin/react-scripts.js build`: compiled successfully; main gzip 103.28 kB. Existing Browserslist data-age warning only.
- Initial npm wrapper swallowed Jest switches; used direct react-scripts entry point. Sandbox blocked build/browser child processes with EPERM; approved tool escalation completed both checks. No dependency changes.
- Artifact validator: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:/Users/AquaCo/.codex/skills/ai-native-sdlc/scripts/validate-artifact-chain.ps1 -ArtifactDirectory docs/ai/mobile-score-recognition`.
## End-to-end evidence
Repro: build, generate sample fixtures with `python tools/create_score_fixtures.py`; optionally `python tools/create_browser_score_sample.py` on Windows with OpenCV Media Foundation H.264 encoder; then `node tools/verify_score_mvp.cjs <path-to-playwright-module>`.

Actual command: `node tools/verify_score_mvp.cjs C:/Users/AquaCo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`.

[Browser results](browser-results.json) and [390px review screenshot](mobile-sample-review.png). Installed Edge/Chromium in mobile emulation; no physical phone or Safari test available. Source: research-data/rex 3/PXL_20260902_054136311.mp4, 26,971,299 bytes, HEVC, 258 frames, 1920×1080, ~10.749 seconds. Original unchanged.

The original HEVC container decoded audio but videoWidth remained 0 in this browser. The app correctly fell back to editable manual input, with no HTTP requests. This is **not** a claim of original HEVC auto-recognition in this environment. Native successful video extraction was tested using an offline H.264 derivative retaining all 258 original frames; it is only a validation fixture. Original extracted JPG and source RGB fixtures also pass.

Actual values left/top/right/bottom: 0026 / 0606 / 0266 / 102 → 2600 / 60600 / 26600 / 10200 points; sum 100000. Bottom rank digit excluded. Browser verified five frame buttons, no pre-confirm append, bad total blocked, re-review after edits, one append, share URL reload, last-row deletion, photo recognition, broken-video manual recovery, no horizontal overflow, no page errors and zero HTTP requests during media processing.
## Review findings and resolutions
Independent reviewer (review agent, not author) found two P2 issues:
1. Last photo record could not be removed due to general Table baseline-row assumption. Fixed with optional allowDeleteLast used only on photo page; page and browser deletion tests pass.
2. Safe integer inputs could exceed doubled zigzag sharing range. Bounded normalized values to MAX_SAFE_INTEGER/2; regression input now rejected.
Root additionally preserved loaded startingScore (30000 → 120000 initial total) and tested unchanged share metadata. No unresolved high/critical findings.
Final independent delta review verified the fixes read-only and reported no remaining blocker.
## Deployment or handoff
Local implementation only. Route `/set_score_photo`, accessible from home/sidebar. No deployment, commits, uploads or external messages. Shared links include only confirmed scores/names/settings; no file names, pixels or recognition drafts. Existing untracked source research files/tools retained.
## Release readiness
Overall status: READY
Scope: native-browser-supported media MVP with mandatory human review and manual fallback. No additional human approval required for local changes; production deployment not requested.
## Residual risks
- Original HEVC recognition requires a browser/device that can decode HEVC video; installed Edge test environment cannot. Use a scoreboard photo or enter manually there. No built-in transcoding/WASM added.
- Limited to red REXX-style four-display layout, upright and sufficiently large digits. Generic OCR, tilted/rotated layouts and negative-sign recognition are not supported; manually enter negative scores. Confidence is a conservative candidate indicator, not a calibrated accuracy probability.
- LED ghosting, occlusion and reflections can produce valid but wrong digits. Sum validation alone cannot guarantee correctness; source, unit and player confirmation remain mandatory.
- Native media dimension/size bounds reduce working memory, but original image decode memory depends on browser. Cancel/timeout releases sources.
- Existing app uses external font/Tailwind assets at page load. Feature adds no network calls; media-processing phase tested at zero HTTP requests.
- New detailed MVP panel controls are Korean; existing route titles/descriptions remain translated. Physical iOS/Android compatibility remains untested.
