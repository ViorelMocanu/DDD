// Post-deploy smoke check: `pnpm verify:live` (or `pnpm verify:live https://staging.example`).
// Read-only. It never submits the contact form.
const ORIGIN = (process.argv[2] ?? "https://dedede.ro").replace(/\/$/, "");
const UA = "Mozilla/5.0 (dedede.ro deploy check)";
const STATIC = ["/robots.txt", "/sitemap.xml", "/site.webmanifest", "/service-worker.js", "/favicon.ico", "/images/og-image.jpg", "/resources/archivo-var.woff2"];
const MUST_NOT_SERVE = ["/env.php", "/env-exemplu.php", "/php_errorlog", "/.htaccess", "/sendgrid-php/sendgrid-php.php", "/sendgrid-php/composer.lock", "/resources/style.scss", "/resources/style.css.map"];

const failures = [];
const check = (ok, label) => {
	console.log(`${ok ? "ok  " : "FAIL"} ${label}`);
	if (!ok) failures.push(label);
};
const get = (path) => fetch(ORIGIN + path, { headers: { "User-Agent": UA }, redirect: "manual" });

// The pages to check come from the live sitemap, so a new article is covered without touching this file.
const sitemap = await (await get("/sitemap.xml")).text();
const ROUTES = [...sitemap.matchAll(/<loc>https?:\/\/[^/]+(\/.*?)<\/loc>/g)].map(([, path]) => path);
check(ROUTES.length >= 9, `the sitemap lists ${ROUTES.length} pages`);

for (const path of [...ROUTES, ...STATIC]) check((await get(path)).status === 200, `200 ${path}`);

const home = await get("/");
const html = await home.text();
check(html.includes("/_astro/") && !html.includes("/_elderjs/"), "home page is the Astro build");
check(home.headers.get("content-security-policy")?.includes("default-src 'none'") === true, "Content-Security-Policy is set");
check(home.headers.get("strict-transport-security")?.includes("max-age=63072000") === true, "Strict-Transport-Security is set");
check(home.headers.get("referrer-policy") === "strict-origin-when-cross-origin", "Referrer-Policy is single-valued");
check(home.headers.has("permissions-policy") && !home.headers.has("feature-policy"), "Permissions-Policy replaces Feature-Policy");
check(home.headers.get("cache-control") === "no-cache", "pages revalidate (Cache-Control: no-cache)");
check(["gzip", "br", "zstd"].includes(home.headers.get("content-encoding")), "pages are sent compressed");

const stylesheet = /href="(\/_astro\/[^"]+\.css)"/.exec(html)?.[1];
check(stylesheet !== undefined && (await get(stylesheet)).headers.get("cache-control")?.includes("immutable") === true, "hashed assets are cached long-term");

for (const path of MUST_NOT_SERVE) {
	const response = await get(path);
	check(response.status === 403 || response.status === 404, `not served: ${path} (got ${response.status})`);
}

const endpoint = await get("/sideform.php");
const reply = await endpoint.json().catch(() => null);
check(reply?.error === "true" && reply?.errors?.[0]?.text === "Input greșit.", "contact endpoint answers a GET with the 'wrong input' reply");

const www = await fetch(ORIGIN.replace("://", "://www.") + "/contact/", { headers: { "User-Agent": UA }, redirect: "manual" }).catch(() => null);
check(www?.status === 301 && www.headers.get("location") === `${ORIGIN}/contact/`, "www redirects to the bare domain");

console.log(failures.length === 0 ? "\nAll checks passed." : `\n${failures.length} check(s) failed.`);
process.exit(failures.length === 0 ? 0 : 1);
