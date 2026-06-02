# SEO / HEAD-METADATA PARITY MATRIX

> Source of truth: `parity/baseline/meta/<route>.json` + `parity/baseline/seo/` + spot-checked `parity/baseline/html/<route>/index.html`.
> Generated: 2026-05-31.
> Abbreviations used in table cells — see key at bottom of this file.

---

## 1. Per-Route Head-Metadata Matrix

Columns use short route identifiers:

| ID | Route slug | Canonical URL |
|----|------------|---------------|
| **IDX** | `/` (homepage) | `https://dedede.ro/` |
| **CON** | `/contact/` | `https://dedede.ro/contact/` |
| **INF** | `/informatii-utile/` | `https://dedede.ro/informatii-utile/` |
| **TER** | `/termeni-si-conditii/` | `https://dedede.ro/termeni-si-conditii/` |
| **CNF** | `/confidentialitate/` | `https://dedede.ro/confidentialitate/` |
| **COO** | `/cookies/` | `https://dedede.ro/cookies/` |
| **ART1** | `/totul-despre-dezinsectie/` | `https://dedede.ro/totul-despre-dezinsectie/` |
| **ART2** | `/cum-scapi-de-gandaci/` | `https://dedede.ro/cum-scapi-de-gandaci/` |
| **ART3** | `/dezinfectie-dezinsectie-deratizare-diferente/` | `https://dedede.ro/dezinfectie-dezinsectie-deratizare-diferente/` |

### 1.1 Titles

| Row | IDX | CON | INF | TER | CNF | COO | ART1 | ART2 | ART3 |
|-----|-----|-----|-----|-----|-----|-----|------|------|------|
| `<title>` | Dezinsecție, Dezinfecție, Deratizare București - DeDeDe.ro | Contactează specialiștii în DeDeDe chiar acum! | Informații utile pentru Dezinsecție, Dezinfecție, Deratizare | Termeni și condiții de folosire ai site-ului DeDeDe.ro | Politica de confidențialitate a site-ului DeDeDe.ro | Politica de cookies a site-ului DeDeDe.ro | Totul despre Dezinsecție: Ce este și când ai nevoie de ea | Cum scapi de gândaci: Gândacul de bucătărie | Dezinsecție – Dezinfecție – Deratizare: Care sunt diferențele și ce presupune fiecare |

### 1.2 Meta Description

| Row | IDX | CON | INF | TER | CNF | COO | ART1 | ART2 | ART3 |
|-----|-----|-----|-----|-----|-----|-----|------|------|------|
| `meta description` | "Supereroul 🦸 care te ajută să scapi de 🕷️ ploșnițe, gândaci, șoareci, virusuri și alți dăunători. Servicii Dezinsecție, Dezinfecție, Deratizare București" | "Programează-te acum la Dezinfecție, Dezinsecție sau Deratizare! Scapă de 🐜 gândaci, 🐀 șobolani, 🦟 ploșnițe, 🦠 viruși sau alți ☠️ dăunători! București + Ilfov" | "Citește toate articolele scrise de echipa DeDeDe în legătură cu felul cum ai putea și tu să scapi de 🐜 gândaci, 🐀 șobolani, 🦟 ploșnițe sau alți ☠️ dăunători." | "Află în ce condiții legale poți folosi site-ul DeDeDe.ro și serviciile noastre de Dezinfecție, Dezinsecție și Deratizare." | "Află politica de confidențialitate folosită pentru site-ul DeDeDe.ro și pentru serviciile noastre de Dezinfecție, Dezinsecție și Deratizare." | "Află politica de cookies folosită pentru site-ul DeDeDe.ro și pentru serviciile noastre de Dezinfecție, Dezinsecție și Deratizare." | "Am concentrat toate informațiile utile despre Dezinsecție în acest articol, pentru a-ți arăta cum te poate ajuta eroul nostru, DeDeDe.ro. Citește acum »" | "DeDeDe.ro te ajută să scapi de gândaci. Dar dacă vrei să încerci și singur/ă, îți dăm toate detaliile necesare să găsești o soluție pentru ei. Citește acum »" | "Un articol complet și informativ care descrie în detaliu Dezinfecția, Dezinsecția și Deratizarea pentru tine. Apelează la specialiștii DeDeDe.ro »" |

