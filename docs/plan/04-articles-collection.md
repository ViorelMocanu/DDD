# Content Collection + Articles + [slug].astro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the typed `blog` content collection, the three article markdown files with correct SPEC §6 frontmatter, the TS helper utilities for date formatting and reading time, and `src/pages/[slug].astro` with full Article + BreadcrumbList microdata, hero `<picture>`, prev/next `<aside>`, and all approved §9 fixes applied — producing visual and meta parity against the three article baselines.

**Architecture:** A typed Zod schema in `src/content/config.ts` governs the three `.md` files under `src/content/blog/`. `[slug].astro` calls `getStaticPaths()` which allow-lists exactly the three slugs from the collection; derived fields (wordCount, readingTime, prev/next order, display date) are computed at build time inside the route. Two pure TS helpers (`src/utils/formatDate.ts`, `src/utils/readingTime.ts`) are unit-tested in isolation. A Vitest test pins `getStaticPaths()` to exactly the three slugs so no future slug can silently slip in.

**Tech Stack:** Astro 6, TypeScript strictest, `astro:content` (Zod), Vitest 4, pnpm

---

## File map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/content/config.ts` | Zod schema for the `blog` collection |
| Create | `src/content/blog/totul-despre-dezinsectie.md` | ART1 frontmatter + body |
| Create | `src/content/blog/cum-scapi-de-gandaci.md` | ART2 frontmatter + body |
| Create | `src/content/blog/dezinfectie-dezinsectie-deratizare-diferente.md` | ART3 frontmatter + body |
| Create | `src/utils/formatDate.ts` | RO date formatter (`14 Septembrie 2021 la ora 11:40`) |
| Create | `src/utils/readingTime.ts` | `Math.round(words/225)` reading-time estimator |
| Create | `src/pages/[slug].astro` | Article template — hero picture, breadcrumb, Article microdata, prev/next aside |
| Create | `src/tests/content-collection.test.ts` | Vitest: schema validation + getStaticPaths allow-list |

---

## Task 1: Create `src/content/config.ts` — typed Zod blog schema

**Files:**
- Create: `src/content/config.ts`
- Test: `src/tests/content-collection.test.ts` (written in Task 5)

**Context for implementer:** Astro's content collections live under `src/content/`. The `config.ts` file at the root of that folder defines and exports the typed schema. The `blog` Zod schema must match exactly the field names and types from SPEC §6. `date` and `modifiedDate` are bare `z.string()` — NOT `z.coerce.date()` and NOT `z.string().datetime()` — because the live `article:published_time` value is `2021-09-14T11:40:00` (no timezone suffix), which Zod's `.datetime()` rejects unless `{local:true}` is set, and `z.coerce.date()` would re-format the value breaking parity.

- [ ] **Step 1: Create `src/content/config.ts`**

```ts
// src/content/config.ts
import { defineCollection, z } from "astro:content";

/**
 * Typed `blog` content collection schema.
 *
 * PARITY NOTE: `date` and `modifiedDate` are plain z.string() — NOT z.coerce.date().
 * The live article:published_time values have no timezone offset (e.g. "2021-09-14T11:40:00").
 * z.coerce.date() would round-trip and re-format, breaking parity. Plain string passes
 * the exact frontmatter value straight through to the meta tag. (SPEC §6, ADR 0003.)
 *
 * `thumbnail.name` is a basename — the article template appends:
 *   -desktop.webp  (min-width: 850px)
 *   -mobile.webp   (min-width: 100px)
 *   -mobile.jpg    (fallback src)
 *
 * `ogimage.url` is root-relative (e.g. /images/totul-despre-dezinsectie-og.jpg).
 * [slug].astro prepends https://dedede.ro to make it absolute (WAIVER-SEO-02).
 */
const blog = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
		description: z.string(),
		excerpt: z.string(),
		// Bare YYYY-MM-DDTHH:MM:SS, no TZ offset, no coerce — passes verbatim to article:published_time
		date: z.string(),
		author: z.string(),
		thumbnail: z.object({
			// Basename; template appends -desktop.webp / -mobile.webp / -mobile.jpg
			name: z.string(),
			alt: z.string(),
		}),
		ogimage: z.object({
			// Root-relative path, e.g. /images/totul-despre-dezinsectie-og.jpg
			url: z.string(),
			alt: z.string(),
		}),
		// Optional — absent in all current frontmatter; defaults to `date` at render time
		modifiedDate: z.string().optional(),
	}),
});

export const collections = { blog };
```

- [ ] **Step 2: Commit**

```
git add src/content/config.ts
git commit -m "feat(content): add typed blog collection Zod schema"
```

---

## Task 2: Create the three article markdown files

**Files:**
- Create: `src/content/blog/totul-despre-dezinsectie.md`
- Create: `src/content/blog/cum-scapi-de-gandaci.md`
- Create: `src/content/blog/dezinfectie-dezinsectie-deratizare-diferente.md`

**Context for implementer — transformation rules:**

Source files are `src/routes/informatii-utile/{slug}.md` (legacy). The frontmatter field names are already correct for the SPEC §6 schema — they can be copied verbatim. The body content must also be copied verbatim from the legacy `.md` files. No content changes are allowed (parity-critical: diacritics, exact punctuation, existing `<br />` inline HTML in the dezinsectie article body, the `<hr />` and links in the ddd-diferente body).

