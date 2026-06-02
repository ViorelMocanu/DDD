# ADR 0003 — Content pipeline: collections for articles, `.astro` for static pages

- **Status:** Accepted (2026-05-31)
- **Date:** 2026-05-30
- **Deciders:** human reviewer at GATE 1
- **Phase:** Phase 4 (content migration)

## Context

Content for the rebuild comes from `/livesite` (the authoritative FTP snapshot of the live deployment) and,
secondarily, the legacy Svelte `src/` for structure. The site has two content shapes:

1. **Six static pages** — homepage, contact, blog index, and three legal/prose pages. Their content is
   bespoke layout + prose, not uniform records.
2. **Three blog articles** — uniform records with shared frontmatter (title, description, canonical, OG
   image, publish date) and a markdown body. They feed both the index (`/informatii-utile/`) and their
   own root-level pages, and need build-time read-time + formatted-date derivations (legacy `TimpCitire`,
   `DataCitibila`).

We must migrate this content faithfully (markup, meta, assets) without re-encoding images in a way that
breaks pixel-diff baselines, and keep the authoring model simple for a 9-page marketing site.

## Decision

Use a **typed Astro content collection only for the three articles**; author the **six static pages as
plain `.astro` files**. Define a `blog` collection in `src/content/blog/` with a Zod schema validated at
build time; `getCollection('blog')` powers both the index and the `[slug].astro` route (ADR 0002).

Article body text is copied from the authoritative deployed baseline HTML (`parity/baseline/html/`) to
preserve exact diacritics.

### Corrected Zod schema (GATE 1 ratified)

> **Note — prior draft schema was wrong and has been replaced.** The original draft used `canonical`,
> `ogImage`, `datePublished: z.coerce.date()`, and `order`. All four were incorrect:
> `z.coerce.date()` would coerce the bare `YYYY-MM-DDTHH:MM:SS` string to a `Date` object and then lose
> the exact string when passed to `<meta property="article:published_time">` (timezone suffix would be
> appended by `.toISOString()`); `canonical` is composed at build from the slug, not stored; `ogImage`
> was renamed to `ogimage` (object) for consistency; `order` is replaced by chronological sort on `date`.

```ts
// src/content/config.ts
import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    excerpt: z.string(),
    // IMPORTANT: bare YYYY-MM-DDTHH:MM:SS string — NOT z.coerce.date().
    // Preserves the exact value for article:published_time without timezone mutation.
    date: z.string(),
    author: z.string(),
    thumbnail: z.object({
      name: z.string(),
      alt: z.string(),
    }),
    ogimage: z.object({
      url: z.string(),
      alt: z.string(),
    }),
    // Optional: defaults to `date` at build time when absent.
    modifiedDate: z.string().optional(),
  }),
});

export const collections = { blog };
```

### Derived fields (computed at build, NOT stored in frontmatter)

| Derived value | Source |
| --- | --- |
| `wordCount` | body word count |
| `readingTime` | `Math.round(wordCount / 225)` minutes |
| Human display date | `date` string, formatted at build |
| `prev` / `next` links | chronological sort on `date` |
| Breadcrumb | composed from slug |

**Migration source rules:** copy article body + frontmatter from `parity/baseline/html/` (authoritative
deployed baseline); copy meta (title/description/OG/Twitter) verbatim to preserve SEO.
Read-time (word-count ÷ 225) and formatted date are computed at build from the body/frontmatter, not stored.
**Never copy `env.php`, `php_errorlog`, or any secret value into the repo or schema.**

## Consequences

- **Easier:** Zod fails the build on a malformed/missing article field, catching migration errors early; the index and article pages share one validated data source; adding an article is a single markdown file.
- **Harder / to watch:** static pages live outside the collection, so their meta is not schema-validated — mitigate by routing all pages' `<head>` through one typed `BaseHead.astro` component. Migrated prose must match the live DOM closely enough for the ≤0.1% visual diff; preserve exact legacy CSS class names (do not rename during migration).
- **Image policy (two-track):** legacy images are copied byte-for-byte into `public/images/` and served via `passthroughImageService()` so Sharp does not re-encode them and shift pixel baselines. New images added **after** parity is certified (e.g. the new branded OG image) may use `astro:assets` + Sharp. Documented in `CONTEXT.md`.

## Alternatives considered

- **Put all 9 pages in collections** — rejected: the six static pages are not uniform records; forcing a schema adds ceremony with no validation payoff and complicates bespoke layouts.
- **No collection; three hand-written article `.astro` files** — viable and maximally explicit, but loses build-time frontmatter validation and duplicates layout; pairs with the "three static files" fallback in ADR 0002.
- **MDX for articles** — only needed if articles embed components. Current articles are prose; plain markdown keeps the dependency surface smaller. Revisit if an article needs interactive embeds.
- **`z.coerce.date()` for the publish date** — rejected at GATE 1. Coercion silently appends a UTC timezone suffix when the value is serialised back to a string, corrupting the `article:published_time` meta tag. The bare `YYYY-MM-DDTHH:MM:SS` string must pass through verbatim; all display formatting and sorting happen in Astro component code at build time.

## Resolution (GATE 1 — 2026-05-31)

Typed `blog` content collection for the three articles + plain `.astro` for the six static pages is
**accepted**. Twitter card and JSON-LD are NOT stored in frontmatter; they are composed in `BaseHead.astro`
from the validated frontmatter fields. The two-track image policy (passthrough for legacy, Sharp for new)
is ratified. The corrected Zod schema above (with `date: z.string()`) supersedes the prior draft.
