# Implementation plan

- Work ID: ip-user-agent-rate-limit
- Artifact revision: 2
- Language: en
- Korean mirror: plan.ko.md

## Context and target outcome
The mahjong score recording web service running on AWS EC2 (`t3.micro`, 1 vCPU / 1GB RAM) must be protected against burst automated scraper and AI agent traffic to prevent CPU credit starvation, OOM kills, and service degradation for human players.
This will be achieved by:
1. Enhancing `public/.htaccess` with `mod_rewrite` rules to detect automated agent / scraper User-Agents and return HTTP 429 (`429 Too Many Requests`).
2. Providing a standalone server configuration script (`scripts/setup-apache-ratelimit.sh`) to install and configure Apache `mod_evasive` for IP rate limiting (`DOSPageCount 5`, `DOSSiteCount 50`, `DOSBlockingPeriod 10`).
3. Creating automated verification tests (`scripts/test-useragent-ratelimit.ps1`) to validate 429 blocking for scrapers while ensuring HTTP 200 for legitimate browsers.

## Repository state and constraints
- Target files:
  - `public/.htaccess`
  - `scripts/setup-apache-ratelimit.sh`
  - `scripts/test-useragent-ratelimit.ps1`
  - `README.md`
- Test files:
  - `scripts/test-useragent-ratelimit.ps1`
  - React test suite (`package.json`)
- Quality gates:
  - `node node_modules/react-scripts/bin/react-scripts.js test --watchAll=false --runInBand --silent`
  - `npm run build`
  - `pwsh.exe -NoProfile -ExecutionPolicy Bypass -File C:\Users\AquaCo\.codex\skills\ai-native-sdlc\scripts\validate-artifact-chain.ps1 -ArtifactDirectory docs/ai/ip-user-agent-rate-limit`

## Change map
- `public/.htaccess`:
  - Insert `RewriteCond %{HTTP_USER_AGENT}` rules targeting known scraper/crawler bots (`curl`, `python`, `aiohttp`, `scrapy`, `puppeteer`, `playwright`, `headlesschrome`, `bytespider`, `gptbot`, `claudebot`).
  - Return HTTP 429 (`[R=429,L]`) for matching requests.
  - Maintain existing SPA rewrite rules (`RewriteRule . /index.html [L]`).
- `scripts/setup-apache-ratelimit.sh`:
  - Shell script to install `libapache2-mod-evasive`, configure `/etc/apache2/mods-available/evasive.conf`, create log directories, and reload Apache.
- `scripts/test-useragent-ratelimit.ps1`:
  - Automated test script simulating HTTP requests with various User-Agent headers to verify status codes (200 vs 429).
- `README.md`:
  - Add documentation section explaining rate limiting architecture, configuration thresholds, and whitelist overrides.

## Dependency graph and parallelization
TASK-001 and TASK-002 can be developed sequentially; TASK-003 depends on TASK-001; TASK-004 verifies the integrated configuration across all gates. REQ-001, REQ-002, REQ-003, REQ-004 and AC-001, AC-002, AC-003, AC-004 are tracked across all tasks.

## Tasks
- TASK-001 — Status: done — REQ-001 / AC-001. Implement User-Agent detection and HTTP 429 response rules in `public/.htaccess` for known automated bots, headless agents, and scrapers.
- TASK-002 — Status: done — REQ-003 / AC-003. Author `scripts/setup-apache-ratelimit.sh` providing idempotent installation and tuning of Apache `mod_evasive` for IP burst rate limiting on Ubuntu/EC2.
- TASK-003 — Status: done — REQ-002, REQ-004 / AC-002, AC-004. Create automated verification test `scripts/test-useragent-ratelimit.ps1` testing User-Agent status responses (200 vs 429) and verify React build copy integrity.
- TASK-004 — Status: done — REQ-004 / AC-004. Update `README.md`, run full regression test suite (`npm test`), build verification (`npm run build`), and validate artifact chain synchronization.

## TDD sequence
1. Red phase: Create `scripts/test-useragent-ratelimit.ps1` defining expected HTTP status codes (429 for scraper User-Agents like `curl/8.0`, `python-requests`, `bytespider`; 200 for browser User-Agents like `Mozilla/5.0... Chrome/120`). Run test against unpatched `.htaccess` and observe failure.
2. Green phase: Update `public/.htaccess` with `RewriteCond %{HTTP_USER_AGENT}` rules and `[R=429,L]`. Re-run test and verify all assertions pass.
3. Server configuration: Create `scripts/setup-apache-ratelimit.sh` for `mod_evasive` IP rate limiting on Ubuntu/EC2.
4. Refactor & Regression: Update `README.md`, verify `npm run build` bundles `.htaccess`, and run `npm test`.

## End-to-end scenarios
1. Scenario 1 (Scraper blocked): A request with `User-Agent: python-requests/2.31.0` or `curl/8.5.0` targets `https://mahjong.aquaco.work/`. Apache returns `429 Too Many Requests` immediately without serving the React SPA bundle.
2. Scenario 2 (Legitimate browser): A user opens `https://mahjong.aquaco.work/` on Chrome, Safari, or Edge. Apache recognizes the legitimate browser header and serves `200 OK` with `index.html`.
3. Scenario 3 (SPA routing intact): A user accesses a deep route like `/set_score_umaoka` with a normal browser. The rewrite engine routes it to `/index.html` with HTTP 200.

## Quality gates
```powershell
node node_modules/react-scripts/bin/react-scripts.js test --watchAll=false --runInBand --silent
npm run build
pwsh.exe -NoProfile -ExecutionPolicy Bypass -File C:\Users\AquaCo\.codex\skills\ai-native-sdlc\scripts\validate-artifact-chain.ps1 -ArtifactDirectory docs/ai/ip-user-agent-rate-limit
```

## Risks, migration, and rollback
- Risk: Overly broad regex blocking legitimate traffic. Mitigation: Target only specific automated library and bot tokens.
- Rollback: Revert `public/.htaccess` to previous version using Git.

## Completion proof
- Successful execution of `scripts/test-useragent-ratelimit.ps1` verifying 429 for scrapers and 200 for browsers.
- Clean pass of `npm run build` and `npm test`.
- Clean pass of artifact chain validator.

## Progress log
- 2026-09-17: Phase 1 design artifacts created and approved by user.
- 2026-09-17: Phase 2 implementation complete; all tasks verified and green.
