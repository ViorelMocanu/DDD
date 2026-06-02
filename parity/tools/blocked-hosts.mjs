// Single source of truth for the analytics / ads / consent hosts the parity harness ABORTS
// during capture so screenshots, axe runs, and layout measurements are deterministic. Fonts,
// CDNs, and recaptcha are deliberately NOT blocked (they affect layout and must load faithfully).
//
// Imported by the Playwright-route tools: capture-baseline.mjs, axe-contrast.mjs, measure-sections.mjs.
// (scripts/lh-compare.mjs keeps its own Lighthouse `blockedUrlPatterns` glob list — different syntax
// and a deliberately different intent, e.g. it also blocks gstatic fonts for stable perf scores.)

/**
 * Exact hosts to block, together with every subdomain of each one — e.g. `facebook.com`
 * also blocks `www.facebook.com` and `connect.facebook.com`. Order is irrelevant.
 * @type {readonly string[]}
 */
export const BLOCKED_HOSTS = ["googletagmanager.com", "google-analytics.com", "analytics.google.com", "doubleclick.net", "googleadservices.com", "googlesyndication.com", "cookiebot.com", "consentcdn.cookiebot.com", "connect.facebook.net", "facebook.com", "hotjar.com", "clarity.ms"];

/**
 * Host PREFIXES blocked across every regional TLD. Google's ad-service runs on country
 * domains (`adservice.google.com`, `adservice.google.ro`, `adservice.google.de`, …), so it is
 * matched as `adservice.google.` followed by any TLD rather than a single fixed host.
 * @type {readonly string[]}
 */
export const BLOCKED_HOST_PREFIXES = ["adservice.google."];

/**
 * Escape a literal string so EVERY RegExp metacharacter (including the backslash itself) is
 * matched verbatim. Without this, an unescaped `.` would act as a wildcard — matching
 * look-alike hosts such as `google-analyticsXcom` — which is the CodeQL hostname-regex finding.
 * @param {string} s - The literal text to embed inside a RegExp.
 * @returns {string} The input with all RegExp metacharacters backslash-escaped.
 */
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Alternation matching a blocked host exactly (the leading `(?:[^/?#@]+\.)?` allows any subdomain).
const exactAlternation = BLOCKED_HOSTS.map(escapeRegExp).join("|");
// Alternation matching a blocked prefix followed by one or more TLD labels (regional adservice).
const prefixAlternation = BLOCKED_HOST_PREFIXES.map((p) => `${escapeRegExp(p)}[a-z][a-z.]*`).join("|");

/**
 * Anchored matcher for `context.route` / response predicates — `BLOCK_REGEX.test(url)`.
 *
 * Matches an http(s) URL whose HOST is one of {@link BLOCKED_HOSTS} (or a subdomain of it), or
 * whose host begins with one of {@link BLOCKED_HOST_PREFIXES} (regional adservice). Every dot is
 * escaped and the host is bounded by the start of the authority and a host terminator — an
 * optional trailing dot (FQDN form, e.g. `facebook.com.`), then `:` port, `/` `?` `#`, or end of
 * string — so a blocked name appearing only inside a path or query, or a look-alike host such as
 * `notfacebook.com` / `facebook.com.evil.com`, is NOT matched. The trailing dot is allowed only
 * when it actually ends the host (a following label, as in the `.evil.com` spoof, still fails to
 * match). The match is case-insensitive because URL hosts are.
 * @type {RegExp}
 */
export const BLOCK_REGEX = new RegExp(String.raw`^https?:\/\/(?:[^\/?#@]+\.)?(?:${exactAlternation}|${prefixAlternation})\.?(?::\d+)?(?:[\/?#]|$)`, "i");
