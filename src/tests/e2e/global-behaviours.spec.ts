// src/tests/e2e/global-behaviours.spec.ts
//
// Functional E2E for the four global, JS-driven behaviours wired up in
// public/resources/script.js + the DeHeader/DeFooter markup + the BaseLayout
// no-flash inline script. These are DoD criterion 3 (functional E2E).
//
// Behaviours under test (exact contract read from script.js):
//   1. Hamburger nav (#menuToggle) toggles the `Active` class on #header. A
//      matchMedia('(min-width:850px)') change handler removes `Active` when the
//      viewport crosses INTO desktop width.
//   2. Dark-mode toggle (#darkMode) flips localStorage `darkMode` ('enabled' |
//      'disabled') and the `darkmode`/`lightmode` classes on <body>. The value
//      PERSISTS across reload, and the BaseLayout inline <head> script applies the
//      class to <html> BEFORE first paint (no flash).
//   3. Back-to-top button (#backTop) visibility is driven by an IntersectionObserver
//      on .Hero: while the Hero (+1500px bottom rootMargin) is on screen, body has
//      `HideBackTop` (button hidden); once scrolled far past it, the class is removed
//      (button visible).
//
// We assert the *state machine* (classes / localStorage), not pixels — parity of the
// rendered pixels is already covered by the screenshot harness.
import { test, expect, type Page } from "@playwright/test";

// script.js is loaded with `defer`, so it runs after the document is parsed but is
// guaranteed to have executed by the `load` event. It attaches its listeners +
// observers at parse time (not wrapped in DOMContentLoaded). We wait for `load` and
// for the toggle button to be ATTACHED (it is display:none above 850px, so we must
// NOT assert visibility) to confirm the markup + script are in place.
/**
 * Wait until `script.js` has executed and its global controls are attached to the DOM.
 *
 * Asserts the hamburger toggle (`#menuToggle`) and dark-mode toggle (`#darkMode`) are
 * attached (present in the DOM) rather than visible, since the hamburger is `display:none`
 * above 850px. See the note above for why `load` (not `DOMContentLoaded`) is the readiness signal.
 * @param page - The Playwright page under test.
 * @returns A promise that resolves once both controls are attached to the DOM.
 */
async function waitForScript(page: Page): Promise<void> {
	await page.waitForLoadState("load");
	await expect(page.locator("#menuToggle")).toBeAttached();
	await expect(page.locator("#darkMode")).toBeAttached();
}

test.describe("hamburger navigation", () => {
	test("opens and closes on mobile via #menuToggle", async ({ page }, testInfo) => {
		// The hamburger is only the interactive nav affordance below 850px. On the
		// tablet (768) and mobile (375) projects it is shown; on desktop (1440) the
		// full menu is laid out and the auto-close path is what matters instead.
		test.skip(testInfo.project.name === "desktop", "hamburger is a sub-850px affordance");

		await page.goto("/");
		await waitForScript(page);

		const header = page.locator("#header");
		// Starts closed.
		await expect(header).not.toHaveClass(/\bActive\b/);

		// Open.
		await page.locator("#menuToggle").click();
		await expect(header).toHaveClass(/\bActive\b/);

		// Close (toggle off).
		await page.locator("#menuToggle").click();
		await expect(header).not.toHaveClass(/\bActive\b/);
	});

	test("auto-closes when the viewport is resized up to desktop", async ({ page }, testInfo) => {
		// Only meaningful for a project that starts below the 850px breakpoint; the
		// desktop project is already past it so there is no transition to observe.
		test.skip(testInfo.project.name === "desktop", "no sub-850 -> desktop transition on the desktop project");

		await page.goto("/");
		await waitForScript(page);

		const header = page.locator("#header");
		// Open the menu while narrow.
		await page.locator("#menuToggle").click();
		await expect(header).toHaveClass(/\bActive\b/);

		// Cross the 850px breakpoint -> the matchMedia change handler strips `Active`.
		await page.setViewportSize({ width: 1200, height: 900 });
		await expect(header).not.toHaveClass(/\bActive\b/);
	});
});

