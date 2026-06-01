// src/utils/formatDate.ts

/** Romanian month names, 1-indexed (index 0 is unused). */
const RO_MONTHS: readonly string[] = ["", "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];

/**
 * Format a bare ISO-8601 datetime string (no timezone offset) into Romanian display format.
 *
 * Produces: "14 Septembrie 2021 la ora 11:40"
 * Matches the live site output from `DataCitibila.svelte`.
 *
 * IMPORTANT: The input is parsed by splitting on "T", "-", and ":" — not via `new Date()` —
 * to avoid timezone-dependent day/hour shifting in build environments.
 * @param isoString - Bare ISO datetime, e.g. "2021-09-14T11:40:00" (no TZ suffix).
 * @returns Romanian display string, e.g. "14 Septembrie 2021 la ora 11:40".
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

/**
 * Format a bare ISO-8601 datetime string into the short Romanian display format.
 *
 * Produces: "14 Sep 2021"
 * Matches the live site output from `DataCitibila.svelte` when called with `eScurta={true}`.
 * Used in article index cards (blog index + homepage article list).
 *
 * IMPORTANT: The input is parsed by splitting on "T" and "-" — not via `new Date()` —
 * to avoid timezone-dependent day shifting in build environments.
 * @param isoString - Bare ISO datetime, e.g. "2021-09-14T11:40:00" (no TZ suffix).
 * @returns Short Romanian display string, e.g. "14 Sep 2021".
 */
export function formatDateShort(isoString: string): string {
	const tIndex = isoString.indexOf("T");
	const datePart = tIndex >= 0 ? isoString.slice(0, tIndex) : isoString;

	const [yearStr, monthStr, dayStr] = datePart.split("-");

	const year = yearStr ?? "";
	const month = parseInt(monthStr ?? "1", 10);
	const day = parseInt(dayStr ?? "1", 10);

	const monthName = RO_MONTHS[month] ?? "";
	// Abbreviated 3-char form, matching DataCitibila.svelte: luna.substring(0, 3)
	const monthAbbr = monthName.substring(0, 3);

	return `${day} ${monthAbbr} ${year}`;
}