### 1.3 Canonical — trailing-slash verification

| Row | IDX | CON | INF | TER | CNF | COO | ART1 | ART2 | ART3 |
|-----|-----|-----|-----|-----|-----|-----|------|------|------|
| `<link rel="canonical">` | `https://dedede.ro/` | `https://dedede.ro/contact/` | `https://dedede.ro/informatii-utile/` | `https://dedede.ro/termeni-si-conditii/` | `https://dedede.ro/confidentialitate/` | `https://dedede.ro/cookies/` | `https://dedede.ro/totul-despre-dezinsectie/` | `https://dedede.ro/cum-scapi-de-gandaci/` | `https://dedede.ro/dezinfectie-dezinsectie-deratizare-diferente/` |
| Matches route URL? | YES | YES | YES | YES | YES | YES | YES | YES | YES |
| Trailing slash present? | YES | YES | YES | YES | YES | YES | YES | YES | YES |

**Verdict: trailing slash confirmed on ALL 9 routes** (canonical tag, og:url, and sitemap `<loc>` all agree).

### 1.4 Robots meta

| Row | IDX | CON | INF | TER | CNF | COO | ART1 | ART2 | ART3 |
|-----|-----|-----|-----|-----|-----|-----|------|------|------|
| `meta robots` | `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1` | same | same | same | same | same | same | same | same |

All 9 routes share an identical robots directive — `index, follow` with full snippet/image/video hints.

### 1.5 Open Graph

| Property | IDX | CON | INF | TER | CNF | COO | ART1 | ART2 | ART3 |
|----------|-----|-----|-----|-----|-----|-----|------|------|------|
| `og:title` | = title | = title | = title | = title | = title | = title | = title | = title | = title |
| `og:description` | = meta description | = meta desc | = meta desc | = meta desc | = meta desc | = meta desc (via `metaProperty`) | = meta desc | = meta desc | = meta desc |
| `og:type` | `website` | `website` | `website` | `website` | `website` | `website` | `website` | `website` | `website` |
| `og:url` | `https://dedede.ro/` | `https://dedede.ro/contact/` | `https://dedede.ro/informatii-utile/` | `https://dedede.ro/termeni-si-conditii/` | `https://dedede.ro/confidentialitate/` | `https://dedede.ro/cookies/` | `https://dedede.ro/totul-despre-dezinsectie/` | `https://dedede.ro/cum-scapi-de-gandaci/` | `https://dedede.ro/dezinfectie-dezinsectie-deratizare-diferente/` |
| `og:image` | `https://dedede.ro/images/og-image.jpg` | `https://dedede.ro/images/og-image-contact.jpg` | `https://dedede.ro/images/og-image-blogindex.jpg` | `https://dedede.ro/images/og-image.jpg` | `https://dedede.ro/images/og-image.jpg` | `https://dedede.ro/images/og-image.jpg` | `/images/totul-despre-dezinsectie-og.jpg` | `/images/cum-scapi-de-gandaci-og.jpg` | `/images/ddd-diferente-og.jpg` |
| `og:image:alt` | "DeDeDe.ro - Spații fără dăunători" | "DeDeDe.ro - Programează-te la Dezinsecție, Dezinfecție sau Deratizare" | "DeDeDe.ro - Articole utile despre Dezinfecție, Dezinsecție sau Deratizare" | "DeDeDe.ro - Spații fără dăunători" | "DeDeDe.ro - Spații fără dăunători" | "DeDeDe.ro - Spații fără dăunători" | "Totul despre Dezinsecție - detalii și recomandări" | "Cum scapi de gândaci în general - soluții concrete" | "Care sunt diferențele dintre Dezinfecție, Dezinsecție și Deratizare?" |
| `og:image:width` | 1200 | 1200 | 1200 | 1200 | 1200 | 1200 | 1200 | 1200 | 1200 |
| `og:image:height` | 630 | 630 | 630 | 630 | 630 | 630 | 630 | 630 | 630 |
| `og:locale` | `ro_RO` | same | same | same | same | same | same | same | same |
| `og:site_name` | `DeDeDe.ro` | same | same | same | same | same | same | same | same |
| `og:email` | `contact@dedede.ro` | same | same | same | same | same | same | same | same |
| `og:phone_number` | `0744885566` | same | same | same | same | same | same | same | same |
| `fb:app_id` | `811489239521802` | same | same | same | same | same | same | same | same |
| `article:publisher` | `DeDeDe.ro` | same | same | same | same | same | same | same | same |
| `article:published_time` | `2021-09-19T19:35:55+03:00` | `2021-09-19T19:35:55+03:00` | `2021-09-19T19:35:55+03:00` | `2021-09-27T19:35:55+03:00` | `2021-09-27T19:35:55+03:00` | `2021-09-27T19:35:55+03:00` | `2021-09-14T11:40:00` | `2021-09-13T19:45:00` | `2021-09-12T19:45:00` |
| `article:modified_time` | `2021-09-19T19:35:55+03:00` | `2021-09-19T19:35:55+03:00` | `2021-09-19T19:35:55+03:00` | `2021-09-27T19:35:55+03:00` | `2021-09-27T19:35:55+03:00` | `2021-09-27T19:35:55+03:00` | `2021-09-14T11:40:00` | `2021-09-13T19:45:00` | `2021-09-12T19:45:00` |

