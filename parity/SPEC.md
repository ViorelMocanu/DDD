# SPEC — dedede.ro Astro Rebuild (GATE-1 Locked Specification)

> **Status:** LOCKED at GATE 1 — 2026-05-31. Authoritative, self-contained spec the human approves
> before Phase 4 scaffold. Supersedes scattered notes; cross-references the ADRs for rationale.
> **Evidence base:** [`parity/INVENTORY.md`](INVENTORY.md) + the five [`parity/inventory/*.md`](inventory/)
> detail files. **Deviations register:** [`WAIVERS.md`](WAIVERS.md). **Domain glossary / state:**
> [`CONTEXT.md`](../CONTEXT.md). **ADRs:** [`docs/adr/0001`–`0006`](../docs/adr/).

---

## 1. Scope & non-goals

**Scope.** A *re-platform with parity*: migrate the live `dedede.ro` marketing site from the legacy
**Elder.js 1.7.5 + Svelte 3.57 + Rollup 2** stack to **Astro 6.x** (SSG-first, TypeScript strictest,
SCSS via `sass-embedded`, pnpm), preserving **visual, functional, and SEO parity** across all 9 public
routes. Content source of truth is the gitignored `/livesite` FTP snapshot, mirrored by the committed
fixtures under [`parity/baseline/`](baseline/).

**Non-goals.** This is **not** a redesign, content rewrite, or feature addition. No new pages, no
restructured navigation, no copy edits, no framework islands beyond the one contact form, no JSON-LD,
no consent UI, no image re-encoding (until parity is certified). The four approved fixes in §9 are the
*only* intentional deltas from byte/pixel parity; everything else reproduces the live site exactly.
GDPR/Cookiebot remediation, SVGO optimisation of `servicii.svg`/`dedede-hero.svg`, and Turnstile
anti-spam are explicitly **out of scope** (recorded as future recommendations, not deliverables).

---

## 2. Decisions summary

All decisions below were ratified by the human at GATE 1 (2026-05-31). Each links to its ADR.

