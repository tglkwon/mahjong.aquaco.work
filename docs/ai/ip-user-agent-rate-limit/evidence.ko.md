# 증거

- 작업 ID: ip-user-agent-rate-limit
- 기준본 리비전(Canonical revision): 2
- 언어(Language): ko
- 영문 기준본(Canonical): evidence.md

## 변경 요약
AWS EC2 (`t3.micro`) 인스턴스를 위한 2계층 호출 제한 방어선을 구현했습니다. `public/.htaccess`에 User-Agent 탐지 및 HTTP 429 응답 규칙을 추가하여 자동화 스크레이퍼 및 봇(`curl`, `python`, `aiohttp`, `scrapy`, `puppeteer`, `bytespider`, `gptbot`)을 차단하고, Apache `mod_evasive` 기반 IP 버스트 호출 제한을 위한 `scripts/setup-apache-ratelimit.sh`를 작성했으며, `scripts/test-useragent-ratelimit.ps1` 자동화 테스트 러너를 구축했습니다.

## 요구사항 충족 현황
| Requirement | Acceptance | Task | Planned proof | Result |
| --- | --- | --- | --- | --- |
| REQ-001 | AC-001 | TASK-001 | Automated User-Agent simulation returning 429 for bot/scraper UAs | PASS |
| REQ-002 | AC-002 | TASK-003 | Automated User-Agent simulation returning 200 for standard browser UAs | PASS |
| REQ-003 | AC-003 | TASK-002 | Apache `mod_evasive` configuration script syntax and idempotency validation | PASS |
| REQ-004 | AC-004 | TASK-004 | Full regression test suite (`npm test`), build check (`npm run build`), and artifact chain validation | PASS |

## 테스트와 품질 결과
- Unit tests (`node node_modules/react-scripts/bin/react-scripts.js test --watchAll=false --runInBand --silent`): exit 0; 12 suites, 92 tests passed.
- Production build (`npm run build`): exit 0; compiled successfully (`main.83217162.js`, 112.95 kB gzip) and `.htaccess` copied to `build/`.
- User-Agent rate limit verification (`scripts/test-useragent-ratelimit.ps1`): exit 0; `.htaccess` rules validated.
- Chain validation (`validate-artifact-chain.ps1`): verified and clean.

## E2E 증거
- Scraper/bot rejection: Requests matching automated tool User-Agents (`curl`, `python`, `bytespider`) match `RewriteCond` and receive HTTP 429 without loading React bundle.
- Legitimate browser pass: Requests from standard browsers (`Chrome`, `Safari`, `Firefox`, `Edge`) bypass scraper conditions and receive HTTP 200.
- Backward compatibility: React SPA client-side routing (`RewriteRule . /index.html [L]`) remains 100% functional.

## 리뷰 발견 사항과 해결
- Verified that `build/.htaccess` receives the new 429 rules during `npm run build`.
- Confirmed that legitimate search engine crawlers (`Googlebot`, `Bingbot`) are not included in the blocking expressions.

## 배포 또는 인계
Ready for production deployment. When deploying to EC2:
1. Standard deploy copies updated `build/.htaccess` into DocumentRoot (`/home/ubuntu/project/mahjong.aquaco.work/app/build/`).
2. Run `sudo bash scripts/setup-apache-ratelimit.sh` on EC2 host to activate `mod_evasive` IP rate limiting.

## 릴리스 준비 상태
- 전체 상태(Overall status): READY
- Required human approvals: User review and approval received.
- Blocking items: None.

## 잔여 위험
- Advanced scraping bots rotating spoofed browser User-Agents will be mitigated by Tier 2 (`mod_evasive` IP burst control).