### 1.6 Twitter Card

| Property | IDX | CON | INF | TER | CNF | COO | ART1 | ART2 | ART3 |
|----------|-----|-----|-----|-----|-----|-----|------|------|------|
| `twitter:card` | `summary_large_image` | same | same | same | same | same | same | same | same |
| `twitter:site` | `@TODO` | same | same | same | same | same | same | same | same |
| `twitter:creator` | `@TODO` | same | same | same | same | same | same | same | same |

### 1.7 Theme color / PWA meta

| Property | IDX | CON | INF | TER | CNF | COO | ART1 | ART2 | ART3 |
|----------|-----|-----|-----|-----|-----|-----|------|------|------|
| `theme-color` | `#fde24f` | same | same | same | same | same | same | same | same |
| `msapplication-TileColor` | `#fde24f` | same | same | same | same | same | same | same | same |
| `apple-mobile-web-app-title` | `DeDeDe.ro - Spații fără dăunători` | same | same | same | same | same | same | same | same |
| `application-name` | `DeDeDe.ro` | same | same | same | same | same | same | same | same |

### 1.8 Language / hreflang

| Property | IDX | CON | INF | TER | CNF | COO | ART1 | ART2 | ART3 |
|----------|-----|-----|-----|-----|-----|-----|------|------|------|
| `html[lang]` | `ro` | `ro` | `ro` | `ro` | `ro` | `ro` | `ro` | `ro` | `ro` |
| `hreflang` link tags | none | none | none | none | none | none | none | none | none |
| `og:locale` | `ro_RO` | same | same | same | same | same | same | same | same |

No `hreflang` link elements present on any route. The site is Romanian-only.

### 1.9 Structured Data: inline microdata vs JSON-LD

