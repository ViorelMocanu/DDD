// Diagnostic: measure the vertical layout of the homepage so we can see WHICH section's
// height/offset diverges between baseline and rebuild. Usage: node measure-sections.mjs <baseUrl>
import { launchBrowser, newBlockedPage, waitForPageReady } from "./playwright-harness.mjs";

const base = (process.argv[2] ?? "http://localhost:4321").replace(/\/$/, "");

const browser = await launchBrowser();
const { page } = await newBlockedPage(browser, { width: 1440, height: 900 });
await page.goto(base + "/", { waitUntil: "load", timeout: 45000 });
await waitForPageReady(page, { timeout: 12000 });

const data = await page.evaluate(() => {
	const heads = [...document.querySelectorAll("h1,h2,h3")].map((h) => ({ tag: h.tagName, top: Math.round(h.getBoundingClientRect().top + window.scrollY), text: (h.textContent || "").replace(/\s+/g, " ").trim().slice(0, 34) }));
	// Direct children of <body> + their heights, to find which block collapses.
	const topBlocks = [...document.body.children].map((el) => ({ tag: el.tagName, cls: (el.className || "").toString().slice(0, 40), h: Math.round(el.getBoundingClientRect().height) }));
	return { scrollHeight: document.documentElement.scrollHeight, heads, topBlocks };
});
console.log(`BASE=${base}  scrollHeight=${data.scrollHeight}`);
console.log("-- body top-level blocks (tag | class | height) --");
for (const b of data.topBlocks) console.log(`  ${b.h.toString().padStart(5)}  ${b.tag}  ${b.cls}`);
console.log("-- headings (top y | tag | text) --");
for (const h of data.heads) console.log(`  ${h.top.toString().padStart(5)}  ${h.tag}  ${h.text}`);
await browser.close();
