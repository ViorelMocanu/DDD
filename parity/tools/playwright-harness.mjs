// Shared Playwright scaffolding for the parity-capture tools: launch a Chromium page with the
// analytics/ads/consent hosts blocked (deterministic captures), and a standard "page is ready" wait.
import { chromium } from "playwright";
import { BLOCK_REGEX } from "./blocked-hosts.mjs";

/** Launch a Chromium browser. Caller is responsible for browser.close(). */
export function launchBrowser() {
	return chromium.launch();
}

/**
 * Open a fresh blocked context+page on an existing browser.
 * @param browser  a Playwright Browser from launchBrowser()
 * @param viewport { width, height }
 * @param opts     { deviceScaleFactor=1, reducedMotion="reduce", ignoreHTTPSErrors=false, onRoute?(blocked:boolean) }
 *                 onRoute is invoked per request (true = aborted/blocked) so callers can count.
 * @returns { context, page }
 */
export async function newBlockedPage(browser, viewport, opts = {}) {
	const context = await browser.newContext({
		viewport: { width: viewport.width, height: viewport.height },
		deviceScaleFactor: opts.deviceScaleFactor ?? 1,
		reducedMotion: opts.reducedMotion ?? "reduce",
		...(opts.ignoreHTTPSErrors ? { ignoreHTTPSErrors: true } : {}),
	});
	await context.route("**/*", (route) => {
		const blocked = BLOCK_REGEX.test(route.request().url());
		opts.onRoute?.(blocked);
		return blocked ? route.abort() : route.continue();
	});
	const page = await context.newPage();
	return { context, page };
}

/** Standard determinism wait: networkidle (best-effort) + fonts.ready + a short settle. */
export async function waitForPageReady(page, opts = {}) {
	await page.waitForLoadState("networkidle", { timeout: opts.timeout ?? 15000 }).catch(() => {});
	await page.evaluate(() => document.fonts?.ready).catch(() => {});
	await page.waitForTimeout(opts.settle ?? 400);
}
