# MASTER INVENTORY — dedede.ro Astro Rebuild (Phase 0 synthesis)

> Single entry point to the Phase-0 parity inventory. Summarises and **links** to the five detail
> files; does not restate them. Cross-reference: [`CONTEXT.md`](../CONTEXT.md), [`docs/adr/0001`–`0005`](../docs/adr/).
> Source of truth for content/markup/assets is the gitignored `/livesite` FTP snapshot; baseline
> fixtures live under [`parity/baseline/`](baseline/). Generated 2026-05-31.

## Detail files (read these for depth)

| Area | File | What it covers |
| --- | --- | --- |
| Legacy build & routing | [`inventory/legacy-build.md`](inventory/legacy-build.md) | Elder.js/Svelte/Rollup pipeline, hooks, route discovery, markdown-plugin slug behaviour, Netlify config, Astro mapping table |
| Components | [`inventory/components.md`](inventory/components.md) | 14-item component table, static/interactive classification, `script.js` behaviour map, conversion order |
| Content | [`inventory/content.md`](inventory/content.md) | Per-article frontmatter, derived fields, livesite drift analysis, proposed Zod schema, GATE-1 content ambiguities |
| Assets | [`inventory/assets.md`](inventory/assets.md) | 259-file manifest, counts/weights by category, broken/unused assets, image-parity rules |
| SEO matrix | [`inventory/seo-matrix.md`](inventory/seo-matrix.md) | Per-route head-metadata matrix, sitemap/robots/manifest, trailing-slash verdict, 11 SEO anomalies (A1–A11) |

---

## 1. Route map

9 routes total, **all trailing-slash** (`trailingSlash: 'always'`). "Interactive elements" = client-JS-driven DOM behaviour, all handled by self-hosted `script.js` (no framework island except the contact form).

| URL | Type | Content source | Interactive elements | Analytics |
| --- | --- | --- | --- | --- |
| `/` | Static page | `Home.svelte` (hardcoded) | nav hamburger, dark-mode, back-to-top | GTM + Ads |
| `/contact/` | Static page **+ 1 SSR/POST surface** | `Contact.svelte` (hardcoded) | **contact form (AJAX→`sideform.php`)**, UTM hidden-field population, GDPR box, + global nav/dark/back-to-top | GTM + Ads |
| `/informatii-utile/` | Static page (data from collection) | `BlogIndex.svelte` + 3 MD records | article-card links, global nav/dark/back-to-top | GTM + Ads |
| `/totul-despre-dezinsectie/` | MD article, **root-level** | `src/content/blog/*.md` (ART1) | prev/next nav, global nav/dark/back-to-top | GTM + Ads |
| `/cum-scapi-de-gandaci/` | MD article, **root-level** | `*.md` (ART2) | prev/next nav, global nav/dark/back-to-top | GTM + Ads |
| `/dezinfectie-dezinsectie-deratizare-diferente/` | MD article, **root-level** | `*.md` (ART3) | prev/next nav, global nav/dark/back-to-top | GTM + Ads |
| `/termeni-si-conditii/` | Static page (pure prose) | `termeni-si-conditii.svelte` | global nav/dark/back-to-top only | **NONE** |
| `/confidentialitate/` | Static page (pure prose) | `confidentialitate.svelte` | global nav/dark/back-to-top only | **NONE** |
| `/cookies/` | Static page (pure prose) | `cookies.svelte` | global nav/dark/back-to-top only | **NONE** |

**Parity-critical:** the 3 articles resolve at **root level**, not under `/informatii-utile/`. Astro replicates via one `[slug].astro` catch route whose `getStaticPaths()` is the sole allow-list (ADR 0002). Nav hamburger, dark-mode, and back-to-top are global (present on all 9 routes) — omitted from per-row detail above for brevity.

---

## 2. Component static/interactive summary

| Bucket | Count | Items |
| --- | --- | --- |
| Static → `.astro` | **13** | Layout, DeHeader, DeFooter, DataCitibila, TimpCitire, Articol, Home, BlogIndex, BlogPost, InformatiiUtile (dispatcher, dissolves into 2 routes), cookies, confidentialitate, termeni-si-conditii |
| Interactive → vanilla-JS island (no framework) | **1** | Contact form (markup static; all JS in `script.js`) |

**Headline:** zero of the six legacy display components need hydration. `DataCitibila`/`TimpCitire` become TS helpers. The contact form is the only non-static surface, and even it ships **no framework** — its JS lives in `script.js`. **Do NOT install `@astrojs/svelte`.** Seven distinct vanilla-JS behaviours must migrate as-is in `script.js`: hamburger toggle, desktop-resize auto-close, dark-mode (localStorage), back-to-top (IntersectionObserver), contact AJAX submit, UTM/URL hidden-field population, GTM+Ads injection. Detail + evidence line numbers: [`components.md`](inventory/components.md).

