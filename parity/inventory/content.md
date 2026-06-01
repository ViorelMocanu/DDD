# Content Migration Plan

> Authoritative source: `/livesite` (FTP snapshot). Legacy `src/` is secondary structure reference only.
> All article body HTML rendered identically in both `/livesite` and `parity/baseline/html` — no drift detected.

---

## 1. Per-article frontmatter field inventory

All three markdown files live at:
`src/routes/informatii-utile/{slug}.md`

### 1.1 totul-despre-dezinsectie

| Field             | Value                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| `title`           | `'Totul despre Dezinsecție: Ce este și când ai nevoie de ea'`                                                   |
| `description`     | `'Am concentrat toate informațiile utile despre Dezinsecție în acest articol, pentru a-ți arăta cum te poate ajuta eroul nostru, DeDeDe.ro. Citește acum »'` |
| `excerpt`         | `'Un articol clar și complet despre dezinsecție, unde am încercat să ne concentrăm toată înțelepciunea și experiența acumulate pentru a-ți arăta de ce eroul nostru DeDeDe alungă nu doar dăunătoarele și insectele cât și competiția.'` |
| `date`            | `'2021-09-14T11:40:00'` (no TZ offset)                                                                         |
| `author`          | `'Echipa DeDeDe.ro'`                                                                                           |
| `thumbnail.name`  | `'totul-despre-dezinsectie'`                                                                                   |
| `thumbnail.alt`   | `'Totul despre Dezinsecție - detalii și recomandări'`                                                           |
| `ogimage.url`     | `'/images/totul-despre-dezinsectie-og.jpg'`                                                                    |
| `ogimage.alt`     | `'Totul despre Dezinsecție - detalii și recomandări'`                                                           |

Deployed: `article:published_time` = `2021-09-14T11:40:00` (same). No `article:modified_time` separate value — both set to same timestamp. Prev link: `/cum-scapi-de-gandaci/`. No next link (newest article). Rendered word count: 1279. Estimated read time: 6 min.

### 1.2 cum-scapi-de-gandaci

| Field             | Value                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| `title`           | `'Cum scapi de gândaci: Gândacul de bucătărie'`                                                                 |
| `description`     | `'DeDeDe.ro te ajută să scapi de gândaci. Dar dacă vrei să încerci și singur/ă, îți dăm toate detaliile necesare să găsești o soluție pentru ei. Citește acum »'` |
| `excerpt`         | `'Păi e simplu! Apelezi la eroul DeDeDe și te salvează el de orice dușman infiltrat în casa sau spațiul tău. Dacă totuși ești determinat să găsești singur o soluție, îți spunem noi clar și răspicat tot ce te-ar putea interesa dacă vrei să afli cum să scapi de gândaci.'` |
| `date`            | `'2021-09-13T19:45:00'` (no TZ offset)                                                                         |
| `author`          | `'Echipa DeDeDe.ro'`                                                                                           |
| `thumbnail.name`  | `'cum-scapi-de-gandaci'`                                                                                       |
| `thumbnail.alt`   | `'Cum scapi de gândaci în general - soluții concrete'`                                                          |
| `ogimage.url`     | `'/images/cum-scapi-de-gandaci-og.jpg'`                                                                        |
| `ogimage.alt`     | `'Cum scapi de gândaci în general - soluții concrete'`                                                          |

Deployed: prev `/dezinfectie-dezinsectie-deratizare-diferente/`, next `/totul-despre-dezinsectie/`. Word count: 1123. Read time: 5 min.

### 1.3 dezinfectie-dezinsectie-deratizare-diferente

| Field             | Value                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| `title`           | `'Dezinsecție – Dezinfecție – Deratizare: Care sunt diferențele și ce presupune fiecare'`                       |
| `description`     | `'Un articol complet și informativ care descrie în detaliu Dezinfecția, Dezinsecția și Deratizarea pentru tine. Apelează la specialiștii DeDeDe.ro »'` |
| `excerpt`         | `'Când vine vorba de cele trei (dezinsecție, dezinfecție și deratizare) încă un articol complet și informativ care să te ajute să pricepi mai bine care, cum, ce, nu strică, nu-i așa?'` |
| `date`            | `'2021-09-12T19:45:00'` (no TZ offset)                                                                         |
| `author`          | `'Echipa DeDeDe.ro'`                                                                                           |
| `thumbnail.name`  | `'ddd-diferente'`                                                                                              |
| `thumbnail.alt`   | `'Care sunt diferențele dintre Dezinfecție, Dezinsecție și Deratizare?'`                                        |
| `ogimage.url`     | `'/images/ddd-diferente-og.jpg'`                                                                               |
| `ogimage.alt`     | `'Care sunt diferențele dintre Dezinfecție, Dezinsecție și Deratizare?'`                                        |

