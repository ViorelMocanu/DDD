// Minimal zero-dependency static file server for parity capture.
// Serves a root directory with directory-index (index.html) + trailing-slash
// resolution that mirrors how the live nginx host serves the Elder.js output:
//   /            -> <root>/index.html
//   /contact/    -> <root>/contact/index.html
//   /foo.css     -> <root>/foo.css
// Usage: node serve-static.mjs --root ../../livesite --port 4321
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i].replace(/^--/, ""), process.argv[i + 1]);
const ROOT = resolve(args.get("root") ?? "../../livesite");
const PORT = Number(args.get("port") ?? 4321);

const TYPES = {
	".html": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".mjs": "text/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".svg": "image/svg+xml",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
	".gif": "image/gif",
	".ico": "image/x-icon",
	".woff": "font/woff",
	".woff2": "font/woff2",
	".ttf": "font/ttf",
	".xml": "application/xml; charset=utf-8",
	".txt": "text/plain; charset=utf-8",
	".webmanifest": "application/manifest+json",
	".map": "application/json",
};

/** Resolve a request URL path to a file inside ROOT, applying index.html for directories. */
async function resolveFile(urlPath) {
	let p = decodeURIComponent(urlPath.split("?")[0]);
	// Block path traversal.
	const safe = normalize(p).replace(/^(\.\.[/\\])+/, "");
	const candidates = [];
	if (safe.endsWith("/")) {
		candidates.push(join(ROOT, safe, "index.html"));
	} else {
		candidates.push(join(ROOT, safe));
		candidates.push(join(ROOT, safe, "index.html")); // extensionless dir
	}
	for (const c of candidates) {
		try {
			const s = await stat(c);
			if (s.isFile()) return c;
		} catch {
			/* try next */
		}
	}
	return null;
}

const server = http.createServer(async (req, res) => {
	const file = await resolveFile(req.url ?? "/");
	if (!file) {
		res.writeHead(404, { "content-type": "text/plain" });
		res.end("404 Not Found: " + req.url);
		return;
	}
	try {
		const body = await readFile(file);
		res.writeHead(200, { "content-type": TYPES[extname(file).toLowerCase()] ?? "application/octet-stream", "cache-control": "no-store" });
		res.end(body);
	} catch (err) {
		res.writeHead(500, { "content-type": "text/plain" });
		res.end("500 " + String(err));
	}
});

server.listen(PORT, () => {
	console.log(`[serve-static] root=${ROOT}`);
	console.log(`[serve-static] listening on http://localhost:${PORT}`);
});
