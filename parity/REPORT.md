# Parity Report — dedede.ro Astro Rebuild

> **Verdict: DONE.** All six Definition-of-Done criteria (SPEC §10) pass. The legacy Elder.js +
> Svelte site has been re-platformed to Astro 6 with strict visual, functional, and SEO parity to
> the live site. Generated for the `feat/astro-rebuild` PR. Evidence is committed under `parity/`;
> every check is reproducible offline against the committed baseline via `parity/tools/`.

| # | DoD criterion | Result |
| --- | --- | --- |
| 1 | Route-inventory match | ✅ 9/9 routes resolve (articles at root); `getStaticPaths` pinned to exactly 3 slugs; **0 redirects** |
| 2 | Visual parity (≤0.1% per view) | ✅ **27/27 views** at mobile/tablet/desktop; **max diff 0.082%** |
| 3 | Functional E2E parity | ✅ Playwright **43 passed** (nav, dark-mode, back-to-top, UTM, contact form) |
| 4 | SEO / meta / sitemap / robots parity | ✅ **0 regressions** (24 approved-waiver changes); robots identical; 9 sitemap URLs match |
| 5 | Quality gates (`pnpm verify`) | ✅ format · lint · typecheck · unit (32) · e2e — **5/5**; knip 0 unused; audit 0 high |
| 6 | Lighthouse ≥ live + axe no-new-serious | ✅ rebuilt **≥ baseline** on every route+category; axe **0 violations** (was 1 serious) |

---

## 1. Route inventory & redirects

All **9 public URLs are byte-identical** between the legacy site and the rebuild — **zero 301 redirects required**.

| URL | Astro source | Type | Analytics |
| --- | --- | --- | --- |
| `/` | `src/pages/index.astro` | static | GTM + Ads |
| `/contact/` | `src/pages/contact.astro` + `src/pages/api/contact.ts` (SSR) | static + 1 endpoint | GTM + Ads |
| `/informatii-utile/` | `src/pages/informatii-utile.astro` | static | GTM + Ads |
| `/totul-despre-dezinsectie/` | `src/pages/[slug].astro` | static (root-level article) | GTM + Ads |
| `/cum-scapi-de-gandaci/` | `src/pages/[slug].astro` | static (root-level article) | GTM + Ads |
| `/dezinfectie-dezinsectie-deratizare-diferente/` | `src/pages/[slug].astro` | static (root-level article) | GTM + Ads |
| `/termeni-si-conditii/` | `src/pages/termeni-si-conditii.astro` | static | none |
| `/confidentialitate/` | `src/pages/confidentialitate.astro` | static | none |
| `/cookies/` | `src/pages/cookies.astro` | static | none |

`robots.txt` is reproduced verbatim; `sitemap.xml` carries the same 9 URLs, priorities, and changefreq (only `<lastmod>` added — WAIVER-SEO-05).

## 2. Visual parity — 27/27 ≤ 0.1%

Captured deterministically (analytics/ads/consent hosts blocked) at **mobile 375×812 / tablet 768×1024 / desktop 1440×900** and diffed against the committed baseline (`parity/tools/diff-screens.mjs`, threshold `0.001`). Baseline-vs-live validated at **0px** before the rebuild, so the small residuals below are genuine (sub-pixel text/image anti-aliasing), not capture noise.

- **27/27 within 0.1%. Max diff: 0.082%** (`cookies__mobile`). Most routes ≤ 0.03%.
- Full per-view table: [`parity/report/visual-diff-report.json`](report/visual-diff-report.json).
- Gallery (before / after / diff): [`parity/report/gallery/`](report/gallery/) — home, contact, an article at desktop.

## 3. SEO / metadata parity — 0 regressions

Automated head-metadata diff (`parity/tools/diff-meta.mjs`) across all 9 routes: **0 regressions**, **24 changes — all approved waivers**:

- **WAIVER-SEO-01** — `twitter:site`/`twitter:creator` `@TODO` placeholders omitted (×9 routes, ×2).
- **WAIVER-SEO-02** — article `og:image` made absolute (×3).
- **WAIVER-SEO-03** — `og:type=article` on the 3 articles (×3).

Inline microdata (schema.org Service / LocalBusiness / Article / BreadcrumbList) reproduced verbatim — **no JSON-LD added**. `article:*` timestamps, theme-color `#fde24f`, font preload, favicons, and the per-route conditional analytics gating all match.

## 4. Accessibility — 0 violations (improved)

axe-core (WCAG 2.1 A/AA): **0 violations** on all 9 routes — an improvement over the live site's **1 pre-existing serious** color-contrast violation. The `.ServiceText .Highlight` text (`#ff5470` on near-white, 3.05:1) is darkened to `#cc2952` (5.15:1) in **light** scheme while keeping `#ff5470` (5.81:1) on the **dark** services background — scheme-aware, so no captured (light-mode) pixels change. (WAIVER-VISUAL-01.)