test.describe("dark-mode toggle", () => {
	test("flips the theme, persists across reload, and applies with no flash", async ({ page }) => {
		await page.goto("/");
		await waitForScript(page);

		const body = page.locator("body");
		const toggle = page.locator("#darkMode");

		// Default (no stored preference): body is NOT in darkmode.
		await expect(body).not.toHaveClass(/\bdarkmode\b/);
		expect(await page.evaluate(() => localStorage.getItem("darkMode"))).toBeNull();

		// Click -> enable dark mode. Class lands on <body>, localStorage = 'enabled'.
		await toggle.click();
		await expect(body).toHaveClass(/\bdarkmode\b/);
		expect(await page.evaluate(() => localStorage.getItem("darkMode"))).toBe("enabled");

		// Reload: the preference PERSISTS. The no-flash inline <head> script must have
		// applied `darkmode` to <html> BEFORE any paint — we assert it is present at the
		// very first opportunity (documentElement), then that script.js mirrors it onto
		// <body> after DOM-ready.
		await page.reload();
		// <html> carries the class set pre-paint by the BaseLayout inline script.
		await expect(page.locator("html")).toHaveClass(/\bdarkmode\b/);
		await waitForScript(page);
		await expect(body).toHaveClass(/\bdarkmode\b/);
		expect(await page.evaluate(() => localStorage.getItem("darkMode"))).toBe("enabled");

		// Click again -> disable. body loses darkmode (gains lightmode), storage = 'disabled'.
		await toggle.click();
		await expect(body).not.toHaveClass(/\bdarkmode\b/);
		await expect(body).toHaveClass(/\blightmode\b/);
		expect(await page.evaluate(() => localStorage.getItem("darkMode"))).toBe("disabled");
	});

	test("no flash: <html> already has the dark class on the very first evaluated script", async ({ page }) => {
		// Seed the preference, then navigate fresh. The inline <head> script runs before
		// the body renders, so by the time ANY page script (incl. ours) can observe the
		// document, <html> must already be `darkmode`. We verify by adding an init script
		// that records documentElement's className at the earliest possible moment.
		await page.goto("/");
		await page.evaluate(() => localStorage.setItem("darkMode", "enabled"));

		await page.addInitScript(() => {
			// Runs after the document is created but we read on DOMContentLoaded, by which
			// point the synchronous inline <head> script has already executed.
			document.addEventListener("DOMContentLoaded", () => {
				(window as unknown as { __htmlClassAtReady?: string }).__htmlClassAtReady = document.documentElement.className;
			});
		});

		await page.reload();
		await page.waitForLoadState("load");
		const htmlClassAtReady = await page.evaluate(() => (window as unknown as { __htmlClassAtReady?: string }).__htmlClassAtReady ?? "");
		expect(htmlClassAtReady).toContain("darkmode");
	});
});

test.describe("back-to-top button", () => {
	test("is hidden near the hero and appears after scrolling far down", async ({ page }) => {
		await page.goto("/");
		await waitForScript(page);

		const body = page.locator("body");
		const backTop = page.locator("#backTop");
		await expect(backTop).toHaveCount(1);

		// Near the top, the Hero (+1500px rootMargin) is intersecting -> body.HideBackTop.
		await expect(body).toHaveClass(/\bHideBackTop\b/);

		// Scroll well past the hero + its 1500px bottom margin so it stops intersecting.
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
		// IntersectionObserver fires async; poll the class off.
		await expect(body).not.toHaveClass(/\bHideBackTop\b/);

		// The back-to-top control is an in-page anchor to #continut at the top.
		await expect(backTop).toHaveAttribute("href", "#continut");

		// Clicking it returns focus/scroll toward the top: after the hash nav the hero
		// re-enters view and HideBackTop is re-applied.
		await backTop.click();
		await expect(body).toHaveClass(/\bHideBackTop\b/);
	});
});
