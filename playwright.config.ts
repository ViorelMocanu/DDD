import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

/** The parity suite needs the local copy of the live site, which is never committed. */
export const HAS_LEGACY_COPY = existsSync("_backup/live/public_html/index.html");
// Not Astro's default port (4321): a `pnpm dev` left running there would otherwise be tested in place of the fresh build.
export const REBUILD_URL = "http://localhost:4331";
export const LEGACY_URL = "http://localhost:4332";
const reuse = !process.env["CI"];

export default defineConfig({
	testDir: "tests",
	testMatch: ["e2e/**/*.spec.ts", "parity/**/*.spec.ts"],
	// One worker as a precaution: parallel runs pass most of the time but stalled now and then, and the cause was never found.
	workers: 1,
	forbidOnly: !!process.env["CI"],
	reporter: "list",
	use: { baseURL: REBUILD_URL, serviceWorkers: "block" },
	projects: [{ name: "chromium", use: devices["Desktop Chrome"] }],
	webServer: [{ command: `pnpm build && pnpm exec astro preview --port ${new URL(REBUILD_URL).port}`, url: `${REBUILD_URL}/`, reuseExistingServer: reuse, timeout: 120_000 }, ...(HAS_LEGACY_COPY ? [{ command: `node tests/parity/serve-legacy.mjs ${new URL(LEGACY_URL).port}`, url: `${LEGACY_URL}/robots.txt`, reuseExistingServer: reuse }] : [])],
});
