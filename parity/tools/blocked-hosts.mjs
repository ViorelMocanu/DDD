// Single source of truth for the analytics / ads / consent hosts the parity harness ABORTS
// during capture so screenshots, axe runs, and layout measurements are deterministic. Fonts,
// CDNs, and recaptcha are deliberately NOT blocked (they affect layout and must load faithfully).
//
// Imported by the Playwright-route tools: capture-baseline.mjs, axe-contrast.mjs, measure-sections.mjs.
// (scripts/lh-compare.mjs keeps its own Lighthouse `blockedUrlPatterns` glob list — different syntax
// and a deliberately different intent, e.g. it also blocks gstatic fonts for stable perf scores.)
export const BLOCKED_HOSTS = ["googletagmanager.com", "google-analytics.com", "analytics.google.com", "doubleclick.net", "googleadservices.com", "googlesyndication.com", "adservice.google.", "cookiebot.com", "consentcdn.cookiebot.com", "connect.facebook.net", "facebook.com", "hotjar.com", "clarity.ms"];

/** Combined regex for `context.route` predicates — `BLOCK_REGEX.test(url)`. */
export const BLOCK_REGEX = new RegExp(BLOCKED_HOSTS.map((h) => h.replace(/\./g, "\\.")).join("|"));
