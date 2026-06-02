# Component Conversion Plan — DeDeDe.ro Svelte → Astro

Generated from reading all Svelte source files and cross-checking against
`livesite/resources/script.js` and `parity/baseline/html/`.

---

## Component Inventory Table

| # | Name | Purpose | Props / Inputs | Svelte Reactivity / Events / Stores / onMount? | Classification | Notes |
|---|------|---------|----------------|------------------------------------------------|----------------|-------|
| 1 | `Layout.svelte` | Root HTML shell: head metadata, skip-nav links, GTM noscript iframe, deferred `script.js` load | `templateHtml` (raw HTML string), `helpers`, `request` | **onMount** (`mounted` flag), `on:load` event on `<script>` tag, two reactive variables `scriptReady`/`mounted` | **STATIC → .astro** | `onMount`/`scriptLoaded` logic is a dead stub (`loadScriptElements` only logs a warning). The actual JS work is done in the external `script.js`. In Astro: render slot content, emit `<script defer src="/resources/script.js">` directly. GTM noscript iframe should be emitted per-page since 3 legal pages must NOT have GTM (confirmed by baseline). |
| 2 | `DeHeader.svelte` | Site header: logo, hamburger toggle button, nav links with active-state highlighting, phone/schedule CTAs | `helpers` (permalink resolver), `request` (current route object for `class:Active`) | Svelte `class:Active` directive reads `request.route` — build-time string comparison only, no runtime reactivity | **STATIC → .astro** | Active-state class on `<li>` items. In Astro, pass `Astro.url.pathname` and apply class conditionally at render time. Hamburger `#menuToggle` button has no Svelte logic; click handler lives entirely in `script.js` (`menuToggle.addEventListener('click', ...)`). |
| 3 | `DeFooter.svelte` | Footer: 3 contact method columns, nav links, copyright, dark-mode toggle button, back-to-top link, Batman SVG signal | none | `new Date()` called at module initialisation to compute dynamic copyright year range (e.g. "2021-2026") | **STATIC → .astro** | Copyright year is a one-time build-time computation — trivially replaced with `` `2021-${new Date().getFullYear()}` `` in the Astro frontmatter. Dark-mode toggle `#darkMode` and back-to-top `#backTop` visibility are controlled entirely by `script.js` via `localStorage` and `IntersectionObserver`. |
| 4 | `DataCitibila.svelte` | Formats a raw ISO date string into human-readable Romanian date (short or long form) | `dataNecitibila` (ISO date string), `eScurta` (boolean) | No reactivity, no events; pure function called at render time | **STATIC → .astro** (inline helper) | Pure data-transformation function. Can be inlined as a TS utility function and called in Astro frontmatter. No DOM, no events. |
| 5 | `TimpCitire.svelte` | Computes estimated reading time (ceil words/225) from raw HTML string | `textOriginal` (HTML string) | No reactivity, no events; calculation at module scope | **STATIC → .astro** (inline helper) | Pure calculation. Inlineable. Imports `add_resize_listener` from `svelte/internal` — unused dead import, can be dropped. |
| 6 | `Articol.svelte` | Article card used on homepage and blog index: thumbnail picture, title, excerpt, date, reading time | `articol` (markdown data object with `frontmatter`, `html`, `slug`), `helpers` | Uses `DataCitibila` and `TimpCitire` as child components; conditional `{#if}` blocks for thumbnail; no events or stores | **STATIC → .astro** | Renders fully at build time. `{#if articol.frontmatter.thumbnail}` → standard Astro conditional. Inline `DataCitibila`/`TimpCitire` helpers. |
| 7 | `Home.svelte` | Homepage page body: Hero section, Services list (3 × schema.org/Service microdata), Testimonials, article list using `Articol` | `data` (markdown collection), `helpers`, `request`, `settings` | `<svelte:head>` for per-page meta; `{#each}` loop over articles; no reactive vars, no events, no onMount | **STATIC → .astro** | All markup is purely static at render time. `settings.origin + request.permalink` → Astro's `Astro.site + Astro.url.pathname`. Inline microdata (schema.org/Service) must be preserved as-is. |
| 8 | `Contact.svelte` | Contact page: Hero, breadcrumbs, contact form with 5 visible + 6 hidden fields, GDPR checkbox, submit button, result output | `data`, `helpers`, `request`, `settings` | **`onMount` implicit via Svelte bind:this** on hidden inputs and `<output>` element; **`bind:value`** on all form controls (two-way binding); UTM param population | **INTERACTIVE → vanilla-JS island** | The form HTML is static and renders well without JS. However: (1) hidden fields (utm_source, utm_medium, utm_term, utm_content, utm_campaign, gclid, side_url) must be populated client-side from `window.location.search` on page load; (2) form submission is intercepted by `script.js` (AJAX POST to `https://dedede.ro/sideform.php`, client-side validation, GTM/Ads conversion events). In Astro: render the form markup as static HTML; let `script.js` handle all the JS. The `bind:this={result}` on `<output>` and `bind:this` on hidden inputs are anti-patterns in Elder.js SSR context — they just map to DOM references which `script.js` already selects by `getElementById`. Do NOT use `@astrojs/svelte` for this. |
| 9 | `cookies.svelte` | Cookies policy legal page: static long-form article | `request`, `settings` | `<svelte:head>` only; imports `Articol` but never uses it in template (dead import) | **STATIC → .astro** | No GTM/analytics on this page (confirmed by baseline). Pure prose article. Dead `Articol` import can be dropped. |
| 10 | `confidentialitate.svelte` | Privacy policy legal page: static long-form article | `request`, `settings` | `<svelte:head>` only; same dead `Articol` import | **STATIC → .astro** | No GTM/analytics on this page. Pure prose article. Dead import to drop. |
| 11 | `termeni-si-conditii.svelte` | Terms & conditions legal page: static long-form article | `request`, `settings` | `<svelte:head>` only; same dead `Articol` import | **STATIC → .astro** | No GTM/analytics on this page. Pure prose article. Dead import to drop. |
| 12 | `InformatiiUtile.svelte` | Route dispatcher for the `/informatii-utile/` route family: switches between `BlogIndex` and `BlogPost` based on `request.template` | `data`, `helpers`, `request`, `settings` | `<svelte:component>` dynamic dispatch — a structural Svelte primitive | **STATIC → .astro** | In Astro this becomes two separate static pages/routes: `src/pages/informatii-utile/index.astro` (blog index) and `src/pages/informatii-utile/[slug].astro` (individual posts). No runtime component needed. |
| 13 | `BlogIndex.svelte` | Blog listing page: Hero, breadcrumbs, `{#each}` loop of article cards with full metadata | `data`, `helpers`, `request`, `settings` | `<svelte:head>`; `{#each}` loop; uses `DataCitibila` and `TimpCitire` as children | **STATIC → .astro** | Renders all article cards at build time. `data.markdown['informatii-utile']` → Astro content collection. |
| 14 | `BlogPost.svelte` | Individual blog article page: hero image, breadcrumbs, article meta, `{@html html}` body, prev/next navigation | `data`, `helpers`, `request`, `settings` | `<svelte:head>` with dynamic `rel="prev"/"next"` links; build-time prev/next computation by date comparison; `{@html html}` for Markdown body; imports (but does not use) `add_resize_listener` from `svelte/internal` (dead import) | **STATIC → .astro** | Prev/next logic is a build-time sort over the article collection — straightforward in Astro `getStaticPaths`. Dead `add_resize_listener` import must be dropped. `{@html html}` → Astro `<Fragment set:html={html} />` or use Astro Content Collections `<Content />`. |

