// Deterministic parity capture: screenshots (3 viewports) + head-metadata + network
// manifest + axe a11y + perf metrics, per route. Analytics/consent/ads hosts are
// BLOCKED so the captured pixels are stable and reproducible (the consent banner and
// GTM are verified functionally in E2E, not pixel-diffed).
//
// This same script is re-run in Phase 5 against the Astro dev server (--base http://localhost:4321)
// to produce the "after" set that is diffed against this baseline.
//
// Usage:
//   node capture-baseline.mjs --base http://localhost:4321 --out ../baseline --label baseline
//   node capture-baseline.mjs --base https://dedede.ro --out ../baseline/_validate --label live --only index,contact
import { AxeBuilder } from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { BLOCK_REGEX } from "./blocked-hosts.mjs";
import { launchBrowser, newBlockedPage, waitForPageReady } from "./playwright-harness.mjs";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i].replace(/^--/, ""), process.argv[i + 1]);
const BASE = (args.get("base") ?? "http://localhost:4321").replace(/\/$/, "");
const OUT = resolve(args.get("out") ?? "../baseline");
const LABEL = args.get("label") ?? "baseline";
const ONLY = args.get("only") ? new Set(args.get("only").split(",")) : null;

// route name -> URL path (must match the live trailing-slash convention exactly).
const ROUTES = [
	{ name: "index", path: "/" },
	{ name: "contact", path: "/contact/" },
	{ name: "informatii-utile", path: "/informatii-utile/" },
	{ name: "termeni-si-conditii", path: "/termeni-si-conditii/" },
	{ name: "confidentialitate", path: "/confidentialitate/" },
	{ name: "cookies", path: "/cookies/" },
	{ name: "totul-despre-dezinsectie", path: "/totul-despre-dezinsectie/" },
	{ name: "cum-scapi-de-gandaci", path: "/cum-scapi-de-gandaci/" },
	{ name: "dezinfectie-dezinsectie-deratizare-diferente", path: "/dezinfectie-dezinsectie-deratizare-diferente/" },
];

const VIEWPORTS = [
	{ name: "mobile", width: 375, height: 812 },
	{ name: "tablet", width: 768, height: 1024 },
	{ name: "desktop", width: 1440, height: 900 },
];
const RICH_VP = "desktop"; // the single viewport that also collects network + head metadata + perf + axe

// Analytics/ads/consent hosts to abort (so layout/pixels stay deterministic): see ./blocked-hosts.mjs.

// Injected before any page script: kill animation/transition non-determinism.
const STABILIZE_CSS = `*,*::before,*::after{transition:none!important;animation:none!important;animation-duration:0s!important;scroll-behavior:auto!important;caret-color:transparent!important}html{scroll-behavior:auto!important}`;

/** Extract head metadata + structured data from the live DOM. */
function extractMeta() {
	const pick = (sel, attr) => Array.from(document.querySelectorAll(sel)).map((el) => el.getAttribute(attr));
	const metaBy = (key, val) =>
		Array.from(document.querySelectorAll("meta"))
			.filter((m) => (m.getAttribute(key) ?? "").length)
			.reduce((acc, m) => {
				acc[m.getAttribute(key)] = m.getAttribute(val ?? "content");
				return acc;
			}, {});
	const links = Array.from(document.querySelectorAll("link[rel]")).map((l) => ({ rel: l.getAttribute("rel"), href: l.getAttribute("href"), hreflang: l.getAttribute("hreflang"), type: l.getAttribute("type"), sizes: l.getAttribute("sizes") }));
	const jsonld = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((s) => {
		try {
			return JSON.parse(s.textContent);
		} catch {
			return { __unparseable: s.textContent?.slice(0, 200) };
		}
	});
	return {
		title: document.title,
		htmlLang: document.documentElement.getAttribute("lang"),
		canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null,
		metaName: metaBy("name"),
		metaProperty: metaBy("property"),
		metaHttpEquiv: metaBy("http-equiv"),
		links,
		jsonld,
		h1: Array.from(document.querySelectorAll("h1")).map((h) => h.textContent?.trim()),
		headingOutline: Array.from(document.querySelectorAll("h1,h2,h3")).map((h) => `${h.tagName}: ${h.textContent?.trim()?.slice(0, 90)}`),
		imgCount: document.querySelectorAll("img").length,
		imgMissingAlt: Array.from(document.querySelectorAll("img")).filter((i) => !i.hasAttribute("alt")).length,
		formCount: document.querySelectorAll("form").length,
		scriptSrcs: pick("script[src]", "src"),
	};
}

