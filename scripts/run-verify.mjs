#!/usr/bin/env node
/**
 * run-verify.mjs — quality-gate orchestrator for the dedede.ro Astro rebuild.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE
 *   node scripts/run-verify.mjs verify        # check-only (CI + pre-PR gate)
 *   node scripts/run-verify.mjs verify:fix    # auto-fix where safe, then check
 *
 * In Phase 4 (Astro scaffold), package.json will wire these as:
 *   "scripts": {
 *     "verify":     "node scripts/run-verify.mjs verify",
 *     "verify:fix": "node scripts/run-verify.mjs verify:fix"
 *   }
 * so the human runs `pnpm verify` / `pnpm verify:fix`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * GATES (run strictly IN ORDER; fail-fast on the first CONFIGURED failure):
 *   1. format     — prettier --check   (verify:fix → prettier --write first)
 *   2. lint       — eslint .           (verify:fix → eslint --fix first)
 *   3. typecheck  — astro check, else tsc --noEmit
 *   4. unit       — vitest run
 *   5. e2e        — playwright test
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY DEFENSIVE
 *   This script is committed in Phase 0, BEFORE the Astro project exists. None of
 *   the tools above are installed yet and none of their configs exist. Each gate
 *   therefore self-detects whether (a) its binary is present in node_modules and
 *   (b) at least one of its config files exists. If either is missing the gate
 *   prints "SKIPPED (not configured yet — Phase 4)" and execution continues.
 *
 *   The process exits non-zero ONLY when a gate that IS configured actually
 *   fails. A run where every gate is skipped exits 0 — that is the expected
 *   Phase 0 behaviour and must never be treated as a failure.
 *
 *   No bashisms: we resolve binaries ourselves. On POSIX we spawn them directly
 *   (shell:false); on Windows the .bin entries are .cmd shims that Node 24 will
 *   not spawn with shell:false (EINVAL), so there we route through cmd.exe
 *   (shell:true) with fixed, non-user args. Runs identically on Windows, macOS, Linux.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { dirname, join, resolve } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import process from "node:process";
import { spawn } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const NODE_MODULES = join(ROOT, "node_modules");
const BIN_DIR = join(NODE_MODULES, ".bin");
const IS_WINDOWS = process.platform === "win32";

// ── tiny logging helpers (ANSI, but degrade gracefully if NO_COLOR is set) ──
const useColor = !process.env.NO_COLOR;
const paint = (code, s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
const bold = (s) => paint("1", s);
const green = (s) => paint("32", s);
const yellow = (s) => paint("33", s);
const red = (s) => paint("31", s);
const cyan = (s) => paint("36", s);
const dim = (s) => paint("2", s);

/**
 * Resolve a locally-installed CLI binary by name.
 * On Windows the executable shim is `<name>.cmd`/`<name>.CMD`; elsewhere it is
 * the extension-less `<name>`. Returns the absolute path if found, else null.
 */
function resolveBin(name) {
	const candidates = IS_WINDOWS ? [join(BIN_DIR, `${name}.cmd`), join(BIN_DIR, `${name}.CMD`), join(BIN_DIR, name)] : [join(BIN_DIR, name)];
	for (const candidate of candidates) {
		if (existsSync(candidate)) return candidate;
	}
	return null;
}

/** True if the named package directory exists under node_modules. */
function packageInstalled(pkg) {
	return existsSync(join(NODE_MODULES, ...pkg.split("/")));
}

/** True if ANY of the supplied config paths (relative to ROOT) exists. */
function anyConfigExists(relPaths) {
	return relPaths.some((p) => existsSync(join(ROOT, p)));
}

/**
 * Spawn a command and resolve with its exit code.
 * - On Windows the `node_modules/.bin` CLIs are `.cmd`/`.CMD` shims, and Node >= 20
 *   refuses to spawn those with shell:false (errno EINVAL — the CVE-2024-27980
 *   mitigation). So on win32 we route through cmd.exe via shell:true; the command
 *   and args here are fixed gate definitions, never user input. Elsewhere we keep
 *   shell:false and spawn the extension-less shim directly.
 * - stdio:'inherit' so the user sees live tool output.
 */
