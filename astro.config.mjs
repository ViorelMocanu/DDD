// astro.config.mjs
import { defineConfig, passthroughImageService } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";

const SITE = "https://dedede.ro";
const BUILD_DATE = new Date().toISOString();

// Per-URL priority + changefreq are byte-locked to the baseline sitemap (WAIVER-SEO-05 changes ONLY lastmod).
const PRIORITY = { "/": 1.0, "/contact/": 1.0, "/informatii-utile/": 0.8, "/totul-despre-dezinsectie/": 0.9, "/cum-scapi-de-gandaci/": 0.9, "/dezinfectie-dezinsectie-deratizare-diferente/": 0.9, "/termeni-si-conditii/": 0.5, "/confidentialitate/": 0.5, "/cookies/": 0.5 };
// changefreq is byte-locked to the baseline sitemap (WAIVER-SEO-05 changes ONLY lastmod): /contact/ = weekly, all others = monthly (incl. the 3 articles).
const CHANGEFREQ = { "/": "monthly", "/contact/": "weekly", "/informatii-utile/": "monthly", "/totul-despre-dezinsectie/": "monthly", "/cum-scapi-de-gandaci/": "monthly", "/dezinfectie-dezinsectie-deratizare-diferente/": "monthly", "/termeni-si-conditii/": "monthly", "/confidentialitate/": "monthly", "/cookies/": "monthly" };
// Article lastmod from frontmatter date (bare YYYY-MM-DD). Static pages -> build date.
const ARTICLE_LASTMOD = { "/totul-despre-dezinsectie/": "2021-09-14", "/cum-scapi-de-gandaci/": "2021-09-13", "/dezinfectie-dezinsectie-deratizare-diferente/": "2021-09-12" };

export default defineConfig({
	site: SITE,
	output: "static", // single SSR route opts out via prerender=false
	adapter: cloudflare(),
	image: { service: passthroughImageService() }, // no Sharp on the Worker; legacy images byte-for-byte
	trailingSlash: "always",
	build: { format: "directory" }, // dist/<route>/index.html
	integrations: [
		sitemap({
			filter: (page) => !page.includes("/api/"),
			serialize(item) {
				const path = new URL(item.url).pathname;
				if (PRIORITY[path] !== undefined) item.priority = PRIORITY[path];
				if (CHANGEFREQ[path] !== undefined) item.changefreq = CHANGEFREQ[path];
				item.lastmod = ARTICLE_LASTMOD[path] ?? BUILD_DATE; // WAIVER-SEO-05 (i)
				return item;
			},
		}),
	],
	vite: { css: { preprocessorOptions: { scss: { api: "modern-compiler" } } } },
});
