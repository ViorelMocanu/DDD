// Migration oracle: compares the rebuilt site with the local copy of the live site.
// Deliberate differences are listed in openspec/changes/astro-rewrite/design.md and masked here.
import { type Page, expect, test } from "@playwright/test";
import { HAS_LEGACY_COPY, LEGACY_URL as LEGACY, REBUILD_URL } from "../../playwright.config";
import { LEGACY_ROUTES } from "./routes";

// Self-check of the oracle: run with PARITY_TARGET set to the legacy address, and every test must pass.
const REBUILD = process.env["PARITY_TARGET"] ?? REBUILD_URL;
const VIEWPORTS = { phone: { width: 375, height: 812 }, tablet: { width: 768, height: 1024 }, desktop: { width: 1440, height: 900 } };

test.skip(!HAS_LEGACY_COPY, "needs the live copy in _backup/live/public_html");

async function onlyLocal(page: Page): Promise<void> {
	await page.route(/^https?:\/\/(?!localhost)/, (route) => route.abort());
}

/** Body reduced to one line per element or text node, ignoring whitespace, attribute order and the masked differences. */
function structure(): string[] {
	const lines: string[] = [];
	const masked = (element: Element): boolean => element.matches(".Copyright, .ArticleDuration .MetaText span, [itemprop=wordCount]");
	const walk = (node: Node, depth: number): void => {
		if (node.nodeType === Node.TEXT_NODE) {
			const text = (node.textContent ?? "").replace(/\s+/g, " ").trim();
			if (text) lines.push(`${" ".repeat(depth)}"${text}"`);
			return;
		}
		if (!(node instanceof Element) || node.matches("script, #side_verificare")) return;
		const attributes = [...node.attributes]
			.filter((attribute) => attribute.name !== "this")
			.map((attribute) => {
				let value = attribute.value.replace(/\s+/g, " ").trim();
				if (attribute.name === "class") value = value.split(" ").sort().join(" ");
				if (attribute.name === "src") value = value.replace(/^\.\//, "/");
				return `${attribute.name}="${value}"`;
			})
			.sort();
		lines.push(`${" ".repeat(depth)}<${[node.tagName.toLowerCase(), ...attributes].join(" ")}>`);
		if (masked(node)) return;
		for (const child of node.childNodes) walk(child, depth + 1);
	};
	walk(document.body, 0);
	return lines;
}

/** Head metadata as sorted `key=value` lines. */
function metadata(): string[] {
	const absolute = (value: string): string => new URL(value, "https://dedede.ro").href;
	const lines = [`title=${document.title}`];
	for (const meta of document.head.querySelectorAll("meta")) {
		const key = meta.getAttribute("name") ?? meta.getAttribute("property") ?? meta.getAttribute("charset") ?? "";
		if (key === "twitter:site" || key === "twitter:creator") continue;
		const content = meta.content;
		lines.push(`meta ${key}=${key === "og:image" ? absolute(content) : content}`);
	}
	for (const link of document.head.querySelectorAll("link:not([rel=stylesheet])")) {
		const href = link.getAttribute("href") ?? "";
		lines.push(`link ${link.getAttribute("rel")} ${link.getAttribute("sizes") ?? ""} ${link.getAttribute("rel") === "canonical" ? href : new URL(absolute(href)).pathname}`);
	}
	return lines.sort();
}

for (const route of LEGACY_ROUTES) {
	test.describe(route, () => {
		test("structure and metadata match", async ({ browser }) => {
			const context = await browser.newContext({ javaScriptEnabled: false });
			const page = await context.newPage();
			await onlyLocal(page);

			const read = async (origin: string): Promise<{ status: number | undefined; body: string[]; head: string[] }> => {
				const response = await page.goto(origin + route, { waitUntil: "domcontentloaded" });
				return { status: response?.status(), body: await page.evaluate(structure), head: await page.evaluate(metadata) };
			};
			const legacy = await read(LEGACY);
			const rebuild = await read(REBUILD);
			await context.close();

			expect(legacy.status).toBe(200);
			expect(rebuild.status).toBe(200);
			expect(rebuild.head.join("\n")).toBe(legacy.head.join("\n"));
			expect(rebuild.body.join("\n")).toBe(legacy.body.join("\n"));
		});

		for (const [device, viewport] of Object.entries(VIEWPORTS)) {
			for (const colorScheme of ["light", "dark"] as const) {
				test(`looks the same on ${device} in ${colorScheme} mode`, async ({ browser }, testInfo) => {
					const context = await browser.newContext({ viewport, colorScheme, reducedMotion: "reduce" });
					const page = await context.newPage();
					await onlyLocal(page);

					const settle = async (origin: string): Promise<void> => {
						await page.goto(origin + route);
						await page.evaluate(async () => {
							for (const image of document.images) image.loading = "eager";
							await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)));
							await document.fonts.ready;
						});
					};

					const name = `${route.replaceAll("/", "") || "home"}-${device}-${colorScheme}.png`;
					const baseline = testInfo.snapshotPath(name);
					await settle(LEGACY);
					await page.screenshot({ path: baseline, fullPage: true, animations: "disabled" });

					await settle(REBUILD);
					await expect(page).toHaveScreenshot(name, { fullPage: true, animations: "disabled", maxDiffPixelRatio: 0.001 });
					await context.close();
				});
			}
		}
	});
}
