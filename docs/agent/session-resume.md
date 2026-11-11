# Session resume

Living file. Overwritten after every completed step so a cut-off session can be resumed from here. Dated snapshots for handoffs go in `docs/state/`.

## Task

None in progress. The Astro rewrite is live on dedede.ro since 2026-11-11 and its OpenSpec change is archived (`openspec/changes/archive/2026-11-11-astro-rewrite/`). Full closing state: `docs/state/2026-11-11-1130-astro-rewrite-live.md`.

## Standing facts

- Owner owns git. Never commit or push.
- Live site copy from before the switch: `_backup/live/public_html` (gitignored; contains `env.php` with secrets: read variable NAMES only).
- Deploy: the manual `deploy` workflow on GitHub (dry run by default). It must never delete on the server: `env.php`, `.well-known/`, `php_errorlog`.
- After every deploy the SiteGround cache must be flushed (Site Tools > Speed > Caching), or the live check fails against the old pages.
- Still on the server on purpose: `_elderjs/` and `resources/script.js`, for pages cached before the switch.
- PHP tests run in Docker (`php:8.5-cli-alpine`); the server runs PHP 8.6.

## Next step

Waiting for the owner. Open items, all theirs:

1. Commit the closing changes (verify-live check, OpenSpec archive, docs).
2. Rotate the database password and revoke the old SendGrid key.
3. Around 2026-11-18: delete `_elderjs/` and `resources/script.js` on the server; then an agent removes their two protect lines from `.github/workflows/deploy.yml`.
4. Decide whether the deploy workflow should flush the SiteGround cache itself.
5. Decide on analytics and remarketing work (options presented 2026-11-11). It needs a new OpenSpec change.

## /simplify bookkeeping

The last run ended on the working tree that became commit `e74b585`. The next run starts from `e74b585` and covers everything after it, committed or not. Runs are logged in `docs/agent/change-log.md`.
