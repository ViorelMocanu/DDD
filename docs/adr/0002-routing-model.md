# ADR 0002 — Routing model: root-level blog slugs alongside `/informatii-utile/`

- **Status:** Accepted (2026-05-31)
- **Date:** 2026-05-30
- **Deciders:** human reviewer at GATE 1
- **Phase:** Phase 4 (page scaffold)

## Context

This is the single most parity-critical routing constraint. The legacy site exposes a blog **index** at
`/informatii-utile/`, but the three blog **articles** resolve at the **root level**, NOT nested under it:

- `/totul-despre-dezinsectie/`
- `/cum-scapi-de-gandaci/`
- `/dezinfectie-dezinsectie-deratizare-diferente/`

Elder.js produces this because its markdown plugin sets `slugFormatter` to return `false` and
`createRoutes: true`, generating top-level slugs decoupled from the source folder. Astro derives URLs
from the `src/pages/` file tree, so we must deliberately reproduce root-level article URLs while keeping
the six other static routes and the index. Any URL drift breaks SEO parity and would require 301 redirects.

## Decision

Use **file-based static routes** for all six fixed pages plus the index, and a **single dynamic catch
route `src/pages/[slug].astro`** for the three root-level articles. Astro's route-priority rules rank
static files above named parameters, so the fixed pages always win; `[slug].astro` only fires for slugs
not otherwise matched. `getStaticPaths()` in that file returns **exactly** the three article slugs from the
blog content collection (ADR 0003) — any other slug 404s at build time, which is parity-safe.

```
src/pages/
	index.astro                                  → /
	contact.astro                                → /contact/
	informatii-utile.astro                       → /informatii-utile/   (blog index)
	termeni-si-conditii.astro                    → /termeni-si-conditii/
	confidentialitate.astro                      → /confidentialitate/
	cookies.astro                                → /cookies/
	[slug].astro                                 → /totul-despre-dezinsectie/
	                                               /cum-scapi-de-gandaci/
	                                               /dezinfectie-dezinsectie-deratizare-diferente/
	api/
		contact.ts                               → POST handler (SSR endpoint, see ADR 0004)
```

`trailingSlash: 'always'` in `astro.config` (legacy URLs all carry a trailing slash). Article URLs come
from the collection entry slug, so adding a fourth article is a content-only change.

## Consequences

- **Easier:** new articles need no new route file (collection-driven); URLs identical to legacy with no redirects; one obvious place to audit each route for SEO.
- **Harder / to watch:** the `[slug].astro` catch route is greedy by design — `getStaticPaths` MUST be the single allow-list, or an unintended slug could render. Guard with a Vitest assertion that the generated paths equal the three known slugs. A `[slug].astro` collision with a future top-level static page name is possible; static files still win, but document any new top-level page.
- **Extension point:** if a future article slug ever contains `/` (multi-segment), `[slug].astro` must become `[...slug].astro` (rest parameter). Noted in `CONTEXT.md`.

## Alternatives considered

- **Three individual static files** (`totul-despre-dezinsectie.astro`, …) — maximally explicit and trivially auditable, but duplicates the article layout three times and makes adding an article a code change. Reasonable fallback if the catch route proves fragile.
- **Nest articles under `src/pages/informatii-utile/[slug].astro`** — rejected: produces `/informatii-utile/<slug>/`, breaking the parity-critical root-level URL.
- **`redirects` config to remap nested → root** — rejected: introduces 301s the legacy site does not have, hurting SEO parity and adding indirection.

## Resolved at GATE 1

Resolved at GATE 1: single `[slug].astro` catch route with `getStaticPaths()` allow-listing exactly the 3 article slugs (totul-despre-dezinsectie, cum-scapi-de-gandaci, dezinfectie-dezinsectie-deratizare-diferente); 6 static pages as their own `.astro` files; `trailingSlash: 'always'`; `build.format: 'directory'`.
