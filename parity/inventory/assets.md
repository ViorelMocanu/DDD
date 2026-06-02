# Asset Inventory: livesite Static Assets

Generated from FTP snapshot at `livesite/`. Machine-readable manifest at `parity/baseline/assets/livesite-manifest.json`.

## Scope

All files under `livesite/` except:
- HTML page files (`*/index.html` — 9 rendered pages, counted as routes not assets)
- `sendgrid-php/vendor/` (PHP Composer dependencies — counted as one line item below)

Total scope: **214 enumerated files** + 1 vendor group = **215 manifest entries**.

---

## Counts and Weights by Category

| Category | Files | Bytes | KB | Notes |
|---|---|---|---|---|
| images (images/) | 56 | ~3,543,834 | 3,460 | All content + decorative images |
| js-elderjs (_elderjs/svelte/) | 19 | 737,020 | 720 | SSR/build artifacts — none loaded as browser `<script>` |
| css-elderjs (_elderjs/assets/) | 6 | 283,074 | 276 | 1 active CSS + 4 unused hashed variants + 1 source map |
| php-backend (sendgrid-php non-vendor) | 103 | ~915,000 | 894 | SDK lib/, examples/, docs, configs |
| css-main (resources/) | 3 | 114,024 | 111 | style.scss source + compiled CSS + CSS source map |
| resources (font + script) | 2 | 46,791 | 46 | archivo-var.woff2 + script.js |
| root static files | 25 | ~147,359 | 144 | Favicons, PWA icons, manifests, SEO, PHP backend, service worker |
| sendgrid-php/vendor/ [group] | 45 | 240,951 | 235 | Composer vendor dependencies (grouped) |

**Grand total: 259 actual files, approx 5,886 KB (5.7 MB) on disk.**

### Images sub-breakdown (images/ directory, 56 files)

| Sub-category | Count | KB |
|---|---|---|
| Article hero images (desktop .webp) | 3 | 245 |
| Article hero images (desktop .jpg source) | 3 | 1,145 |
| Article hero images (mobile .webp) | 3 | 44 |
| Article hero images (mobile .jpg fallback) | 3 | 155 |
| OG/social images (.jpg) | 6 | 765 |
| Logo images (SVG + PNG variants) | 4 | 73 |
| UI icon SVGs (inline-embedded by Svelte) | 22 | 54 |
| Background/decorative (cityscape.svg, memphis-mini.webp) | 2 | 26 |
| Hero illustrations (dedede-hero.svg, servicii.svg) | 2 | 800 |
| Generic/unused assets | 6 | 43 |
| Signal SVG (inline in index) | 1 | 7 |

---

## Assets Required for Astro Rebuild

These are the assets that must be reproduced with byte/visual parity in the Astro output:

### Fonts (1 file, 30.8 KB)
- `resources/archivo-var.woff2` — Archivo variable font, self-hosted. All 9 routes preload it.

### Images — actively loaded by pages (38 files, ~2,558 KB)

**Logos (all 9 routes):**
- `images/dedede-logo-desktop.svg` (25 KB) — header `<img>`
- `images/dedede-logo-mobile.svg` (20 KB) — header `<img>`
- `images/dedede-logo-mobile.png` (7 KB) — header + footer `<img>`

**Hero illustrations:**
- `images/dedede-hero.svg` (118 KB) — index + contact hero
- `images/servicii.svg` (697 KB) — index only; VERY LARGE, optimization candidate

**Background images (CSS-only, no `<img>` tag):**
- `images/cityscape.svg` (9 KB) — all pages via CSS `background-image`
- `images/memphis-mini.webp` (17 KB) — all pages via CSS `background-image`

**Article hero images (3 articles x 4 variants each = 12 files):**
- `images/totul-despre-dezinsectie-desktop.webp` / `-mobile.jpg` / `-mobile.webp` + desktop JPEG source
- `images/cum-scapi-de-gandaci-desktop.webp` / `-mobile.jpg` / `-mobile.webp` + desktop JPEG source
- `images/ddd-diferente-desktop.webp` / `-mobile.jpg` / `-mobile.webp` + desktop JPEG source

**OG images (5 real + 1 broken, used in `og:image` meta):**
- `images/og-image-contact.jpg` (172 KB)
- `images/og-image-blogindex.jpg` (122 KB)
- `images/totul-despre-dezinsectie-og.jpg` (203 KB)
- `images/cum-scapi-de-gandaci-og.jpg` (141 KB)
- `images/ddd-diferente-og.jpg` (146 KB)
- `images/og-image.jpg` (0 bytes — **BROKEN: empty file**, used by index/termeni/confidentialitate/cookies)

