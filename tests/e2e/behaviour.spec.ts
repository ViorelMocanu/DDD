import { ACCEPTED, RETRY_MESSAGE } from "../fixtures/replies";
import { type Page, expect, test } from "@playwright/test";

const ARTICLE = "/totul-despre-dezinsectie/";

/** Third-party scripts are answered with an empty file so tests never touch the network. */
async function stubExternal(page: Page): Promise<string[]> {
	const requested: string[] = [];
	await page.route(/^https?:\/\/(?!localhost)/, (route) => {
		requested.push(route.request().url());
		return route.fulfill({ status: 200, contentType: "text/javascript", body: "" });
	});
	return requested;
}

/** Event names and gtag calls pushed to the data layer, in order. */
async function dataLayer(page: Page): Promise<string[]> {
	return page.evaluate(() => (window.dataLayer as (IArguments | { event?: string })[]).map((entry) => ("length" in entry ? `gtag:${Array.from(entry).slice(0, 2).join(":")}` : (entry.event ?? ""))));
}

async function fillValidForm(page: Page): Promise<void> {
	await page.fill("#side_name", "Ion Popescu");
	await page.fill("#side_telephone", "0744885566");
	await page.fill("#side_email", "ion@example.com");
	await page.selectOption("#side_tip", "dezinsectie");
	await page.fill("#side_mesaj", "Am gândaci în bucătărie.");
	await page.check("#gdpr");
}

test.beforeEach(async ({ page }) => {
	await stubExternal(page);
});

test("the menu button opens and closes the menu on a phone", async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto("/");
	const header = page.locator("#header");
	await page.click("#menuToggle");
	await expect(header).toHaveClass(/Active/);
	await page.click("#menuToggle");
	await expect(header).not.toHaveClass(/Active/);
});

test("a dark mode choice survives navigation", async ({ page }) => {
	await page.goto("/");
	await page.click("#darkMode");
	await expect(page.locator("body")).toHaveClass(/darkmode/);
	await page.goto("/contact/");
	await expect(page.locator("body")).toHaveClass(/darkmode/);
	await page.click("#darkMode");
	await expect(page.locator("body")).toHaveClass(/lightmode/);
	expect(await page.evaluate(() => localStorage.getItem("darkMode"))).toBe("disabled");
});

test("back to top appears only after scrolling past the hero", async ({ page }) => {
	await page.goto(ARTICLE);
	const body = page.locator("body");
	await expect(body).toHaveClass(/HideBackTop/);
	await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
	await expect(body).not.toHaveClass(/HideBackTop/);
});

test("the same Tag Manager container and Ads tag are loaded", async ({ page }) => {
	const requested = await stubExternal(page);
	await page.goto("/");
	await expect.poll(() => requested).toEqual(expect.arrayContaining(["https://www.googletagmanager.com/gtm.js?id=GTM-NGTSNLX", "https://www.googletagmanager.com/gtag/js?id=AW-10780123066"]));
	expect(await dataLayer(page)).toEqual(expect.arrayContaining(["gtm.js", "gtag:config:AW-10780123066"]));
});

test("contact links report the visitor's intent, other links do not", async ({ page }) => {
	await page.goto("/termeni-si-conditii/");
	// The links are kept from navigating, so the page (and its data layer) stays put.
	await page.evaluate(() => {
		document.addEventListener("click", (click) => {
			click.preventDefault();
		});
		const other = document.createElement("a");
		other.href = "mailto:altcineva@example.com";
		other.id = "alta-adresa";
		other.textContent = "altă adresă";
		document.body.append(other);
	});
	const contactEvents = async (): Promise<string[]> => (await dataLayer(page)).filter((event) => event.startsWith("contact"));

	await page.locator('a.FooterButton[href^="tel:"]').click();
	expect(await contactEvents()).toEqual(["contactTelefon"]);
	await page.locator('a.FooterButton[href*="wa.me"]').click();
	await page.locator('a.FooterButton[href="mailto:contact@dedede.ro"]').click();
	expect(await contactEvents()).toEqual(["contactTelefon", "contactWhatsapp", "contactEmail"]);

	await page.locator("#alta-adresa").click();
	await page.locator('a[href="/contact/"]').last().click();
	expect(await contactEvents()).toHaveLength(3);
});

