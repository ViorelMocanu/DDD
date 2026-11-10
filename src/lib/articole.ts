import { type CollectionEntry, getCollection } from "astro:content";
import { numarCuvinte, timpCitire } from "./format";

export interface Articol {
	slug: string;
	date: string;
	data: CollectionEntry<"articole">["data"];
	html: string;
	cuvinte: number;
	minute: number;
}

/** All articles, newest first. */
export async function getArticole(): Promise<Articol[]> {
	const intrari = await getCollection("articole");
	return intrari
		.map((intrare) => {
			const html = intrare.rendered?.html;
			if (!html) throw new Error(`Articolul "${intrare.id}" nu are conținut.`);
			return { slug: intrare.id, date: intrare.data.date, data: intrare.data, html, cuvinte: numarCuvinte(html), minute: timpCitire(html) };
		})
		.sort((a, b) => b.date.localeCompare(a.date));
}
