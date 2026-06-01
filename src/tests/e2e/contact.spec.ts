// src/tests/e2e/contact.spec.ts
//
// Functional E2E for the contact form (src/pages/contact.astro driven by
// public/resources/script.js). DoD criterion 3.
//
// IMPORTANT — why everything mocks /api/contact:
//   The Astro build is `output: "static"` and the endpoint is `prerender = false`,
//   so /api/contact is an SSR Worker route that is NOT emitted into dist/client/.
//   The static server (serve-static.mjs) therefore returns 404 for it. So any test
//   that submits the form MUST intercept the POST with page.route() and supply a
//   response that matches the real contract.
//
// RESPONSE CONTRACT (read from public/resources/script.js postData()):
//   • The client does `fetch(url).then(r => r.text())` then `isJson(text)`.
//   • If the body parses as JSON  -> SUCCESS path: renders JSON.parse(body).message,
//       pushes dataLayer `formularTrimis`, then flashEroare(true) pushes
//       `conversieAcceptata`. (The very first thing the submit handler does, before
//       any fetch, is push `formularInitializat`.)
//   • If the body is NOT valid JSON -> ERROR path: pushes dataLayer `formularEroare`.
//   So to exercise the error branch we return a NON-JSON body (e.g. plain text),
//   mirroring how a 5xx HTML error page would look to the client.
import { test, expect, type Page } from "@playwright/test";

// A minimal set of valid values that pass script.js client-side validation
// (regexMail for email, regexPhone /^[0-9]{3,24}$/ for phone, non-empty name,
// a non-empty side_tip option, and the required gdpr checkbox).
const VALID = {
	name: "Ion Popescu",
	phone: "0744123456",
	email: "ion@example.com",
	tip: "dezinsectie",
	mesaj: "Am gandaci in bucatarie.",
};

/**
 * Read the page's `dataLayer` event names. `window.dataLayer` is created by `script.js`
 * (and pre-seeded by GTM); this maps each entry to its `event` property and drops any
 * entry without one, yielding the ordered list of analytics events fired so far.
 * @param page - The Playwright page under test.
 * @returns A promise resolving to the `event` names present on `window.dataLayer`, in order.
 */
async function dataLayerEvents(page: Page): Promise<string[]> {
	return page.evaluate(() => {
		const dl = (window as unknown as { dataLayer?: Array<Record<string, unknown>> }).dataLayer ?? [];
		return dl.map((e) => (e && typeof e === "object" ? (e["event"] as string) : undefined)).filter(Boolean) as string[];
	});
}

/**
 * Fill every required, human-facing contact-form field with valid values and tick the GDPR
 * checkbox, leaving the form in a submittable state.
 * @param page - The Playwright page under test.
 * @returns A promise that resolves once all fields have been populated.
 */
async function fillValid(page: Page): Promise<void> {
	await page.locator("#side_name").fill(VALID.name);
	await page.locator("#side_telephone").fill(VALID.phone);
	await page.locator("#side_email").fill(VALID.email);
	await page.locator("#side_tip").selectOption(VALID.tip);
	await page.locator("#side_mesaj").fill(VALID.mesaj);
	await page.locator("#gdpr").check();
}

/**
 * Wait for `script.js` to be live before interacting with the form — it binds the submit
 * handler at parse time, so we wait for the `load` event and assert the form is visible.
 * @param page - The Playwright page under test.
 * @returns A promise that resolves once the form is present and its handlers are wired.
 */
async function waitForFormReady(page: Page): Promise<void> {
	await page.waitForLoadState("load");
	await expect(page.locator("#sideform")).toBeVisible();
}

test.describe("contact form — markup contract", () => {
	test("form posts to /api/contact and exposes every expected field id", async ({ page }) => {
		await page.goto("/contact/");
		await waitForFormReady(page);

		const form = page.locator("#sideform");
		await expect(form).toHaveAttribute("action", "/api/contact");
		await expect(form).toHaveAttribute("method", "post");

		// Visible, required, human-facing fields.
		for (const id of ["side_name", "side_telephone", "side_email", "side_tip", "side_mesaj", "gdpr", "side_submit"]) {
			await expect(page.locator(`#${id}`)).toHaveCount(1);
		}

		// Hidden tracking / UTM fields exist (type=hidden, so not "visible").
		for (const id of ["side_url", "utm_source", "utm_medium", "utm_term", "utm_content", "utm_campaign", "gclid"]) {
			const el = page.locator(`#${id}`);
			await expect(el).toHaveCount(1);
			await expect(el).toHaveAttribute("type", "hidden");
		}
	});

	test("honeypot hp_field is present but visually hidden off-screen", async ({ page }) => {
		await page.goto("/contact/");
		await waitForFormReady(page);

		const hp = page.locator("#hp_field");
		await expect(hp).toHaveCount(1);
		// It must NOT be type=hidden (bots should be tempted to fill it) — it is a real
		// text input pushed off-screen by CSS (.Honeypot { position:absolute; left:-9999px }).
		await expect(hp).toHaveAttribute("type", "text");
		await expect(hp).toHaveAttribute("aria-hidden", "true");

		// Confirm it is genuinely off the left edge (CSS-hidden, not display:none) so it
		// is unreachable for a sighted user but present for a naive bot.
		const left = await hp.evaluate((el) => el.getBoundingClientRect().left);
		expect(left).toBeLessThan(-1000);
	});
});

