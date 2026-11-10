import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/** Articles shown under "Informații utile". The file name is the URL: `cum-scapi-de-gandaci.md` is served at `/cum-scapi-de-gandaci/`. */
const articole = defineCollection({
	loader: glob({ pattern: "*.md", base: "./src/content/articole" }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		excerpt: z.string(),
		date: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/, "Folosește formatul AAAA-LL-ZZTHH:MM:SS"),
		author: z.string().optional(),
		thumbnail: z.object({ name: z.string(), alt: z.string() }).optional(),
		ogimage: z.object({ url: z.string(), alt: z.string() }),
	}),
});

export const collections = { articole };
