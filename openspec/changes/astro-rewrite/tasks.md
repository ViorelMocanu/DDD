# Tasks

Every milestone ends with `pnpm verify`, the test suites, a `/simplify` pass logged in `docs/agent/change-log.md`, and an update of `docs/agent/session-resume.md`.

## 1. M0 Foundation and guardrails

- [x] 1.1 Legacy sources and unused agent mirrors removed; static files moved to `public/`
- [x] 1.2 Astro project, strict TypeScript, ESLint, Prettier, commitlint, husky configured
- [x] 1.3 Agent harness written (`AGENTS.md`, `CLAUDE.md`, `CONTEXT.md`, OpenSpec config, secrets guard)
- [x] 1.4 Smoke test first: build outputs `dist/index.html`; then `pnpm verify` passes with zero warnings

## 2. M1 Parity oracle

- [x] 2.1 Local server for the live copy; Playwright projects for baseline and rebuild
- [x] 2.2 Failing tests first: route status, head metadata, body structure, pixels (3 viewports, light and dark)
- [x] 2.3 Oracle validated by comparing the live copy with itself

## 3. M2 Shell, styles, legal pages

- [x] 3.1 Layout, header, footer, stylesheet, fonts, icons
- [x] 3.2 `/confidentialitate/`, `/cookies/`, `/termeni-si-conditii/` pass parity

## 4. M3 Home, articles, listing

- [x] 4.1 Failing unit tests first: Romanian date format, reading time, previous/next ordering
- [x] 4.2 Content collection and article pages at the root
- [x] 4.3 Home and `/informatii-utile/` pass parity; sitemap matches the live one

## 5. M4 Contact page and browser behaviour

- [x] 5.1 Failing browser tests first: menu, dark mode, back-to-top, validation, analytics events
- [x] 5.2 Scripts ported to typed modules; `/contact/` passes parity

## 6. M5 Contact endpoint

- [x] 6.1 Failing contract tests first (valid, invalid fields, method, origin, honeypot, size, injection strings, rate limit)
- [x] 6.2 `sideform.php` implemented; tests pass in Docker with mail and database captured

## 7. M6 Server config and hardening

- [x] 7.1 Failing tests first: `.htaccess` expectations, size budgets, no forbidden files in `dist/`
- [x] 7.2 `.htaccess`, service-worker kill switch, `verify:live` script, CI and deploy workflows
- [x] 7.3 `pnpm audit` reports zero advisories

## 8. M7 Release pack

- [x] 8.1 Full gate green; regression scan of adjacent files
- [x] 8.2 `DEPLOY.md`, README, retrospective, commit message checked with commitlint
- [ ] 8.3 Specs synced; owner commits, pushes and deploys
