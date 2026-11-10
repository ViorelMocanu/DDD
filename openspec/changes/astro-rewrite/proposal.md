# Rebuild dedede.ro in Astro

## Why

The site runs on Elder.js 1.7 and Svelte 3, both abandoned, with 31 direct npm packages that can no longer be patched. The contact endpoint `sideform.php` passes request input through `eval()`, builds SQL by string concatenation and ships a vendored SendGrid SDK (101 PHP files) into the web root. The server copy has drifted from the repo.

## What changes

- Replace Elder.js, Svelte, Rollup and Babel with Astro (static output, no adapter, no UI framework).
- Keep every public URL, all visible content, the design and the behaviour identical to the live site.
- Replace `sideform.php` with one hardened PHP file at the same URL with the same JSON replies. It sends mail through the host's own mail transfer agent and inserts leads into the existing `dedede_contact` table with prepared statements.
- Rebuild `.htaccess` from the live server copy and fix the broken or obsolete headers.
- Add linting, formatting, type checking, unit, browser and parity tests, CI, a manual-trigger deploy workflow and a slim agent harness.
- Fix defects visitors cannot see (listed in `design.md`).

## Non-goals

- No redesign, copy edits or new pages.
- No change to the Google Tag Manager container or Google Ads setup.
- No change to the MySQL schema.
- No move away from SiteGround.

## Capabilities

- `site--pages`: routes, content, metadata and visual parity.
- `site--behaviour`: menu, dark mode, back-to-top, analytics loaders.
- `contact--form`: client validation, endpoint contract, security guards.
- `hosting--delivery`: server configuration, stale-file cleanup, deploy.

## Impact

Everything under `src/` and `assets/` is replaced. `public/` holds the static files unchanged. Task mode: `tdd-core` for utilities, endpoint and behaviour; parity tests are written before the pages they cover.
