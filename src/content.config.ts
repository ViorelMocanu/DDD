// src/content.config.ts
// Astro v6 content collection config.
// NOTE: This file lives at src/content.config.ts — NOT src/content/config.ts.
// Astro v6 moved the config file and introduced the glob() loader API.
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
// Import `z` from "astro/zod" (the full bundled Zod namespace) rather than the `z`
// re-exported from "astro:content", which Astro v6 deprecates. It is the same Zod instance
// Astro uses internally, so the schema stays fully compatible — and adds no new dependency.
import { z } from "astro/zod";

const blog = defineCollection({
	loader: glob({ pattern: "**/[^_]*.md", base: "./src/content/blog" }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		excerpt: z.string(),
		// Bare YYYY-MM-DDTHH:MM:SS, NO timezone, NO coerce.
		// Must pass through verbatim to article:published_time (SPEC §6).
		// z.coerce.date() would reformat and break parity — DO NOT change this.
		date: z.string(),
		author: z.string(),
		thumbnail: z.object({
			// Basename; page component appends -desktop.webp / -mobile.webp / -mobile.jpg
			name: z.string(),
			alt: z.string(),
		}),
		ogimage: z.object({
			// Root-relative, e.g. /images/totul-despre-dezinsectie-og.jpg
			url: z.string(),
			alt: z.string(),
		}),
		// Absent in frontmatter; defaults to `date` at use site.
		modifiedDate: z.string().optional(),
	}),
});

export const collections = { blog };
