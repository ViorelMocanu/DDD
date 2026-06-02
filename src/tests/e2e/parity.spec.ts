// src/tests/e2e/parity.spec.ts
//
// Accessibility parity guard — runs @axe-core/playwright on all 9 production routes
// and asserts ZERO serious/critical violations. This is the runtime counterpart to the
// one-shot parity/tools/axe-contrast.mjs probe (the home page contrast fix means the
// homepage is now clean). Tags + analytics-host blocking mirror that tool exactly.
//
// Runs on the desktop project only — axe results are viewport-independent for these
// WCAG checks and re-running the full sweep across 3 viewports would triple CI time
// with no added signal.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// The 9 routes that ship (matches the sitemap + the screenshot baseline set).
const ROUTES = ["/", "/contact/", "/informatii-utile/", "/termeni-si-conditii/", "/confidentialitate/", "/cookies/", "/dezinfectie-dezinsectie-deratizare-diferente/", "/cum-scapi-de-gandaci/", "/totul-despre-dezinsectie/"];

// Block third-party analytics/ads hosts (script.js injects GTM + gtag at runtime) so axe
// scores ONLY our markup, never a vendor iframe. Same regex as axe-contrast.mjs.
const BLOCK = /googletagmanager|google-analytics|analytics\.google|doubleclick|googleadservices|googlesyndication|cookiebot|connect\.facebook|facebook\.com/;

test.describe("accessibility parity (axe)", () => {
	// Run the sweep once, on the desktop project — axe WCAG results are viewport-
	// independent here, so re-running across 3 viewports adds time, not signal.
	test.beforeEach(({}, testInfo) => {
		test.skip(testInfo.project.name !== "desktop", "axe sweep runs once on desktop");
	});

	for (const route of ROUTES) {
		test(`no serious/critical axe violations on ${route}`, async ({ page }) => {
			await page.route("**/*", (r) => (BLOCK.test(r.request().url()) ? r.abort() : r.continue()));
			await page.goto(route, { waitUntil: "load" });
			await page.waitForLoadState("networkidle").catch(() => {});

			const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();

			const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
			// On failure, surface the offending rule ids + targets for a fast fix.
			const detail = serious.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`).join("\n");
			expect(serious, detail).toEqual([]);
		});
	}
});