Deployed: no prev (oldest article), next `/cum-scapi-de-gandaci/`. Word count: 831. Read time: 4 min.

---

## 2. Deployed article metadata not in frontmatter (derived at build time)

The following fields appear in deployed HTML but are absent from the markdown frontmatter. They are computed by the Elder.js `BlogPost.svelte` / `TimpCitire.svelte` / `DataCitibila.svelte` components. Astro must reproduce the same computation:

| Derived field        | Source                                | Deployed value (examples)                      |
| -------------------- | ------------------------------------- | ---------------------------------------------- |
| `wordCount`          | Body word-count                       | 1279 / 1123 / 831                              |
| `readingTime`        | `Math.round(wordCount / 225)` min     | 6 / 5 / 4                                     |
| `datePublished` (display) | ISO datetime → "DD Luna YYYY la ora HH:MM" | `14 Septembrie 2021 la ora 11:40`  |
| prev/next `<link>`   | Sorted chronologically by `date`      | `rel="prev"` / `rel="next"` in `<head>`        |
| Breadcrumb position  | Static (always 3 levels for articles) | DeDeDe.ro → Informații utile → article title   |
| Hero image srcset    | `thumbnail.name` + fixed suffixes     | `-desktop.webp` / `-mobile.webp` / `-mobile.jpg` |

---

## 3. Livesite drift analysis

**Finding: no content drift detected.** The `livesite/` HTML for all three articles is byte-for-byte equivalent to `parity/baseline/html/` for the head metadata and rendered body. The src markdown bodies match the rendered HTML body paragraphs exactly. There are no post-commit edits on the live FTP that diverge from the repo markdown. `livesite/` is the authoritative source but in this case confirms the repo markdown is current.

---

## 4. Proposed Astro content-collection schema (zod) for `blog`

File: `src/content/config.ts`

```typescript
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    // Core SEO / display
    title: z.string(),
    description: z.string(),
    excerpt: z.string(),

    // Canonical URL slug — must match the deployed root-level path
    // e.g. 'totul-despre-dezinsectie' → URL /totul-despre-dezinsectie/
    // Derived from the .md filename by default; include explicitly for safety.
    // slug is provided automatically by Astro from the filename; no need to
    // declare it here unless you need to override it.

    // Dates — stored as PLAIN strings to match live site values verbatim.
    // NOTE: use bare z.string(), NOT z.string().datetime(...) — the article dates are
    // 'YYYY-MM-DDTHH:MM:SS' with no 'Z' and no offset, which zod's .datetime() REJECTS
    // (it requires a Z/offset unless {local:true}). z.coerce.date() is also wrong: it
    // produces Date objects and re-formats, breaking article:published_time parity.
    // Plain string passes the exact value straight through to the meta tag. (Authoritative: SPEC §6 / ADR 0003.)
    date: z.string(),
    // modifiedDate is NOT in any frontmatter; live site sets it equal to date.
    // Compute: entry.data.modifiedDate ?? entry.data.date
    modifiedDate: z.string().optional(),

    // Author
    author: z.string(),

    // Thumbnail — drives the article hero <picture> element
    thumbnail: z.object({
      name: z.string(),  // basename; component appends -desktop.webp / -mobile.webp / -mobile.jpg
      alt: z.string(),
    }),

    // Open Graph image — separate from thumbnail; used in <meta og:image>
    ogimage: z.object({
      url: z.string(),   // root-relative path, e.g. '/images/totul-despre-dezinsectie-og.jpg'
      alt: z.string(),
    }),
  }),
});

export const collections = { blog };
```

**Notes on field decisions:**

- `slug` / `permalink`: Astro derives the slug from the `.md` filename automatically when using content collections. The deployed URLs are root-level (not under `/informatii-utile/`), so the `[slug].astro` route must live at `src/pages/[slug].astro`, not under a sub-folder. See ADR 0002.
- `excerpt` is used as the article intro paragraph (`<p class="BigArticleIntro">`) — it is not the same as `description`. Both are required.
- `readingTime` and `wordCount` are **not** stored in frontmatter; they are computed at render time from the markdown body. Compute in the `.astro` page template.
- No `tags`, `category`, or `series` fields exist in any article — omit from schema.
- No `draft` flag in any article — omit, but note it can be added later if needed.
- `ogimage.url` and `thumbnail.name` reference different images (OG = 1200×630 JPG, thumbnail = responsive hero picture). Keep separate to preserve the pattern.

---

## 5. Blog article migration approach

### 5.1 Where the markdown files live in Astro

```
src/content/blog/
  totul-despre-dezinsectie.md
  cum-scapi-de-gandaci.md
  dezinfectie-dezinsectie-deratizare-diferente.md
```

