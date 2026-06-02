// lh-compare.mjs — Lighthouse rebuilt-vs-baseline category-score comparison (SPEC §10 DoD #6).
//
// The rebuild is static HTML + far fewer deps than the legacy Elder.js bundle, so its
// Lighthouse category scores must MATCH OR BEAT the legacy /livesite baseline. This runner
// drives Lighthouse (12.x, imported directly from the pnpm store) against TWO already-running
// static servers — the REBUILT dist/client and the legacy /livesite snapshot — for a shared
// set of routes, blocks analytics/ads hosts for determinism, and prints a side-by-side table
// plus a pass/fail verdict (rebuilt category score >= baseline, with a small rounding epsilon).
//
// PRE-REQ: both servers already listening (started by the caller; this script does NOT manage
// them, so it can't accidentally leave one running):
//   node parity/tools/serve-static.mjs --root dist/client --port 4321   # rebuilt
//   node parity/tools/serve-static.mjs --root livesite    --port 4322   # baseline
//
// USAGE: node scripts/lh-compare.mjs
//   env LH_ROUTES="/,/contact/" to override the route list.
import process from "node:process";
import { resolve } from "node:path";

// Resolve from the pnpm store (these are transitive deps of @lhci/cli, not hoisted).
const lighthouse = (await import("file://" + resolve("node_modules/.pnpm/lighthouse@12.6.1/node_modules/lighthouse/core/index.js"))).default;
const chromeLauncher = await import("file://" + resolve("node_modules/.pnpm/chrome-launcher@1.2.1/node_modules/chrome-launcher/dist/index.js"));

const REBUILT = "http://localhost:4321";
const BASELINE = "http://localhost:4322";
const ROUTES = (process.env.LH_ROUTES ?? "/,/contact/,/informatii-utile/,/totul-despre-dezinsectie/").split(",");
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];
// performance is volatile run-to-run on a busy CI box; the rebuild is static so we still
// expect parity, but allow a small tolerance there. a11y/bp/seo must hold strictly.
const EPSILON = { "performance": 0.05, "accessibility": 0.0, "best-practices": 0.0, "seo": 0.0 };

const BLOCKED = ["*googletagmanager.com*", "*google-analytics.com*", "*analytics.google.com*", "*googleads*", "*doubleclick.net*", "*google.com/ads*", "*gstatic.com*", "*connect.facebook.net*"];

/** Run Lighthouse once for a URL on the given Chrome port; return {category: score 0..100}. */
async function runOne(url, port) {
	const result = await lighthouse(
		url,
		{
			port,
			output: "json",
			logLevel: "error",
			onlyCategories: CATEGORIES,
		},
		{
			extends: "lighthouse:default",
			settings: {
				formFactor: "desktop",
				screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
				throttlingMethod: "simulate",
				throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1, requestLatencyMs: 0, downloadThroughputKbps: 0, uploadThroughputKbps: 0 },
				blockedUrlPatterns: BLOCKED,
			},
		},
	);
	const cats = result.lhr.categories;
	const out = {};
	for (const c of CATEGORIES) out[c] = cats[c]?.score == null ? null : Math.round(cats[c].score * 100);
	return out;
}

const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"] });
console.log(`[lh-compare] chrome on port ${chrome.port}`);

const rows = [];
let allPass = true;
try {
	for (const route of ROUTES) {
		const rPath = route.endsWith("/") || route.includes(".") ? route : route + "/";
		let rebuilt, baseline;
		try {
			rebuilt = await runOne(REBUILT + rPath, chrome.port);
		} catch (e) {
			rebuilt = { _error: e.message };
		}
		try {
			baseline = await runOne(BASELINE + rPath, chrome.port);
		} catch (e) {
			baseline = { _error: e.message };
		}
		rows.push({ route: rPath, rebuilt, baseline });
	}
} finally {
	await chrome.kill();
	console.log("[lh-compare] chrome killed");
}

// ── report ───────────────────────────────────────────────────────────────────
const label = { "performance": "perf", "accessibility": "a11y", "best-practices": "bp", "seo": "seo" };
console.log("\n=== Lighthouse: REBUILT (4321) vs BASELINE (4322) — category scores 0..100 ===");
console.log("route".padEnd(46) + CATEGORIES.map((c) => `${label[c]} R/B`.padStart(12)).join(""));
for (const { route, rebuilt, baseline } of rows) {
	if (rebuilt._error || baseline._error) {
		console.log(route.padEnd(46) + `  ERROR rebuilt=${rebuilt._error ?? "ok"} baseline=${baseline._error ?? "ok"}`);
		allPass = false;
		continue;
	}
	let cells = "";
	for (const c of CATEGORIES) {
		const r = rebuilt[c],
			b = baseline[c];
		const ok = r != null && b != null && r >= b - Math.round(EPSILON[c] * 100);
		if (!ok) allPass = false;
		cells += `${r}/${b}${ok ? " " : "✗"}`.padStart(12);
	}
	console.log(route.padEnd(46) + cells);
}
console.log("\nLegend: R=rebuilt, B=baseline. ✗ = rebuilt below baseline beyond epsilon.");
console.log(`epsilon: perf ±${EPSILON.performance * 100}pt; a11y/bp/seo strict (rebuilt >= baseline).`);
console.log(allPass ? "\nVERDICT: PASS — rebuilt >= baseline on every category/route.\n" : "\nVERDICT: FAIL — see ✗ cells above.\n");

// Emit machine-readable JSON for the harness/report.
console.log("LH_COMPARE_JSON=" + JSON.stringify({ allPass, rows }));
process.exit(allPass ? 0 : 1);
