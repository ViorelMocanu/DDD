import { defineConfig } from "astro/config";

export default defineConfig({
	site: "https://dedede.ro",
	trailingSlash: "always",
	build: { inlineStylesheets: "never" },
	compressHTML: true,
	// The articles were written with plain punctuation; keep it byte for byte.
	markdown: { smartypants: false },
});
