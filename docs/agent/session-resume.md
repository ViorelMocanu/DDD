# Session resume

Living file. Overwritten after every completed step so a cut-off session can be resumed from here. Dated snapshots for handoffs go in `docs/state/`.

## Task

OpenSpec change `astro-rewrite`: rebuild dedede.ro 1:1 in Astro (static output, SiteGround hosting), replace the unsafe `sideform.php`, deliver as ONE commit made by the owner. Plan approved 2026-11-10.

## Owner decisions (2026-11-10)

- Fresh build on `main`; reuse only verified pieces of the old `feat/astro-rebuild` branch.
- Contact backend: one hardened PHP file at the same URL (`/sideform.php`), same JSON replies.
- Email: SiteGround's own mail (`mail()`), no SendGrid.
- Leads: keep inserting into the existing MySQL table `dedede_contact` (prepared statements, no schema changes).
- PHP tests run in Docker (`php:8.5-cli`; the server runs PHP 8.6, no 8.6 image exists yet).
- Fix invisible defects (list in `openspec/changes/astro-rewrite/design.md`).
- Agent folders: keep `.claude` and `.agents`; the others were deleted.
- CI: verify + unit tests on push; deploy is a manual-trigger workflow using rsync over SSH.
- Owner owns git. Never commit or push.

## Ground truth

- Live site copy: `_backup/live/public_html` (gitignored; contains `env.php` with secrets: read variable NAMES only).
- Legacy sources: `git show HEAD:<path>` (HEAD is `0e426f0`).
- Articles live at the root: `/totul-despre-dezinsectie/`, `/cum-scapi-de-gandaci/`, `/dezinfectie-dezinsectie-deratizare-diferente/`.
- Deploy must never delete on the server: `env.php`, `.well-known/`, `php_errorlog`.

## Progress

- [x] M0 scaffold and configs written, dependencies installed
- [x] M1 Parity oracle: `tests/parity/` (63 tests pass: 9 structure + 54 screenshots; negative control proven)
- [x] M2 Shell, styles (`src/styles/global.css` is the legacy SCSS compiled once to flat CSS), legal pages
- [x] M3 Home, articles (`src/content/articole`), listing, `src/lib/format.ts` with unit tests
- [x] M4 Contact page and scripts (`src/scripts/`), `tests/e2e/behaviour.spec.ts` (8 pass)
- [x] M5 `public/sideform.php` + `tests/unit/sideform.test.ts` (8 pass in Docker, image `php:8.5-cli`)
- [x] M6 `.htaccess`, service worker, sitemap, `verify:live`, CI + deploy workflows, `tests/unit/hosting.test.ts`; `pnpm verify` green; `pnpm audit` clean (minimatch override)
- [x] Agent docs, `DEPLOY.md`, README, OpenSpec config, change log written
- [x] M7 Release pack: `/simplify` run logged in the change log; final gate green on 2026-11-10 (`pnpm verify` 0 errors and 0 warnings, `pnpm test` 35 passed, `pnpm exec playwright test` 75 passed, parity self-check 63 passed, `pnpm audit` clean)
- [x] Owner decisions of 2026-11-11 applied: honeypot hits go to the office marked `[posibil spam]`; forgiving phone rule on page and server; `openspec/ddd-rewrite-analysis.md` deleted. Left as is on purpose: IPv6 cut in the `ip` column, no history rewrite for the old `.env`
- [x] Review round on 2026-11-10 (four `/simplify` reviewers, security review, spec check): fixes applied and logged in the change log

## Next step

The build is finished and waits for the owner. Nothing is committed. Open items, all for the owner:

1. Run `/simplify` if wanted, then make the single commit and push.
2. Follow `DEPLOY.md`: add the deploy secrets, run the deploy workflow as a dry run, then for real, then `pnpm verify:live`.
3. Send one test message through the live contact form and check that the email arrives and the row lands in `dedede_contact`. `mail()` delivery is unverified until then.
4. Check that one of the `$ALLOWED_SERVER` values in the server's `env.php` is exactly `dedede.ro`. During the test submission also check the address in the office email footer (`DEPLOY.md` step 5): if it is SiteGround's and not the visitor's, the rate limit is shared by everyone.
5. Rotate the database password and revoke the SendGrid key (both sat in a web-reachable folder for years).
6. Decide what to do with `.worktrees/astro-rebuild` and the branch `feat/astro-rebuild`.
7. After the deploy: `/opsx:archive` for `astro-rewrite` (task 8.3).

## /simplify bookkeeping

Base for every run is commit `0e426f0` plus the whole working tree (nothing is committed until the end). Runs are logged in `docs/agent/change-log.md`.
