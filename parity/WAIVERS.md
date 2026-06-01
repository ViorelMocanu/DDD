# WAIVERS — Parity Deviation Register

> **Purpose.** The single source of truth the **Phase-5 verifier** consults to classify every observed
> diff as either an **expected deviation** (an approved, intentional delta) or a **real regression** (a
> bug to fix). If a diff matches a waiver's *expected diff signature* below, it PASSES; any diff NOT
> covered here is a regression and FAILS the Definition of Done.
>
> **Status:** All entries APPROVED by the human at GATE 1 — 2026-05-31. Authority: the four approved fix
> groups in [`SPEC.md`](SPEC.md) §9. Evidence: [`parity/inventory/seo-matrix.md`](inventory/seo-matrix.md)
> (anomalies A1–A11), [`parity/inventory/assets.md`](inventory/assets.md). Harness:
> [`parity/tools/`](tools/) (`capture-baseline.mjs` → `diff-screens.mjs`, threshold `0.001`).
>
> **Default rule:** the baseline is reproduced **byte/pixel-exact** on all 9 routes at all 3 viewports
> (375×812 / 768×1024 / 1440×900). These waivers are the **complete and exhaustive** list of permitted
> departures. There is **exactly ONE visual waiver** (WAIVER-VISUAL-01 — the homepage `.ServiceText
> .Highlight` contrast fix, whose pixel diff stays **under the 0.1% threshold**); everything else is
> SEO-manifest or asset metadata that does NOT shift on-page pixels.

---

## How the verifier uses this file

| Diff surface | Verifier check |
| --- | --- |
| **Screenshot pixel diff** (`diff-screens.mjs`) | Every view MUST be `≤ 0.1%`, **including** `index`. WAIVER-VISUAL-01 (the `.ServiceText .Highlight` color change) recolours only 4 small inline spans and its measured diff stays **under 0.1%**, so it needs **no threshold exception** — any view over `0.1%` is a **regression**. |
| **Meta/head diff** (`baseline/meta/*.json`) | Differences MUST match exactly one of WAIVER-SEO-01..04. Any other meta delta is a regression. |
| **Sitemap / manifest diff** (`baseline/seo/*`) | Differences MUST match WAIVER-SEO-05. Any other delta is a regression. |
| **Asset byte diff** (`baseline/assets/`) | The ONLY permitted changed/added image is `og-image.jpg` → **WAIVER-ASSET-01**. Every other asset is byte-identical. |
| **axe a11y diff** (`baseline/a11y/*.json`) | The ONLY permitted delta is the *removal* of the homepage `.ServiceText .Highlight` serious contrast violation → consistent with WAIVER-VISUAL-01. No NEW serious violations allowed. |

---

## WAIVER-VISUAL-01 — Homepage `.ServiceText .Highlight` color-contrast fix *(the ONE visual waiver)*

