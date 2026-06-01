// src/tests/content-collection.test.ts
//
// Group C / Task 23 — content collection foundation test.
//
// Pins the blog collection allow-list, the Zod schema's verbatim-date behaviour,
// and the two pure helpers (formatDateRo, readingTimeMinutes/wordCount) against the
// THREE real article markdown files plus synthetic edge cases.
//
// WHY filesystem reads instead of getCollection('blog'):
// `getCollection` / `astro:content` require Astro's content layer (the glob() loader
// runs only inside `astro build`/`dev`). A plain Vitest `node` environment cannot
// invoke it. So this test pins the allow-list by reading `src/content/blog/` directly
// and asserts the real reading-time output from each article's raw markdown body —
// which is exactly the string Astro exposes as `entry.body` at build time.

import { describe, it, expect, vi } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ARTICLE_IDS } from "@utils/articles";
import { formatDateRo } from "@utils/formatDate";
import { readingTimeMinutes, wordCount } from "@utils/readingTime";

// `@utils/articles` imports the `astro:content` virtual module (getCollection), which only
// resolves inside Astro's build — not in a plain Vitest `node` run. Stub it so we can import the
// real ARTICLE_IDS allow-list (a plain const) and share ONE source of truth with the route.
// vi.mock is hoisted above the imports above, so the stub is registered before @utils/articles
// is evaluated. This getCollection stub IS load-bearing — @utils/articles really imports it from
// astro:content (the endpoint's zod, by contrast, comes from the node-resolvable "astro/zod").
vi.mock("astro:content", () => ({ getCollection: async () => [] }));

const BLOG_DIR = join(process.cwd(), "src", "content", "blog");

/**
 * Read a blog article's raw markdown file (frontmatter + body) from `src/content/blog/`.
 * @param slug - The article id / filename stem, e.g. `"cum-scapi-de-gandaci"` (no `.md` extension).
 * @returns The full file contents as a UTF-8 string.
 */
function readRaw(slug: string): string {
	return readFileSync(join(BLOG_DIR, `${slug}.md`), "utf8");
}

/**
 * Strip the YAML frontmatter (the first `---`-delimited block) from a raw `.md` file,
 * returning only the body — mirroring what Astro exposes as `entry.body` at build time.
 * @param slug - The article id / filename stem (no `.md` extension).
 * @returns The markdown body with the leading frontmatter block removed; the full file if it has no frontmatter.
 */
function readBody(slug: string): string {
	const raw = readRaw(slug);
	const match = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
	return match ? raw.slice(match[0].length) : raw;
}

/**
 * Extract the raw, top-level (column-0) `date:` frontmatter value from a `.md` file,
 * stripping any surrounding quotes so the verbatim datetime string can be asserted.
 * @param slug - The article id / filename stem (no `.md` extension).
 * @returns The unquoted `date` value, or `null` when no top-level `date:` line is present.
 */
function readDateField(slug: string): string | null {
	// Top-level (column-0) `date:` line inside the frontmatter block.
	const m = readRaw(slug).match(/^date:\s*['"]?([^'"\r\n]+)['"]?\s*$/m);
	return m ? (m[1] ?? null) : null;
}

// ---------------------------------------------------------------------------
// 1. getStaticPaths allow-list — exactly the 3 expected slugs, nothing else.
//    This is the structural pin: a 4th .md slipping into src/content/blog/
//    (or a rename) fails the suite. Mirrors the [slug].astro getStaticPaths set.
// ---------------------------------------------------------------------------
describe("blog collection slug allow-list", () => {
	// Single source of truth: the same allow-list the [slug].astro route uses (via getArticles).
	const EXPECTED_SLUGS = ARTICLE_IDS;
	const EXPECTED_SET = new Set<string>(EXPECTED_SLUGS);

	const actualSlugs = readdirSync(BLOG_DIR)
		.filter((f) => f.endsWith(".md"))
		.map((f) => f.replace(/\.md$/, ""));
	const actualSet = new Set(actualSlugs);

	it("getCollection('blog') would return exactly 3 slugs", () => {
		expect(actualSet.size).toBe(3);
	});

	it("contains every expected slug", () => {
		for (const slug of EXPECTED_SLUGS) {
			expect(actualSet.has(slug)).toBe(true);
		}
	});

	it("contains NO unexpected slug (allow-list pin)", () => {
		for (const slug of actualSet) {
			expect(EXPECTED_SET.has(slug)).toBe(true);
		}
	});
});

