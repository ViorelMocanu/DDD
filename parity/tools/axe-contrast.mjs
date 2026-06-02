// Focused axe probe: dump the FULL color-contrast violation detail (fg/bg/ratio/element)
// for one route, so we can fix the exact failing element. Usage: node axe-contrast.mjs <url>
import { AxeBuilder } from "@axe-core/playwright";
import { launchBrowser, newBlockedPage, waitForPageReady } from "./playwright-harness.mjs";

const url = process.argv[2] ?? "http://localhost:4330/";
const browser = await launchBrowser();
const { page } = await newBlockedPage(browser, { width: 1440, height: 900 }, { deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: "load", timeout: 45000 });
await waitForPageReady(page, { timeout: 12000, settle: 300 });
const res = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
for (const v of res.violations) {
	console.log(`\n## ${v.id} (${v.impact}) — ${v.help}`);
	for (const n of v.nodes) {
		console.log("  target:", n.target.join(" "));
		console.log("  summary:", (n.failureSummary || "").replace(/\n/g, " | "));
		for (const c of [...(n.any || []), ...(n.all || [])]) {
			if (c.data) console.log("  data:", JSON.stringify(c.data));
		}
	}
}
console.log(`\nTOTAL violations: ${res.violations.length}`);
await browser.close();
