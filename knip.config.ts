// knip.config.ts
import type { KnipConfig } from "knip";

const config: KnipConfig = {
	entry: [
		// Astro framework entry points
		"astro.config.mjs",
		"src/content.config.ts",
		// All pages are entries (Astro's file-based routing)
		"src/pages/**/*.{astro,ts}",
		// All layouts and components used by pages
		"src/layouts/**/*.astro",
		"src/components/**/*.astro",
		// Utility helpers imported by pages/components
		"src/utils/**/*.ts",
		"src/lib/**/*.ts",
		// Test files
		"src/**/*.test.ts",
		"src/**/*.spec.ts",
		"src/tests/**/*.test.ts",
		"src/tests/**/*.spec.ts",
		// Config files that import deps
		"vitest.config.ts",
		"playwright.config.ts",
		"eslint.config.js",
		"commitlint.config.cjs",
		// Standalone CLI harness scripts (run via `node …` or pnpm scripts, not imported):
		// generate-og-image.mjs (WAIVER-ASSET-01), lh-compare.mjs (the Lighthouse
		// rebuilt-vs-baseline gate). lighthouserc.cjs is the @lhci/cli config consumed by
		// the `lhci` binary. All three are reachable entry points, not dead files.
		"scripts/**/*.mjs",
		"lighthouserc.cjs",
	],
	ignore: [
		// Parity tooling has its own package.json — not part of the project dep graph.
		"parity/**",
		// Legacy Elder.js source — being replaced, not tracked.
		"livesite/**",
		"tmp/**",
		// Build output
		"dist/**",
		".wrangler/**",
		// Astro-generated type declarations
		".astro/**",
	],
	ignoreDependencies: [
		// sass-embedded is consumed by Vite's css.preprocessorOptions — not a direct import.
		"sass-embedded",
		// sharp is used by astro:assets internals at build time, not imported directly.
		"sharp",
		// prettier-plugin-astro is referenced in .prettierrc (string), not a JS import.
		"prettier-plugin-astro",
		// @commitlint/config-conventional is referenced in commitlint.config.cjs extends array.
		"@commitlint/config-conventional",
		// wrangler is invoked as a CLI tool, not imported.
		"wrangler",
		// @lhci/cli is invoked as a CLI tool for the Lighthouse gate, not imported.
		"@lhci/cli",
		// @astrojs/check provides the `astro check` typecheck binary (the typecheck gate),
		// invoked via `astro check`, not imported.
		"@astrojs/check",
	],
};

export default config;
