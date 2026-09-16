# Evidence

- Work ID: live-score-scan
- Artifact revision: 1
- Language: en
- Korean mirror: evidence.ko.md

## Change summary
Implemented REXX 3 live camera scanning, bounded fresh-frame recognition, stable single capture, camera cleanup, editable review and explicit human confirmation. Photo/manual fallback and player rotation remain available.

## Requirement coverage
| Requirement | Acceptance | Task | Planned proof | Result |
| --- | --- | --- | --- | --- |
| REQ-001 | AC-001 | TASK-001 | Camera lifecycle, late permission, hidden/unmount tests | PASS |
| REQ-002 | AC-002 | TASK-002 | Stability, native/fallback fresh-frame scheduling, total/unit/player and duplicate tests | PASS |
| REQ-003 | AC-003 | TASK-003 | Review, rotation, confirmation and shared record tests | PASS |
| REQ-004 | AC-004 | TASK-004 | Final-build real-video browser scenario, automated gates, independent review | PASS |

## Test and quality results
Final outcomes supplied by the implementation owner:

- `node node_modules/react-scripts/bin/react-scripts.js test --watchAll=false --runInBand --silent`: exit 0; 11 suites, 66 tests passed, including 12 camera, 8 stability and 13 panel tests.
- `npx tsc --noEmit`: exit 0.
- `npm run build`: exit 0; `main.3707ae10.js`, 106.76 kB gzip. Initial sandbox `EPERM` was resolved by approved escalation; build was not waived.
- `node tools/verify_live_score_scan.cjs`: exit 0 against the final build.

Red phase: stability and camera tests failed on missing implementation modules; two new UI tests failed on the missing scan button before implementation.

## End-to-end evidence
390×844 Edge/Chromium mobile emulation used `research-data/rex 3/inspection/browser-sample-h264.mp4`, the existing H264 derivative of `PXL_20260902_054136311.mp4`. Test-only `getUserMedia` injection supplied real frames through `video.captureStream`; the actual pixel recognizer was unmocked. No product debug API was added.

Evidence: `docs/ai/live-score-scan/live-scan-browser-results.json`, `docs/ai/live-score-scan/live-scan-auto-capture.png`, `docs/ai/live-score-scan/live-scan-record-shared.png`, `docs/ai/live-score-scan/live-scan-total-mismatch.png`. The browser JSON was independently read; root visually inspected capture. Capture and mismatch layouts had no horizontal overflow.

Candidates 102 / 0266 / 0606 / 0026 yielded exactly one snapshot and stopped tracks. No record existed before human confirmation. One shift produced player-ordered recorded/shared points 2600 / 10200 / 26600 / 60600; four shifts restored mapping. Repeat confirmation created no duplicate. Wrong total blocked capture for five seconds. Permission-denied manual recovery, explicit stop and late permission cleanup passed. Zero page errors and zero uploads; three local fixture GETs were test-harness reads only.

## Review findings and resolutions
Independent review found one low-severity issue: synchronous unsupported-camera failure left a stale disposer that could overwrite the recovery message later. A current-session token guard and regression test resolved it. Follow-up review found no blockers. Added coverage includes native frame callbacks, pending playback cancellation, watchdog/late streams, mute, nondefault total, invalid unit/players, hidden page and unmount.

## Deployment or handoff
Local work only. No deployment or tunnel activation occurred. Source/derivative above supports repeatable desktop verification; remaining shop testing requires an actual phone camera.

## Release readiness
- Overall status: READY
- Required human approvals: none for the authorized local implementation and pre-visit checks; explicit user confirmation remains required for each score record in the product.
- Blocking items: none within authorized local implementation and pre-visit verification. This readiness does not claim production deployment or physical-device acceptance.

## Residual risks
Not run: physical phone, Safari and shop tests, explicitly deferred because the user cannot visit today. Real-phone camera permissions, autofocus, LED bloom, performance and shop lighting remain unverified. Stable repeated wrong readings may pass the total check; retain review. Desktop video evidence is not real-device accuracy evidence.
