// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "src/tests/e2e",
	// Each test file gets a fresh browser context.
	fullyParallel: true,
	// Fail the run on any test.only left in CI.
	forbidOnly: !!process.env.CI,
	// Retry once to absorb cold-start / load flake (the dev target is the single-threaded
	// zero-dep static server, so an occasional first-navigation timeout under burst load is
	// not a real failure — one retry makes the suite deterministic).
	retries: 1,
	// Cap workers in BOTH environments. The site is served by the single-threaded
	// parity/tools/serve-static.mjs; Playwright's unbounded auto-detect (one worker per
	// core) launches a burst of simultaneous browser navigations that starves that server
	// and produces spurious `page.goto` timeouts. Two workers keep the suite parallel while
	// staying within what the static server can serve without contention. (CI was already
	// capped; this extends the same cap to local `pnpm verify`.)
	workers: 2,
	reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
	use: {
		// The built static site is served on 4321 (see webServer below).
		baseURL: "http://localhost:4321",
		// Capture screenshot on failure for debugging.
		screenshot: "only-on-failure",
		// Short timeout for actions — this is a brochure site with fast page loads.
		actionTimeout: 5000,
		navigationTimeout: 15000,
		// No trace on first run; trace on retry to keep CI artefact size small.
		trace: "on-first-retry",
	},
	// `astro preview` does NOT work with @astrojs/cloudflare (it errors), so we cannot
	// use `pnpm preview`. Instead: build the static output, then serve dist/client with
	// the zero-dependency static server (parity/tools/serve-static.mjs) — the same server
	// the parity harness uses, with index.html + trailing-slash resolution that mirrors
	// the production nginx/Worker host. NOTE: the /api/contact Worker route is SSR-only
	// (prerender=false) so it is NOT emitted to dist/client/ and returns 404 here — the
	// contact E2E mocks it via page.route('**/api/contact', ...).
	webServer: {
		command: "pnpm build && node parity/tools/serve-static.mjs --root dist/client --port 4321",
		url: "http://localhost:4321",
		// Reuse a running server in local dev to avoid rebuilding every run.
		reuseExistingServer: !process.env.CI,
		// Generous timeout: a cold `pnpm build` plus server boot can take well over a minute.
		timeout: 180000,
	},
	projects: [
		// ── Mobile (375×812 — iPhone SE-class) ──────────────────────────────
		// The iPhone/iPad device presets default to the WebKit engine. We pin
		// `browserName: "chromium"` so the whole suite runs on a single installed
		// engine (matching the Chromium-based screenshot/axe parity harness) — these
		// functional behaviours are not engine-specific, and this avoids requiring a
		// separate WebKit download in CI. The mobile viewport + touch flags are kept.
		{
			name: "mobile",
			use: {
				...devices["iPhone SE"],
				browserName: "chromium",
				viewport: { width: 375, height: 812 },
			},
		},
		// ── Tablet (768×1024 — iPad-class) ──────────────────────────────────
		{
			name: "tablet",
			use: {
				...devices["iPad (gen 7)"],
				browserName: "chromium",
				viewport: { width: 768, height: 1024 },
			},
		},
		// ── Desktop (1440×900) ───────────────────────────────────────────────
		{
			name: "desktop",
			use: {
				...devices["Desktop Chrome"],
				viewport: { width: 1440, height: 900 },
			},
		},
	],
});
