# Astro rewrite is live (2026-11-11 11:30)

Trigger: milestone Branch and HEAD: main at 76f27dd, working tree dirty (the files listed in section 3) Supersedes: none

## 1. Resume here

Nothing is in progress. The next action is the owner's: commit the files in section 3.

## 2. What is done

- The Astro rebuild was committed by the owner (`e74b585` and three follow-ups) and deployed to SiteGround on 2026-11-11 with the deploy workflow (dry run first, then the real run).
- `pnpm verify:live` passes against https://dedede.ro after the SiteGround cache was flushed.
- The owner sent one real submission from a phone: the lead reached the office inbox, the confirmation reached the visitor, both in the inbox, with Romanian time.
- The OpenSpec change is archived at `openspec/changes/archive/2026-11-11-astro-rewrite/`; its 16 requirements are now the main specs in `openspec/specs/`.
- GitHub is tidy: no open pull requests or issues, code scanning alerts at 0, monthly Dependabot, `SECURITY.md`.
- The old branch `feat/astro-rebuild` (last commit `5e887e9`) and its worktree were deleted at the owner's request.

## 3. What is in progress

Uncommitted, waiting for the owner:

- `scripts/verify-live.mjs`: the asset cache check accepts a one-year `max-age`.
- `openspec/`: the archive move and the four main specs.
- `tests/parity/parity.spec.ts`: one comment path.
- `docs/`: this snapshot, `session-resume.md`, `change-log.md`.

## 4. Decisions and why

- **Asset cache check loosened.** SiteGround's nginx serves static files itself, so the `immutable` set in `.htaccess` never reaches the browser; nginx sends its own one-year `max-age`, which has the same effect.
- **The first real deploy run is red on GitHub and stays red.** The upload worked; the live check ran against SiteGround's stale cache. Every deploy needs a cache flush (Site Tools > Speed > Caching) before the live check means anything.
- **`_elderjs/` and `resources/script.js` are still on the server**, protected in the deploy workflow, so pages cached before the switch keep their styles and script.

## 5. Open questions for the owner

1. The database row of the test submission was not looked at (very likely fine: the endpoint stores before it mails).
2. Rotate the database password and revoke the old SendGrid key.
3. Around 2026-11-18: delete `_elderjs/` and `resources/script.js` on the server, then remove their two protect lines from `.github/workflows/deploy.yml`.
4. Should the deploy workflow flush the SiteGround cache itself?
5. Analytics and remarketing: options were presented on 2026-11-11; nothing is built. Any change there starts with a new OpenSpec change.

## 6. How to verify

- `pnpm verify:live` prints "All checks passed."
- `pnpm verify`, `pnpm test` (Docker running) and `pnpm test:e2e` pass.
- `pnpm exec openspec validate --all` passes.