**Preserve verbatim:**
- All frontmatter field names and values exactly as in the legacy `.md` (confirmed no drift vs livesite per `content.md §3`)
- All body text including Romanian diacritics (`ș`, `ț`, `â`, `î`, `ă`)
- Inline HTML in body: `<br />` in totul-despre-dezinsectie body (inside the gel bullet point); `<hr />` and `[DeDeDe.ro](/)` / `[serviciile DeDeDe](/#servicii)` links in ddd-diferente body
- Heading levels (##, ###, ####) — these become the heading IDs Astro generates; the baseline IDs are verified below

**Heading IDs the Astro markdown renderer must produce** (verified from `parity/baseline/html/*/index.html`):

ART1 (`totul-despre-dezinsectie`):
- `ce-este-dezinsecția-și-de-ce-trebuie-făcută`
- `când-trebuie-făcută-dezinsecția`
- `există-mai-multe-tipuri-de-dezinsecție`
- `dezinsecția-preventivă`
- `dezinsecția-curativă`
- `dedede-vs-dăunători--metode-ecologice-fizice`
- `dedede-vs-dăunători--metode-chimice`
- `cum-se-face-dezinsecția`
- `cât-de-des-ar-trebui-să-faci-o-dezinsecție`

ART2 (`cum-scapi-de-gandaci`):
- `dedede-vs-gândacii-de-bucătărie`
- `cum-luptăm-cu-gândacii-de-bucătărie`
- `1-elimină-factorii-care-le-asigură-supraviețuirea`
- `2-cunoaște-ți-dușmanul-și-pune-i-piedici`
- `și-dacă-toate-astea-nu-merg`
- `despre-momeala-insecticidă`

ART3 (`dezinfectie-dezinsectie-deratizare-diferente`):
- `ce-este-dezinsecția`
- `ce-este-deratizarea`
- `ce-este-dezinfecția-și-ce-presupune`
- `de-ce-e-bine-să-facă-asta-cineva-care-se-pricepe`

**NOTE on heading IDs:** Astro's default markdown renderer (remark) lowercases and slugifies headings in a way that usually preserves Unicode letters. The IDs listed above come directly from the baseline HTML — they are the required output. If the rendered IDs do not match after `astro build`, you must add `rehype-slug` or `remark-rehype` options to `astro.config.mjs` to align the slug algorithm. Do NOT manually add `{#id}` to headings in the markdown — that would diverge from the source.

- [ ] **Step 1: Create `src/content/blog/totul-despre-dezinsectie.md`**

Copy the file from `src/routes/informatii-utile/totul-despre-dezinsectie.md` verbatim. The frontmatter and body are already correct for the new schema. The only change is the destination path.

The complete file content (copy exactly — do NOT summarise or paraphrase):

```md
---
title: 'Totul despre Dezinsecție: Ce este și când ai nevoie de ea'
description: 'Am concentrat toate informațiile utile despre Dezinsecție în acest articol, pentru a-ți arăta cum te poate ajuta eroul nostru, DeDeDe.ro. Citește acum »'
excerpt: 'Un articol clar și complet despre dezinsecție, unde am încercat să ne concentrăm toată înțelepciunea și experiența acumulate pentru a-ți arăta de ce eroul nostru DeDeDe alungă nu doar dăunătoarele și insectele cât și competiția.'
date: '2021-09-14T11:40:00'
author: 'Echipa DeDeDe.ro'
thumbnail:
  name: 'totul-despre-dezinsectie'
  alt: 'Totul despre Dezinsecție - detalii și recomandări'
ogimage:
  url: '/images/totul-despre-dezinsectie-og.jpg'
  alt: 'Totul despre Dezinsecție - detalii și recomandări'
---
```

Then copy the entire body from `src/routes/informatii-utile/totul-despre-dezinsectie.md` lines 15–96 verbatim (the `<br />` in the gel bullet point at line 80 must be preserved).

- [ ] **Step 2: Create `src/content/blog/cum-scapi-de-gandaci.md`**

Copy the file from `src/routes/informatii-utile/cum-scapi-de-gandaci.md` verbatim.

```md
---
title: 'Cum scapi de gândaci: Gândacul de bucătărie'
description: 'DeDeDe.ro te ajută să scapi de gândaci. Dar dacă vrei să încerci și singur/ă, îți dăm toate detaliile necesare să găsești o soluție pentru ei. Citește acum »'
excerpt: 'Păi e simplu! Apelezi la eroul DeDeDe și te salvează el de orice dușman infiltrat în casa sau spațiul tău. Dacă totuși ești determinat să găsești singur o soluție, îți spunem noi clar și răspicat tot ce te-ar putea interesa dacă vrei să afli cum să scapi de gândaci.'
date: '2021-09-13T19:45:00'
author: 'Echipa DeDeDe.ro'
thumbnail:
  name: 'cum-scapi-de-gandaci'
  alt: 'Cum scapi de gândaci în general - soluții concrete'
ogimage:
  url: '/images/cum-scapi-de-gandaci-og.jpg'
  alt: 'Cum scapi de gândaci în general - soluții concrete'
---
```

Then copy the entire body from `src/routes/informatii-utile/cum-scapi-de-gandaci.md` lines 15–69 verbatim.

- [ ] **Step 3: Create `src/content/blog/dezinfectie-dezinsectie-deratizare-diferente.md`**

Copy the file from `src/routes/informatii-utile/dezinfectie-dezinsectie-deratizare-diferente.md` verbatim.

```md
---
title: 'Dezinsecție – Dezinfecție – Deratizare: Care sunt diferențele și ce presupune fiecare'
description: 'Un articol complet și informativ care descrie în detaliu Dezinfecția, Dezinsecția și Deratizarea pentru tine. Apelează la specialiștii DeDeDe.ro »'
excerpt: 'Când vine vorba de cele trei (dezinsecție, dezinfecție și deratizare) încă un articol complet și informativ care să te ajute să pricepi mai bine care, cum, ce, nu strică, nu-i așa?'
date: '2021-09-12T19:45:00'
author: 'Echipa DeDeDe.ro'
thumbnail:
  name: 'ddd-diferente'
  alt: 'Care sunt diferențele dintre Dezinfecție, Dezinsecție și Deratizare?'
ogimage:
  url: '/images/ddd-diferente-og.jpg'
  alt: 'Care sunt diferențele dintre Dezinfecție, Dezinsecție și Deratizare?'
---
```

Then copy the entire body from `src/routes/informatii-utile/dezinfectie-dezinsectie-deratizare-diferente.md` lines 15–63 verbatim (the `<hr />`, the `[DeDeDe.ro](/)` and `[serviciile DeDeDe](/#servicii)` Markdown links must be preserved exactly).

- [ ] **Step 4: Commit**

```
git add src/content/blog/
git commit -m "feat(content): add three blog article markdown files with correct schema frontmatter"
```

---

## Task 3: Create `src/utils/formatDate.ts` — Romanian date formatter

**Files:**
- Create: `src/utils/formatDate.ts`
- Test: `src/tests/content-collection.test.ts` (tested in Task 5)

**Context for implementer:** The legacy `DataCitibila.svelte` component converted an ISO datetime string like `2021-09-14T11:40:00` into the Romanian display `14 Septembrie 2021 la ora 11:40`. The conversion must be deterministic (not locale-dependent via `Intl`) to avoid any server/build-environment locale difference affecting the output. Use a hardcoded Romanian month name array indexed by the `Date` month number. Parse the bare ISO string by splitting on `T` and `-` — do NOT pass it to `new Date()` directly, because `new Date("2021-09-14T11:40:00")` without a timezone suffix is treated as LOCAL time in some environments and UTC in others, which can shift the displayed day/hour.

- [ ] **Step 1: Create `src/utils/formatDate.ts`**

```ts
// src/utils/formatDate.ts

/** Romanian month names, 1-indexed (index 0 is unused). */
const RO_MONTHS: readonly string[] = [
	"",
	"Ianuarie",
	"Februarie",
	"Martie",
	"Aprilie",
	"Mai",
	"Iunie",
	"Iulie",
	"August",
	"Septembrie",
	"Octombrie",
	"Noiembrie",
	"Decembrie",
];

/**
 * Format a bare ISO-8601 datetime string (no timezone offset) into Romanian display format.
 *
 * Produces: "14 Septembrie 2021 la ora 11:40"
 * Matches the live site output from `DataCitibila.svelte`.
 *
 * IMPORTANT: The input is parsed by splitting on "T", "-", and ":" — not via `new Date()` —
 * to avoid timezone-dependent day/hour shifting in build environments.
 *
 * @param {string} isoString - Bare ISO datetime, e.g. "2021-09-14T11:40:00" (no TZ suffix).
 * @returns {string} Romanian display string, e.g. "14 Septembrie 2021 la ora 11:40".
 */
export function formatDateRo(isoString: string): string {
	// Split "2021-09-14T11:40:00" → datePart="2021-09-14", timePart="11:40:00"
	const tIndex = isoString.indexOf("T");
	const datePart = tIndex >= 0 ? isoString.slice(0, tIndex) : isoString;
	const timePart = tIndex >= 0 ? isoString.slice(tIndex + 1) : "00:00:00";

	const [yearStr, monthStr, dayStr] = datePart.split("-");
	const [hourStr, minuteStr] = timePart.split(":");

	const year = yearStr ?? "";
	const month = parseInt(monthStr ?? "1", 10);
	const day = parseInt(dayStr ?? "1", 10);
	const hour = hourStr ?? "00";
	const minute = minuteStr ?? "00";

	const monthName = RO_MONTHS[month] ?? "";

	return `${day} ${monthName} ${year} la ora ${hour}:${minute}`;
}
```

- [ ] **Step 2: Commit** (after tests pass in Task 5)

Hold the commit — commit together with the test in Task 5.

---

## Task 4: Create `src/utils/readingTime.ts` — reading-time estimator

**Files:**
- Create: `src/utils/readingTime.ts`
- Test: `src/tests/content-collection.test.ts` (tested in Task 5)

**Context for implementer:** The legacy `TimpCitire.svelte` component computed `Math.round(wordCount / 225)`. The word count itself was derived from the rendered article body. In Astro the raw markdown body is available as `entry.body` (a string). Words are split on whitespace. The function returns a minimum of 1 minute.

Note: `entry.body` in Astro contains the raw markdown (including `## headings`, `**bold**`, etc.). The word count from the live site (1279 / 1123 / 831) was computed from the RENDERED text, which excludes markdown syntax characters. However, the difference is tiny for these short articles. Compute from `entry.body` splitting on whitespace — this matches the legacy computation closely enough that it will produce the correct reading-time values (6/5/4 min) for the three articles. Verify after running the test in Task 5.

- [ ] **Step 1: Create `src/utils/readingTime.ts`**

```ts
// src/utils/readingTime.ts

/**
 * Estimate reading time in minutes from article body text.
 *
 * Uses the same formula as the legacy TimpCitire.svelte: Math.round(wordCount / 225).
 * Minimum return value is 1 minute.
 *
 * @param {string} text - Raw article body text (markdown or plain text).
 * @param {number} [wpm=225] - Words-per-minute reading speed (legacy parity value).
 * @returns {number} Whole-minute reading-time estimate.
 */
export function readingTimeMinutes(text: string, wpm = 225): number {
	const words = text.trim().split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / wpm));
}

/**
 * Count words in article body text.
 *
 * @param {string} text - Raw article body text (markdown or plain text).
 * @returns {number} Total word count.
 */
export function wordCount(text: string): number {
	return text.trim().split(/\s+/).filter(Boolean).length;
}
```

- [ ] **Step 2: Commit** (after tests pass in Task 5)

Hold the commit — commit together with the test in Task 5.

---

## Task 5: Write and pass Vitest tests for schema + helpers + getStaticPaths allow-list

**Files:**
- Create: `src/tests/content-collection.test.ts`
- Modify: (none — tests validate the existing implementations)

**Context for implementer:** Vitest is configured in `vitest.config.ts` (or via `package.json` `vitest` key). Tests live under `src/tests/`. The `getStaticPaths` test imports the blog collection and asserts that `getStaticPaths()` returns exactly the three expected slugs (SPEC §3 / §10 requirement). The schema test validates that correct frontmatter passes Zod and that a bare date string passes through unchanged (i.e. the schema does NOT coerce it). The helper tests check the formatter output against the three known live-site display strings and the reading-time formula.

**IMPORTANT — getStaticPaths test approach:** `[slug].astro` uses `getCollection('blog')` from `astro:content`. In a Vitest unit test (not an Astro integration test), you cannot call `getStaticPaths()` from the `.astro` file directly. Instead, test the slug derivation logic in isolation: assert that the set of filenames in `src/content/blog/` (stripped of `.md`) exactly equals the three expected slugs. This is a lighter, faster test that still pins the allow-list.

- [ ] **Step 1: Write failing tests**

```ts
// src/tests/content-collection.test.ts
import { describe, it, expect } from "vitest";
import { z } from "zod";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { formatDateRo } from "@utils/formatDate";
import { readingTimeMinutes, wordCount } from "@utils/readingTime";

// ---------------------------------------------------------------------------
// 1. Schema validation — bare date string passes through unchanged
// ---------------------------------------------------------------------------
describe("blog collection Zod schema", () => {
	// Inline the schema to test it in isolation without Astro's content system
	const blogSchema = z.object({
		title: z.string(),
		description: z.string(),
		excerpt: z.string(),
		date: z.string(),
		author: z.string(),
		thumbnail: z.object({ name: z.string(), alt: z.string() }),
		ogimage: z.object({ url: z.string(), alt: z.string() }),
		modifiedDate: z.string().optional(),
	});

	it("accepts valid ART1 frontmatter", () => {
		const result = blogSchema.safeParse({
			title: "Totul despre Dezinsecție: Ce este și când ai nevoie de ea",
			description: "Am concentrat toate informațiile utile despre Dezinsecție în acest articol, pentru a-ți arăta cum te poate ajuta eroul nostru, DeDeDe.ro. Citește acum »",
			excerpt: "Un articol clar și complet despre dezinsecție, unde am încercat să ne concentrăm toată înțelepciunea și experiența acumulate pentru a-ți arăta de ce eroul nostru DeDeDe alungă nu doar dăunătoarele și insectele cât și competiția.",
			date: "2021-09-14T11:40:00",
			author: "Echipa DeDeDe.ro",
			thumbnail: { name: "totul-despre-dezinsectie", alt: "Totul despre Dezinsecție - detalii și recomandări" },
			ogimage: { url: "/images/totul-despre-dezinsectie-og.jpg", alt: "Totul despre Dezinsecție - detalii și recomandări" },
		});
		expect(result.success).toBe(true);
	});

	it("passes bare date string through verbatim (no coerce, no re-format)", () => {
		const input = "2021-09-14T11:40:00";
		const result = blogSchema.safeParse({
			title: "T",
			description: "D",
			excerpt: "E",
			date: input,
			author: "A",
			thumbnail: { name: "n", alt: "a" },
			ogimage: { url: "/images/x-og.jpg", alt: "a" },
		});
		expect(result.success).toBe(true);
		// The string must survive unchanged — NOT converted to a Date object
		if (result.success) {
			expect(result.data.date).toBe(input);
			expect(typeof result.data.date).toBe("string");
		}
	});

	it("accepts ART3 date with no modifiedDate (optional field)", () => {
		const result = blogSchema.safeParse({
			title: "T",
			description: "D",
			excerpt: "E",
			date: "2021-09-12T19:45:00",
			author: "A",
			thumbnail: { name: "ddd-diferente", alt: "a" },
			ogimage: { url: "/images/ddd-diferente-og.jpg", alt: "a" },
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.modifiedDate).toBeUndefined();
		}
	});

	it("rejects frontmatter missing required fields", () => {
		const result = blogSchema.safeParse({ title: "Only title" });
		expect(result.success).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// 2. getStaticPaths allow-list — exactly 3 slugs, correct filenames
// ---------------------------------------------------------------------------
describe("blog collection slug allow-list", () => {
	const EXPECTED_SLUGS = new Set([
		"totul-despre-dezinsectie",
		"cum-scapi-de-gandaci",
		"dezinfectie-dezinsectie-deratizare-diferente",
	]);

	it("src/content/blog/ contains exactly the 3 expected slugs and nothing else", () => {
		const blogDir = join(process.cwd(), "src", "content", "blog");
		const files = readdirSync(blogDir)
			.filter((f) => f.endsWith(".md"))
			.map((f) => f.replace(/\.md$/, ""));
		const fileSet = new Set(files);

		expect(fileSet.size).toBe(3);
		for (const slug of EXPECTED_SLUGS) {
			expect(fileSet.has(slug)).toBe(true);
		}
		// No extra slugs
		for (const slug of fileSet) {
			expect(EXPECTED_SLUGS.has(slug)).toBe(true);
		}
	});
});

// ---------------------------------------------------------------------------
// 3. formatDateRo helper
// ---------------------------------------------------------------------------
describe("formatDateRo", () => {
	it("formats ART1 date correctly", () => {
		expect(formatDateRo("2021-09-14T11:40:00")).toBe("14 Septembrie 2021 la ora 11:40");
	});

	it("formats ART2 date correctly", () => {
		expect(formatDateRo("2021-09-13T19:45:00")).toBe("13 Septembrie 2021 la ora 19:45");
	});

	it("formats ART3 date correctly", () => {
		expect(formatDateRo("2021-09-12T19:45:00")).toBe("12 Septembrie 2021 la ora 19:45");
	});

	it("handles a January date", () => {
		expect(formatDateRo("2022-01-05T08:30:00")).toBe("5 Ianuarie 2022 la ora 08:30");
	});

	it("handles a December date", () => {
		expect(formatDateRo("2021-12-31T23:59:00")).toBe("31 Decembrie 2021 la ora 23:59");
	});
});

// ---------------------------------------------------------------------------
// 4. readingTimeMinutes helper
// ---------------------------------------------------------------------------
describe("readingTimeMinutes", () => {
	// ART1 body has ~1279 words → round(1279/225) = round(5.68) = 6 min
	it("returns 6 min for ~1279 words", () => {
		const text = Array(1279).fill("cuvant").join(" ");
		expect(readingTimeMinutes(text)).toBe(6);
	});

	// ART2 body has ~1123 words → round(1123/225) = round(4.99) = 5 min
	it("returns 5 min for ~1123 words", () => {
		const text = Array(1123).fill("cuvant").join(" ");
		expect(readingTimeMinutes(text)).toBe(5);
	});

	// ART3 body has ~831 words → round(831/225) = round(3.69) = 4 min
	it("returns 4 min for ~831 words", () => {
		const text = Array(831).fill("cuvant").join(" ");
		expect(readingTimeMinutes(text)).toBe(4);
	});

	it("returns minimum 1 for empty string", () => {
		expect(readingTimeMinutes("")).toBe(1);
	});

	it("returns minimum 1 for a single word", () => {
		expect(readingTimeMinutes("cuvant")).toBe(1);
	});
});

// ---------------------------------------------------------------------------
// 5. wordCount helper
// ---------------------------------------------------------------------------
describe("wordCount", () => {
	it("counts words split by whitespace", () => {
		expect(wordCount("unu doi trei")).toBe(3);
	});

	it("returns 0 for empty string", () => {
		expect(wordCount("")).toBe(0);
	});

	it("ignores extra whitespace", () => {
		expect(wordCount("  unu  doi  ")).toBe(2);
	});
});
```

- [ ] **Step 2: Run failing test to confirm helper modules do not exist yet**

```
pnpm exec vitest run src/tests/content-collection.test.ts
```

Expected: FAIL — `Cannot find module '@utils/formatDate'` and `Cannot find module '@utils/readingTime'`

- [ ] **Step 3: Confirm the implementations from Tasks 3 and 4 are in place**

Verify `src/utils/formatDate.ts` and `src/utils/readingTime.ts` exist as written.

- [ ] **Step 4: Run test to verify all pass**

```
pnpm exec vitest run src/tests/content-collection.test.ts
```

Expected: All tests PASS. If the reading-time tests fail for the actual article bodies (i.e. the actual entry.body word counts do not round to 6/5/4), investigate: the legacy numbers (1279/1123/831) were for rendered HTML word count, not raw markdown. The actual markdown bodies may count slightly differently. Adjust the test to use the actual `entry.body` word count if needed, but confirm the final displayed values are 6/5/4 minutes by cross-checking against the baseline HTML (`parity/baseline/html/*/index.html` lines containing `Timp de citire estimat`).

- [ ] **Step 5: Commit helpers + tests together**

```
git add src/utils/formatDate.ts src/utils/readingTime.ts src/tests/content-collection.test.ts
git commit -m "feat(utils): add formatDateRo and readingTimeMinutes helpers with Vitest tests"
```

---

## Task 6: Create `src/pages/[slug].astro` — article template

**Files:**
- Create: `src/pages/[slug].astro`

**Context for implementer:** This is the most complex task. Read the baseline HTML at `parity/baseline/html/totul-despre-dezinsectie/index.html` and `parity/baseline/html/cum-scapi-de-gandaci/index.html` before writing this template. The task below gives transformation rules, not full re-typed HTML.

> **SPINE RECONCILIATION (the spine wins — see `docs/IMPLEMENTATION-PLAN.md` reconciliations + Task 29).** The example code below predates two locked decisions; apply these swaps when you write the file:
> 1. **`entry.id`, NOT `entry.slug`.** The collection uses the Astro v6 `glob()` loader, so the URL key is `entry.id` (and `prev.id`/`next.id`). Replace every `entry.slug`/`prev.slug`/`next.slug` below with `.id`. Sort/render via `import { getCollection, render } from "astro:content"`.
> 2. **BaseLayout/BaseHead prop names.** The locked `BaseLayout` interface (spine Task 20) is `{ title, description, canonical, ogImage, ogImageAlt, ogType?, articlePublishedTime?, articleModifiedTime?, analytics, bodyClass? }`. `og:title`/`og:description`/`og:url` are DERIVED inside BaseHead from `title`/`description`/`canonical` — do NOT pass `ogTitle`/`ogDescription`/`ogUrl`. Use `analytics={true}` (NOT `loadAnalytics`) and `articlePublishedTime`/`articleModifiedTime` (NOT `articlePublished`/`articleModified`). Drop the `ogTitle`/`ogDescription`/`ogUrl`/`loadAnalytics` lines from the `<BaseLayout>` invocation below.

**Source files to reference:**
- `parity/baseline/html/totul-despre-dezinsectie/index.html` — authoritative article body structure and microdata
- `parity/baseline/html/cum-scapi-de-gandaci/index.html` — confirms cum-scapi structure matches
- `parity/baseline/meta/totul-despre-dezinsectie.json` — baseline meta values
- `parity/baseline/meta/cum-scapi-de-gandaci.json` — baseline meta values
- `parity/baseline/meta/dezinfectie-dezinsectie-deratizare-diferente.json` — baseline meta values

**Preserve verbatim (class names, attributes, microdata — do NOT change):**
- `<article class="ArticleContainer" itemscope itemtype="https://schema.org/Article">` — outer wrapper
- `<section class="Hero" role="banner">` — hero section wrapper
- `<picture class="BigArticlePicture">` — hero picture element with exact `<source>` and `<img>` attributes (use `thumbnail.name` to build paths)
- `<img class="BigArticleImg" ... itemprop="image" loading="lazy" width="280" height="157">` — exact class, itemprop, lazy, dimensions
- `<ol class="Breadcrumbs" itemscope itemtype="https://schema.org/BreadcrumbList">` — breadcrumb list
- Each `<li class="BreadcrumbItem" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">` — exact microdata
- The breadcrumb link structure for item 2: `<a class="BreadcrumbLink" itemscope itemtype="https://schema.org/WebPage" itemprop="item" itemid="/informatii-utile/" href="/informatii-utile/">`
- `<div class="ArticlePreMeta">` — pre-meta block with date and reading time
- `<strong itemprop="datePublished" content="{date}">` — exact itemprop and content attribute
- `<p class="ScreenReaders" itemprop="wordCount">{wordCount}</p>` — screen-reader word count
- `<h1 class="BigArticleTitle" itemprop="headline">` — exact class and itemprop
- `<p class="ArticleAuthor">Articol scris de<strong itemprop="author">` — exact markup
- `<p class="BigArticleIntro">` — excerpt paragraph
- `<div class="ArticleBody" itemprop="articleBody">` — body wrapper with itemprop
- `<aside role="complementary">` — prev/next navigation wrapper
- `<nav class="BigArticleNav LimitWidth">` — nav inside aside
- `<ol class="BigArticleList">` — list of prev/next items
- `<li class="BigArticleItem BigArticlePrevious">` / `<li class="BigArticleItem BigArticleNext">` — exact classes per direction
- `<a class="BigArticleLink" href="{url}" title="Mergi la articolul precedent: {title}">` / `title="Mergi la articolul următor: {title}">`
- `<span class="BALstatus">Articolul precedent:</span>` / `<span class="BALstatus">Articolul următor:</span>`

**Approved fixes to APPLY (from SPEC §9 and WAIVERS):**
- `og:type` must be `"article"` on all three article routes (WAIVER-SEO-03). Pass `ogType="article"` to `BaseLayout`.
- `og:image` must be absolute (prepend `https://dedede.ro` to `ogimage.url`). Example: `"https://dedede.ro" + entry.data.ogimage.url` (WAIVER-SEO-02).
- DROP `<link rel="prev">` and `<link rel="next">` from `<head>` (WAIVER-SEO-05). Do NOT pass prev/next to `BaseLayout` for head emission.
- The visible `<aside>` prev/next navigation block MUST be retained (WAIVER-SEO-05 explicitly: "the visible prev/next `<aside>` navigation block in the article body is RETAINED").
- `twitter:site` and `twitter:creator` are NOT emitted (WAIVER-SEO-01) — handled by `BaseLayout` accepting no such props.

**Derived fields computed in `getStaticPaths` frontmatter:**

Chronological order (ascending by `date`):
1. `dezinfectie-dezinsectie-deratizare-diferente` — 2021-09-12 (oldest: prev=null, next=cum-scapi)
2. `cum-scapi-de-gandaci` — 2021-09-13 (prev=ddd-diferente, next=totul-despre)
3. `totul-despre-dezinsectie` — 2021-09-14 (newest: prev=cum-scapi, next=null)

**`body` class:** The live site sets `<body class="informatii-utile">` on all 3 article pages (confirmed in baseline HTML). Pass this to `BaseLayout`.

- [ ] **Step 1: Create `src/pages/[slug].astro`**

```astro
---
// src/pages/[slug].astro
import { getCollection, render } from "astro:content";
import type { CollectionEntry } from "astro:content";
import BaseLayout from "@layouts/BaseLayout.astro";
import { formatDateRo } from "@utils/formatDate";
import { readingTimeMinutes, wordCount as countWords } from "@utils/readingTime";

export async function getStaticPaths() {
	// Fetch all blog entries and sort chronologically ascending by date string.
	// date strings are bare ISO "YYYY-MM-DDTHH:MM:SS" — lexicographic sort is correct for same-TZ dates.
	const entries = await getCollection("blog");
	const sorted = [...entries].sort((a, b) => a.data.date.localeCompare(b.data.date));

	return sorted.map((entry, index) => {
		const prev: CollectionEntry<"blog"> | null = index > 0 ? (sorted[index - 1] ?? null) : null;
		const next: CollectionEntry<"blog"> | null = index < sorted.length - 1 ? (sorted[index + 1] ?? null) : null;

		return {
			params: { slug: entry.slug },
			props: { entry, prev, next },
		};
	});
}

interface Props {
	entry: CollectionEntry<"blog">;
	prev: CollectionEntry<"blog"> | null;
	next: CollectionEntry<"blog"> | null;
}

const { entry, prev, next } = Astro.props;
const { Content } = await render(entry);

const { title, description, date, author, thumbnail, ogimage, modifiedDate } = entry.data;
const excerpt = entry.data.excerpt;
// Derive the resolved modified date — absent in all current frontmatter, defaults to date
const resolvedModifiedDate = modifiedDate ?? date;

// Derive display values
const bodyText = entry.body;
const wc = countWords(bodyText);
const readTime = readingTimeMinutes(bodyText);
const displayDate = formatDateRo(date);

// Build absolute og:image (WAIVER-SEO-02: articles must have absolute og:image)
const absoluteOgImage = `https://dedede.ro${ogimage.url}`;

// Build hero picture paths from thumbnail.name
const heroDesktopWebp = `/images/${thumbnail.name}-desktop.webp`;
const heroMobileWebp = `/images/${thumbnail.name}-mobile.webp`;
const heroMobileJpg = `/images/${thumbnail.name}-mobile.jpg`;
---

<BaseLayout
	title={title}
	description={description}
	canonical={`https://dedede.ro/${entry.slug}/`}
	ogTitle={title}
	ogDescription={description}
	ogUrl={`https://dedede.ro/${entry.slug}/`}
	ogImage={absoluteOgImage}
	ogImageAlt={ogimage.alt}
	ogType="article"
	articlePublishedTime={date}
	articleModifiedTime={resolvedModifiedDate}
	bodyClass="informatii-utile"
	loadAnalytics={true}
>
	<article class="ArticleContainer" itemscope itemtype="https://schema.org/Article">
		<section class="Hero" role="banner">
			<picture class="BigArticlePicture">
				<source type="image/webp" srcset={heroDesktopWebp} media="(min-width: 850px)" />
				<source type="image/webp" srcset={heroMobileWebp} media="(min-width: 100px)" />
				<img
					class="BigArticleImg"
					src={heroMobileJpg}
					alt={thumbnail.alt}
					itemprop="image"
					loading="lazy"
					width="280"
					height="157"
				/>
			</picture>
		</section>
		<main class="BigArticle LimitWidth">
			<ol class="Breadcrumbs" itemscope itemtype="https://schema.org/BreadcrumbList">
				<li class="BreadcrumbItem" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
					<a class="BreadcrumbLink" itemprop="item" href="/">
						<span class="BreadcrumbText" itemprop="name">DeDeDe.ro</span>
					</a>
					<span class="ScreenReaders" itemprop="position">1</span>
				</li>
				<li class="BreadcrumbItem" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
					<a
						class="BreadcrumbLink"
						itemscope
						itemtype="https://schema.org/WebPage"
						itemprop="item"
						itemid="/informatii-utile/"
						href="/informatii-utile/"
					>
						<span class="BreadcrumbText" itemprop="name">Informații utile</span>
					</a>
					<span class="ScreenReaders" itemprop="position">2</span>
				</li>
				<li class="BreadcrumbItem" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
					<span class="BreadcrumbText" itemprop="name">{title}</span>
					<span class="ScreenReaders" itemprop="position">3</span>
				</li>
			</ol>
			<div class="ArticlePreMeta">
				<p>
					Articol scris pe <strong itemprop="datePublished" content={date}>
						<span>{displayDate}</span>
					</strong>
				</p>
				<p>
					Timp de citire estimat: <strong><span>{readTime}</span> min.</strong>
				</p>
				<p class="ScreenReaders" itemprop="wordCount">{wc}</p>
			</div>
			<h1 class="BigArticleTitle" itemprop="headline">{title}</h1>
			<p class="ArticleAuthor">Articol scris de<strong itemprop="author">{author}</strong></p>
			<p class="BigArticleIntro">{excerpt}</p>
			<div class="ArticleBody" itemprop="articleBody">
				<Content />
			</div>
		</main>
		<aside role="complementary">
			<nav class="BigArticleNav LimitWidth">
				<ol class="BigArticleList">
					{prev && (
						<li class="BigArticleItem BigArticlePrevious">
							<a
								class="BigArticleLink"
								href={`/${prev.slug}/`}
								title={`Mergi la articolul precedent: ${prev.data.title}`}
							>
								<span class="BALstatus">Articolul precedent:</span>
								<strong>{prev.data.title}</strong>
							</a>
						</li>
					)}
					{next && (
						<li class="BigArticleItem BigArticleNext">
							<a
								class="BigArticleLink"
								href={`/${next.slug}/`}
								title={`Mergi la articolul următor: ${next.data.title}`}
							>
								<span class="BALstatus">Articolul următor:</span>
								<strong>{next.data.title}</strong>
							</a>
						</li>
					)}
				</ol>
			</nav>
		</aside>
	</article>
</BaseLayout>
```

- [ ] **Step 2: Confirm `BaseLayout.astro` accepts the new props**

`BaseLayout.astro` must accept: `ogType`, `articlePublishedTime`, `articleModifiedTime`, `bodyClass`, `loadAnalytics`. If it does not yet exist or does not accept these props, it will be addressed in the base-layout task (Phase 4 plan `02-layout-components.md`). For this task: verify the props are declared in `BaseLayout`'s interface and that it emits `<meta name="og:type" content={ogType}>`, `<meta name="article:published_time" content={articlePublishedTime}>`, `<meta name="article:modified_time" content={articleModifiedTime}>`. If `BaseLayout` is not yet implemented, note the dependency and implement this task after the layout task.

- [ ] **Step 3: Run `astro check` to typecheck the file**

```
pnpm exec astro check
```

Expected: No type errors in `src/pages/[slug].astro`. If `astro:content` types are not yet generated, run `pnpm exec astro sync` first.

- [ ] **Step 4: Commit**

```
git add src/pages/[slug].astro
git commit -m "feat(pages): add [slug].astro article template with microdata, prev/next, hero picture, and §9 fixes"
```

---

## Task 7: Run full verify gate for the articles section

**Files:**
- No new files — validation pass

**Context for implementer:** Before declaring this section done, run the full `pnpm verify` chain and confirm all article-related gates pass. Then run the parity harness against `astro preview` for the three article routes.

- [ ] **Step 1: Run Vitest**

```
pnpm exec vitest run
```

Expected: all tests PASS including `src/tests/content-collection.test.ts`.

- [ ] **Step 2: Run ESLint on new files**

```
pnpm exec eslint src/content/config.ts src/utils/formatDate.ts src/utils/readingTime.ts src/pages/[slug].astro src/tests/content-collection.test.ts
```

Expected: no errors. Warnings about `no-console` or similar are acceptable but should be driven to zero.

- [ ] **Step 3: Run Prettier check**

```
pnpm exec prettier --check "src/content/**" "src/utils/formatDate.ts" "src/utils/readingTime.ts" "src/pages/[slug].astro" "src/tests/content-collection.test.ts"
```

Expected: no formatting issues.

- [ ] **Step 4: Run `astro build` to confirm the three article routes build successfully**

```
pnpm exec astro build
```

Expected: build completes; `dist/totul-despre-dezinsectie/index.html`, `dist/cum-scapi-de-gandaci/index.html`, `dist/dezinfectie-dezinsectie-deratizare-diferente/index.html` all exist.

- [ ] **Step 5: Verify heading IDs in built HTML**

After build, check that the article body headings in the built HTML files have the expected IDs (see Task 2 for the expected ID list). Quick check for ART1:

```
pnpm exec node -e "const fs = require('fs'); const html = fs.readFileSync('dist/totul-despre-dezinsectie/index.html', 'utf8'); const ids = [...html.matchAll(/id=\"([^\"]+)\"/g)].map(m => m[1]).filter(id => !['header','menuToggle','mainMenu','continut','darkMode','backTop','noScriptIframe','mask0'].includes(id) && !id.startsWith('/')); console.log(ids);"
```

Expected output includes: `ce-este-dezinsecția-și-de-ce-trebuie-făcută`, `când-trebuie-făcută-dezinsecția`, etc. If IDs differ from the baseline, investigate the Astro remark slug algorithm and add a rehype plugin if needed.

- [ ] **Step 6: Run parity harness visual diff for ART1**

```
node parity/tools/capture-baseline.mjs --base http://localhost:4321
node parity/tools/diff-screens.mjs --threshold 0.001
```

Expected: pixel diff `<= 0.1%` on all three article routes at mobile 375x812, tablet 768x1024, desktop 1440x900.

- [ ] **Step 7: Run meta diff for ART1**

Compare `dist/totul-despre-dezinsectie/index.html` head against `parity/baseline/meta/totul-despre-dezinsectie.json`. Expected deltas (all approved waivers, all others must match verbatim):

| Tag | Baseline value | Rebuilt value | Waiver |
|-----|---------------|---------------|--------|
| `og:type` | `website` | `article` | WAIVER-SEO-03 |
| `og:image` | `/images/totul-despre-dezinsectie-og.jpg` | `https://dedede.ro/images/totul-despre-dezinsectie-og.jpg` | WAIVER-SEO-02 |
| `twitter:site` | `@TODO` | absent | WAIVER-SEO-01 |
| `twitter:creator` | `@TODO` | absent | WAIVER-SEO-01 |
| `<link rel="prev">` | present in `<head>` | absent from `<head>` | WAIVER-SEO-05 |
| `<link rel="next">` | present in `<head>` | absent from `<head>` | WAIVER-SEO-05 |

All other meta tags (`title`, `description`, canonical, `og:title`, `og:description`, `og:url`, `og:image:alt`, `og:image:width`, `og:image:height`, `og:locale`, `og:site_name`, `og:email`, `og:phone_number`, `fb:app_id`, `article:publisher`, `article:published_time`, `article:modified_time`, `twitter:card`, theme-color, favicons, font preload) must be byte-identical to the baseline.

Repeat the meta diff check for ART2 and ART3 using their respective baseline files.

- [ ] **Step 8: Commit verification pass**

```
git add -A
git commit -m "test(parity): verify article routes ART1/ART2/ART3 pass visual + meta diff gates"
```

---

## Acceptance criteria summary

A route (ART1 / ART2 / ART3) is done when all of the following hold:

1. **Visual parity** — `<= 0.1%` pixel diff vs `parity/baseline/screenshots/{slug}__*.png` at all three viewports (mobile 375x812, tablet 768x1024, desktop 1440x900). No diff permitted outside the approved WAIVER-VISUAL-01 region (which only applies to the homepage, not articles).

2. **Meta parity** — all head tags match `parity/baseline/meta/{slug}.json` exactly, EXCEPT:
   - `og:type` = `article` (was `website`) — WAIVER-SEO-03
   - `og:image` is absolute (`https://dedede.ro` prefix) — WAIVER-SEO-02
   - `twitter:site` and `twitter:creator` are absent — WAIVER-SEO-01
   - `<link rel="prev">` and `<link rel="next">` absent from `<head>` — WAIVER-SEO-05

3. **Visible prev/next `<aside>` present** — the `<aside role="complementary">` navigation block with `BigArticleNav` / `BigArticleList` / `BigArticleItem BigArticlePrevious` / `BigArticleItem BigArticleNext` is present and links to the correct adjacent article URLs (WAIVER-SEO-05 explicitly retains the visible block).

4. **Article microdata present** — `<article itemscope itemtype="https://schema.org/Article">` and `<ol itemscope itemtype="https://schema.org/BreadcrumbList">` with all `itemprop` attributes and positions 1/2/3 matching the baseline.

5. **Heading IDs match** — rendered heading `id` attributes in `<div class="ArticleBody">` match those in `parity/baseline/html/{slug}/index.html`.

6. **Vitest green** — all tests in `src/tests/content-collection.test.ts` pass; particularly the slug allow-list test asserts exactly 3 slugs.

7. **`pnpm verify` green** — `astro check`, ESLint, Prettier, Vitest, Playwright all pass.

---

## Notes for implementer

- **`entry.body` vs rendered word count:** Astro exposes the raw markdown body as `entry.body`. The word count from the live site was computed from rendered HTML. Raw markdown bodies include heading markers (`##`, `###`, `####`), bold markers (`**`, `**`), and link syntax (`[text](url)`). These contribute a few extra "words" in the raw count. If the displayed reading times (6/5/4) are wrong, adjust the `wordCount` function to strip markdown syntax before counting: `text.replace(/[#*_\[\]()!`]/g, " ")`.

- **`getStaticPaths` and `getCollection`:** Astro's `getCollection('blog')` returns only entries from `src/content/blog/`. Since only 3 files exist there, the allow-list is structurally enforced by the filesystem. The Vitest test in Task 5 pins this at 3 files, which will fail the test suite if a 4th article is accidentally added.

- **`render` import:** In Astro 6 the function is `render` from `"astro:content"` (not `Astro.glob` or `getEntry`). The returned `Content` is a Svelte-like component rendered with `<Content />`.

- **`entry.slug` vs `entry.id`:** In Astro 6 content collections, `entry.slug` gives the filename without extension and without the collection prefix (e.g. `"totul-despre-dezinsectie"`). Use `entry.slug` for URL construction.

- **Trailing slash:** `href={\`/${entry.slug}/\`}` and `href={\`/${prev.slug}/\`}` — always append `/` to match `trailingSlash: 'always'` config.

- **`body class`:** baseline HTML shows `<body class="informatii-utile">` on all three article pages. Pass `bodyClass="informatii-utile"` to `BaseLayout`. This must match exactly.
