// vitest.config.ts
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
	test: {
		// Pure Node environment — unit tests have no DOM access.
		// E2E (Playwright) handles DOM/browser behaviour separately.
		environment: "node",
		include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
		exclude: ["node_modules/**", "dist/**", "parity/**", "livesite/**", "tmp/**", "src/tests/e2e/**"],
		// Timeout per test in ms (generous for any async helpers).
		testTimeout: 10000,
		globals: false,
		reporters: ["verbose"],
		// Vitest 4 exits 1 on "no test files"; the scaffold gate must pass vacuously
		// until Group C/E add tests. Applies to both `pnpm test` and the run-verify
		// orchestrator's `vitest run`. [SUBSTITUTION recorded — appendix assumed
		// vitest's older exit-0 semantics.]
		passWithNoTests: true,
	},
	resolve: {
		alias: {
			// Mirror tsconfig.json paths so @utils/formatDate etc. resolve.
			"@components": resolve(__dirname, "src/components"),
			"@layouts": resolve(__dirname, "src/layouts"),
			"@lib": resolve(__dirname, "src/lib"),
			"@utils": resolve(__dirname, "src/utils"),
			"@content": resolve(__dirname, "src/content"),
			"@styles": resolve(__dirname, "src/styles"),
			"@img": resolve(__dirname, "src/img"),
		},
	},
});
