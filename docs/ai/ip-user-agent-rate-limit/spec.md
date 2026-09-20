# Specification

## Metadata and source
- Work ID: ip-user-agent-rate-limit
- Artifact revision: 2
- Language: en
- Korean mirror: spec.ko.md
- Source: intent.md revision 2

## Summary
Implement a two-tier protection mechanism for the Mahjong web service running on AWS EC2 (`t3.micro`). Tier 1 intercepts automated scraper and bot User-Agents via Apache `public/.htaccess` rewrite rules, returning HTTP 429 (`429 Too Many Requests`). Tier 2 configures Apache `mod_evasive` for IP-based request rate limiting (`DOSPageCount 5`, `DOSSiteCount 50`, `DOSBlockingPeriod 10`).

## Functional requirements
- REQ-001: In `public/.htaccess`, introduce User-Agent filtering rules using `mod_rewrite` to detect scraper User-Agents (`curl`, `wget`, `python`, `aiohttp`, `scrapy`, `puppeteer`, `playwright`, `headlesschrome`, `bytespider`, `gptbot`, `claudebot`) and return HTTP 429 (`[R=429,L]`).
- REQ-002: Ensure legitimate web browsers (`Chrome`, `Safari`, `Firefox`, `Edge`) and search indexers (`Googlebot`, `Bingbot`) continue to receive HTTP 200 without obstruction.
- REQ-003: Provide an Apache IP rate limiting script (`scripts/setup-apache-ratelimit.sh`) configuring `mod_evasive` with bounded thresholds: `DOSHashTableSize 3097`, `DOSPageCount 5`, `DOSSiteCount 50`, `DOSPageInterval 1`, `DOSSiteInterval 1`, `DOSBlockingPeriod 10`, and local whitelist (`127.0.0.1`, `::1`).
- REQ-004: Provide automated test verification script (`scripts/test-useragent-ratelimit.ps1`) verifying status codes (200 vs 429) while preserving React SPA routing (`RewriteRule . /index.html [L]`).

## Non-functional requirements
User-Agent inspection in `public/.htaccess` must complete with negligible latency (< 1ms). Requests blocked with HTTP 429 must terminate early without loading static bundles, protecting `t3.micro` CPU credits. Normal user score calculation must never experience false positives.

## User experience and flows
1. Normal browser user: Visits `https://mahjong.aquaco.work/` with `Chrome` or `Safari`. Apache serves `index.html` with HTTP 200.
2. Scraper client: Automated script sends request with `curl` or `python`. Apache matches `.htaccess` rule and returns HTTP 429.
3. Burst traffic: An IP sending over 5 requests per second to a single page triggers `mod_evasive` and enters a 10-second block with HTTP 429.

## Architecture and interfaces
- `public/.htaccess`: Evaluates `%{HTTP_USER_AGENT}` prior to `RewriteRule . /index.html [L]`.
- Apache Host: Installs `libapache2-mod-evasive` and configures `/etc/apache2/mods-available/evasive.conf`.
- Verification CLI: `scripts/test-useragent-ratelimit.ps1` executes HTTP status checks.

## Data and migrations
Not applicable: Configuration-only changes. No database schema changes.

## Failure modes and edge cases
- False positives: Targeted regex must only match automated tool keywords (`python`, `curl`, `wget`, `scrapy`, `aiohttp`, `bot`) and never generic tokens (`mobile`, `webkit`).
- Empty User-Agent: Empty or missing User-Agent headers can be blocked or subjected to rate limits.
- Proxy forwarding: In future proxy topologies, `mod_remoteip` can be coupled with `mod_evasive`.

## Security, privacy, and permissions
No user IP logs are publicly exposed. Protection mitigates DoS starvation on the `t3.micro` EC2 tier.

## Observability and operations
- Apache access log (`/var/log/apache2/access.log`) records 429 status codes for blocked requests.
- Apache error log records `mod_evasive: Blacklisting address` entries.

## Test strategy
1. Verify `public/.htaccess` syntax and rules.
2. Execute `scripts/test-useragent-ratelimit.ps1` for status assertions across User-Agent variations.
3. Run `npm test` and `npm run build` for full regression pass.

## Acceptance criteria
- AC-001: Requests with scraper User-Agent (`curl`, `python`, `bytespider`) receive HTTP 429 (`429 Too Many Requests`).
- AC-002: Requests with standard browser User-Agent receive HTTP 200 and load `index.html`.
- AC-003: Apache `mod_evasive` deployment script (`scripts/setup-apache-ratelimit.sh`) is provided with validated thresholds.
- AC-004: Existing React test suite and production build pass with zero regressions.

## Traceability
- Scraper blocking -> REQ-001 -> AC-001
- Browser access preservation -> REQ-002 -> AC-002
- IP burst rate limiting -> REQ-003 -> AC-003
- Verification and regression -> REQ-004 -> AC-004

## Open decisions
None: Two-tier defense strategy approved for implementation.
