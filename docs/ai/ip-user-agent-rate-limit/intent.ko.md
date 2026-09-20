# 의도

## 메타데이터
- 작업 ID: ip-user-agent-rate-limit
- 기준본 리비전(Canonical revision): 2
- 언어(Language): ko
- 영문 기준본(Canonical): intent.md
- 요청자: user request
- 상태(Status): ready
- 위험도(Risk): standard
- 생성일: 2026-09-17
- 수정일: 2026-09-17
- 담당: root implementation agent

## 최초 요청
우선 IP / User-Agent 기반 Rate Limit (호출 제한)만 진행해보자. /ai-native-sdlc

English synthesis:
Implement IP and User-Agent based Rate Limiting for the mahjong score tracking application to protect the AWS EC2 instance (`t3.micro`) from automated scrapers, bots, and AI agents.

## 문제와 근거
1. EC2 버스터블 CPU 고갈 위험: 프로덕션 서버는 AWS EC2 `t3.micro` (1 vCPU, 1GB RAM) 환경의 Apache2로 구동됩니다. 자동화 에이전트의 버스트 트래픽은 CPU 크레딧과 메모리를 빠르게 소진하여 인간 유저에게 접속 먹통이나 OOM 종료를 유발합니다.
2. 무제한 자동화 스크래핑: 현재 `public/.htaccess`는 SPA 라우팅(`RewriteRule . /index.html [L]`)만 처리합니다. 자동화 도구(`curl`, `python`, `aiohttp`, `scrapy`, `puppeteer` 등)가 제한 없이 라우트와 정적 자산에 접근 가능합니다.
3. 429 응답 부재: `429 Too Many Requests`를 반환하는 스로틀링이나 차단 메커니즘이 없습니다.

## 원하는 결과
1. User-Agent 필터링 및 차단: Apache `.htaccess` 계층에서 자동화 봇/스크레이퍼 User-Agent를 HTTP 429로 차단하며, 정상적인 인간 웹 브라우저는 보존합니다.
2. EC2 Apache 상의 IP 기반 호출 제한: Ubuntu Apache에 `mod_evasive`를 구성하여 IP별 요청 빈도를 제한합니다 (`DOSPageCount 5`, `DOSSiteCount 50`, `DOSBlockingPeriod 10`).
3. 검증 및 운영 투명성: 봇 User-Agent는 HTTP 429를 수신하고 브라우저 User-Agent는 HTTP 200을 수신함을 입증하는 자동화 검증 테스트를 제공합니다.

## 범위
- `public/.htaccess`: 스크레이퍼 User-Agent를 가로채 HTTP 429를 반환하는 리라이트 규칙.
- `scripts/setup-apache-ratelimit.sh`: `mod_evasive` 서버 구성 스크립트.
- `scripts/test-useragent-ratelimit.ps1`: 자동화 검증 테스트 스크립트.
- `README.md`: 운영 문서.

## 제외 범위
- 상용 CDN/WAF 이전 또는 DNS 변경.
- 유료 API 키 인프라 또는 데이터베이스 인증 레이어.
- React SPA 클라이언트 측 라우팅 변경.

## 제약과 정책
- Ubuntu 24.04 상의 Apache 2.4 호환성.
- 일반 사용자 무마찰: 표준 웹 브라우저에 대한 오탐 금지.
- 멱등성을 갖춘 구성 스크립트.

## 수용 신호
- 자동화 테스트에서 `curl`, `python`, `bytespider`에 대해 HTTP 429 확인.
- 자동화 테스트에서 표준 브라우저에 대해 HTTP 200 확인.
- 설정 스크립트가 `mod_evasive`를 설치하고 검증함.

## 가정과 미해결 질문
- 가정: 프로덕션 EC2에서 Apache `mod_rewrite` 활성화됨 (활성화 확인 완료).
- 가정: `/home/ubuntu/project/mahjong.aquaco.work/app/build`에 대해 Apache `AllowOverride All` 설정됨 (설정 확인 완료).

## 결정 사항
- 결정 1: 빠른 429 응답 반환을 위해 `public/.htaccess`에서 `RewriteCond %{HTTP_USER_AGENT}` 사용.
- 결정 2: Apache 호스트 상의 IP 버스트 호출 제한을 위해 `mod_evasive` 사용.