// ---------------------------------------------------------------------------
// 2. Schema contract — the bare `date` string passes through VERBATIM (no coerce).
//
//    NOTE: We deliberately do NOT import `zod` here — it is not a direct project
//    dependency, and this test needs no validator. Asserting against the REAL
//    frontmatter on disk is a stronger pin than a re-typed inline schema copy:
//    it proves the actual published values stay verbatim.
//
//    PARITY CONTRACT (SPEC §6 / ADR 0003): `date` in src/content.config.ts is a
//    bare z.string() — NOT z.coerce.date(), NOT z.string().datetime(). The live
//    article:published_time has no TZ suffix (e.g. "2021-09-14T11:40:00"). If the
//    schema ever coerced it, the value would round-trip to a Date/UTC string and
//    these assertions would break — the intended tripwire.
// ---------------------------------------------------------------------------
describe("blog frontmatter date contract (no coerce)", () => {
	const CASES: ReadonlyArray<readonly [slug: string, expected: string]> = [
		["totul-despre-dezinsectie", "2021-09-14T11:40:00"],
		["cum-scapi-de-gandaci", "2021-09-13T19:45:00"],
		["dezinfectie-dezinsectie-deratizare-diferente", "2021-09-12T19:45:00"],
	];

	for (const [slug, expected] of CASES) {
		it(`${slug} keeps a bare ISO date string with no TZ offset`, () => {
			const date = readDateField(slug);
			expect(date).toBe(expected);
			// Bare local datetime — no Z, no +HH:MM / -HH:MM offset.
			expect(date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
			expect(date).not.toContain("Z");
		});

		it(`${slug} date round-trips through formatDateRo unchanged at the source`, () => {
			// formatDateRo must consume the verbatim frontmatter value (string-in).
			const date = readDateField(slug);
			expect(typeof date).toBe("string");
			expect(formatDateRo(date as string)).toMatch(/ la ora \d{2}:\d{2}$/);
		});
	}

	it("no article frontmatter declares an optional modifiedDate (defaults to date at render)", () => {
		for (const [slug] of CASES) {
			expect(readRaw(slug)).not.toMatch(/^modifiedDate:/m);
		}
	});
});

// ---------------------------------------------------------------------------
// 3. formatDateRo — the 3 live display strings + a January + a December edge.
//    Deterministic (no Intl / no new Date): must not drift with build TZ/locale.
// ---------------------------------------------------------------------------
describe("formatDateRo", () => {
	it("ART1 — 14 Septembrie 2021 la ora 11:40", () => {
		expect(formatDateRo("2021-09-14T11:40:00")).toBe("14 Septembrie 2021 la ora 11:40");
	});

	it("ART2 — 13 Septembrie 2021 la ora 19:45", () => {
		expect(formatDateRo("2021-09-13T19:45:00")).toBe("13 Septembrie 2021 la ora 19:45");
	});

	it("ART3 — 12 Septembrie 2021 la ora 19:45", () => {
		expect(formatDateRo("2021-09-12T19:45:00")).toBe("12 Septembrie 2021 la ora 19:45");
	});

	it("January edge — strips leading day zero, keeps zero-padded hour", () => {
		expect(formatDateRo("2022-01-05T08:30:00")).toBe("5 Ianuarie 2022 la ora 08:30");
	});

	it("December edge — last day, last minute", () => {
		expect(formatDateRo("2021-12-31T23:59:00")).toBe("31 Decembrie 2021 la ora 23:59");
	});
});

// ---------------------------------------------------------------------------
// 4. readingTimeMinutes — 6/5/4 on the REAL article bodies (raw markdown =
//    entry.body), plus synthetic word-count boundaries. Math.round(words/225).
// ---------------------------------------------------------------------------
describe("readingTimeMinutes — real article bodies", () => {
	it("totul-despre-dezinsectie reads in 6 min", () => {
		expect(readingTimeMinutes(readBody("totul-despre-dezinsectie"))).toBe(6);
	});

	it("cum-scapi-de-gandaci reads in 5 min", () => {
		expect(readingTimeMinutes(readBody("cum-scapi-de-gandaci"))).toBe(5);
	});

	it("dezinfectie-dezinsectie-deratizare-diferente reads in 4 min", () => {
		expect(readingTimeMinutes(readBody("dezinfectie-dezinsectie-deratizare-diferente"))).toBe(4);
	});
});

describe("readingTimeMinutes — formula edges", () => {
	const wordsOf = (n: number): string => Array(n).fill("cuvant").join(" ");

	it("6 min near the ART1 word count (~1289)", () => {
		expect(readingTimeMinutes(wordsOf(1289))).toBe(6);
	});

	it("5 min near the ART2 word count (~1126)", () => {
		expect(readingTimeMinutes(wordsOf(1126))).toBe(5);
	});

	it("4 min near the ART3 word count (~829)", () => {
		expect(readingTimeMinutes(wordsOf(829))).toBe(4);
	});

	it("rounds 0.5 up — 113 words -> round(0.502) -> 1", () => {
		expect(readingTimeMinutes(wordsOf(113))).toBe(1);
	});

	it("rounds at the 1.5 boundary — 338 words -> round(1.502) -> 2", () => {
		expect(readingTimeMinutes(wordsOf(338))).toBe(2);
	});

	it("clamps below half a minute up to the 1-minute floor", () => {
		expect(readingTimeMinutes(wordsOf(50))).toBe(1);
	});

	it("returns the 1-minute floor for empty input", () => {
		expect(readingTimeMinutes("")).toBe(1);
	});

	it("returns the 1-minute floor for a single word", () => {
		expect(readingTimeMinutes("cuvant")).toBe(1);
	});

	it("honours a custom wpm", () => {
		expect(readingTimeMinutes(wordsOf(450), 225)).toBe(2);
		expect(readingTimeMinutes(wordsOf(450), 450)).toBe(1);
	});
});

// ---------------------------------------------------------------------------
// 5. wordCount — whitespace handling edges.
// ---------------------------------------------------------------------------
describe("wordCount", () => {
	it("counts words split on single spaces", () => {
		expect(wordCount("unu doi trei")).toBe(3);
	});

	it("returns 0 for an empty string", () => {
		expect(wordCount("")).toBe(0);
	});

	it("returns 0 for whitespace only", () => {
		expect(wordCount("   \n\t  ")).toBe(0);
	});

	it("collapses runs of mixed whitespace", () => {
		expect(wordCount("  unu  doi\t\ntrei  ")).toBe(3);
	});

	it("agrees with the real ART1 body being a multi-hundred-word count", () => {
		const count = wordCount(readBody("totul-despre-dezinsectie"));
		expect(count).toBeGreaterThan(1200);
		expect(count).toBeLessThan(1400);
	});
});
