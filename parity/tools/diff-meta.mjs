// diff-meta.mjs — SEO/head-metadata parity check (DoD criterion 4).
// Merges each route's name=/property= meta into one key->value map for BASELINE vs AFTER,
// then reports differences and classifies each as an APPROVED WAIVER or a REGRESSION.
// Usage: node diff-meta.mjs --a parity/baseline/meta --b parity/baseline/_validate/groupF/meta
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i].replace(/^--/, ""), process.argv[i + 1]);
const A = resolve(args.get("a") ?? "parity/baseline/meta");
const B = resolve(args.get("b") ?? "parity/baseline/_validate/groupF/meta");

const load = (dir, f) => JSON.parse(readFileSync(join(dir, f), "utf8"));
const tags = (m) => ({ ...(m.metaProperty || {}), ...(m.metaName || {}) }); // name wins ties
const ARTICLES = new Set(["totul-despre-dezinsectie", "cum-scapi-de-gandaci", "dezinfectie-dezinsectie-deratizare-diferente"]);

/** Classify an expected (waived) change. Returns a waiver id or null (=regression). */
function waiver(route, key, base, after) {
	// WAIVER-SEO-01: @TODO twitter handles removed on every route.
	if ((key === "twitter:site" || key === "twitter:creator") && base === "@TODO" && after === undefined) return "SEO-01";
	// WAIVER-SEO-02: article og:image becomes absolute.
	if (key === "og:image" && ARTICLES.has(route) && base?.startsWith("/") && after === `https://dedede.ro${base}`) return "SEO-02";
	// WAIVER-SEO-03: article og:type website -> article.
	if (key === "og:type" && ARTICLES.has(route) && base === "website" && after === "article") return "SEO-03";
	return null;
}

const files = readdirSync(A).filter((f) => f.endsWith(".json"));
let regressions = 0;
let waived = 0;
for (const f of files) {
	const route = f.replace(/\.json$/, "");
	const ba = tags(load(A, f));
	const af = tags(load(B, f));
	const baseObj = load(A, f);
	const afObj = load(B, f);
	const lines = [];
	// title / canonical / htmlLang
	for (const k of ["title", "canonical", "htmlLang"]) {
		if (baseObj[k] !== afObj[k]) lines.push({ key: k, base: baseObj[k], after: afObj[k], w: null });
	}
	const keys = new Set([...Object.keys(ba), ...Object.keys(af)]);
	for (const k of keys) {
		if (ba[k] === af[k]) continue;
		lines.push({ key: k, base: ba[k], after: af[k], w: waiver(route, k, ba[k], af[k]) });
	}
	if (lines.length) {
		console.log(`\n## ${route}`);
		for (const l of lines) {
			const tag = l.w ? `WAIVER-${l.w}` : "REGRESSION";
			if (l.w) waived++;
			else regressions++;
			console.log(`  [${tag}] ${l.key}: ${JSON.stringify(l.base)} -> ${JSON.stringify(l.after)}`);
		}
	}
}
console.log(`\n===== META PARITY: ${regressions} regression(s), ${waived} approved-waiver change(s) across ${files.length} routes =====`);
process.exit(regressions === 0 ? 0 : 1);
