# Intent

## Metadata
- Work ID: mobile-camera-capture
- Artifact revision: 1
- Language: en
- Korean mirror: intent.ko.md
- Status: done
- Risk: standard
- Created: 2026-09-11
- Updated: 2026-09-11

## Originating request
Implement dedicated mobile camera capture UI with desktop fallback, provide pre-capture viewfinder guide card, support 90-degree manual rotation with auto re-recognition, and configure Cloudflare HTTPS tunnel for mobile testing.

## Problem and evidence
Scoreboard recognition lacked a single-action camera button, causing extra mobile OS prompts. Rotated photos caused recognition failure. PC `localhost` is inaccessible from mobile devices on separate network segments.

## Desired outcomes
Single-action camera capture using `environment`, visual guide card, 90-degree canvas rotation recovery via `scoreMedia.ts`, and `npm run test:mobile` HTTPS tunnel using `untun` for `test:mobile` device testing.

## Scope
`PhotoUploadPanel.tsx`, `scoreMedia.ts`, `package.json`, and documentation.

## Non-goals
In-app WebRTC stream overlay, Expo migration, cloud media storage.

## Constraints and policies
Browser-only processing with zero server uploads. Maintain existing game codecs.

## Acceptance signals
Dedicated camera button triggers environment capture; viewfinder guide card displays before capture; 90-degree rotation transforms canvas and re-runs recognition; `test:mobile` script is available; all 37 tests and production build pass.

## Assumptions and open questions
Default camera is back-facing (`environment`); desktop browsers fall back to file chooser.

## Decisions
Adopt Alternative A (pre-capture guide card) and Cloudflare Tunnel (`untun`) for mobile testing.