---

## 3. Content-pipeline summary

- **No CMS / API / DB.** Static-page content is hardcoded in templates; 3 articles come from markdown frontmatter + body.
- **Livesite drift:** none — `livesite/` HTML is byte-equivalent to `parity/baseline/html/` and matches the repo markdown. Copy article bodies safely; verify rendering against baseline HTML (heading IDs, `ArticleBody` div).
- **Astro shape:** typed `blog` content collection (`src/content/blog/*.md`) for the 3 articles → powers both the index and `[slug].astro`; six static pages authored as plain `.astro`. Content text must be copied from **deployed baseline HTML** (not Svelte source) to preserve exact diacritics/legacy encoding.
- **Derived at build (not stored):** `wordCount` (1279/1123/831), `readingTime` = `round(words/225)` (6/5/4 min), human display date (`14 Septembrie 2021 la ora 11:40`), prev/next links (chronological by `date`), breadcrumb position, hero `<picture>` srcset from `thumbnail.name`.
- **Schema field set** (from actual frontmatter): `title, description, excerpt, date, author, thumbnail{name,alt}, ogimage{url,alt}` + optional `modifiedDate` (defaults to `date`). Article dates are bare `YYYY-MM-DDTHH:MM:SS` (no TZ) and must pass through verbatim to `article:published_time`. Detail: [`content.md`](inventory/content.md).

---

## 4. Asset summary

| Metric | Value |
| --- | --- |
| Total files on disk | **259** (~5.7 MB) |
| Manifest entries | 215 (214 enumerated + 1 vendor group) |
| Images (`images/`) | 56 files, ~3.46 MB |
| Actively-loaded images for rebuild | 38 files, ~2.56 MB |
| Inline icon SVGs (baked into HTML, not requested) | 22 (6 confirmed unused) |
| Self-hosted font (preloaded all routes) | `archivo-var.woff2`, 30.8 KB |
| Site JS / SW | `script.js` 15 KB (migrate as-is); `service-worker.js` 2.5 KB (**not registered** — do not enable) |
| Favicons / PWA icons | 14 (4 mstile PNGs unreferenced — safe to drop) |
| PHP backend (NOT ported to static) | `sideform.php` + `sendgrid-php/` SDK + vendor (replacement = GATE-1 decision) |

**Image policy (ADR 0003):** copy `images/` byte-for-byte to `public/images/`, serve via `passthroughImageService()`, **no re-encoding until parity is certified.** Notable assets: `servicii.svg` (697 KB, homepage only — SVGO candidate post-parity), `dedede-hero.svg` (118 KB). Detail: [`assets.md`](inventory/assets.md).

---

## 5. SEO parity summary

- **Trailing-slash verdict:** `trailingSlash: 'always'` — **confirmed on ALL 9 routes**, cross-validated three ways (canonical tag, `og:url`, and every sitemap `<loc>`). No exceptions.
- **Sitemap:** exactly 9 URLs, trailing-slash, fixed priorities (`/`=1.00, `/contact/`=1.00, index=0.80, articles=0.90, legal=0.50), `changefreq` monthly/weekly, **no `<lastmod>`**.
- **robots.txt:** single `User-agent: *`, `Disallow: /login` only, `Sitemap: https://dedede.ro/sitemap.xml`.
- **Structured data:** **inline microdata only** (`itemscope`/`itemprop` — `schema.org/Service`×3 + nested `LocalBusiness` on home; `schema.org/Article` + `BreadcrumbList` on articles). **Zero JSON-LD** (`jsonld` baseline array empty on all routes). Reproduce microdata; do NOT add JSON-LD without GATE-1 approval.
- **Per-route meta** (`<title>`, description, canonical, full `og:*`, `article:*`, `twitter:*`, theme-color `#fde24f`, font preload, `mask-icon color="#00214d"`) — exact values in [`seo-matrix.md`](inventory/seo-matrix.md). All `og:*`/`article:*` rendered as `<meta name=...>` (cookies `og:description` is the lone `property=` outlier).
- **Analytics gating:** GTM-NGTSNLX + Ads AW-10780123066 on 6 routes (home, contact, index, 3 articles); **legal pages load none**.
- **11 anomalies (A1–A11)** catalogued in the SEO matrix — the live-bug ones (twitter `@TODO`, root-relative article `og:image`, `article:*` on `website`-type pages, empty `og-image.jpg`) feed the GATE-1 questions below.

---

## 6. Open questions for GATE 1 (consolidated)

Merges the **decision-bearing ADR open questions (0002–0005)** with the **new evidence-backed anomalies** surfaced in this phase. ADR 0001 (framework) is Accepted — no question. Deduped; each is decision-ready. `[ADR n]` = originating ADR; `[Ann]` = SEO anomaly; `[new]` = surfaced this phase.