| Field | Value |
| --- | --- |
| **ID** | WAIVER-VISUAL-01 |
| **Category** | **visual** (pixel) + a11y |
| **Source anomaly** | A11 ([`seo-matrix.md`](inventory/seo-matrix.md) §3.2); SPEC §9(c) |
| **What changes** | The **4 `.ServiceText .Highlight` spans** in the homepage service descriptions (NOT the Hero `<h1>` — corrected target) are recoloured to meet **WCAG AA** contrast, fixing the 1 pre-existing **serious** axe `color-contrast` violation. The change is **scheme-aware** because the failing background differs by color scheme: light scheme darkens `#ff5470` → **`#cc2952`** (on near-white `#fdfdfd` = 5.15:1, was 3.06:1); dark scheme keeps the brand **`#ff5470`** (on the navy `.Services` background `#001633` = 5.81:1, where `#cc2952` would only reach 3.45:1 and fail). The global `.Highlight` (used elsewhere) is **unchanged**. |
| **Why approved (GATE-1)** | Live markup has a real, serious accessibility defect. The human chose to fix it during the rebuild rather than reproduce the bug. This is the single accepted trade-off against strict pixel parity. |
| **Expected diff signature** | **Pixel:** a *small, bounded* diff confined to the 4 `.ServiceText .Highlight` spans on the **`index`** route at all 3 viewports (`index__{mobile,tablet,desktop}.png`); the rest of the page is pixel-identical. The recolour touches so few pixels that **each view stays UNDER the 0.1% threshold** — so **no threshold exception is needed**. (Baseline screenshots are captured in the default LIGHT scheme, where `#cc2952` renders.) **a11y:** the homepage axe report loses exactly one *serious* `color-contrast` violation (no other a11y change). |
| **Verifier treatment** | On `index` views, the small `.ServiceText .Highlight` diff is **EXPECTED — PASS** and MUST remain `≤ 0.1%` like every other view (it is not granted a threshold waiver). A diff *outside* those spans, a diff *over* `0.1%`, or any diff on a non-`index` route is a **REGRESSION — FAIL**. The axe delta (one fewer serious violation on `index`) is **EXPECTED**; any *new* serious violation anywhere — including the dark-scheme contrast that a Lighthouse desktop run (which emulates `prefers-color-scheme: dark`) would surface if the dark-scheme `#ff5470` override were missing — is a **REGRESSION**. |

---

## WAIVER-SEO-01 — Omit `@TODO` Twitter handles

| Field | Value |
| --- | --- |
| **ID** | WAIVER-SEO-01 |
| **Category** | **seo** (head metadata) |
| **Source anomaly** | A1 ([`seo-matrix.md`](inventory/seo-matrix.md) §1.6, §3.2); SPEC §9(a) |
| **What changes** | The literal `<meta name="twitter:site" content="@TODO">` and `<meta name="twitter:creator" content="@TODO">` tags are **omitted entirely** on all 9 routes. `twitter:card=summary_large_image` is **kept**. |
| **Why approved (GATE-1)** | `@TODO` is a live placeholder bug; no real handle exists. Omitting both tags is valid (Twitter Cards still render from `twitter:card` + OG) and stops perpetuating the defect. |
| **Expected diff signature** | **Meta only, all 9 routes:** baseline `twitter:site="@TODO"` and `twitter:creator="@TODO"` keys are **absent** in the rebuilt head. `twitter:card` unchanged. **No on-page pixel change** (head-only). |
| **Verifier treatment** | Absence of both `@TODO` keys on all 9 routes = **EXPECTED — PASS**. Presence of `@TODO`, or absence of `twitter:card`, = **REGRESSION**. |

---

## WAIVER-SEO-02 — Absolute article `og:image`

| Field | Value |
| --- | --- |
| **ID** | WAIVER-SEO-02 |
| **Category** | **seo** (head metadata) |
| **Source anomaly** | A5 ([`seo-matrix.md`](inventory/seo-matrix.md) §1.5, §3.2); SPEC §9(a) |
| **What changes** | The 3 article `og:image` values change from **root-relative** (`/images/<slug>-og.jpg`) to **absolute** (`https://dedede.ro/images/<slug>-og.jpg`) — matching the already-absolute home/contact/index pattern and the OG spec. |
| **Why approved (GATE-1)** | Root-relative `og:image` is non-conforming; FB/Twitter crawlers may fail to resolve it. Making it absolute fixes broken social previews with no visible change. |
| **Expected diff signature** | **Meta only, ART1/ART2/ART3:** `og:image` gains the `https://dedede.ro` prefix. The 6 non-article routes are unchanged (already absolute). **No on-page pixel change.** |
| **Verifier treatment** | Article `og:image` being absolute = **EXPECTED — PASS**. A root-relative article `og:image`, or any change to non-article `og:image` values, = **REGRESSION**. |

---

## WAIVER-SEO-03 — `og:type='article'` on the 3 articles