**Inline icon SVGs (22 files, Svelte embeds their content into HTML):**
All `images/icon-*.svg` files + `images/signal.svg`. These are inlined as SVG markup into rendered HTML by the Svelte components — they are not served as external requests. In Astro, they will be imported as raw SVG strings or as Astro components.

Confirmed unused (not in rendered HTML): `icon-cart.svg`, `icon-delivery.svg`, `icon-gift.svg`, `icon-package.svg`, `icon-pay.svg`, `icon-search.svg`.

### Favicons and PWA icons (14 files, ~110 KB)
- `favicon.ico`, `favicon.svg`, `favicon-16x16.png`, `favicon-32x32.png` — all 9 routes
- `apple-touch-icon.png` — all 9 routes
- `safari-pinned-tab.svg` — all 9 routes (mask-icon)
- `android-chrome-192x192.png`, `android-chrome-512x512.png` — via `site.webmanifest`
- `maskable_icon.png` — via `site.webmanifest`
- `mstile-150x150.png` — via `browserconfig.xml` (only this one mstile is referenced)
- `mstile-70x70.png`, `mstile-144x144.png`, `mstile-310x150.png`, `mstile-310x310.png` — **not referenced by any file**

### PWA manifests (2 files, <1 KB)
- `site.webmanifest` — all 9 routes via `<link rel=manifest>`. Theme/background color: `#fde24f`.
- `browserconfig.xml` — no HTML `<meta msapplication-config>` link; browser auto-discovery only.

### SEO files (3 must-have, 2 legacy)
- `sitemap.xml` — must reproduce in Astro (`@astrojs/sitemap`)
- `robots.txt` — must reproduce in Astro
- `humans.txt` — must reproduce in Astro
- `google8bed9638f272a4f6.html` — Google Search Console verification; must be kept (static file in `public/`)
- `robotfilter.htm` — legacy; not in sitemap, can be omitted

### JavaScript (2 files, 17.3 KB)
- `resources/script.js` (15 KB) — main site JS (dark mode, scroll-to-top, GTM initialization). Needs Astro equivalent.
- `service-worker.js` (2.5 KB) — basic SW precaching. Not registered in any HTML. Re-implement with `@vite-pwa/astro` or `@astrojs/service-worker`.

### PHP backend (NOT reproduced in Astro static build)
- `sideform.php` — contact form handler (SendGrid). Replace with Netlify Function or edge function.
- `sendgrid-php/` — PHP SDK. Replace with SendGrid Node.js client or API calls from the serverless function.
- `env.php` / `env-exemplu.php` — PHP credentials. Do not commit to repo; use Netlify env vars.
- `php_errorlog` — server log; do not deploy.

---

## Notable Issues

1. **`images/og-image.jpg` is 0 bytes (empty file).** It is referenced as `og:image` by 4 routes (index, termeni-si-conditii, confidentialitate, cookies). Social sharing for these pages is currently broken on the live site. The Astro rebuild must provide a real OG image.

2. **`images/servicii.svg` is 697 KB** — an extremely large SVG used only on the homepage. Optimization (SVGO) would be appropriate, but parity policy requires byte/visual preservation as a baseline. Optimize only after parity is confirmed.

3. **`images/dedede-hero.svg` is 118 KB** — also a candidate for SVGO optimization after parity is confirmed.

4. **4 mstile PNG files have no references** — `mstile-70x70.png`, `mstile-144x144.png`, `mstile-310x150.png`, `mstile-310x310.png` are present but not referenced by `browserconfig.xml` or any HTML `<meta>` tag. Safe to omit from Astro.

5. **CSS loading pattern:** The active CSS in production is `_elderjs/assets/svelte-85ed3d00.css` (loaded via `<link rel=stylesheet>`), NOT `resources/style.css` directly. The `resources/style.css` is only in the service worker precache. Astro will generate its own compiled CSS from the source SCSS.

6. **Inline SVG icons:** The 22 icon SVG files in `images/` are not served as external image requests — their paths/content are baked into the Svelte component JS and inlined as SVG markup in the HTML output. In Astro, import them as raw SVG (`.svg?raw`) or as inline Astro SVG components.

---

## Image-Optimization Parity Note

**Legacy images must be byte/visually preserved in the Astro rebuild baseline.**

- Copy all `images/` files to Astro's `public/images/` unchanged (or `src/assets/images/` if using Astro Image integration with passthrough).
- Do NOT re-encode, resize, or optimize any image until after parity validation passes.
- The only exception is `images/og-image.jpg` (0 bytes) which must be created new.
- After parity is confirmed, optimization passes (SVGO for `servicii.svg`/`dedede-hero.svg`, squoosh/sharp for JPEGs) may be run as a separate improvement task.
- The `<picture>` + `<source srcset>` WebP/JPEG pattern for article hero images must be reproduced exactly (same breakpoints, same file references).