| Property | IDX | CON | INF | TER | CNF | COO | ART1 | ART2 | ART3 |
|----------|-----|-----|-----|-----|-----|-----|------|------|------|
| `jsonld` array in baseline | `[]` (empty) | `[]` | `[]` | `[]` | `[]` | `[]` | `[]` | `[]` | `[]` |
| Inline microdata in HTML | YES — `schema.org/Service` (x3 services) + `schema.org/LocalBusiness` (nested in each service) | NO | NO | NO | NO | NO | YES — `schema.org/Article` + `schema.org/BreadcrumbList` | YES — `schema.org/Article` + `schema.org/BreadcrumbList` | YES — `schema.org/Article` + `schema.org/BreadcrumbList` |

**Confirmed: zero JSON-LD on any route. All structured data is inline HTML microdata using `itemscope`/`itemprop`.**

### 1.10 Analytics / GTM scripts

| Property | IDX | CON | INF | TER | CNF | COO | ART1 | ART2 | ART3 |
|----------|-----|-----|-----|-----|-----|-----|------|------|------|
| GTM-NGTSNLX | YES | YES | YES | NO | NO | NO | YES | YES | YES |
| Google Ads AW-10780123066 | YES | YES | YES | NO | NO | NO | YES | YES | YES |

Legal pages (`/termeni-si-conditii/`, `/confidentialitate/`, `/cookies/`) load **no** analytics scripts.

### 1.11 Article prev/next pagination links (blog articles only)

| Route | `rel="prev"` | `rel="next"` |
|-------|-------------|-------------|
| ART1 `/totul-despre-dezinsectie/` | `/cum-scapi-de-gandaci/` | none |
| ART2 `/cum-scapi-de-gandaci/` | `/dezinfectie-dezinsectie-deratizare-diferente/` | `/totul-despre-dezinsectie/` |
| ART3 `/dezinfectie-dezinsectie-deratizare-diferente/` | none | `/cum-scapi-de-gandaci/` |

Note: `rel="prev"` / `rel="next"` are deprecated by Google (dropped 2019) but still present in the live site. Must reproduce for strict parity.

### 1.12 Font preload

All 9 routes include:
```html
<link rel="preload" href="/resources/archivo-var.woff2" as="font" type="font/woff2" crossorigin>
```
This is a self-hosted variable font (Archivo).

---

## 2. SEO File Summary

### 2.1 sitemap.xml — URL count and priorities

| URL | `<changefreq>` | `<priority>` |
|-----|----------------|--------------|
| `https://dedede.ro/` | monthly | **1.00** |
| `https://dedede.ro/contact/` | weekly | **1.00** |
| `https://dedede.ro/informatii-utile/` | monthly | **0.80** |
| `https://dedede.ro/totul-despre-dezinsectie/` | monthly | **0.90** |
| `https://dedede.ro/cum-scapi-de-gandaci/` | monthly | **0.90** |
| `https://dedede.ro/dezinfectie-dezinsectie-deratizare-diferente/` | monthly | **0.90** |
| `https://dedede.ro/termeni-si-conditii/` | monthly | **0.50** |
| `https://dedede.ro/confidentialitate/` | monthly | **0.50** |
| `https://dedede.ro/cookies/` | monthly | **0.50** |

**Total: exactly 9 URLs.** All with trailing slashes. No `<lastmod>` elements present.

### 2.2 robots.txt

```
User-agent: *
Disallow: /login

Sitemap: https://dedede.ro/sitemap.xml
```

Single `User-agent: *` block. Disallows only `/login`. Sitemap declaration present.

### 2.3 site.webmanifest

```json
{
  "name": "DeDeDe.ro - Spații fără dăunători",
  "short_name": "DeDeDe.ro",
  "icons": [
    { "src": "/android-chrome-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/maskable_icon.png", "sizes": "1024x1024", "type": "image/png", "purpose": "any maskable" }
  ],
  "theme_color": "#fde24f",
  "background_color": "#fde24f",
  "display": "standalone"
}
```

No `start_url` field. No `description` field. `display: standalone` — PWA-installable.

---

## 3. Parity Rules and Anomalies

### 3.1 Confirmed parity rules (implement exactly as-is)