| Field | Value |
| --- | --- |
| **ID** | WAIVER-SEO-03 |
| **Category** | **seo** (head metadata) |
| **Source anomaly** | A4 ([`seo-matrix.md`](inventory/seo-matrix.md) §1.5, §3.2); SPEC §9(a) |
| **What changes** | `og:type` on ART1/ART2/ART3 changes from `website` to **`article`** (semantically correct for blog posts; also legitimises their `article:*` timestamps). `og:type=website` is **kept** on the other 6 routes. |
| **Why approved (GATE-1)** | Articles legitimately are articles; the live `website` value was incorrect. Scoped to the 3 article routes only. |
| **Expected diff signature** | **Meta only, ART1/ART2/ART3:** `og:type` = `article` (was `website`). IDX/CON/INF/TER/CNF/COO unchanged (`website`). **No on-page pixel change.** |
| **Verifier treatment** | `og:type=article` on exactly the 3 articles = **EXPECTED — PASS**. `og:type=article` on a non-article route, or `website` on an article, = **REGRESSION**. |

---

## WAIVER-SEO-04 — Normalise `/cookies/` `og:description` to `name=`

| Field | Value |
| --- | --- |
| **ID** | WAIVER-SEO-04 |
| **Category** | **seo** (head metadata — attribute encoding) |
| **Source anomaly** | A6 ([`seo-matrix.md`](inventory/seo-matrix.md) §1.5, §3.1.9, §3.2); SPEC §9(a) |
| **What changes** | On `/cookies/`, `og:description` is emitted as `<meta name="og:description">` instead of the live `<meta property="og:description">` — making all 9 routes consistent (`name=`). The **content string is unchanged**. |
| **Why approved (GATE-1)** | `/cookies/` was the lone `property=` outlier; both forms parse identically. Normalising removes an inconsistency with zero functional or visual effect. |
| **Expected diff signature** | **Meta only, COO route:** the `og:description` attribute key flips from `property` to `name`; the value is identical. **No on-page pixel change.** Note: a serializer keyed on `name=` may now *capture* the cookies `og:description` where it previously missed it — that surfaced value is EXPECTED. |
| **Verifier treatment** | `og:description` on `/cookies/` present as `name=` with the baseline content string = **EXPECTED — PASS**. A changed description string, or the value going missing, = **REGRESSION**. |

---

## WAIVER-SEO-05 — Sitemap `<lastmod>`, drop `rel=prev/next`, manifest `start_url`

| Field | Value |
| --- | --- |
| **ID** | WAIVER-SEO-05 |
| **Category** | **seo** (sitemap + PWA manifest + head links) |
| **Source anomaly** | A7, A9, A10 ([`seo-matrix.md`](inventory/seo-matrix.md) §2.1, §1.11, §2.3, §3.2); SPEC §9(d) |
| **What changes** | (i) Add `<lastmod>` to every sitemap URL — articles = `modifiedDate ?? date`, static pages = build date. (ii) **DROP** the Google-deprecated `<link rel="prev">` / `<link rel="next">` head tags from the 3 articles. (iii) Add `"start_url": "/"` to `site.webmanifest`. The 9 sitemap URLs, their `priority` (1.00/1.00/0.80/0.90/0.90/0.90/0.50/0.50/0.50) and `changefreq` values are otherwise **unchanged**. |
| **Why approved (GATE-1)** | Low-risk crawl/PWA improvements: `lastmod` aids crawl efficiency; `rel=prev/next` has been ignored by Google since 2019; `start_url` improves installability. |
| **Expected diff signature** | **Sitemap (`baseline/seo/sitemap.xml`):** each `<url>` gains a `<lastmod>`; URL set, order, priorities, changefreq otherwise identical. **Article heads (ART1/ART2/ART3):** `rel=prev`/`rel=next` `<link>` tags **absent**. **Manifest (`baseline/seo/site.webmanifest`):** gains `"start_url": "/"`; all other keys identical. **No on-page pixel change** (the prev/next *visible* `<aside>` navigation block in the article body is RETAINED — only the `<head>` `<link>` tags are dropped). |
| **Verifier treatment** | `lastmod` present on all 9 sitemap URLs + identical priorities/changefreq = EXPECTED. Absence of head `rel=prev/next` on articles = EXPECTED. `start_url:"/"` in manifest = EXPECTED. A changed priority/changefreq, a missing/added sitemap URL, a missing visible prev/next `<aside>`, or any other manifest key change = **REGRESSION**. |

