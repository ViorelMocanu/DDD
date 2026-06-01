import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";

/** The exact article ids that may produce a route — single source of truth (also used by tests). */
export const ARTICLE_IDS = ["dezinfectie-dezinsectie-deratizare-diferente", "cum-scapi-de-gandaci", "totul-despre-dezinsectie"] as const;

/**
 * Fetch blog articles from the `blog` content collection.
 *
 * With `enforce` left false the full collection is returned (used by the homepage and the
 * blog index). With `enforce` true the result is narrowed to the {@link ARTICLE_IDS}
 * allow-list — the exact set `[slug].astro`'s `getStaticPaths` is permitted to render — so
 * a stray `.md` file dropped into the collection cannot silently publish a new route.
 * @param enforce - When `true`, return only entries whose id is in {@link ARTICLE_IDS}; when `false`, return the whole collection.
 * @returns A promise resolving to the matching blog collection entries.
 */
export async function getArticles(enforce = false): Promise<CollectionEntry<"blog">[]> {
	return enforce ? getCollection("blog", (entry) => (ARTICLE_IDS as readonly string[]).includes(entry.id)) : getCollection("blog");
}

/**
 * Sort blog entries newest-first, descending by the bare-ISO `date` string.
 *
 * Powers the homepage and blog-index lists. The comparison is a lexicographic compare on
 * the verbatim `YYYY-MM-DDTHH:MM:SS` strings (no `Date` parsing), which is order-correct
 * for this fixed-width format and stays timezone-independent. Returns a new array; the
 * input is not mutated.
 * @param articles - The blog entries to sort.
 * @returns A new array ordered newest-first.
 */
export function sortNewestFirst(articles: CollectionEntry<"blog">[]): CollectionEntry<"blog">[] {
	return [...articles].sort((a, b) => b.data.date.localeCompare(a.data.date));
}

/**
 * Sort blog entries oldest-first, ascending by the bare-ISO `date` string.
 *
 * Used to build the article-detail previous/next chaining. Like {@link sortNewestFirst} it
 * compares the verbatim date strings and returns a new array without mutating the input.
 * @param articles - The blog entries to sort.
 * @returns A new array ordered oldest-first.
 */
export function sortOldestFirst(articles: CollectionEntry<"blog">[]): CollectionEntry<"blog">[] {
	return [...articles].sort((a, b) => a.data.date.localeCompare(b.data.date));
}
