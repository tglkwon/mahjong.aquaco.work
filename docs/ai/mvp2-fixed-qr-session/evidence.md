# Evidence

## Metadata
- Work ID: mvp2-fixed-qr-session
- Artifact revision: 4
- Language: en
- Korean mirror: evidence.ko.md
- Status: ready
- Risk: standard
- Created: 2026-09-18
- Updated: 2026-09-18
- Owner: AquaCo

## Change summary
Verification results for `mvp2-fixed-qr-session` (Revision 4). All planned implementation tasks (`TASK-001` through `TASK-010`), requirements (`REQ-001` through `REQ-011`), and acceptance criteria (`AC-001` through `AC-013`) are verified with all 5 quality gates passing.

## Requirement coverage
| Requirement | Acceptance Criteria | Task | Verification Method | Status |
|---|---|---|---|---|
| `REQ-001` | `AC-001` | `TASK-001` | `src/utils/clientId.test.ts` | `Passed` |
| `REQ-002` | `AC-002` | `TASK-003`, `TASK-004` | `src/components/SeatCheckinPage.test.tsx` | `Passed` |
| `REQ-003` | `AC-003` | `TASK-003`, `TASK-004` | `server/index.test.js` | `Passed` |
| `REQ-004` | `AC-004`, `AC-012` | `TASK-003`, `TASK-005` | `src/components/QueuePage.test.tsx` | `Passed` |
| `REQ-005` | `AC-006` | `TASK-006` | `src/components/ScorePhotoInputPage.test.tsx` | `Passed` |
| `REQ-006` | `AC-005` | `TASK-003`, `TASK-006` | `src/components/ScorePhotoInputPage.test.tsx` | `Passed` |
| `REQ-007` | `AC-007`, `AC-013` | `TASK-003`, `TASK-007` | `src/components/ScorePhotoInputPage.test.tsx` | `Passed` |
| `REQ-008` | `AC-008` | `TASK-002`, `TASK-003` | `server/db.test.js` | `Passed` |
| `REQ-009` | `AC-009` | `TASK-008` | `scripts/setup-backend-service.sh` | `Passed` |
| `REQ-010` | `AC-010` | `TASK-009` | `scripts/cleanup-test-artifacts.sh` | `Passed` |
| `REQ-011` | `AC-011` | `TASK-003`, `TASK-004` | `src/components/SeatCheckinPage.test.tsx` | `Passed` |

## Test and quality results
- Gate 1 (TypeScript check): `npx tsc --noEmit` - `Passed` (0 errors)
- Gate 2 (Frontend unit tests): `npm test -- --watchAll=false --forceExit` - `Passed` (15 suites, 104 tests passed)
- Gate 3 (Backend API tests): `npm --prefix server test` - `Passed` (2 suites, 8 tests passed)
- Gate 4 (Production build): `npm run build` - `Passed` (Compiled successfully, 117.56 kB gzip)
- Gate 5 (Artifact sync check): `scripts/validate-artifact-chain.ps1 -ArtifactDirectory docs/ai/mvp2-fixed-qr-session` - `Passed`

## End-to-end evidence
- Scenario 1 & 2: `src/components/SeatCheckinPage.test.tsx` verified 1-second checkin with `client_id` and returning player nickname.
- Scenario 3: `src/components/QueuePage.test.tsx` verified 4-player 3D Mahjong wind tile seat draw.
- Scenario 4 & 5: `src/components/ScorePhotoInputPage.test.tsx` verified 2-second polling into `UmaOkaTable.tsx` and session completion on `[기록 추가 및 공유]` with `duration_seconds`.
- Scenario 6: `src/components/SeatCheckinPage.test.tsx` and `server/index.test.js` verified device reset clearing `localStorage`, redirecting to `/`, and anonymizing nickname to `reset_{epoch}` on server.

## Review findings and resolutions
- Phase 1 architectural contract reviewed against user specifications and expanded with client reset, digital seat draw, and game timing. No blocking design defects found.

## Deployment or handoff
- Target environment: AWS EC2 `t3.micro` Ubuntu host.
- Deployment script: `scripts/setup-backend-service.sh` (systemd unit `mahjong-api.service` and Apache `/api` proxy pass).

## Release readiness
- Overall status: READY
- Blockers: None

## Residual risks
- Low memory headroom on EC2 `t3.micro` requires enforcing under 150MB RSS limit for Node.js process.
- Database write lock contention prevented by mandatory WAL mode (`journal_mode = WAL`).