function run(command, args) {
	return new Promise((resolvePromise) => {
		// On Windows route through cmd.exe (shell:true) so the `.cmd` shim runs; fold
		// the fixed, space-free gate args into the command string so Node does not emit
		// DEP0190 (it cannot escape an args array under shell:true). On POSIX spawn the
		// extension-less bin directly with shell:false.
		const useShell = IS_WINDOWS;
		const child = spawn(useShell ? `"${command}" ${args.join(" ")}` : command, useShell ? [] : args, {
			cwd: ROOT,
			stdio: "inherit",
			shell: useShell,
			windowsHide: true,
		});
		child.on("error", (err) => {
			console.error(red(`  ✗ failed to launch: ${err.message}`));
			resolvePromise(1);
		});
		child.on("close", (code) => resolvePromise(code ?? 1));
	});
}

// ── argv / mode ─────────────────────────────────────────────────────────────
const RAW_MODE = process.argv[2] ?? "verify";
const MODE = RAW_MODE.toLowerCase();
if (MODE !== "verify" && MODE !== "verify:fix") {
	console.error(red(`Unknown mode "${RAW_MODE}". Use "verify" or "verify:fix".`));
	process.exit(2);
}
const FIX = MODE === "verify:fix";

/**
 * Gate definitions, executed in array order.
 *
 * Each gate declares:
 *   - id / title:   human-facing labels
 *   - bin:          CLI name to resolve under node_modules/.bin
 *   - pkg:          package dir to confirm under node_modules (defaults to bin)
 *   - configs:      config files; at least one must exist for the gate to run
 *                   (empty array ⇒ no config file is required)
 *   - checkArgs:    args for `verify` (and the verify step of `verify:fix`)
 *   - fixArgs:      optional args run FIRST under `verify:fix` (auto-fix pass)
 *   - resolve():    optional override returning a full gate plan at runtime
 *                   (used by typecheck to choose astro check vs tsc)
 */
const GATES = [
	{
		id: "format",
		title: "Format (prettier)",
		bin: "prettier",
		configs: [".prettierrc", ".prettierrc.json", ".prettierrc.js", ".prettierrc.cjs", ".prettierrc.mjs", ".prettierrc.yaml", ".prettierrc.yml", "prettier.config.js", "prettier.config.cjs", "prettier.config.mjs"],
		fixArgs: ["--write", "."],
		checkArgs: ["--check", "."],
	},
	{
		id: "lint",
		title: "Lint (eslint)",
		bin: "eslint",
		configs: ["eslint.config.js", "eslint.config.mjs", "eslint.config.cjs", "eslint.config.ts", ".eslintrc.js", ".eslintrc.cjs", ".eslintrc.json", ".eslintrc.yaml", ".eslintrc.yml"],
		fixArgs: [".", "--fix"],
		checkArgs: ["."],
	},
	{
		id: "typecheck",
		title: "Typecheck (astro check / tsc)",
		// Resolved dynamically: prefer `astro check` when the Astro project is
		// present, otherwise fall back to `tsc --noEmit`. Skipped entirely if
		// neither toolchain plus a tsconfig is available.
		resolve() {
			const hasTsconfig = anyConfigExists(["tsconfig.json"]);
			if (!hasTsconfig) {
				return { skip: true, reason: "no tsconfig.json" };
			}
			const astroBin = resolveBin("astro");
			if (astroBin && packageInstalled("astro")) {
				return { skip: false, bin: astroBin, label: "astro", checkArgs: ["check"], fixArgs: null };
			}
			const tscBin = resolveBin("tsc");
			if (tscBin && packageInstalled("typescript")) {
				return { skip: false, bin: tscBin, label: "tsc", checkArgs: ["--noEmit"], fixArgs: null };
			}
			return { skip: true, reason: "neither astro nor tsc installed" };
		},
	},
	{
		id: "unit",
		title: "Unit tests (vitest)",
		bin: "vitest",
		configs: ["vitest.config.ts", "vitest.config.js", "vitest.config.mjs", "vitest.config.cjs", "vite.config.ts", "vite.config.js", "vite.config.mjs", "astro.config.mjs", "astro.config.ts"],
		fixArgs: null,
		checkArgs: ["run"],
	},
	{
		id: "e2e",
		title: "E2E + visual + a11y (playwright)",
		bin: "playwright",
		pkg: "@playwright/test",
		configs: ["playwright.config.ts", "playwright.config.js", "playwright.config.mjs", "playwright.config.cjs"],
		fixArgs: null,
		checkArgs: ["test"],
	},
];

// ── runner ──────────────────────────────────────────────────────────────────
const results = []; // { id, title, status: 'pass'|'fail'|'skip', detail }

console.log(bold(cyan(`\n▶ run-verify — mode: ${MODE}`)));
console.log(dim(`  root: ${ROOT}`));
console.log(dim(`  platform: ${process.platform} | node: ${process.version}\n`));

