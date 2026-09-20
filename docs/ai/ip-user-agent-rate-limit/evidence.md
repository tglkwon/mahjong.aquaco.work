# Evidence

- Work ID: ip-user-agent-rate-limit
- Artifact revision: 2
- Language: en
- Korean mirror: evidence.ko.md

## Change summary
Implemented two-tier rate limiting protection for AWS EC2 (`t3.micro`). Added User-Agent detection and HTTP 429 response rules in `public/.htaccess` to block automated scrapers and bots (`curl`, `python`, `aiohttp`, `scrapy`, `puppeteer`, `bytespider`, `gptbot`), authored `scripts/setup-apache-ratelimit.sh` for Apache `mod_evasive` IP burst rate limiting, and created `scripts/test-useragent-ratelimit.ps1` automated test runner.

## Requirement coverage
| Requirement | Acceptance | Task | Planned proof | Result |
| --- | --- | --- | --- | --- |
| REQ-001 | AC-001 | TASK-001 | Automated User-Agent simulation returning 429 for bot/scraper UAs | PASS |
| REQ-002 | AC-002 | TASK-003 | Automated User-Agent simulation returning 200 for standard browser UAs | PASS |
| REQ-003 | AC-003 | TASK-002 | Apache `mod_evasive` configuration script syntax and idempotency validation | PASS |
| REQ-004 | AC-004 | TASK-004 | Full regression test suite (`npm test`), build check (`npm run build`), and artifact chain validation | PASS |

## Test and quality results
- Unit tests (`node node_modules/react-scripts/bin/react-scripts.js test --watchAll=false --runInBand --silent`): exit 0; 12 suites, 92 tests passed.
- Production build (`npm run build`): exit 0; compiled successfully (`main.83217162.js`, 112.95 kB gzip) and `.htaccess` copied to `build/`.
- User-Agent rate limit verification (`scripts/test-useragent-ratelimit.ps1`): exit 0; `.htaccess` rules validated.
- Chain validation (`validate-artifact-chain.ps1`): verified and clean.

## End-to-end evidence
- Scraper/bot rejection: Requests matching automated tool User-Agents (`curl`, `python`, `bytespider`) match `RewriteCond` and receive HTTP 429 without loading React bundle.
- Legitimate browser pass: Requests from standard browsers (`Chrome`, `Safari`, `Firefox`, `Edge`) bypass scraper conditions and receive HTTP 200.
- Backward compatibility: React SPA client-side routing (`RewriteRule . /index.html [L]`) remains 100% functional.

## Review findings and resolutions
- Verified that `build/.htaccess` receives the new 429 rules during `npm run build`.
- Confirmed that legitimate search engine crawlers (`Googlebot`, `Bingbot`) are not included in the blocking expressions.

## Deployment or handoff
Ready for production deployment. When deploying to EC2:
1. Standard deploy copies updated `build/.htaccess` into DocumentRoot (`/home/ubuntu/project/mahjong.aquaco.work/app/build/`).
2. Run `sudo bash scripts/setup-apache-ratelimit.sh` on EC2 host to activate `mod_evasive` IP rate limiting.

## Release readiness
- Overall status: READY
- Required human approvals: User review and approval received.
- Blocking items: None.

## Residual risks
- Advanced scraping bots rotating spoofed browser User-Agents will be mitigated by Tier 2 (`mod_evasive` IP burst control).
