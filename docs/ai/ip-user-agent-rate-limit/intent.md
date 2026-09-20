# Intent

## Metadata
- Work ID: ip-user-agent-rate-limit
- Artifact revision: 2
- Language: en
- Korean mirror: intent.ko.md
- Originator: user request
- Status: ready
- Risk: standard
- Created: 2026-09-17
- Updated: 2026-09-17
- Owner: root implementation agent

## Originating request
우선 IP / User-Agent 기반 Rate Limit (호출 제한)만 진행해보자. /ai-native-sdlc

English synthesis:
Implement IP and User-Agent based Rate Limiting for the mahjong score tracking application to protect the AWS EC2 instance (`t3.micro`) from automated scrapers, bots, and AI agents.

## Problem and evidence
1. EC2 Burstable CPU exhaustion: The production instance runs on AWS EC2 `t3.micro` (1 vCPU, 1GB RAM) with Apache2. Burst traffic from automated agents quickly exhausts CPU credits and available RAM, resulting in service freeze or OOM kills for human users.
2. Unrestricted automated scraping: Currently, `public/.htaccess` only handles SPA routing (`RewriteRule . /index.html [L]`). Automated tools (`curl`, `python`, `aiohttp`, `scrapy`, `puppeteer`, etc.) can access routes and static assets without limitation.
3. Lack of 429 response: There is no throttling or blocking mechanism to return `429 Too Many Requests`.

## Desired outcomes
1. User-Agent Filtering & Throttling: Block or throttle automated bot/scraper User-Agents at the Apache `.htaccess` layer with HTTP 429, while preserving legitimate human web browsers.
2. IP-based Rate Limiting on EC2 Apache: Configure `mod_evasive` for Apache on Ubuntu to cap request frequency per IP (`DOSPageCount 5`, `DOSSiteCount 50`, `DOSBlockingPeriod 10`).
3. Verification & Operational Transparency: Provide automated verification tests demonstrating that bot User-Agents receive HTTP 429 while browser User-Agents receive HTTP 200.

## Scope
- `public/.htaccess`: Rewrite rules to intercept scraper User-Agents and return HTTP 429.
- `scripts/setup-apache-ratelimit.sh`: Server configuration script for `mod_evasive`.
- `scripts/test-useragent-ratelimit.ps1`: Automated verification test script.
- `README.md`: Operational documentation.

## Non-goals
- Commercial CDN/WAF migration or DNS transfer.
- Paid API key infrastructure or database auth layer.
- Modifying React SPA client-side routing.

## Constraints and policies
- Apache 2.4 compatibility on Ubuntu 24.04.
- Human user zero-friction: No false positives for standard web browsers.
- Idempotent configuration scripts.

## Acceptance signals
- Automated test confirms HTTP 429 for `curl`, `python`, and `bytespider`.
- Automated test confirms HTTP 200 for standard browsers.
- Setup script installs and validates `mod_evasive`.

## Assumptions and open questions
- Assumption: Apache `mod_rewrite` is active on production EC2 (verified active).
- Assumption: Apache `AllowOverride All` is configured for `/home/ubuntu/project/mahjong.aquaco.work/app/build` (verified active).

## Decisions
- Decision 1: Use `public/.htaccess` with `RewriteCond %{HTTP_USER_AGENT}` for fast-fail 429 responses.
- Decision 2: Use `mod_evasive` for IP burst rate limiting on the Apache host.