Move the `.md` files from `src/routes/informatii-utile/` into `src/content/blog/`. The frontmatter is migrated verbatim. The body content is sourced from `/livesite/{slug}/index.html` (the rendered `<div class="ArticleBody">` inner HTML) since livesite is the authoritative content source. In this case body content matches the src markdown, so copying the existing `.md` body is safe — but the HTML rendered form in livesite is the reference for verifying rendering parity (heading IDs, HTML structure).

### 5.2 Route file

A single dynamic route handles all three articles:

```
src/pages/[slug].astro
```

`getStaticPaths()` maps each `blog` collection entry to its slug (the filename without `.md`). This keeps the root-level URLs (`/totul-despre-dezinsectie/`, etc.) intact and matches the parity requirement in ADR 0002.

### 5.3 Image resolution pattern

From `thumbnail.name` = `"totul-despre-dezinsectie"` the template constructs:

```
/images/{thumbnail.name}-desktop.webp   (min-width: 850px)
/images/{thumbnail.name}-mobile.webp    (min-width: 100px)
/images/{thumbnail.name}-mobile.jpg     (fallback src)
```

All images stay as passthrough `public/` assets — no `astro:assets` transforms on legacy images (ADR 0003).

### 5.4 Computed fields at render time

```typescript
// In src/pages/[slug].astro
import { render } from 'astro:content';

const { Content, remarkPluginFrontmatter } = await render(entry);
// Word count: count words in body text at build time
// Astro remark plugins can inject wordCount / readingTime into remarkPluginFrontmatter
// OR compute from entry.body (raw markdown string) with a simple split on whitespace.
// Reading time formula matches legacy: Math.round(wordCount / 225)
```

The Legacy `TimpCitire.svelte` computes `Math.round(wordCount / 225)`. A remark plugin (e.g. `remark-reading-time`) or an inline computation from `entry.body.split(/\s+/).length` achieves parity.

### 5.5 Prev/next navigation

Articles sorted ascending by `date` give the chronological order:

1. `dezinfectie-dezinsectie-deratizare-diferente` — 2021-09-12 (oldest, no prev, next = cum-scapi)
2. `cum-scapi-de-gandaci` — 2021-09-13 (prev = ddd-diferente, next = totul-despre)
3. `totul-despre-dezinsectie` — 2021-09-14 (oldest → newest, prev = cum-scapi, no next)

Generate sorted list in `getStaticPaths()`, pass prev/next as props. These also drive the `<link rel="prev">` / `<link rel="next">` head tags and the `<aside>` navigation block at the bottom of each article.

---

## 6. Static pages — content location

The 6 non-article pages have all their content inline in the legacy Svelte files. There is no external data source. In Astro, each becomes a dedicated `.astro` page file with the text hardcoded inside the template (same pattern as the legacy Svelte).

| Route                    | Astro file                                     | Content location in legacy                          | Notes |
| ------------------------ | ---------------------------------------------- | --------------------------------------------------- | ----- |
| `/`                      | `src/pages/index.astro`                        | `src/routes/home/Home.svelte` — full HTML inline    | Hero text, services section, testimonials, contact CTA all hardcoded in Svelte. No data files. |
| `/contact/`              | `src/pages/contact/index.astro`                | `src/routes/contact/Contact.svelte`                 | Form labels, field names, GDPR disclaimer text inline. AJAX logic moves to a dedicated island component. |
| `/informatii-utile/`     | `src/pages/informatii-utile/index.astro`       | `InformatiiUtile.svelte` + `BlogIndex.svelte`       | Article cards driven by content-collection query (`getCollection('blog')`). Page title/description in Svelte head. |
| `/termeni-si-conditii/`  | `src/pages/termeni-si-conditii/index.astro`    | `src/routes/termeni-si-conditii/termeni-si-conditii.svelte` — body prose inline | Full legal text hardcoded in the Svelte template (no markdown file). Copy verbatim to .astro. |
| `/confidentialitate/`    | `src/pages/confidentialitate/index.astro`      | `src/routes/confidentialitate/confidentialitate.svelte` — body prose inline | Same as above — inline prose. Includes company registration data (SC Gyo Cleaning Experts SRL, CUI 35666363, J51/429/2016). |
| `/cookies/`              | `src/pages/cookies/index.astro`                | `src/routes/cookies/cookies.svelte`                 | Same inline pattern. |

**Note on legal page content:** the Svelte source for `termeni-si-conditii` contains the full privacy + cookie policy text (it appears to also include the cookie section within the same component — see `termeni-si-conditii.svelte` line 78 "Politica de utilizare a cookie-urilor"). The deployed baseline HTML is authoritative; verify against `parity/baseline/html/{route}/index.html` if the cookie policy section shows up on termeni vs. the cookies page. Use the deployed HTML as the final source to avoid copying mismatched content from the Svelte file.

---

## 7. GATE 1 content ambiguities

