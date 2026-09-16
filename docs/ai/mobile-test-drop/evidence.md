# Evidence

- Work ID: mobile-test-drop
- Artifact revision: 2
- Language: en
- Korean mirror: evidence.ko.md

## Change summary
Implemented mobile-to-PC test drop bridge connecting `PhotoUploadPanel` to local `mobile-drop` receiver via Cloudflare Quick Tunnel. Provides automatic/manual chunked drop of original video/photo files and live scan capture snapshots into `./uploads/`.

## Requirement coverage
| Requirement | Acceptance | Task | Planned proof | Result |
| --- | --- | --- | --- | --- |
| REQ-001 | AC-001 | TASK-001 | Chunk slicing, headers, complete notification unit tests | PASS |
| REQ-002 | AC-002 | TASK-001 | Health check ping unit test | PASS |
| REQ-003 | AC-003 | TASK-002 | Panel toggle and UI configuration integration test | PASS |
| REQ-004 | AC-003 | TASK-002 | URL query parameter parsing and localStorage caching test | PASS |
| REQ-005 | AC-004 | TASK-002 | Concurrent video/photo OCR and background drop upload test | PASS |
| REQ-006 | AC-005 | TASK-002 | Live scan snapshot frame and candidate scores drop | PASS |
| REQ-007 | AC-004, AC-005 | TASK-002 | Inline progress bar and error/success feedback in panel | PASS |
| REQ-008 | AC-001, AC-002 | TASK-003 | Continuous local session orchestrator script in project | PASS |
| REQ-009 | AC-007 | TASK-005 | Multi-device destination routing integration test | PASS |
| REQ-001 | AC-006 | TASK-004 | Full test suite and production build quality gate | PASS |

## Test and quality results
- `npm test -- --watchAll=false`: 12 test suites, 84 tests passed (including 9 client unit tests and 3 bridge integration tests).
- `npm run build`: Compiled successfully; `main.9cd9c268.js` (111.24 kB gzip), `0` TypeScript or ESLint errors.

## End-to-end evidence
- Automated test runs in `src/utils/mobileDropClient.test.ts` verified 8MB chunk slicing, custom PIN header propagation, error recovery, and `/upload/complete` reassembly signal.
- Integration tests in `src/components/PhotoUploadPanel.test.tsx` verified UI toggle, credential preservation in `localStorage`, and automated drop on file change.
- Orchestrator `scripts/start-test-drop.ps1` and receiver `scripts/test-drop-server.py` support continuous multi-file upload targeting `./uploads/`.

## Review findings and resolutions
- No blocking defects found. Cross-origin mixed content issue proactively mitigated via Cloudflare HTTPS tunnel.

## Deployment or handoff
- Testing utility remains developer-facing only. Does not affect production mahjong tracking routes or end users.

## Release readiness
- Overall status: READY
- Required human approvals: none; testing utility authorized and verified.
- Blocking items: none.

## Residual risks
- Tunnel requires outbound internet access to Cloudflare Quick Tunnel. If unavailable, falls back to in-memory local processing.
