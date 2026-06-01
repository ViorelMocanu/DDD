// generate-og-image.mjs — WAIVER-ASSET-01.
// The live images/og-image.jpg is 0 bytes (broken Open Graph previews on home + the 3 legal
// pages). This regenerates a real branded 1200x630 social card. Run: pnpm generate:og
//
// Design note: the brand wordmark logos (dedede-logo-desktop.svg) are yellow+pink, so they are
// invisible on a yellow (#fde24f) background. We therefore use the dark brand color (#00214d) as
// the canvas — the colorful wordmark + a yellow tagline read with strong contrast. This is a
// social-card asset only (never rendered in-page), so it does not affect pixel parity.
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const W = 1200;
const H = 630;
const NAVY = "#00214d";
const YELLOW = "#fde24f";

const logo = await sharp(join(ROOT, "public/images/dedede-logo-desktop.svg"), { density: 300 }).resize({ width: 760 }).png().toBuffer();
const logoMeta = await sharp(logo).metadata();

const tagline = Buffer.from(`<svg width="${W}" height="160" xmlns="http://www.w3.org/2000/svg">` + `<text x="50%" y="100" text-anchor="middle" font-family="Archivo, Arial, Helvetica, sans-serif" ` + `font-size="68" font-weight="700" fill="${YELLOW}">Spații fără dăunători</text></svg>`);

await sharp({ create: { width: W, height: H, channels: 4, background: NAVY } })
	.composite([
		{ input: logo, top: 165, left: Math.round((W - (logoMeta.width ?? 760)) / 2) },
		{ input: tagline, top: 400, left: 0 },
	])
	.jpeg({ quality: 90, mozjpeg: true })
	.toFile(join(ROOT, "public/images/og-image.jpg"));

const out = await sharp(join(ROOT, "public/images/og-image.jpg")).metadata();
console.log(`[og-image] wrote public/images/og-image.jpg — ${out.width}x${out.height}, ${out.size} bytes`);