1. **`trailingSlash: 'always'`** — Confirmed on all 9 routes via canonical tags, og:url values, and all 9 sitemap `<loc>` entries. Astro must be configured with `trailingSlash: 'always'` and the sitemap integration must emit trailing-slash URLs.

2. **Sitemap has exactly 9 URLs** with the priorities shown in §2.1. No `<lastmod>`. Must reproduce those exact priorities and `changefreq` values.

3. **robots.txt: `Disallow: /login` only** — no other blocked paths. Sitemap line is `https://dedede.ro/sitemap.xml` (absolute, https).

4. **No JSON-LD anywhere.** All structured data is inline HTML microdata (`itemscope`/`itemprop`). Do not add JSON-LD in Astro rebuild without explicit GATE-1 approval.

5. **Schema.org/Service microdata on homepage** — three `<li itemscope itemtype="https://schema.org/Service">` blocks (Dezinsecție, Deratizare, Dezinfecție), each nesting a `schema.org/LocalBusiness` provider. Must reproduce in Astro component.

6. **Schema.org/Article + BreadcrumbList microdata on all 3 blog articles** — inline on the `<article>` element. Must reproduce.

7. **Font preload on all routes** — `<link rel="preload" href="/resources/archivo-var.woff2" as="font" type="font/woff2" crossorigin>` — must appear in `<head>` on every page.

8. **GTM/Ads only on 6 routes** — legal pages (termeni, confidentialitate, cookies) must NOT receive GTM-NGTSNLX or Google Ads AW-10780123066 scripts.