The following items require a decision or human confirmation before implementation:

### 7.1 `@TODO` twitter handles (BLOCKER for SEO parity)

All 9 routes in both livesite and parity/baseline have:

```html
<meta name="twitter:site" content="@TODO">
<meta name="twitter:creator" content="@TODO">
```

This is a live bug on the deployed site — the Twitter/X handles were never filled in. Options:
- **A (recommended):** populate with the real Twitter handle if the business has one (ask client).
- **B:** omit `twitter:site` and `twitter:creator` entirely (valid; Twitter Cards still works with only `twitter:card`).
- **C:** reproduce the `@TODO` placeholder for strict parity (not recommended — perpetuates a bug).

Resolution needed before Phase 4.

### 7.2 Date format — no timezone offset on article dates

Frontmatter `date` values use `'2021-09-14T11:40:00'` (no TZ suffix). The deployed `article:published_time` meta tag reproduces this exact string. Home/contact/legal pages use `'2021-09-19T19:35:55+03:00'` (with `+03:00` offset). The zod schema uses **plain `z.string()`** for articles (NOT `.datetime(...)`, which would reject the bare no-`Z` format; NOT `z.coerce.date()`, which re-formats) so the frontmatter value passes through verbatim. If a remark plugin or date formatter adds a UTC offset, the rendered meta tag will diverge from live.

Decision: store article dates as strings, pass through verbatim to meta tags, and only format for human display (e.g. `14 Septembrie 2021 la ora 11:40`).

### 7.3 `article:modified_time` — not a separate field

The live site sets both `article:published_time` and `article:modified_time` to the same value for all articles. The `modifiedDate` field does not exist in any frontmatter. The schema declares it `optional()`; the page template should default: `entry.data.modifiedDate ?? entry.data.date`.

### 7.4 Legal page content — Romanian vs. diacritics consistency

The Svelte legal-page templates mix diacritics-correct Romanian (e.g., `"ș"`, `"ț"`) with incorrect legacy ASCII approximations (`"s"`, `"t"` substitutes in some paragraphs). The deployed HTML preserves these exactly. Copy from the deployed baseline HTML (`parity/baseline/html/{route}/index.html`), NOT from the Svelte source, to get the canonical deployed text.

### 7.5 `termeni-si-conditii` contains cookie policy section

The `termeni-si-conditii.svelte` file embeds a `## Politica de utilizare a cookie-urilor` section at the end (line 78). Verify whether this section also appears in the deployed `/termeni-si-conditii/` HTML or only in `/cookies/`. Do not copy it into both Astro pages without checking.

### 7.6 Homepage and contact meta description contain emoji

The deployed meta descriptions for `/` and `/contact/` contain emoji characters (`🦸`, `🕷️`, `🐜`, `🐀`, etc.). These are present in the Svelte source and the parity baseline. Replicate exactly — Astro renders Unicode correctly. No action needed unless the SEO parity check tool strips emoji.

### 7.7 No JSON-LD on any page

The live site uses inline microdata (`itemscope` / `itemprop` on `schema.org/Article`, `schema.org/BreadcrumbList`, `schema.org/ProfessionalService`) — NOT JSON-LD. The `<script type="application/ld+json">` block in the deployed HTML is empty for all pages. Do not add JSON-LD in the Astro rebuild; reproduce the microdata attributes on the same HTML elements.

### 7.8 GTM / Analytics conditional loading

Home `/`, contact `/contact/`, and the three article pages load GTM (`GTM-NGTSNLX`) + Google Ads (`AW-10780123066`). The three legal pages (`/termeni-si-conditii/`, `/confidentialitate/`, `/cookies/`) do NOT load analytics. The Astro layout must conditionally inject the GTM snippet based on the route. A boolean prop `loadAnalytics` (defaulting to `true`, set to `false` on legal pages) is the simplest approach; or exclude legal pages from the GTM snippet via `Astro.url.pathname`.

---

## 8. Summary of migration steps (ordered)

1. Create `src/content/config.ts` with the `blog` schema above.
2. Move the three `.md` files from `src/routes/informatii-utile/` to `src/content/blog/` — frontmatter unchanged.
3. Verify body content of each `.md` against `parity/baseline/html/{slug}/index.html` (the ArticleBody div).
4. Create `src/pages/[slug].astro` using `getStaticPaths()` + content collection, computing `readingTime` and `wordCount` inline.
5. Create `src/pages/informatii-utile/index.astro` querying the `blog` collection for the article card list.
6. Create static `.astro` pages for `/`, `/contact/`, `/termeni-si-conditii/`, `/confidentialitate/`, `/cookies/` with content copied from the deployed baseline HTML.
7. Resolve GATE 1 items 7.1 (twitter handles) and 7.5 (cookie section placement) before PR.