## 5. Lighthouse ≥ live

`scripts/lh-compare.mjs` (Lighthouse 12, desktop, analytics blocked) — rebuilt (R) vs legacy `/livesite` baseline (B), 0–100:

| Route | Perf R/B | A11y R/B | Best-Practices R/B | SEO R/B |
| --- | --- | --- | --- | --- |
| `/` | 100/100 | 99/99 | 100/100 | 100/100 |
| `/contact/` | 100/100 | 96/96 | 100/100 | 100/100 |
| `/informatii-utile/` | 100/100 | 99/99 | 100/100 | 100/100 |
| 3 articles | 100/100 | 99/99 | 100/100 | 100/100 |
| 3 legal pages | 100/100 | 99/99 | 96/96 | 100/100 |

**Rebuilt ≥ baseline on every route and category.** (The identical 96 a11y on contact and 96 best-practices on legal pages are reproduced from the legacy site, not regressions.)

## 6. Quality gates

- `pnpm verify` (format → lint → typecheck → unit → e2e): **5/5 PASS** (32 unit + 43 e2e tests).
- `pnpm knip`: **0 unused** files/deps.
- `pnpm audit --audit-level=high`: **0 high/critical** (the one HIGH `tmp` advisory remediated via a pnpm override → 0.2.7). 2 dev-only moderates remain, off the runtime graph.

## 7. Dependency budget (pinned, security-vetted)

**Runtime (5):** `astro` ^6.4.2 · `@astrojs/cloudflare` ^13.6 · `@astrojs/sitemap` ^3.7 · `resend` ^6.12 · `sass-embedded` ^1.100. *(zod ships via `astro:content`; no `@astrojs/svelte`, no `@astrojs/mdx`.)*
**Dev (~20):** typescript, @astrojs/check, eslint + plugins (astro/ts/a11y/jsdoc), prettier + prettier-plugin-astro, vitest, @playwright/test, @axe-core/playwright, sharp (OG image only, build-host), wrangler, husky, commitlint, knip, @lhci/cli, lighthouse.

## 8. Approved deviations (waivers)

The complete register is [`parity/WAIVERS.md`](WAIVERS.md). Summary:

| Waiver | What | Category |
| --- | --- | --- |
| SEO-01 | omit `@TODO` twitter handles | meta |
| SEO-02 | absolute article `og:image` | meta |
| SEO-03 | `og:type=article` on articles | meta |
| SEO-04 | `/cookies/` `og:description` as `name=` | meta |
| SEO-05 | sitemap `<lastmod>`; drop deprecated `rel=prev/next`; manifest `start_url` | sitemap/PWA |
| ASSET-01 | real 1200×630 OG image (replaces 0-byte file; navy bg) | asset |
| VISUAL-01 | `.ServiceText .Highlight` AA contrast fix (scheme-aware; ≤0.1%, no threshold exception) | visual/a11y |

## 9. Residual risks / notes

- **Contact form is deploy-gated, not PR-gated:** `/api/contact` (Astro SSR + Resend) needs `RESEND_API_KEY` / `RESEND_FROM` / `CONTACT_TO` bound in Cloudflare (Preview + Production) and a Resend-verified sender domain. A missing binding is a runtime 500, not a build error. Endpoint logic is unit-tested (12/12) with Resend mocked.
- **Deploy is Cloudflare Workers (Static Assets), not Pages** — `@astrojs/cloudflare` v13 is a Workers adapter; deploy with `wrangler deploy`. (See ADR-0005.)
- **`astro preview` does not work** with the Cloudflare adapter — serve the static `dist/client/` via `parity/tools/serve-static.mjs` for local preview/parity.
- 2 dev-only moderate advisories (`yaml` via @astrojs/check, `uuid` via @lhci/cli) remain — off the production graph; clear on the tools' next minor bumps.

## How to reproduce

```bash
pnpm install
pnpm build                                   # -> dist/client/ (+ Worker in dist/server)
node parity/tools/serve-static.mjs --root dist/client --port 4321 &
node parity/tools/capture-baseline.mjs --base http://localhost:4321 --out parity/after --label after
node parity/tools/diff-screens.mjs --a parity/baseline/screenshots --b parity/after/screenshots   # 27/27 ≤0.1%
node parity/tools/diff-meta.mjs   --a parity/baseline/meta        --b parity/after/meta            # 0 regressions
pnpm verify                                  # 5/5 gates
node scripts/lh-compare.mjs                  # Lighthouse rebuilt vs /livesite
```