let hadFailure = false;

for (const gate of GATES) {
	const label = bold(gate.title);

	// Dynamically-resolved gates (typecheck) compute their own plan.
	let plan = null;
	if (typeof gate.resolve === "function") {
		plan = gate.resolve();
		if (plan.skip) {
			console.log(`${yellow("●")} ${label}`);
			console.log(yellow(`  SKIPPED (not configured yet — Phase 4): ${plan.reason}`));
			console.log("");
			results.push({ id: gate.id, title: gate.title, status: "skip", detail: plan.reason });
			continue;
		}
	}

	// Static gates: confirm binary + package + config presence.
	if (!plan) {
		const binPath = resolveBin(gate.bin);
		const pkgName = gate.pkg ?? gate.bin;
		const binMissing = !binPath || !packageInstalled(pkgName);
		const needsConfig = Array.isArray(gate.configs) && gate.configs.length > 0;
		const configMissing = needsConfig && !anyConfigExists(gate.configs);

		if (binMissing || configMissing) {
			const why = binMissing ? `binary "${gate.bin}" not installed` : `no config file found (${gate.configs.slice(0, 3).join(", ")}…)`;
			console.log(`${yellow("●")} ${label}`);
			console.log(yellow(`  SKIPPED (not configured yet — Phase 4): ${why}`));
			console.log("");
			results.push({ id: gate.id, title: gate.title, status: "skip", detail: why });
			continue;
		}
		plan = { bin: binPath, label: gate.bin, checkArgs: gate.checkArgs, fixArgs: gate.fixArgs };
	}

	// ── execute the gate ──────────────────────────────────────────────────
	console.log(`${cyan("●")} ${label}`);

	// verify:fix → run the auto-fix pass first (if this gate has one).
	if (FIX && plan.fixArgs) {
		console.log(dim(`  $ ${plan.label} ${plan.fixArgs.join(" ")}`));
		const fixCode = await run(plan.bin, plan.fixArgs);
		if (fixCode !== 0) {
			console.log(red(`  ✗ FAIL (fix pass exited ${fixCode})\n`));
			results.push({ id: gate.id, title: gate.title, status: "fail", detail: `fix pass exit ${fixCode}` });
			hadFailure = true;
			break; // fail-fast
		}
	}

	console.log(dim(`  $ ${plan.label} ${plan.checkArgs.join(" ")}`));
	const code = await run(plan.bin, plan.checkArgs);
	if (code === 0) {
		console.log(green(`  ✓ PASS\n`));
		results.push({ id: gate.id, title: gate.title, status: "pass", detail: "" });
	} else {
		console.log(red(`  ✗ FAIL (exit ${code})\n`));
		results.push({ id: gate.id, title: gate.title, status: "fail", detail: `exit ${code}` });
		hadFailure = true;
		break; // fail-fast: stop at the first configured failure
	}
}

// ── summary ─────────────────────────────────────────────────────────────────
console.log(bold("─".repeat(60)));
console.log(bold("  Gate summary"));
console.log(bold("─".repeat(60)));
for (const r of results) {
	const tag = r.status === "pass" ? green("PASS") : r.status === "fail" ? red("FAIL") : yellow("SKIP");
	const detail = r.detail ? dim(`  (${r.detail})`) : "";
	console.log(`  ${tag}  ${r.title}${detail}`);
}
// Any gate after a fail-fast break never ran — show them as "not run".
const ran = new Set(results.map((r) => r.id));
for (const gate of GATES) {
	if (!ran.has(gate.id)) {
		console.log(`  ${dim("····")}  ${gate.title} ${dim("(not run — earlier gate failed)")}`);
	}
}
console.log(bold("─".repeat(60)));

const passCount = results.filter((r) => r.status === "pass").length;
const skipCount = results.filter((r) => r.status === "skip").length;
const failCount = results.filter((r) => r.status === "fail").length;

if (hadFailure) {
	console.log(red(bold(`\n✗ verify FAILED — ${failCount} gate(s) failed, ${passCount} passed, ${skipCount} skipped.\n`)));
	process.exit(1);
}

if (passCount === 0) {
	console.log(yellow(bold(`\n● verify PASSED vacuously — all ${skipCount} gate(s) skipped (Phase 0; tools not scaffolded yet).\n`)));
} else {
	console.log(green(bold(`\n✓ verify PASSED — ${passCount} gate(s) passed, ${skipCount} skipped.\n`)));
}
process.exit(0);
