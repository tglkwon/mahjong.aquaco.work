# 명세

## 메타데이터와 출처
- 작업 ID: ip-user-agent-rate-limit
- 기준본 리비전(Canonical revision): 2
- 언어(Language): ko
- 영문 기준본(Canonical): spec.md
- 출처: intent.md 리비전 2

## 요약
AWS EC2 (`t3.micro`) 환경에서 실행되는 마작 웹 서비스를 위한 2계층 방어 메커니즘을 구현합니다. 계층 1은 Apache `public/.htaccess` 리라이트 규칙을 통해 자동화 스크레이퍼 및 봇 User-Agent를 차단하여 HTTP 429 (`429 Too Many Requests`)를 반환합니다. 계층 2는 IP 기반 요청 빈도 제한을 위해 Apache `mod_evasive`를 구성합니다 (`DOSPageCount 5`, `DOSSiteCount 50`, `DOSBlockingPeriod 10`).

## 기능 요구사항
- REQ-001: `public/.htaccess`에서 `mod_rewrite`를 사용한 User-Agent 필터링 규칙을 도입하여 스크레이퍼 User-Agent(`curl`, `wget`, `python`, `aiohttp`, `scrapy`, `puppeteer`, `playwright`, `headlesschrome`, `bytespider`, `gptbot`, `claudebot`)를 탐지하고 HTTP 429 (`[R=429,L]`)를 반환해야 합니다.
- REQ-002: 정상적인 웹 브라우저(`Chrome`, `Safari`, `Firefox`, `Edge`) 및 검색 색인 봇(`Googlebot`, `Bingbot`)이 방해 없이 지속적으로 HTTP 200을 수신하도록 보장해야 합니다.
- REQ-003: 한정된 임계치(`DOSHashTableSize 3097`, `DOSPageCount 5`, `DOSSiteCount 50`, `DOSPageInterval 1`, `DOSSiteInterval 1`, `DOSBlockingPeriod 10`, 로컬 화이트리스트 `127.0.0.1`, `::1`)로 `mod_evasive`를 구성하는 Apache IP 호출 제한 스크립트(`scripts/setup-apache-ratelimit.sh`)를 제공해야 합니다.
- REQ-004: React SPA 라우팅(`RewriteRule . /index.html [L]`)을 보존하면서 상태 코드(200 vs 429)를 검증하는 자동화 테스트 검증 스크립트(`scripts/test-useragent-ratelimit.ps1`)를 제공해야 합니다.

## 비기능 요구사항
`public/.htaccess`의 User-Agent 검사는 미미한 지연 시간(< 1ms)으로 완료되어야 합니다. HTTP 429로 차단된 요청은 정적 번들을 로드하지 않고 조기 종료되어 `t3.micro` CPU 크레딧을 보존해야 합니다. 정상적인 사용자 점수 계산 과정에서 오탐이 절대 발생하지 않아야 합니다.

## 사용자 경험과 흐름
1. 정상 브라우저 사용자: `Chrome` 또는 `Safari`로 `https://mahjong.aquaco.work/` 접속. Apache가 `index.html`을 HTTP 200으로 서빙.
2. 스크레이퍼 클라이언트: 자동화 스크립트가 `curl` 또는 `python`으로 요청 전송. Apache가 `.htaccess` 규칙과 매칭되어 HTTP 429 반환.
3. 버스트 트래픽: 단일 IP가 한 페이지에 초당 5회 초과 요청 전송 시 `mod_evasive`가 트리거되어 HTTP 429와 함께 10초간 차단 상태 진입.

## 아키텍처와 인터페이스
- `public/.htaccess`: `RewriteRule . /index.html [L]` 이전에 `%{HTTP_USER_AGENT}` 평가.
- Apache 호스트: `libapache2-mod-evasive` 설치 및 `/etc/apache2/mods-available/evasive.conf` 구성.
- 검증 CLI: `scripts/test-useragent-ratelimit.ps1`에서 HTTP 상태 점검 실행.

## 데이터와 마이그레이션
해당 사항 없음: 구성 전용 변경 사항. 데이터베이스 스키마 변경 없음.

## 실패 모드와 경계 사례
- 오탐 방지: 대상 정규식은 자동화 도구 키워드(`python`, `curl`, `wget`, `scrapy`, `aiohttp`, `bot`)만 매칭해야 하며 일반 토큰(`mobile`, `webkit`)은 절대 포함하지 않음.
- 빈 User-Agent: 비어 있거나 누락된 User-Agent 헤더는 차단되거나 호출 제한 대상이 됨.
- 프록시 포워딩: 향후 프록시 구성 시 `mod_remoteip`를 `mod_evasive`와 결합 가능.

## 보안, 개인정보, 권한
사용자 IP 로그는 공개 노출되지 않습니다. 이 보호 체계는 `t3.micro` EC2 계층의 DoS 고갈을 완화합니다.

## 관측성과 운영
- Apache 접근 로그(`/var/log/apache2/access.log`)에 차단된 요청의 429 상태 코드 기록.
- Apache 에러 로그에 `mod_evasive: Blacklisting address` 항목 기록.

## 테스트 전략
1. `public/.htaccess` 구문 및 규칙 검증.
2. User-Agent 변형별 상태 단언을 위한 `scripts/test-useragent-ratelimit.ps1` 실행.
3. 전체 회귀 통과를 위해 `npm test` 및 `npm run build` 실행.

## 수용 기준
- AC-001: 스크레이퍼 User-Agent(`curl`, `python`, `bytespider`)를 포함한 요청이 HTTP 429 (`429 Too Many Requests`)를 수신함.
- AC-002: 표준 브라우저 User-Agent를 포함한 요청이 HTTP 200을 수신하고 `index.html`을 로드함.
- AC-003: 검증된 임계치가 적용된 Apache `mod_evasive` 배포 스크립트(`scripts/setup-apache-ratelimit.sh`)가 제공됨.
- AC-004: 기존 React 테스트 스위트 및 프로덕션 빌드가 회귀 없이 통과함.

## 추적성
- 스크레이퍼 차단 -> REQ-001 -> AC-001
- 브라우저 접근 보존 -> REQ-002 -> AC-002
- IP 버스트 호출 제한 -> REQ-003 -> AC-003
- 검증 및 회귀 -> REQ-004 -> AC-004

## 미결정 사항
없음: 2계층 방어 전략 구현 승인됨.