test.describe("contact form — UTM population (bug fix)", () => {
	test("query params populate the hidden UTM / gclid fields on load", async ({ page }) => {
		// The legacy Svelte version used `urlParams = []` and never read the URL; the
		// rebuild's populateHiddenFields() reads URLSearchParams. This is the regression
		// the fix targets.
		await page.goto("/contact/?utm_source=google&utm_medium=cpc&gclid=abc123");
		await waitForFormReady(page);

		await expect(page.locator("#utm_source")).toHaveValue("google");
		await expect(page.locator("#utm_medium")).toHaveValue("cpc");
		await expect(page.locator("#gclid")).toHaveValue("abc123");
		// side_url is set to the full current URL (incl. query string).
		await expect(page.locator("#side_url")).toHaveValue(/\/contact\/\?utm_source=google/);
		// Untouched params stay empty.
		await expect(page.locator("#utm_term")).toHaveValue("");
		await expect(page.locator("#utm_campaign")).toHaveValue("");
	});
});

test.describe("contact form — validation & submission", () => {
	test("an empty submit is blocked (native required validation, no request fired)", async ({ page }) => {
		await page.goto("/contact/");
		await waitForFormReady(page);

		// If the form ever reaches the network on an empty submit, fail loudly.
		let requested = false;
		await page.route("**/api/contact", (route) => {
			requested = true;
			return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, message: "x" }) });
		});

		// The required fields (side_name/telephone/email/tip + gdpr) carry the native
		// `required` attribute, so the browser's constraint validation blocks submit BEFORE
		// any handler runs. Click the submit button and assert nothing was sent and the
		// first required control reports invalid.
		await page.locator("#side_submit").click();

		// Give any (non-)submission a beat; the request map must stay false.
		await expect.poll(() => requested, { timeout: 1500 }).toBe(false);

		// The form was NOT marked as sent/successful and the first required field is invalid.
		await expect(page.locator("#sideform")).not.toHaveClass(/\bSuccess\b/);
		const nameValid = await page.locator("#side_name").evaluate((el) => (el as HTMLInputElement).checkValidity());
		expect(nameValid).toBe(false);

		// No conversion events fired.
		const events = await dataLayerEvents(page);
		expect(events).not.toContain("formularTrimis");
		expect(events).not.toContain("conversieAcceptata");
	});

	test("happy path: a JSON success response fires formularInitializat + formularTrimis + conversieAcceptata", async ({ page }) => {
		await page.goto("/contact/");
		await waitForFormReady(page);

		// Mock the SSR endpoint with the real success contract: JSON { success, message }.
		await page.route("**/api/contact", (route) =>
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ success: true, message: "Am primit detaliile tale!" }),
			}),
		);

		await fillValid(page);
		await page.locator("#side_submit").click();

		// flashEroare(true) is what pushes conversieAcceptata — wait for it to settle.
		await expect(page.locator("#sideform")).toHaveClass(/\bSuccess\b/);

		const events = await dataLayerEvents(page);
		expect(events).toContain("formularInitializat");
		expect(events).toContain("formularTrimis");
		expect(events).toContain("conversieAcceptata");

		// The sanitized server message is rendered into #raspuns.
		await expect(page.locator("#raspuns")).toContainText("Am primit detaliile tale");
	});

	test("server error: a non-JSON response fires formularEroare", async ({ page }) => {
		await page.goto("/contact/");
		await waitForFormReady(page);

		// A 5xx/HTML-ish, NON-JSON body is what script.js treats as the error branch.
		await page.route("**/api/contact", (route) => route.fulfill({ status: 500, contentType: "text/html", body: "<h1>Internal Server Error</h1>" }));

		await fillValid(page);
		await page.locator("#side_submit").click();

		// The error branch adds the Errors class and pushes formularEroare.
		await expect(page.locator("#sideform")).toHaveClass(/\bErrors\b/);
		const events = await dataLayerEvents(page);
		expect(events).toContain("formularInitializat");
		expect(events).toContain("formularEroare");
		expect(events).not.toContain("conversieAcceptata");
	});

	test("honeypot-filled submit is handled silently (server returns success, no error surfaced)", async ({ page }) => {
		await page.goto("/contact/");
		await waitForFormReady(page);

		// Mirrors the endpoint: a filled honeypot still gets a JSON success so the bot
		// has no signal. The client therefore takes the SUCCESS path.
		await page.route("**/api/contact", (route) =>
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ success: true, message: "Am primit detaliile tale!" }),
			}),
		);

		await fillValid(page);
		// A bot fills the off-screen honeypot. The field has tabindex=-1 and is off-screen,
		// so set the value directly (a human cannot reach it).
		await page.locator("#hp_field").evaluate((el) => {
			(el as HTMLInputElement).value = "i-am-a-bot";
		});

		await page.locator("#side_submit").click();

		// Client behaviour is identical to the happy path (silent success), so the form
		// shows Success and surfaces NO error.
		await expect(page.locator("#sideform")).toHaveClass(/\bSuccess\b/);
		const events = await dataLayerEvents(page);
		expect(events).toContain("formularTrimis");
		expect(events).not.toContain("formularEroare");
	});
});