### A. Architecture / scaffold-blocking

1. **Deploy target** `[ADR 0005]` — Netlify (recommended) vs Cloudflare Pages+Workers vs nginx+Node sidecar? Does the client control the current nginx host, and is keeping it desirable? *This is the primary gating decision — it picks the adapter and unblocks the Phase-4 scaffold.*
2. **Contact-form backend + email provider** `[ADR 0005 + 0004]` — keep PHP `sideform.php` + SendGrid (max parity, no adapter) vs serverless Resend (default if PHP host goes away) vs serverless SendGrid (continuity if an account with validated sender domain exists)? Decide **together** with Q1.
3. **Rendering split** `[ADR 0004]` — confirm `output: 'static'` for all 9 pages with the contact form as the only dynamic surface, and pick the contact-handling option (1 keep PHP / 2 Astro SSR endpoint `api/contact.ts` / 3 external function). Bound to Q1/Q2.
4. **Article routing approach** `[ADR 0002]` — single `[slug].astro` catch route (recommended, collection-driven) vs three explicit static article files (maximally explicit)? Both yield identical root-level URLs.
5. **Content model** `[ADR 0003]` — typed `blog` collection for the 3 articles + plain `.astro` for the 6 static pages (recommended) vs all-`.astro` no-collection? Ratify the two-track image policy (passthrough legacy, Sharp for new only).
6. **Article frontmatter schema mismatch** `[new — ADR 0003 vs content.md]` — the draft schema in ADR 0003 (`canonical`, `ogImage`, `datePublished: z.coerce.date()`, `order`) does **not** match the actual live frontmatter (`date` bare-string no-TZ, `excerpt`, `thumbnail{name,alt}`, `ogimage{url,alt}`; **no** `canonical`/`order`/`ogImage`). Ratify the corrected field set from [`content.md`](inventory/content.md), incl. `date` as `z.string().datetime({offset:false})` (a `z.coerce.date()` round-trip would re-format and break `article:published_time` parity), and whether per-article Twitter/JSON-LD live in frontmatter or are composed in `BaseHead`.

### B. SEO / parity fidelity (preserve-the-bug vs fix-it)

7. **Twitter handles `@TODO`** `[A1, content §7.1]` — all 9 routes ship literal `twitter:site`/`twitter:creator = "@TODO"` (live placeholder bug). Provide the real handle, omit both tags, or reproduce `@TODO` verbatim?
8. **Root-relative article `og:image`** `[A5]` — articles use `/images/...og.jpg` (relative); OG spec requires absolute. Preserve for parity, or prepend `https://dedede.ro` (candidate-fix)?
9. **Empty `og-image.jpg` (0 bytes)** `[assets, A-broken]` — referenced as `og:image` by home + 3 legal pages; social sharing is currently broken on live. Must a real OG image be created (breaks byte-parity but fixes a live defect)?
10. **`og:type=website` + `article:*` on non-article / article pages** `[A2, A4]` — `article:published_time`/`modified_time` exist on every route despite `og:type=website`, and articles themselves use `website` not `article`. Preserve verbatim, or switch articles to `og:type=article` (candidate-fix)?
11. **Cookies `og:description` attribute outlier** `[A6]` — emitted as `property=` on `/cookies/` while all 8 others use `name=`. Normalise to `name=` everywhere (low-priority candidate-fix) or preserve?
12. **Sitemap `<lastmod>` + deprecated `rel=prev/next`** `[A7, A9]` — live sitemap has no `<lastmod>`; articles carry Google-deprecated `rel="prev"/"next"`. Reproduce exactly (recommended), or add `<lastmod>` / drop the deprecated links?
13. **PWA manifest `start_url`** `[A10]` — `site.webmanifest` has no `start_url`, which can hurt installability. Add `"start_url": "/"` (low-priority candidate-fix) or preserve?

### C. Accessibility / behaviour confirmations

14. **Homepage `.Highlight` color-contrast violation** `[A11, known finding]` — pre-existing serious axe violation in `<h1>`. Reproduce markup as-is and track as a separate a11y task, or fix during rebuild (would break pixel parity)?
15. **Cookiebot presence** `[CONTEXT §6]` — referenced in the brief but **absent from the FTP snapshot** and absent from all baseline HTML. Inspect live `https://dedede.ro` to confirm whether it is GTM-injected or a standalone script before Phase 4. (No cookie-consent UI found in any baseline HTML.)
16. **`termeni-si-conditii` embeds a cookie-policy section** `[content §7.5]` — the Svelte source for terms contains a `## Politica de utilizare a cookie-urilor` section. Confirm against deployed `/termeni-si-conditii/` HTML whether it belongs there or only on `/cookies/` before copying — do not duplicate blindly.

---

*Detail lives in the five linked files; this document is the index and the GATE-1 decision sheet.*