---

## WAIVER-ASSET-01 — Real OG image replacing the 0-byte file

| Field | Value |
| --- | --- |
| **ID** | WAIVER-ASSET-01 |
| **Category** | **asset** (binary) |
| **Source anomaly** | "BROKEN: empty file" ([`assets.md`](inventory/assets.md) §Notable Issues 1); SPEC §9(b) |
| **What changes** | The live `images/og-image.jpg` is **0 bytes** (broken social sharing on home + the 3 legal pages). It is replaced with a **real branded 1200×630 JPEG** on a **navy `#00214d` background** — the brand wordmark logos are yellow+pink and would be invisible on the yellow brand color, so the dark navy canvas carries the colourful `dedede-logo-desktop.svg` wordmark plus a **yellow (`#fde24f`) tagline "Spații fără dăunători"** at strong contrast. Generated via Sharp (`scripts/generate-og-image.mjs`, run by `pnpm generate:og`). It remains the default `og:image` for pages without their own. |
| **Why approved (GATE-1)** | Restores broken Open Graph previews on 4 routes. The empty file is a live defect, not a design choice. This is the ONLY image permitted to change/add; all other legacy images stay byte-for-byte passthrough. |
| **Expected diff signature** | **Asset bytes:** `public/images/og-image.jpg` changes from 0 bytes to a valid ~non-trivial 1200×630 JPEG. **Meta:** the `og:image` *URL* on IDX/TER/CNF/COO is unchanged (`https://dedede.ro/images/og-image.jpg`); only the bytes behind it differ. **On-page pixel:** **NONE** — `og-image.jpg` is never rendered in-page on any of the 9 routes (it is a social-card asset only), so all screenshots stay pixel-identical. |
| **Verifier treatment** | A non-empty valid 1200×630 `og-image.jpg` with an unchanged `og:image` URL = **EXPECTED — PASS**. Any *other* image byte-changing, OR any on-page screenshot diff attributable to this asset, = **REGRESSION**. |

---

## Out of scope — NOT waivers (would be regressions if they appear)

These were considered and **deliberately excluded** from the rebuild. If the verifier sees any of them as
a diff, it is a **REGRESSION**, not an approved deviation:

- **JSON-LD** added anywhere (live uses inline microdata only; `jsonld` baseline array is empty on all 9).
- **Cookiebot / consent UI** added (confirmed absent on live; GDPR gap is a future recommendation).
- **`service-worker.js` registered** (live registration is commented out).
- **Re-encoded / optimised legacy images** (`servicii.svg`, `dedede-hero.svg`, article JPEGs/WebPs) — byte
  parity required until parity is certified; SVGO/squoosh is a separate post-parity task.
- **Analytics on legal pages**, or analytics *removed* from the 6 non-legal routes.
- **`article:*` timestamps normalised** (mixed TZ/no-TZ formats are reproduced verbatim per route).
- **Emoji stripped** from the home/contact meta descriptions.
- **`mask-icon color` changed** from `#00214d`; **`theme-color` changed** from `#fde24f`.
- **The embedded cookie-policy section removed** from `/termeni-si-conditii/` (it IS in the deployed HTML).
- **Any URL change** (would also require an ADR + a 301 — see SPEC §4).

---

*This register is exhaustive: 7 approved deviations (1 visual, 5 SEO/manifest, 1 asset). Anything else is
a regression. Cross-reference [`SPEC.md`](SPEC.md) §9–§10 and the ADRs for rationale.*