---

## Prioritized Conversion Order

Priority is driven by: (1) dependency order (layout before pages), (2) blocking shared structure, (3) complexity risk.

1. **`DataCitibila` + `TimpCitire`** — Pure utility functions, no markup. Extract as TypeScript helpers in `src/utils/` first; all other components depend on them for date/reading-time rendering.
2. **`Layout.astro`** — Root shell. Everything else depends on it. Implement GTM conditional logic (legal pages vs. others) here using a prop flag.
3. **`DeHeader.astro`** — Shared; needed by every page. Active-state logic is trivial in Astro with `Astro.url.pathname`.
4. **`DeFooter.astro`** — Shared; needed by every page. Copyright year trivially computed in frontmatter.
5. **`Articol.astro`** — Reused by `Home`, `BlogIndex`, and `BlogPost`-adjacent contexts; convert before those pages.
6. **`Home.astro`** — Homepage; the highest-traffic, highest-SEO-priority page. Large but fully static.
7. **`BlogIndex.astro`** (`src/pages/informatii-utile/index.astro`) — Blog listing; depends on content collection.
8. **`BlogPost.astro`** (`src/pages/informatii-utile/[slug].astro`) — Individual articles; depends on content collection + prev/next logic.
9. **`Contact.astro`** + contact JS island — Form HTML is static; `script.js` already handles all JS. Focus on preserving field IDs and hidden field names exactly.
10. **Legal pages** (`cookies.astro`, `confidentialitate.astro`, `termeni-si-conditii.astro`) — Pure prose, simplest conversions. Ensure GTM is NOT injected on these three routes.
11. **`InformatiiUtile.svelte`** — Structural dispatcher only; dissolves into the two Astro route files already created in steps 7–8.

