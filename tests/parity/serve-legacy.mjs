// Serves the local copy of the live site (`_backup/live/public_html`) so the parity tests can compare against it.
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { createServer } from "node:http";

const ROOT = join(process.cwd(), "_backup/live/public_html");
const PORT = Number(process.argv[2]);
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon", ".woff2": "font/woff2", ".xml": "text/xml", ".txt": "text/plain", ".webmanifest": "application/manifest+json" };

createServer((request, response) => {
	const path = normalize(decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname));
	let file = join(ROOT, path);
	if (!file.startsWith(ROOT) || path.endsWith(".php")) file = "";
	if (file && existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
	if (!file || !existsSync(file)) {
		response.writeHead(404).end("Not found");
		return;
	}
	response.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
	createReadStream(file).pipe(response);
}).listen(PORT, () => console.log(`Legacy copy on http://localhost:${PORT}`));
