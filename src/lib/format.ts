const LUNI = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];
const CUVINTE_PE_MINUT = 225;

/**
 * Formats an article date such as `2021-09-13T19:45:00` for readers.
 * The parts are read straight from the string, so the result never depends on the build machine's time zone.
 */
export function dataCitibila(data: string, scurta: boolean): string {
	const parti = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(data);
	if (!parti) throw new Error(`Dată invalidă: "${data}" (formatul așteptat este AAAA-LL-ZZTHH:MM:SS)`);
	const [, an, luna, zi, ora, minut] = parti;
	const numeLuna = LUNI[Number(luna) - 1];
	if (!numeLuna) throw new Error(`Lună invalidă în data "${data}"`);
	if (scurta) return `${Number(zi)} ${numeLuna.slice(0, 3)} ${an}`;
	return `${Number(zi)} ${numeLuna} ${an} la ora ${Number(ora)}:${minut}`;
}

export function numarCuvinte(text: string): number {
	const curat = text.trim();
	return curat === "" ? 0 : curat.split(/\s+/).length;
}

/** Estimated reading time in whole minutes. */
export function timpCitire(text: string): number {
	return Math.ceil(numarCuvinte(text) / CUVINTE_PE_MINUT);
}

/** The closest older and closest newer article around the one with the given slug. */
export function vecini<T extends { slug: string; date: string }>(articole: readonly T[], slug: string): { precedent: T | undefined; urmator: T | undefined } {
	const cronologic = [...articole].sort((a, b) => a.date.localeCompare(b.date));
	const pozitie = cronologic.findIndex((articol) => articol.slug === slug);
	if (pozitie === -1) return { precedent: undefined, urmator: undefined };
	return { precedent: cronologic[pozitie - 1], urmator: cronologic[pozitie + 1] };
}