| Area | Decision | ADR |
| --- | --- | --- |
| **Deploy target** | Cloudflare **Workers** (Static Assets) via `@astrojs/cloudflare` v13 + `wrangler deploy` — NOT Pages. The adapter is a Workers adapter; it manages the Worker `main` + the static-assets `ASSETS` binding itself, so `wrangler.jsonc` stays minimal (name/compat/flags/observability) and must NOT set `pages_build_output_dir` (Pages mode rejects the adapter's reserved `ASSETS` binding). Static pages are served from the Worker's static assets; the one dynamic surface (`/api/contact`) runs on-demand in the same Worker. | [0005](../docs/adr/0005-deploy-target.md) |
| **Rendering** | `output: 'static'` for all 9 pages; `src/pages/api/contact.ts` is the **sole** on-demand route (`export const prerender = false`). `passthroughImageService()` (no native Sharp on Workers). | [0004](../docs/adr/0004-rendering-ssg-vs-ssr.md) |
| **Routing** | Six static `.astro` pages + one index + a single `[slug].astro` catch route whose `getStaticPaths()` allow-lists **exactly** the 3 article slugs. `trailingSlash: 'always'`, `build.format: 'directory'`. | [0002](../docs/adr/0002-routing-model.md) |
| **Content model** | Typed `blog` content collection (`src/content/blog/*.md`) for the 3 articles; 6 static pages as plain `.astro`. Article body copied from baseline HTML to preserve diacritics. Image passthrough policy. | [0003](../docs/adr/0003-content-pipeline.md) |
| **Contact form** | Astro SSR POST endpoint + **Resend** SDK; zod validation; hidden honeypot + server-side rate-limit; no visible CAPTCHA. POST target `/sideform.php` → `/api/contact`. Legacy PHP/SendGrid NOT ported. | [0004](../docs/adr/0004-rendering-ssg-vs-ssr.md), [0006](../docs/adr/0006-contact-form-handler.md) |
| **Framework** | Astro, **no UI framework island** (`@astrojs/svelte` NOT installed). All interactivity is vanilla JS in `script.js`. | [0001](../docs/adr/0001-framework-choice.md) |

---

## 3. Route map

9 routes total. **All trailing-slash** (`trailingSlash: 'always'`, cross-validated three ways: canonical
tag, `og:url`, and every sitemap `<loc>` — no exceptions). The **3 articles resolve at root level**, NOT
under `/informatii-utile/` — the single most parity-critical routing fact (ADR 0002). Global behaviours
(nav hamburger, dark-mode toggle, back-to-top) are present on **all 9 routes** and omitted from per-row
detail for brevity.

| # | URL | Astro source file | Type | Analytics (GTM-NGTSNLX + Ads AW-10780123066) |
| --- | --- | --- | --- | --- |
| 1 | `/` | `src/pages/index.astro` | Static (SSG) | **YES** |
| 2 | `/contact/` | `src/pages/contact.astro` **+** `src/pages/api/contact.ts` (SSR POST) | Static page + 1 on-demand endpoint | **YES** |
| 3 | `/informatii-utile/` | `src/pages/informatii-utile.astro` | Static (SSG), lists `blog` collection | **YES** |
| 4 | `/totul-despre-dezinsectie/` | `src/pages/[slug].astro` (ART1) | Static (SSG), `blog` collection | **YES** |
| 5 | `/cum-scapi-de-gandaci/` | `src/pages/[slug].astro` (ART2) | Static (SSG), `blog` collection | **YES** |
| 6 | `/dezinfectie-dezinsectie-deratizare-diferente/` | `src/pages/[slug].astro` (ART3) | Static (SSG), `blog` collection | **YES** |
| 7 | `/termeni-si-conditii/` | `src/pages/termeni-si-conditii.astro` | Static (SSG) | **NONE** |
| 8 | `/confidentialitate/` | `src/pages/confidentialitate.astro` | Static (SSG) | **NONE** |
| 9 | `/cookies/` | `src/pages/cookies.astro` | Static (SSG) | **NONE** |

**Root-level article fact.** Elder.js produced root-level article URLs via the markdown plugin
(`slugFormatter → false`, `createRoutes: true`). Astro replicates this with one `[slug].astro` whose
`getStaticPaths()` is the **sole allow-list** of the 3 slugs; any other slug 404s at build (parity-safe).
Astro static-file route priority guarantees the 6 fixed pages always win over the catch route. A Vitest
assertion MUST pin `getStaticPaths()` output to exactly those 3 slugs.

```ts
src/pages/
	index.astro                                  → /
	contact.astro                                → /contact/
	informatii-utile.astro                       → /informatii-utile/   (blog index)
	termeni-si-conditii.astro                    → /termeni-si-conditii/
	confidentialitate.astro                      → /confidentialitate/
	cookies.astro                                → /cookies/
	[slug].astro                                 → 3 root-level articles (allow-list)
	api/
		contact.ts                               → POST handler (prerender = false)
```

---

## 4. Redirect plan — NONE

**All 9 public URLs are byte-identical between the legacy site and the rebuild. Zero 301 redirects are
required.** The trailing-slash convention, the root-level article paths, and every legal/index path match
the live site exactly (verified against the sitemap `<loc>` set and canonical tags in
[`seo-matrix.md`](inventory/seo-matrix.md) §1.3). If any URL change is *later* discovered, it requires its
own ADR plus an explicit redirect rule — none is in scope now.

**`robots.txt` (reproduced verbatim):**

```
User-agent: *
Disallow: /login

Sitemap: https://dedede.ro/sitemap.xml
```

Single `User-agent: *` block, `/login` the only disallow, absolute https sitemap line. Emitted as a static
`public/robots.txt` (not generated), matching [`parity/baseline/seo/robots.txt`](baseline/seo/robots.txt).

---

## 5. Component plan

Source of truth and evidence line numbers: [`components.md`](inventory/components.md). Headline:
**zero of the six legacy display components need hydration.** **Do NOT install `@astrojs/svelte`.**

**13 static → `.astro` (or TS helper):**

| Legacy component | Astro target | Notes |
| --- | --- | --- |
| `Layout.svelte` | `src/layouts/BaseLayout.astro` | Head meta, skip-nav, GTM `<noscript>` per-page (legal pages get none). `onMount` was a dead stub — dropped. |
| `DeHeader.svelte` | `src/components/DeHeader.astro` | Active-nav class from `Astro.url.pathname`. Hamburger handler lives in `script.js`. |
| `DeFooter.svelte` | `src/components/DeFooter.astro` | Copyright `2021-${new Date().getFullYear()}` at build. Dark-mode/back-to-top wired in `script.js`. |
| `DataCitibila.svelte` | `src/utils/formatDate.ts` | Pure RO date formatter → TS helper. |
| `TimpCitire.svelte` | `src/utils/readingTime.ts` | `Math.round(words/225)` → TS helper. Drop dead `add_resize_listener` import. |
| `Articol.svelte` | `src/components/Articol.astro` | Article card; composes the two helpers. |
| `Home.svelte` | `src/pages/index.astro` | Hero, 3× `schema.org/Service` microdata (preserve), testimonials, article list. |
| `BlogIndex.svelte` | `src/pages/informatii-utile.astro` | `getCollection('blog')`-driven cards. |
| `BlogPost.svelte` | `src/pages/[slug].astro` | `<Content />` body, prev/next, `Article`+`BreadcrumbList` microdata. Drop dead import. |
| `InformatiiUtile.svelte` | (dissolves) | Dispatcher → splits into the index + `[slug].astro`; no runtime component. |
| `cookies.svelte` | `src/pages/cookies.astro` | Pure prose; no analytics. Drop dead `Articol` import. |
| `confidentialitate.svelte` | `src/pages/confidentialitate.astro` | Pure prose; no analytics. Drop dead import. |
| `termeni-si-conditii.svelte` | `src/pages/termeni-si-conditii.astro` | Pure prose; **keeps its embedded cookie-policy section** (it IS in the deployed HTML — verify against baseline before copying). No analytics. |

**1 contact-form island — vanilla JS, no framework:**

The `Contact.svelte` form markup becomes **static HTML** in `contact.astro` (preserve every field `id`
and hidden-field `name` exactly). All form JS lives in `script.js`. **No framework island** — the
`bind:this`/`bind:value` Svelte constructs were SSR anti-patterns that `script.js` already replaces with
`getElementById` lookups.

**7 `script.js` behaviours migrate as-is** to `public/resources/script.js` (deferred, self-hosted):
hamburger toggle, desktop-resize auto-close, dark-mode (localStorage; needs an early `<script is:inline>`
to prevent mode-flash), back-to-top (IntersectionObserver), contact AJAX submit (**target updated to
`/api/contact`**), UTM/URL hidden-field population (legacy had a real bug — `urlParams = []` never read
the URL; the rebuild must populate from `URLSearchParams` explicitly), and GTM+Ads injection (6 non-legal
routes only). `dataLayer` events (`formularInitializat`, `formularTrimis`, `conversieAcceptata`,
`formularEroare`) and the `gtag('event','conversion',…)` call must fire identically. Service-worker
registration stays **commented out** — do not enable.

---

## 6. Content pipeline

Typed `blog` content collection at `src/content/blog/*.md` powers **both** the `/informatii-utile/` index
and `[slug].astro`. The 6 static pages are plain `.astro` with prose copied **from the deployed baseline
HTML** (`parity/baseline/html/<route>/index.html`), NOT from Svelte source, to preserve exact diacritics
and legacy encoding. Detail: [`content.md`](inventory/content.md).

**Corrected Zod schema** (the ADR 0003 *draft* was wrong — it used `z.coerce.date()`, which round-trips
and re-formats the value and would break `article:published_time` parity. Dates are bare
`YYYY-MM-DDTHH:MM:SS`, no timezone, and MUST pass through verbatim):

```ts
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		description: z.string(),
		excerpt: z.string(),
		// bare YYYY-MM-DDTHH:MM:SS, NO timezone, NO coerce — verbatim to article:published_time
		date: z.string(),
		author: z.string(),
		thumbnail: z.object({
			name: z.string(), // basename; component appends -desktop.webp / -mobile.webp / -mobile.jpg
			alt: z.string(),
		}),
		ogimage: z.object({
			url: z.string(), // root-relative, e.g. /images/totul-despre-dezinsectie-og.jpg
			alt: z.string(),
		}),
		modifiedDate: z.string().optional(), // absent in frontmatter; defaults to `date`
	}),
});

export const collections = { blog };
```

**Derived at build (NOT stored):** `wordCount` (1279 / 1123 / 831), `readingTime = round(words/225)`
(6 / 5 / 4 min), human display date (`14 Septembrie 2021 la ora 11:40`), prev/next (chronological
ascending by `date`), breadcrumb position, hero `<picture>` srcset from `thumbnail.name`. Prev/next order:
`ddd-diferente` (oldest) → `cum-scapi-de-gandaci` → `totul-despre-dezinsectie` (newest).

**Image policy (ADR 0003).** Copy legacy `images/` **byte-for-byte** to `public/images/`; serve via
`passthroughImageService()` — **NO re-encode until parity is certified.** `astro:assets` + Sharp are
permitted **ONLY** for NEW images (the new OG image, §9b). Reproduce the article hero `<picture>` +
`<source srcset>` WebP/JPEG breakpoints exactly. Self-hosted `archivo-var.woff2` preloaded on all routes.

---

## 7. Contact form spec

| Aspect | Specification |
| --- | --- |
| **Endpoint** | `src/pages/api/contact.ts`, `export const prerender = false` — the ONLY on-demand route. `POST` only; `GET` → `405`; malformed/invalid body → `400`. |
| **Runtime** | Cloudflare Worker via `@astrojs/cloudflare`. |
| **Validation** | **zod** (free via `astro:content`, no extra dependency) over all expected fields (`side_name`, `side_email`, `side_telephone`, `side_tip`, `side_mesaj`, GDPR consent + UTM/`gclid`/`side_url` hidden fields). |
| **Email** | **Resend** SDK — `Resend.emails.send()`. |
| **Env shape** (names only; values gitignored / Cloudflare bindings) | `RESEND_API_KEY`, `RESEND_FROM` (verified sender), `CONTACT_TO` (recipient inbox). A committed `.env.example` documents the shape with placeholders. |
| **Spam protection** | **Hidden honeypot** field (CSS-hidden, not `type=hidden`, to defeat smart bots; bot-filled = silent discard) **+ server-side validation + best-effort in-process rate-limit**. **NO visible CAPTCHA** — form UI stays pixel-identical. |
| **Preserved UX** | Existing AJAX flow, all UTM hidden fields, GDPR checkbox, `dataLayer` conversion events — verbatim. **Only the POST target changes** (`/sideform.php` → `/api/contact`). |
| **Retired** | `sideform.php` + `sendgrid-php/` SDK + vendor are NOT ported (documented retirement, not a gap). |

**Operational prerequisites (outside the repo, before production deploy):** Resend DNS verification of the
sending domain; all three env vars bound in Cloudflare (Preview + Production) — a missing binding is a
runtime `500`, not a build error.

---

## 8. Dependency budget

Pinned to the latest stable resolved from the npm registry on **2026-05-31**. CVE posture is re-validated
in Phase 4 via `pnpm audit --audit-level=high`. The parity capture/diff tooling under
[`parity/tools/`](tools/) keeps its **own** `package.json` and is deliberately NOT a project dependency —
it never pollutes the shipped budget.

### 8.1 Runtime dependencies

| Package | Version | Justification | CVE check |
| --- | --- | --- | --- |
| `astro` | `^6.4.2` | The framework. SSG-first, content collections, `passthroughImageService`. | pending pnpm audit (Phase 4) |
| `@astrojs/cloudflare` | `^13.6.0` | Workers (Static Assets) adapter; serves the static pages + the one on-demand route (`/api/contact`) and manages `main`+`ASSETS` for `wrangler deploy` (NOT Pages). Advisory history — pin + audit. | pending pnpm audit (Phase 4) |
| `@astrojs/sitemap` | `^3.7.3` | Generates `sitemap.xml`; supports per-URL `priority`/`changefreq`/`lastmod` (§9d). | pending pnpm audit (Phase 4) |
| `resend` | `^6.12.4` | Transactional email from the contact endpoint; matches the viorelmocanu.ro stack. | pending pnpm audit (Phase 4) |
| `sass-embedded` | `^1.100.0` | Compiles the legacy `style.scss` (SCSS in `.astro` `<style lang="scss">`). | pending pnpm audit (Phase 4) |

> `zod` is **not** a direct dependency — it ships transitively via `astro:content` and is used for both the
> collection schema and the contact-endpoint validation. **No `@astrojs/svelte`** (zero framework islands).
> **No `@astrojs/mdx`** (plain `.md` articles).

### 8.2 Dev dependencies

| Package | Version | Justification | CVE check |
| --- | --- | --- | --- |
| `typescript` | `^6.0.3` | Strictest TS for `.astro`/`.ts`. | pending pnpm audit (Phase 4) |
| `@astrojs/check` | `^0.9.9` | `astro check` typecheck/diagnostics for `.astro`. | pending pnpm audit (Phase 4) |
| `typescript-eslint` | `^8.60.0` | Unified TS-ESLint parser **+** plugin meta-package (the `@typescript-eslint` toolchain) for flat config. | pending pnpm audit (Phase 4) |
| `eslint` | `^10.4.1` | Linter (flat config). | pending pnpm audit (Phase 4) |
| `eslint-plugin-astro` | `^1.7.0` | Lint rules for `.astro` files. | pending pnpm audit (Phase 4) |
| `astro-eslint-parser` | `^1.4.0` | Parser ESLint needs for `.astro`. | pending pnpm audit (Phase 4) |
| `eslint-plugin-jsx-a11y` | `^6.10.2` | a11y lint over template expressions (axe gate complement). | pending pnpm audit (Phase 4) |
| `eslint-plugin-jsdoc` | `^63.0.0` | Enforces JSDoc on the TS helpers (`formatDate`, `readingTime`). | pending pnpm audit (Phase 4) |
| `prettier` | `^3.8.3` | Formatter. | pending pnpm audit (Phase 4) |
| `prettier-plugin-astro` | `^0.14.1` | Prettier support for `.astro`. | pending pnpm audit (Phase 4) |
| `vitest` | `^4.1.7` | Unit tests (date/reading-time helpers, `getStaticPaths` allow-list, zod schema). | pending pnpm audit (Phase 4) |
| `@playwright/test` | `^1.60.0` | E2E parity (nav, dark mode, back-to-top, contact submit) + parity screenshot harness. | pending pnpm audit (Phase 4) |
| `@axe-core/playwright` | `^4.11.3` | a11y assertions in E2E; the "no-new-serious" gate. | pending pnpm audit (Phase 4) |
| `sharp` | `^0.34.5` | Build-host image encode for the **new** OG image only (NOT for legacy passthrough images; not on the Worker). | pending pnpm audit (Phase 4) |
| `wrangler` | `^4.95.0` | Cloudflare local dev/deploy tooling for the Worker route. | pending pnpm audit (Phase 4) |
| `husky` | `^9.1.7` | Git hooks (pre-commit lint/format; commit-msg lint). | pending pnpm audit (Phase 4) |
| `@commitlint/cli` | `^21.0.2` | Conventional-commit enforcement at commit-msg. | pending pnpm audit (Phase 4) |
| `@commitlint/config-conventional` | `^21.0.2` | Conventional-commit ruleset. | pending pnpm audit (Phase 4) |
| `knip` | `^6.14.2` | Dead-code / unused-dependency detection (keeps the budget honest). | pending pnpm audit (Phase 4) |

> **Verification gate dependency (DoD §6, scaffolded Phase 4):** `@lhci/cli ^0.15.1` is used for the
> "Lighthouse ≥ live" gate against `astro preview`. Kept out of the shipped runtime budget.

---

## 9. Approved fixes & deviations

The human approved **all four** fix groups at GATE 1. Each is an intentional, documented deviation from
byte/pixel parity and carries a [`WAIVERS.md`](WAIVERS.md) entry the Phase-5 verifier consults to
classify *expected deviation vs real regression*.

- **(a) SEO meta cleanups** — [WAIVER-SEO-01..04]. Omit the literal `@TODO` `twitter:site`/`twitter:creator`
  tags entirely (keep `twitter:card=summary_large_image`); make article `og:image` **absolute**
  (prepend `https://dedede.ro`); set `og:type='article'` on the 3 article pages (keep `website` elsewhere);
  normalise `/cookies/` `og:description` to `<meta name=…>` (it was the lone `property=` outlier). **No
  on-page pixel change.**
- **(b) Real OG image** — [WAIVER-ASSET-01]. The live `images/og-image.jpg` is **0 bytes** (broken social
  sharing on home + 3 legal pages). Produce a branded 1200×630 `og-image.jpg` on a **navy `#00214d`
  background** (the yellow+pink brand wordmark would be invisible on the yellow brand color) carrying the
  `dedede-logo-desktop.svg` wordmark + a **yellow `#fde24f`** tagline "Spații fără dăunători"; replaces the
  empty file; default `og:image` for pages without their own. Generated via Sharp
  (`scripts/generate-og-image.mjs`, `pnpm generate:og`).
- **(c) Homepage `.ServiceText .Highlight` contrast** — [WAIVER-VISUAL-01]. Fix the 1 serious axe
  color-contrast violation in the **4 homepage service-description `.Highlight` spans** (`.ServiceText
  .Highlight` — NOT the Hero `<h1>`) to meet WCAG AA. The fix is **scheme-aware**: `#ff5470` → `#cc2952`
  in the light scheme (near-white bg), keep `#ff5470` in the dark scheme (navy `.Services` bg, where
  `#cc2952` would fail). **This is the SINGLE approved visual waiver** — it shifts only those few spans
  and stays **under the 0.1% pixel threshold** at all 3 viewports (no threshold exception needed).
- **(d) Sitemap / PWA niceties** — [WAIVER-SEO-05]. Add `<lastmod>` to the sitemap (article `lastmod` =
  `modifiedDate ?? date`; static pages = build date); DROP the Google-deprecated `rel=prev`/`rel=next`
  on articles; add `"start_url": "/"` to `site.webmanifest`.

**Explicitly PRESERVED verbatim (NOT changed):** inline microdata (`schema.org` Service/LocalBusiness/
Article/BreadcrumbList — NO JSON-LD added); GTM-NGTSNLX + Ads AW-10780123066 on the 6 non-legal routes
only; legal pages load NO analytics; NO Cookiebot/consent UI (confirmed absent on live — GDPR gap is a
future recommendation, NOT in scope); `service-worker.js` NOT registered; `archivo-var.woff2` preloaded;
`theme-color #fde24f`; `mask-icon color="#00214d"`; `robots.txt` verbatim; `/termeni-si-conditii/` keeps
its embedded cookie-policy section; emoji in home/contact meta descriptions reproduced exactly;
`article:*` timestamps reproduced verbatim per route (mixed TZ/no-TZ formats preserved).

---

## 10. Parity acceptance criteria (the DoD oracle)

A route is "done" only when **all** of the following hold. Evidence is committed under
[`parity/baseline/`](baseline/); the harness is [`parity/tools/`](tools/). The Phase-5 verifier re-runs
`capture-baseline.mjs --base http://localhost:4321` against the built static output to produce the "after"
set, then `diff-screens.mjs` against the committed baseline. **NOTE:** `astro preview` does NOT work with
the `@astrojs/cloudflare` Workers adapter (it errors), so the "after" site is served from `dist/client/`
via `node parity/tools/serve-static.mjs --root dist/client --port 4321` (the same zero-dep server the E2E
and Lighthouse gates use). Analytics/ads/consent hosts are **blocked** during capture so pixels are
deterministic (GTM/Ads are verified *functionally* in E2E, not pixel-diffed).

1. **Route-inventory match** — every legacy public URL resolves identically (the 9 routes in §3, all
   trailing-slash, articles at root level). No 301s (§4). A Vitest assertion pins `[slug].astro`
   `getStaticPaths()` to exactly the 3 article slugs.
2. **Visual parity** — `≤ 0.1%` pixel diff (`maxDiffPixelRatio = 0.001`, the `diff-screens.mjs`
   `--threshold 0.001`) per view at **mobile 375×812 / tablet 768×1024 / desktop 1440×900**, **EXCEPT**
   the documented waivers in [`WAIVERS.md`](WAIVERS.md) — only WAIVER-VISUAL-01 (homepage
   `.ServiceText .Highlight` spans) produces a small bounded diff on `index` at all 3 viewports, and even
   that stays **≤ 0.1%** (no threshold exception).
3. **Functional E2E parity** — Playwright covers nav hamburger (+ desktop-resize close), dark-mode
   toggle (localStorage persistence, no flash), back-to-top, UTM hidden-field population, and contact-form
   submit (success + validation + honeypot + `dataLayer` events).
4. **SEO/meta + sitemap + robots parity** — `<title>`, description, canonical, full `og:*`/`article:*`/
   `twitter:*`, theme-color, font preload, mask-icon, microdata, `sitemap.xml`, `robots.txt`,
   `site.webmanifest` diffed against [`parity/baseline/meta/`](baseline/meta/) +
   [`parity/baseline/seo/`](baseline/seo/), **accounting for the approved meta/sitemap/manifest changes**
   in §9 (a)/(d) per [`WAIVERS.md`](WAIVERS.md). All `og:*`/`article:*` emitted as `<meta name=…>`.
5. **Quality gates green (`pnpm verify`)** — `astro check` / `tsc --noEmit`, ESLint, Prettier
   `--check`, Vitest, Playwright, `@axe-core/playwright`, `knip`, and `pnpm audit --audit-level=high`
   all pass.
6. **Lighthouse ≥ live + axe no-new-serious** — Lighthouse against the built site (served from
   `dist/client` on `:4321`, NOT `astro preview`) scores **≥** the legacy `/livesite` baseline (served on
   `:4322`) on every category — verified by `scripts/lh-compare.mjs` (analytics hosts blocked for
   determinism). axe reports **no new serious** violations vs the baseline
   ([`parity/baseline/a11y/`](baseline/a11y/)) — the *only* permitted axe delta is the *removal* of the
   homepage `.ServiceText .Highlight` contrast violation (WAIVER-VISUAL-01, an improvement). NB: the fix
   is scheme-aware so it also holds under Lighthouse's `prefers-color-scheme: dark` desktop emulation.

---

## 11. Phase plan forward

| Phase | Gate | What happens |
| --- | --- | --- |
| **Phase 3 — Plan** | → **GATE 2** | Detailed implementation plan from this locked spec: file-by-file task list, test plan, the `astro.config.mjs` shape (`output: 'static'`, `@astrojs/cloudflare`, `passthroughImageService()`, `trailingSlash: 'always'`, `build.format: 'directory'`, `@astrojs/sitemap` with the 9 fixed priorities + `lastmod`), and per-Worker `wrangler.jsonc` colocated with the contact endpoint. Human approves at GATE 2 before any code. |
| **Phase 4 — Implement** | | Scaffold the Astro project on `feat/astro-rebuild`; install the pinned budget (§8); run `pnpm audit` and record CVE results; build the 13 components, 9 routes, content collection, contact endpoint; copy assets byte-for-byte; generate the new OG image; apply the 4 approved fixes; wire husky/commitlint. |
| **Phase 5 — Verify** | | Re-run the parity harness (`capture-baseline.mjs` → `diff-screens.mjs`) against `astro preview`; run all DoD gates (§10); classify every diff against [`WAIVERS.md`](WAIVERS.md) — expected-deviation vs regression. Fix regressions, re-verify. |
| **Phase 6 — PR** | | Open the PR-only delivery on `feat/astro-rebuild` with the parity report attached. Human reviews and deploys. No commit/push/merge without explicit human go-ahead per gate. |

---

*This spec is the GATE-1 source of truth. Rationale lives in the ADRs; intentional deviations live in
[`WAIVERS.md`](WAIVERS.md); evidence lives in [`parity/baseline/`](baseline/).*