test.describe("contact form", () => {
	test("an invalid phone number blocks sending and marks the field", async ({ page }) => {
		let sent = false;
		await page.route("**/sideform.php", (route) => {
			sent = true;
			return route.abort();
		});
		await page.goto("/contact/");
		await fillValidForm(page);
		await page.fill("#side_telephone", "+40 744 abc");
		page.once("dialog", (dialog) => void dialog.accept());
		await page.click("#side_submit");

		await expect(page.locator("#sideform")).toHaveClass(/Errors/);
		await expect(page.locator("label:has(#side_telephone)")).toHaveClass(/Eroare/);
		await expect(page.locator("#side_telephone")).toBeFocused();
		await expect(page.locator("#side_submit_text")).toHaveText("Retrimite formularul →");
		expect(sent).toBe(false);
		expect(await dataLayer(page)).toContain("formularInitializat");
	});

	test("a phone number typed with spaces and a plus is accepted", async ({ page }) => {
		let phone = "";
		await page.route("**/sideform.php", (route) => {
			phone = (route.request().postDataJSON() as Record<string, string>)["side_telephone"] ?? "";
			return route.fulfill({ contentType: "application/json", body: JSON.stringify(ACCEPTED) });
		});
		await page.goto("/contact/");
		await fillValidForm(page);
		await page.fill("#side_telephone", "+40 744 885 566");
		await page.click("#side_submit");

		await expect(page.locator("#sideform")).toHaveClass(/Success/);
		expect(phone).toBe("+40 744 885 566");
	});

	test("a phone number that is too short is stopped by the page", async ({ page }) => {
		await page.route("**/sideform.php", (route) => route.abort());
		await page.goto("/contact/");
		await fillValidForm(page);
		await page.fill("#side_telephone", "0744 885");
		page.once("dialog", (dialog) => void dialog.accept());
		await page.click("#side_submit");

		await expect(page.locator("label:has(#side_telephone)")).toHaveClass(/Eroare/);
	});

	test("an accepted submission shows success and records the conversion", async ({ page }) => {
		let payload: Record<string, string> = {};
		await page.route("**/sideform.php", (route) => {
			payload = route.request().postDataJSON() as Record<string, string>;
			return route.fulfill({ contentType: "application/json", body: JSON.stringify(ACCEPTED) });
		});
		await page.goto("/contact/?utm_source=google&utm_campaign=toamna&gclid=abc123");
		await fillValidForm(page);
		await page.click("#side_submit");

		await expect(page.locator("#sideform")).toHaveClass(/Success/);
		await expect(page.locator("#raspuns")).toHaveText(ACCEPTED.message);
		await expect(page.locator("#side_submit_text")).toHaveText("Formularul a fost trimis!");
		expect(payload).toMatchObject({ side_name: "Ion Popescu", side_telephone: "0744885566", side_email: "ion@example.com", side_tip: "dezinsectie", datasent: "true", utm_source: "google", utm_campaign: "toamna", gclid: "abc123", side_verificare: "" });
		expect(payload["side_url"]).toContain("/contact/");
		const expected = ["formularInitializat", "formularTrimis", "gtag:event:conversion", "conversieAcceptata"];
		expect((await dataLayer(page)).filter((event) => expected.includes(event))).toEqual(expected);
		// The problem type travels with the success event; nothing personal does.
		const sent = await page.evaluate(() => (window.dataLayer as { event?: string }[]).find((entry) => entry.event === "formularTrimis"));
		expect(sent).toEqual({ event: "formularTrimis", tip_problema: "dezinsectie" });
	});

	test("a refused submission shows the reasons and records no conversion", async ({ page }) => {
		await page.route("**/sideform.php", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ error: "true", message: RETRY_MESSAGE, errors: [{ text: 'ai introdus un <a href="#side_email">email greșit</a>' }] }) }));
		await page.goto("/contact/");
		await fillValidForm(page);
		await page.click("#side_submit");

		await expect(page.locator("#sideform")).toHaveClass(/Errors/);
		await expect(page.locator("#raspuns")).toHaveText(`${RETRY_MESSAGE}ai introdus un email greșit`);
		await expect(page.locator("#raspuns a")).toHaveCount(0);
		const events = await dataLayer(page);
		expect(events).toContain("formularEroare");
		expect(events).not.toContain("gtag:event:conversion");
		expect(events).not.toContain("formularTrimis");
	});

	test("a broken server reply is reported as an error", async ({ page }) => {
		await page.route("**/sideform.php", (route) => route.fulfill({ status: 500, contentType: "text/html", body: "<b>Fatal error</b>" }));
		await page.goto("/contact/");
		await fillValidForm(page);
		await page.click("#side_submit");

		await expect(page.locator("#sideform")).toHaveClass(/Errors/);
		const events = await dataLayer(page);
		expect(events).toContain("formularEroare");
		expect(events).not.toContain("gtag:event:conversion");
	});

	test("a reply of JSON null is reported as an error, not left hanging", async ({ page }) => {
		await page.route("**/sideform.php", (route) => route.fulfill({ contentType: "application/json", body: "null" }));
		await page.goto("/contact/");
		await fillValidForm(page);
		await page.click("#side_submit");

		await expect(page.locator("#sideform")).toHaveClass(/Errors/);
	});

	test("a long malformed email is rejected at once", async ({ page }) => {
		await page.route("**/sideform.php", (route) => route.abort());
		await page.goto("/contact/");
		await fillValidForm(page);
		// The old pattern needed minutes of processor time for this value and froze the page.
		// The browser itself accepts this address (a hyphen inside the last label), so it reaches the script.
		await page.fill("#side_email", `a@b.${"a".repeat(60)}-a`);
		page.once("dialog", (dialog) => void dialog.accept());
		await page.click("#side_submit");

		await expect(page.locator("label:has(#side_email)")).toHaveClass(/Eroare/, { timeout: 3000 });
	});
});
