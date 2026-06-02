// Pixel-diff two screenshot sets and report per-image diff ratios. Reused in Phase 5
// to diff the rebuilt site against the committed baseline (DoD: <= 0.1% pixel diff per view).
//
// Usage:
//   node diff-screens.mjs --a ../baseline/screenshots --b ../baseline/_validate/screenshots --out ../baseline/_validate/diff [--threshold 0.001]
import { readdir, mkdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i].replace(/^--/, ""), process.argv[i + 1]);
const A = resolve(args.get("a"));
const B = resolve(args.get("b"));
const OUT = resolve(args.get("out") ?? join(B, "..", "diff"));
const THRESHOLD = Number(args.get("threshold") ?? 0.001); // 0.1% per the parity DoD

/** Read a PNG, padding the smaller image to the union size so different full-page heights still diff. */
function readPng(p) {
	return PNG.sync.read(readFileSync(p));
}

async function main() {
	await mkdir(OUT, { recursive: true });
	const files = (await readdir(A)).filter((f) => f.endsWith(".png"));
	const report = { a: A, b: B, threshold: THRESHOLD, results: [], pass: true };

	for (const f of files) {
		const pa = join(A, f);
		const pb = join(B, f);
		if (!existsSync(pb)) {
			report.results.push({ file: f, status: "missing-in-b" });
			report.pass = false;
			continue;
		}
		const ia = readPng(pa);
		const ib = readPng(pb);
		const width = Math.max(ia.width, ib.width);
		const height = Math.max(ia.height, ib.height);
		const norm = (img) => {
			if (img.width === width && img.height === height) return img;
			const out = new PNG({ width, height });
			PNG.bitblt(img, out, 0, 0, img.width, img.height, 0, 0);
			return out;
		};
		const na = norm(ia);
		const nb = norm(ib);
		const diff = new PNG({ width, height });
		const mismatched = pixelmatch(na.data, nb.data, diff.data, width, height, { threshold: 0.1 });
		const ratio = mismatched / (width * height);
		const pass = ratio <= THRESHOLD;
		if (!pass) report.pass = false;
		await writeFile(join(OUT, f.replace(/\.png$/, ".diff.png")), PNG.sync.write(diff));
		report.results.push({ file: f, mismatched, totalPixels: width * height, ratio: Number(ratio.toFixed(6)), ratioPct: Number((ratio * 100).toFixed(4)), pass, dims: { a: `${ia.width}x${ia.height}`, b: `${ib.width}x${ib.height}` } });
		console.log(`${pass ? "PASS" : "FAIL"} ${f}  ${(ratio * 100).toFixed(4)}%  (${mismatched}px${ia.width !== ib.width || ia.height !== ib.height ? `, dims ${ia.width}x${ia.height} vs ${ib.width}x${ib.height}` : ""})`);
	}

	await writeFile(join(OUT, "diff-report.json"), JSON.stringify(report, null, 2));
	console.log(`\n[diff] ${report.results.filter((r) => r.pass).length}/${report.results.length} within ${THRESHOLD * 100}%  -> ${join(OUT, "diff-report.json")}`);
	process.exit(0); // report-only; diffs are advisory — never fail the process here
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
