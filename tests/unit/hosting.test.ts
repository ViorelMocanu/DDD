// Checks on the build output in dist/ and on the files that configure the server.
import { describe, expect, test } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";

const ARTICLES = "src/content/articole";

const all = readdirSync(DIST, { recursive: true, withFileTypes: true })
	.filter((entry) => entry.isFile())
	.map((entry) => join(entry.parentPath, entry.name).replaceAll("\\", "/"));
const sitemap = readFileSync(join(DIST, "sitemap.xml"), "utf8");
const htaccess = readFileSync(join(DIST, ".htaccess"), "utf8");
const headers = [...htaccess.matchAll(/^\s*Header (?:always )?set (\S+) "(.*)"$/gm)].map(([, name, value]) => ({ name, value }));
const header = (name: string): string[] => headers.filter((entry) => entry.name === name).map((entry) => entry.value ?? "");

describe("build output", () => {
	test("the sitemap and the built pages list each other", () => {
		const listed = [...sitemap.matchAll(/<loc>https:\/\/dedede\.ro(.*?)<\/loc>/g)].map(([, path]) => path).sort();
		const built = all
			.filter((file) => file.endsWith("/index.html"))
			.map((file) => file.slice(DIST.length, -"index.html".length))
			.sort();
		expect(built).toEqual(listed);
	});

	test("server files and legacy static files ship with the build", () => {
		for (const file of [".htaccess", "sideform.php", "service-worker.js", "robots.txt", "sitemap.xml", "site.webmanifest", "humans.txt", "favicon.ico", "google8bed9638f272a4f6.html", "resources/archivo-var.woff2", "images/og-image.jpg"]) expect(existsSync(join(DIST, file)), file).toBe(true);
	});

	test("nothing private or obsolete is published", () => {
		const forbidden = all.filter((file) => /(^|\/)(env\.php|env-exemplu\.php|\.env.*)$|\.(map|scss)$|sendgrid|_elderjs/.test(file));
		expect(forbidden).toEqual([]);
		expect(all.filter((file) => file.endsWith(".php"))).toEqual(["dist/sideform.php"]);
	});

	test("the sitemap keeps the legacy entries and lists every article, newest first", () => {
		const articles = readdirSync(ARTICLES)
			.filter((name) => name.endsWith(".md"))
			.map((name) => ({ slug: name.slice(0, -".md".length), date: /^date:\s*["']?([^"'\s]+)/m.exec(readFileSync(join(ARTICLES, name), "utf8"))?.[1] ?? "" }))
			.sort((a, b) => b.date.localeCompare(a.date))
			.map((article) => `/${article.slug}/ monthly 0.90`);
		const entries = [...sitemap.matchAll(/<loc>https:\/\/dedede\.ro(.*?)<\/loc>\s*<changefreq>(.*?)<\/changefreq>\s*<priority>(.*?)<\/priority>/g)].map(([, path, changefreq, priority]) => `${path} ${changefreq} ${priority}`);
		expect(entries).toEqual(["/ monthly 1.00", "/contact/ weekly 1.00", "/informatii-utile/ monthly 0.80", ...articles, "/termeni-si-conditii/ monthly 0.50", "/confidentialitate/ monthly 0.50", "/cookies/ monthly 0.50"]);
		expect(entries).toEqual(expect.arrayContaining(["/totul-despre-dezinsectie/ monthly 0.90", "/cum-scapi-de-gandaci/ monthly 0.90", "/dezinfectie-dezinsectie-deratizare-diferente/ monthly 0.90"]));
	});

	test("pages stay within their size budgets", () => {
		const size = (file: string): number => statSync(file).size;
		for (const file of all.filter((name) => name.endsWith(".html"))) expect(size(file), file).toBeLessThan(100_000);
		for (const file of all.filter((name) => name.endsWith(".css"))) expect(size(file), file).toBeLessThan(45_000);
		// The page scripts are small enough for Astro to inline, so no script file is expected at all.
		for (const file of all.filter((name) => name.endsWith(".js") && name !== "dist/service-worker.js")) expect(size(file), file).toBeLessThan(10_000);
	});
});

describe(".htaccess", () => {
	test("keeps the security headers of the live site", () => {
		expect(header("Content-Security-Policy")[0]).toContain("default-src 'none'");
		expect(header("Content-Security-Policy")[0]).toContain("*.cookiebot.com");
		expect(header("Strict-Transport-Security")).toEqual(["max-age=63072000; includeSubDomains; preload"]);
		expect(header("X-Content-Type-Options")).toEqual(["nosniff"]);
		expect(header("X-Frame-Options")).toEqual(["SAMEORIGIN"]);
	});

	test("sends valid, current policy headers", () => {
		expect(header("Referrer-Policy")).toEqual(["strict-origin-when-cross-origin"]);
		expect(header("Permissions-Policy")).toHaveLength(1);
		expect(header("Feature-Policy")).toEqual([]);
		expect(header("X-XSS-Protection")).toEqual([]);
	});

	test("never turns PHP error display on", () => {
		expect(htaccess).not.toMatch(/display_errors\s+on/i);
	});

	test("blocks private files and hidden paths, but not the certificate challenges", () => {
		const block = /<FilesMatch "(.*)">\s*Order allow,deny\s*Deny from all/.exec(htaccess)?.[1] ?? "";
		expect(block.startsWith("(?i)")).toBe(true);
		const denied = new RegExp(block.slice("(?i)".length), "i");
		for (const file of ["env.php", "ENV.PHP", "env.php.bak", "env-exemplu.php", "php_errorlog", "error_log", "style.css.map", "style.scss", "dump.sql", "site.zip", "sideform.php.old", "sideform.php~"]) expect(denied.test(file), file).toBe(true);
		for (const file of ["sideform.php", "index.html", "sitemap.xml", "robots.txt", "site.webmanifest", "favicon.ico", "archivo-var.woff2"]) expect(denied.test(file), file).toBe(false);
		expect(htaccess).toContain("RewriteRule (^|/)\\.(?!well-known/) - [F]");
	});

	test("pages revalidate and hashed assets are cached for a year", () => {
		expect(htaccess).toMatch(/<FilesMatch "\\\.\(html\|php\)\$">\s*Header set Cache-Control "no-cache"/);
		expect(htaccess).toMatch(/<Files "sideform\.php">\s*Header set Cache-Control "no-store"/);
		expect(htaccess).toMatch(/m#\^\/_astro\/#">\s*Header set Cache-Control "public, max-age=31536000, immutable"/);
	});

	test("keeps the redirects to https and to the bare domain", () => {
		expect(htaccess).toContain("RewriteCond %{HTTP_HOST} ^www\\.(.*)$ [NC]");
		expect(htaccess).toContain("RewriteRule ^(.*)$ https://%1/$1 [R=301,L]");
	});
});

describe("server scripts", () => {
	test("the contact endpoint never evaluates or interpolates request data", () => {
		const php = readFileSync("public/sideform.php", "utf8");
		expect(php).not.toMatch(/\beval\s*\(|\$_REQUEST|\$_GET|mysqli_query|extract\s*\(/);
		expect(php).toContain("->prepare(");
	});

	test("the service worker only retires the legacy one", () => {
		const worker = readFileSync(join(DIST, "service-worker.js"), "utf8");
		expect(worker).toContain("registration.unregister()");
		expect(worker).toContain("caches.delete");
		expect(worker).not.toContain("fetch");
	});
});
