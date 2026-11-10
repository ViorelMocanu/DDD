import type { APIRoute } from "astro";
import { getArticole } from "../lib/articole";

interface Intrare {
	path: string;
	changefreq: "weekly" | "monthly";
	priority: string;
}

const INAINTE: Intrare[] = [
	{ path: "/", changefreq: "monthly", priority: "1.00" },
	{ path: "/contact/", changefreq: "weekly", priority: "1.00" },
	{ path: "/informatii-utile/", changefreq: "monthly", priority: "0.80" },
];
const DUPA: Intrare[] = ["/termeni-si-conditii/", "/confidentialitate/", "/cookies/"].map((path) => ({ path, changefreq: "monthly", priority: "0.50" }));

/** Same entries as the hand-written legacy sitemap; new articles are added automatically. */
export const GET: APIRoute = async ({ site }) => {
	const articole: Intrare[] = (await getArticole()).map((articol) => ({ path: `/${articol.slug}/`, changefreq: "monthly", priority: "0.90" }));
	const urls = [...INAINTE, ...articole, ...DUPA].map(({ path, changefreq, priority }) => `<url>\n  <loc>${new URL(path, site).href}</loc>\n  <changefreq>${changefreq}</changefreq>\n  <priority>${priority}</priority>\n</url>`);
	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
	return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
