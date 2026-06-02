// src/tests/unit/blocked-hosts.test.ts
//
// Locks the security-hardened BLOCK_REGEX (parity/tools/blocked-hosts.mjs) against the CodeQL
// findings it was rewritten to resolve:
//   • js/incomplete-hostname-regexp — an unescaped `.` acted as a wildcard, matching look-alike
//     hosts and the blocked name appearing anywhere in the URL.
//   • js/incomplete-sanitization   — `.replace(/\./g, "\\.")` escaped only dots, not every metachar.
//
// The matcher is now anchored to the URL host with all metacharacters escaped. These cases pin
// the should-block / must-not-block contract (including Google's regional adservice domains) so a
// future edit cannot silently regress blocking or re-introduce the over-match.

import { describe, it, expect } from "vitest";
import { BLOCK_REGEX, BLOCKED_HOSTS, BLOCKED_HOST_PREFIXES } from "../../../parity/tools/blocked-hosts.mjs";

describe("BLOCK_REGEX — blocks analytics / ads / consent hosts", () => {
	const SHOULD_BLOCK = [
		"https://www.googletagmanager.com/gtag/js?id=G-XXXX",
		"https://google-analytics.com/collect",
		"https://www.google-analytics.com/g/collect",
		"https://analytics.google.com/g/collect",
		"https://stats.g.doubleclick.net/j/collect", // deep subdomain
		"https://googleadservices.com/pagead/conversion.js",
		"https://www.googlesyndication.com/pagead/js/adsbygoogle.js",
		"https://cookiebot.com/uc.js",
		"https://consent.cookiebot.com/uc.js",
		"https://consentcdn.cookiebot.com/consentconfig",
		"https://connect.facebook.net/en_US/fbevents.js",
		"https://www.facebook.com/tr/",
		"https://facebook.com/tr", // bare apex host
		"https://script.hotjar.com/modules.js",
		"https://www.clarity.ms/tag/abc",
		"http://facebook.com/tr", // http scheme too
		"https://facebook.com", // host only, no path
		"https://facebook.com:443/tr", // explicit port
		"https://FACEBOOK.COM/tr", // case-insensitive (URL hosts are)
		"https://facebook.com./tr/", // trailing-dot FQDN (RFC 1123) — the dot ends the host
		"https://www.googletagmanager.com./gtag/js", // trailing-dot FQDN with a subdomain
	];

	it.each(SHOULD_BLOCK)("blocks %s", (url: string) => {
		expect(BLOCK_REGEX.test(url)).toBe(true);
	});

	// Google ad-service runs on regional TLDs — every variant must stay blocked (the original
	// `"adservice.google."` substring entry covered these, and the rewrite must not lose them).
	const ADSERVICE_REGIONAL = ["https://adservice.google.com/pagead/id", "https://adservice.google.ro/pagead/id", "https://adservice.google.de/pagead/id", "https://adservice.google.co.uk/pagead/id", "https://www.adservice.google.com/pagead/id", "https://adservice.google.com./pagead/id"];

	it.each(ADSERVICE_REGIONAL)("blocks regional adservice %s", (url: string) => {
		expect(BLOCK_REGEX.test(url)).toBe(true);
	});
});

describe("BLOCK_REGEX — does NOT over-match (CodeQL hardening)", () => {
	const SHOULD_NOT_BLOCK = [
		"https://example.com/?ref=facebook.com", // blocked name only in the query string
		"https://example.com/facebook.com/page", // ...only in the path
		"https://notfacebook.com/tr", // look-alike host (substring of a real one)
		"https://facebook.com.evil.com/", // suffix-spoof: subdomain of evil.com — the trailing-dot allowance must NOT terminate the host here
		"https://my-doubleclick.net.evil.com/", // another suffix-spoof
		"https://google-analytics-com.evil.com/", // dot-as-wildcard guard (hyphen, not dot)
		"https://dedede.ro/contact/", // the site under test itself
		"https://fonts.googleapis.com/css2", // fonts are deliberately allowed
		"https://www.google.com/recaptcha/api.js", // base google / recaptcha allowed
		"data:text/html,facebook.com", // non-http scheme
	];

	it.each(SHOULD_NOT_BLOCK)("allows %s", (url: string) => {
		expect(BLOCK_REGEX.test(url)).toBe(false);
	});
});

describe("blocked-hosts data integrity", () => {
	it("exports a non-empty exact-host list plus the adservice regional prefix", () => {
		expect(BLOCKED_HOSTS.length).toBeGreaterThan(0);
		expect(BLOCKED_HOST_PREFIXES).toContain("adservice.google.");
	});
});
