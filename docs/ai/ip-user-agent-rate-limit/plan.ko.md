# 구현 계획

- 작업 ID: ip-user-agent-rate-limit
- 기준본 리비전(Canonical revision): 2
- 언어(Language): ko
- 영문 기준본(Canonical): plan.md

## 맥락과 목표 결과
AWS EC2 (`t3.micro`, 1 vCPU / 1GB RAM) 환경에서 실행 중인 마작 점수 기록 웹 서비스를 자동화된 스크레이퍼 및 AI 에이전트 버스트 트래픽으로부터 보호하여 CPU 크레딧 고갈, OOM 종료 및 인간 사용자의 서비스 저하를 방지해야 합니다.
이를 다음 방식으로 달성합니다:
1. `public/.htaccess`에 `mod_rewrite` 규칙을 적용하여 자동화 에이전트 / 스크레이퍼 User-Agent를 탐지하고 HTTP 429 (`429 Too Many Requests`)를 반환합니다.
2. IP 호출 제한을 위해 Apache `mod_evasive`를 설치하고 구성하는 독립형 서버 설정 스크립트(`scripts/setup-apache-ratelimit.sh`)를 제공합니다 (`DOSPageCount 5`, `DOSSiteCount 50`, `DOSBlockingPeriod 10`).
3. 스크레이퍼는 429로 차단되고 정상 브라우저는 HTTP 200으로 통과함을 검증하는 자동화 테스트(`scripts/test-useragent-ratelimit.ps1`)를 작성합니다.

## 저장소 상태와 제약
- 대상 파일:
  - `public/.htaccess`
  - `scripts/setup-apache-ratelimit.sh`
  - `scripts/test-useragent-ratelimit.ps1`
  - `README.md`
- 테스트 파일:
  - `scripts/test-useragent-ratelimit.ps1`
  - React 테스트 스위트 (`package.json`)
- 품질 게이트:
  - `node node_modules/react-scripts/bin/react-scripts.js test --watchAll=false --runInBand --silent`
  - `npm run build`
  - `pwsh.exe -NoProfile -ExecutionPolicy Bypass -File C:\Users\AquaCo\.codex\skills\ai-native-sdlc\scripts\validate-artifact-chain.ps1 -ArtifactDirectory docs/ai/ip-user-agent-rate-limit`

## 변경 지도
- `public/.htaccess`:
  - 알려진 스크레이퍼/크롤러 봇(`curl`, `python`, `aiohttp`, `scrapy`, `puppeteer`, `playwright`, `headlesschrome`, `bytespider`, `gptbot`, `claudebot`)을 타겟팅하는 `RewriteCond %{HTTP_USER_AGENT}` 규칙 삽입.
  - 일치하는 요청에 대해 HTTP 429 (`[R=429,L]`) 반환.
  - 기존 SPA 리라이트 규칙(`RewriteRule . /index.html [L]`) 유지.
- `scripts/setup-apache-ratelimit.sh`:
  - `libapache2-mod-evasive` 설치, `/etc/apache2/mods-available/evasive.conf` 구성, 로그 디렉토리 생성 및 Apache를 재로드하는 셸 스크립트.
- `scripts/test-useragent-ratelimit.ps1`:
  - 다양한 User-Agent 헤더로 HTTP 요청을 시뮬레이션하여 상태 코드(200 vs 429)를 검증하는 자동화 테스트 스크립트.
- `README.md`:
  - 호출 제한 아키텍처, 구성 임계치 및 화이트리스트 재정의를 설명하는 문서 섹션 추가.

## 의존성 그래프와 병렬화
TASK-001 and TASK-002 can be developed sequentially; TASK-003 depends on TASK-001; TASK-004 verifies the integrated configuration across all gates. REQ-001, REQ-002, REQ-003, REQ-004 and AC-001, AC-002, AC-003, AC-004 are tracked across all tasks.

## 작업
- TASK-001 — Status: done — REQ-001 / AC-001. Implement User-Agent detection and HTTP 429 response rules in `public/.htaccess` for known automated bots, headless agents, and scrapers.
- TASK-002 — Status: done — REQ-003 / AC-003. Author `scripts/setup-apache-ratelimit.sh` providing idempotent installation and tuning of Apache `mod_evasive` for IP burst rate limiting on Ubuntu/EC2.
- TASK-003 — Status: done — REQ-002, REQ-004 / AC-002, AC-004. Create automated verification test `scripts/test-useragent-ratelimit.ps1` testing User-Agent status responses (200 vs 429) and verify React build copy integrity.
- TASK-004 — Status: done — REQ-004 / AC-004. Update `README.md`, run full regression test suite (`npm test`), build verification (`npm run build`), and validate artifact chain synchronization.

## TDD 순서
1. Red phase: Create `scripts/test-useragent-ratelimit.ps1` defining expected HTTP status codes (429 for scraper User-Agents like `curl/8.0`, `python-requests`, `bytespider`; 200 for browser User-Agents like `Mozilla/5.0... Chrome/120`). Run test against unpatched `.htaccess` and observe failure.
2. Green phase: Update `public/.htaccess` with `RewriteCond %{HTTP_USER_AGENT}` rules and `[R=429,L]`. Re-run test and verify all assertions pass.
3. Server configuration: Create `scripts/setup-apache-ratelimit.sh` for `mod_evasive` IP rate limiting on Ubuntu/EC2.
4. Refactor & Regression: Update `README.md`, verify `npm run build` bundles `.htaccess`, and run `npm test`.

## E2E 시나리오
1. Scenario 1 (Scraper blocked): A request with `User-Agent: python-requests/2.31.0` or `curl/8.5.0` targets `https://mahjong.aquaco.work/`. Apache returns `429 Too Many Requests` immediately without serving the React SPA bundle.
2. Scenario 2 (Legitimate browser): A user opens `https://mahjong.aquaco.work/` on Chrome, Safari, or Edge. Apache recognizes the legitimate browser header and serves `200 OK` with `index.html`.
3. Scenario 3 (SPA routing intact): A user accesses a deep route like `/set_score_umaoka` with a normal browser. The rewrite engine routes it to `/index.html` with HTTP 200.

## 품질 게이트
```powershell
node node_modules/react-scripts/bin/react-scripts.js test --watchAll=false --runInBand --silent
npm run build
pwsh.exe -NoProfile -ExecutionPolicy Bypass -File C:\Users\AquaCo\.codex\skills\ai-native-sdlc\scripts\validate-artifact-chain.ps1 -ArtifactDirectory docs/ai/ip-user-agent-rate-limit
```

## 위험, 마이그레이션, 롤백
- Risk: Overly broad regex blocking legitimate traffic. Mitigation: Target only specific automated library and bot tokens.
- Rollback: Revert `public/.htaccess` to previous version using Git.

## 완료 증거
- Successful execution of `scripts/test-useragent-ratelimit.ps1` verifying 429 for scrapers and 200 for browsers.
- Clean pass of `npm run build` and `npm test`.
- Clean pass of artifact chain validator.

## 진행 기록
- 2026-09-17: Phase 1 design artifacts created and approved by user.
- 2026-09-17: Phase 2 implementation complete; all tasks verified and green.
