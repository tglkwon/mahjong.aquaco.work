# Evidence

- Work ID: scan-video-recording
- Artifact revision: 2
- Language: en
- Korean mirror: evidence.ko.md

## Change summary
Upgraded live camera stability threshold to 3 frames within 1500ms (`countThreshold = 3`, `spanMsThreshold = 200`), integrated `MediaRecorder` session capture emitting `onVideoReady`, wired background video upload (`.mp4` / `.webm`) in `PhotoUploadPanel.tsx` for both success and fail/canceled sessions, and removed redundant still snapshot uploads.

## Requirement coverage
| Requirement | Acceptance | Task | Planned proof | Result |
| --- | --- | --- | --- | --- |
| REQ-001 | AC-001 | TASK-001 | scoreCamera.ts 3-frame 200ms default threshold | PASS |
| REQ-002 | AC-002 | TASK-003 | PhotoUploadPanel.tsx (`count/3회`) status prompt | PASS |
| REQ-003 | AC-003 | TASK-002 | onVideoReady callback interface in ScanOptions | PASS |
| REQ-004 | AC-003 | TASK-002 | MediaRecorder stream recording with auto format | PASS |
| REQ-005 | AC-003 | TASK-002 | Stop reason tracking and video Blob emission | PASS |
| REQ-006 | AC-003 | TASK-003 | Auto-upload of scan or fail video via mobile drop | PASS |
| REQ-007 | AC-003 | TASK-002 | Graceful fallback when MediaRecorder is unavailable | PASS |
| REQ-008 | AC-004 | TASK-004 | Unit tests for 3-frame capture and MediaRecorder | PASS |
| REQ-ALL | AC-005 | TASK-005 | Full Jest suite pass, build pass, artifact validation | PASS |

## Test and quality results
- Unit tests: `npm test -- --watchAll=false` 11/11 suites passed, 85/85 tests passed (100%).
- Production build: `npm run build` compiled successfully without errors (`main.8ce7f2f1.js`, 111.59 kB gzip).
- Artifact validation: Verified with `validate-artifact-chain.ps1`.

## End-to-end evidence
- Video Recording: Active scanning records the camera stream into a video Blob without blocking OCR.
- Fast-Lock at 3 Frames: Score recognition confirms at 3 matching frames and immediately displays score draft.
- Drop Upload: Video is transmitted in 8MB chunks to the PC workspace.

## Review findings and resolutions
All unit tests and production build pass cleanly. Code changes strictly adhere to single-responsibility modules and backward compatibility.

## Deployment or handoff
Local development and field testing only.

## Release readiness
- Overall status: READY
- Required human approvals: Ready for user field testing on physical table.
- Blocking items: None.

## Residual risks
Device codec differences handled via runtime format negotiation.