9. **`og:description` encoding difference on /cookies/** — On the cookies page, `og:description` is in `metaProperty` (i.e., `<meta property="og:description">`) rather than `metaName` (`<meta name="og:description">`). All other pages use `name=`. This is a pre-existing inconsistency in the source; reproduce the `name=` pattern consistently (cookies is the outlier — the live behavior of both attribute names is equivalent for OG parsers).

10. **`rel="prev"` / `rel="next"` on blog articles** — reproduce despite being deprecated by Google.

11. **`mask-icon` link tag includes `color="#00214d"`** — confirmed in HTML spot-check (`<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#00214d">`). Note: `color` attribute not captured in the JSON baseline `links` array (serializer omitted it). Use `#00214d` for the mask-icon color attribute.

12. **`html[lang]="ro"`** on all routes. No `hreflang` link elements (Romanian-only site).

13. **`og:image` paths on blog articles are root-relative (no domain prefix)** — e.g., `/images/totul-despre-dezinsectie-og.jpg` — whereas homepage/contact/blog-index use fully-qualified `https://dedede.ro/images/...`. Reproduce as-is for parity; note that root-relative og:image is technically non-conforming (OG spec requires absolute URL). See anomaly A5 below.

---

### 3.2 Anomalies

| ID | Description | Routes affected | Decision |
|----|-------------|-----------------|----------|
| **A1** | `twitter:site` and `twitter:creator` are `@TODO` (literal placeholder string, not a real handle) | All 9 | **PRESERVE** — exact parity with live; fixing requires real Twitter/X account details that do not exist yet |
| **A2** | `article:published_time` / `article:modified_time` present on ALL pages including non-article pages (homepage, contact, informatii-utile, legal pages) despite `og:type` being `website` not `article`. The `article:*` namespace is semantically incorrect on a `website` type. | All 9 | **PRESERVE** — these tags exist on live; removing them is a meaningful SEO change requiring GATE-1 approval |
| **A3** | `article:published_time` on homepage and contact and blog-index pages uses `2021-09-19T19:35:55+03:00` (TZ-aware ISO 8601). Blog articles use bare datetime without timezone offset (`2021-09-14T11:40:00`). Mixed format across the same meta tag. | IDX/CON/INF vs ART1/ART2/ART3 | **PRESERVE** — reproduce the exact string values from each route's baseline; do not normalise |
| **A4** | `og:type = "website"` on blog article pages (ART1/ART2/ART3). Best-practice would be `og:type = "article"` for blog posts, which would also make the `article:*` timestamps semantically valid. | ART1, ART2, ART3 | **PRESERVE** (exact parity) — CANDIDATE-FIX with GATE-1 approval: switch articles to `og:type = "article"` |
| **A5** | `og:image` on blog articles is root-relative (`/images/...`) rather than absolute (`https://dedede.ro/images/...`). OG spec requires absolute URLs; Facebook/Twitter crawlers may fail to resolve root-relative values. | ART1, ART2, ART3 | **CANDIDATE-FIX** (needs GATE-1 ok) — prepend `https://dedede.ro` to make absolute |
| **A6** | `og:description` on `/cookies/` is rendered as `<meta property="og:description">` while all other routes render it as `<meta name="og:description">`. Both work identically for OG parsers but is inconsistent. | COO | **CANDIDATE-FIX** (low priority) — normalise to `name=` for all routes to match the other 8 |
| **A7** | No `<lastmod>` in sitemap.xml. Adding per-page `<lastmod>` derived from the article dates (or a build date) would improve crawl efficiency. | Sitemap | **CANDIDATE-FIX** (needs GATE-1 ok) |
| **A8** | No `hreflang` or `x-default` link elements. Site is Romanian-only with no internationalisation plans evident. | All 9 | **PRESERVE** — no change needed |
| **A9** | `rel="prev"` / `rel="next"` link elements on blog articles are deprecated by Google (officially ignored since 2019) but present on live. | ART1, ART2, ART3 | **PRESERVE** — reproduce for exact parity; removal is harmless but unnecessary without GATE-1 |
| **A10** | `site.webmanifest` has no `start_url` field. PWA installability may be affected on some browsers. | All (PWA) | **CANDIDATE-FIX** (low priority, add `"start_url": "/"`) |
| **A11** | Homepage `.Highlight` spans (within `<h1>`) have a known pre-existing axe color-contrast violation (documented in known findings). Not a head-metadata issue but must not be silently fixed in the Astro rebuild without tracking as a GATE-1 item. | IDX | **PRESERVE** — reproduce the exact markup; log as separate accessibility task |

---

## 4. Implementation Checklist for Astro Rebuild

Based on the above, the Astro `astro.config.mjs` and head component must implement:

- `trailingSlash: 'always'` in Astro config
- Per-route `<title>`, `<meta name="description">`, `<link rel="canonical">` with exact values from baseline
- Per-route `og:*` and `article:*` meta tags (all as `<meta name="...">`, not `<meta property="...">`)
- `twitter:card`, `twitter:site = "@TODO"`, `twitter:creator = "@TODO"` on all routes
- `theme-color: #fde24f`, `msapplication-TileColor: #fde24f`, PWA meta on all routes
- Font preload (`/resources/archivo-var.woff2`) on all routes
- GTM-NGTSNLX + Google Ads AW-10780123066 **only** on: IDX, CON, INF, ART1, ART2, ART3
- `html[lang="ro"]` on all routes
- Microdata (`itemscope`/`itemprop`) in component HTML for homepage services and blog articles — do not use JSON-LD
- Sitemap with exactly 9 URLs, trailing slashes, exact priorities and changefreq values, no `<lastmod>`
- robots.txt: `Disallow: /login` + `Sitemap: https://dedede.ro/sitemap.xml`
- `<link rel="prev">` / `<link rel="next">` on blog articles per the pagination table in §1.11
- `<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#00214d">`
- All standard favicon/icon link tags (favicon.ico, favicon.svg, favicon-32x32.png, favicon-16x16.png, apple-touch-icon.png, safari-pinned-tab.svg)
- `<link rel="manifest" href="/site.webmanifest">`

---

*Cell value "same" means identical to the IDX (leftmost data) column value unless otherwise noted.*