---

## Genuinely Interactive Behaviors Requiring Client JS

All of the following are handled by `livesite/resources/script.js` (self-hosted, deferred). None require Svelte or any Astro island framework. The JS file must be reproduced/migrated as-is at `public/resources/script.js`.

| Behavior | DOM hook(s) | script.js evidence |
|----------|-------------|-------------------|
| **Hamburger nav toggle** | `#menuToggle` click → toggles `.Active` on `#header` | Lines 324–328 |
| **Hamburger auto-close on desktop resize** | `window.matchMedia('(min-width:850px)').onchange` → removes `.Active` from `#header` | Lines 346–351 |
| **Dark mode toggle** | `#darkMode` click → toggles `.darkmode`/`.lightmode` on `body`, persisted in `localStorage` | Lines 356–389 |
| **Back-to-top button visibility** | `IntersectionObserver` on `.Hero[0]` → toggles `.HideBackTop` on `body`; `#backTop` visibility controlled via CSS | Lines 330–344 |
| **Contact form interception & AJAX submit** | `#sideform` submit event → client-side validation, `fetch` POST to `https://dedede.ro/sideform.php`, updates `#raspuns` `<output>` with sanitized HTML response | Lines 106–318 |
| **Contact form UTM / URL hidden field population** | On contact page load, hidden inputs (`#utm_source`, `#utm_medium`, `#utm_term`, `#utm_content`, `#utm_campaign`, `#gclid`, `#side_url`) must be populated from `window.location.href` / URL params | Lines 106–125 (variable declaration); population must be added explicitly in Astro — the legacy Svelte code used `bind:value` pointing to pre-parsed `urlParams[]` which was never actually populated from the URL (bug: `urlParams = []` not `URLSearchParams`). |
| **GTM + Google Ads injection** | Dynamically inserts GTM script tag (ID: `GTM-NGTSNLX`) and Google Ads script (ID: `AW-10780123066`) into `<head>` at runtime | Lines 408–433 |
| **Contact form GTM conversion events** | Pushes `formularInitializat`, `formularTrimis`, `conversieAcceptata`, `formularEroare` events to `dataLayer`; fires `gtag('event', 'conversion', {...})` on success | Lines 143–146, 264–269, 303–305 |

**Not present in live site** (confirmed by baseline HTML inspection):
- No cookie consent banner / CMP in any baseline HTML — the live site has no cookie consent UI widget.
- No scroll-triggered CSS animations beyond `IntersectionObserver` back-to-top hide/show.
- Service worker is commented out in `script.js` (lines 391–404) — do not implement.

---

## Summary Counts

- **Total components/pages analysed:** 14
- **Static → convert to `.astro`:** 13 (Layout, DeHeader, DeFooter, DataCitibila, TimpCitire, Articol, Home, cookies, confidentialitate, termeni-si-conditii, InformatiiUtile dispatcher, BlogIndex, BlogPost)
- **Interactive → vanilla-JS island (no framework):** 1 (Contact form — HTML is static, all JS lives in `script.js`)
- **Shared JS behaviors needing `script.js` migration:** 7 distinct behaviors (hamburger, desktop resize close, dark mode, back-to-top, contact form AJAX, UTM population, GTM+Ads injection)