/** Capture a single viewport for a route. Rich extraction (network + head metadata + perf + axe) runs only when isRich. */
async function captureViewport(browser, route, vp, isRich) {
	let blocked = 0,
		allowed = 0;
	const network = [];
	const { context, page } = await newBlockedPage(browser, vp, {
		ignoreHTTPSErrors: true,
		onRoute: (b) => (b ? blocked++ : allowed++),
	});
	try {
		// Capture network only once (rich pass) to avoid 3x duplication.
		if (isRich) {
			page.on("response", (resp) => {
				const u = resp.url();
				if (BLOCK_REGEX.test(u)) return;
				network.push({ url: u, status: resp.status(), type: resp.request().resourceType() });
			});
		}
		await page.addInitScript((css) => {
			const s = document.createElement("style");
			s.textContent = css;
			document.documentElement.appendChild(s);
		}, STABILIZE_CSS);

		const url = BASE + route.path;
		await page.goto(url, { waitUntil: "load", timeout: 45000 });
		await waitForPageReady(page);

		const shot = join(OUT, "screenshots", `${route.name}__${vp.name}.png`);
		await page.screenshot({ path: shot, fullPage: true, animations: "disabled", caret: "hide" });
		const dims = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, scrollH: document.documentElement.scrollHeight }));
		const viewport = { width: vp.width, height: vp.height, fullHeight: dims.scrollH, screenshot: `screenshots/${route.name}__${vp.name}.png` };

		// Rich per-route extraction once, on the rich viewport.
		let a11y = null;
		if (isRich) {
			const meta = await page.evaluate(extractMeta);
			await writeFile(join(OUT, "meta", `${route.name}.json`), JSON.stringify(meta, null, 2));

			const perf = await page.evaluate(() => {
				const nav = performance.getEntriesByType("navigation")[0];
				const paints = performance.getEntriesByType("paint").reduce((a, p) => ((a[p.name] = Math.round(p.startTime)), a), {});
				return { domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : null, loadEvent: nav ? Math.round(nav.loadEventEnd) : null, transferSize: nav?.transferSize ?? null, paints, resourceCount: performance.getEntriesByType("resource").length };
			});
			await writeFile(join(OUT, "perf", `${route.name}.json`), JSON.stringify(perf, null, 2));

			try {
				const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
				const slim = { url, violations: axe.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, targets: v.nodes.slice(0, 5).map((n) => n.target.join(" ")) })), violationCount: axe.violations.length, serious: axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical").length, passes: axe.passes.length, incomplete: axe.incomplete.length };
				await writeFile(join(OUT, "a11y", `${route.name}.json`), JSON.stringify(slim, null, 2));
				a11y = { violations: slim.violationCount, serious: slim.serious };
			} catch (e) {
				a11y = { error: String(e).slice(0, 160) };
			}
		}

		return { viewport, blocked, allowed, network, a11y };
	} finally {
		await context.close();
	}
}

async function main() {
	await mkdir(join(OUT, "screenshots"), { recursive: true });
	await mkdir(join(OUT, "meta"), { recursive: true });
	await mkdir(join(OUT, "assets"), { recursive: true });
	await mkdir(join(OUT, "a11y"), { recursive: true });
	await mkdir(join(OUT, "perf"), { recursive: true });

	const browser = await launchBrowser();
	const summary = { label: LABEL, base: BASE, capturedAt: new Date().toISOString(), routes: [] };

	for (const route of ROUTES) {
		if (ONLY && !ONLY.has(route.name)) continue;
		const rec = { name: route.name, path: route.path, viewports: {}, blockedRequests: 0, allowedRequests: 0 };
		let network = [];

		try {
		for (const vp of VIEWPORTS) {
			const isRich = vp.name === RICH_VP;
			const r = await captureViewport(browser, route, vp, isRich);
			rec.viewports[vp.name] = r.viewport;
			rec.blockedRequests += r.blocked;
			rec.allowedRequests += r.allowed;
			if (isRich) {
				rec.a11y = r.a11y;
				network = r.network;
			}
		}

		network.sort((a, b) => a.url.localeCompare(b.url));
		const thirdParty = [...new Set(network.map((n) => new URL(n.url).host))].filter((h) => !h.includes("localhost") && !h.includes("dedede.ro"));
		await writeFile(join(OUT, "assets", `${route.name}.network.json`), JSON.stringify({ url: BASE + route.path, requestCount: network.length, thirdPartyHosts: thirdParty, requests: network }, null, 2));
		rec.requestCount = network.length;
		rec.thirdPartyHosts = thirdParty;
		summary.routes.push(rec);
		console.log(`[capture] ${route.name}: ${Object.keys(rec.viewports).length} shots, ${network.length} reqs, blocked ${rec.blockedRequests}, a11y ${JSON.stringify(rec.a11y ?? {})}`);
		} catch (err) {
			rec.error = String(err).split("\n")[0];
			summary.routes.push(rec);
			console.log(`[capture] ${route.name}: FAILED — ${rec.error}`);
		}
	}

	await browser.close();
	await writeFile(join(OUT, `capture-summary.${LABEL}.json`), JSON.stringify(summary, null, 2));
	console.log(`\n[capture] DONE -> ${OUT}\\capture-summary.${LABEL}.json`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
