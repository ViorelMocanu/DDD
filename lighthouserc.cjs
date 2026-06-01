"use strict";
// lighthouserc.cjs — @lhci/cli config for the "Lighthouse ≥ live" gate (SPEC §10 DoD #6).
//
// IMPORTANT: this project uses the @astrojs/cloudflare *Workers* adapter, so
// `astro preview` / `pnpm preview` does NOT work (it errors). The built static HTML
// lives in `dist/client/`; we serve it with the zero-dep static server used by the
// parity harness, exactly as the screenshot/axe gates do:
//
//   pnpm build
//   node parity/tools/serve-static.mjs --root dist/client --port 4321   # background
//   pnpm exec lhci autorun --config=lighthouserc.cjs
//   # then kill the server (Windows locks dist/)
//
// For the rebuilt-vs-baseline COMPARISON (rebuilt must score >= the legacy /livesite
// baseline) use the dedicated runner which drives Lighthouse against BOTH servers and
// asserts category-score parity:  `node scripts/lh-compare.mjs`.
//
// This lhci config is the single-target "recommended floor" harness (rebuilt site only).
module.exports = {
	ci: {
		collect: {
			// serve-static (NOT astro preview) serves the built dist/client on 4321.
			// The server is started/stopped by the caller; lhci just collects.
			url: ["http://localhost:4321/", "http://localhost:4321/contact/", "http://localhost:4321/informatii-utile/", "http://localhost:4321/totul-despre-dezinsectie/", "http://localhost:4321/cum-scapi-de-gandaci/", "http://localhost:4321/dezinfectie-dezinsectie-deratizare-diferente/", "http://localhost:4321/termeni-si-conditii/", "http://localhost:4321/confidentialitate/", "http://localhost:4321/cookies/"],
			numberOfRuns: 1,
			settings: {
				preset: "desktop",
				// Deterministic capture: block analytics/ads/consent hosts (matches parity policy).
				blockedUrlPatterns: ["*googletagmanager.com*", "*google-analytics.com*", "*analytics.google.com*", "*googleads*", "*doubleclick.net*", "*google.com/ads*", "*gstatic.com*"],
				chromeFlags: "--no-sandbox --headless=new",
			},
		},
		assert: {
			// Interim floor so the gate is meaningful and invocable. The authoritative
			// gate is the rebuilt-vs-baseline comparison in scripts/lh-compare.mjs.
			preset: "lighthouse:recommended",
		},
		upload: {
			// Local filesystem only — no LHCI server in scope.
			target: "filesystem",
			outputDir: "./.lighthouseci",
		},
	},
};
