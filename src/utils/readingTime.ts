// src/utils/readingTime.ts

/**
 * Estimate reading time in minutes from article body text.
 *
 * Uses the same formula as the legacy TimpCitire.svelte: Math.round(wordCount / 225).
 * Minimum return value is 1 minute.
 * @param text - Raw article body text (markdown or plain text).
 * @param wpm - Words-per-minute reading speed (legacy parity value; defaults to 225).
 * @returns Whole-minute reading-time estimate (always at least 1).
 */
export function readingTimeMinutes(text: string, wpm = 225): number {
	return Math.max(1, Math.round(wordCount(text) / wpm));
}

/**
 * Count words in article body text.
 * @param text - Raw article body text (markdown or plain text).
 * @returns Total word count (whitespace-delimited, non-empty tokens).
 */
export function wordCount(text: string): number {
	return text.trim().split(/\s+/).filter(Boolean).length;
}
