import { dataCitibila, numarCuvinte, timpCitire, vecini } from "../../src/lib/format";
import { describe, expect, test } from "vitest";

describe("dataCitibila", () => {
	test("long form names the month and the time", () => {
		expect(dataCitibila("2021-09-13T19:45:00", false)).toBe("13 Septembrie 2021 la ora 19:45");
	});

	test("short form abbreviates the month to three letters", () => {
		expect(dataCitibila("2021-09-14T11:40:00", true)).toBe("14 Sep 2021");
	});

	test("minutes are zero padded", () => {
		expect(dataCitibila("2022-01-05T08:05:00", false)).toBe("5 Ianuarie 2022 la ora 8:05");
	});

	test("does not depend on the machine time zone", () => {
		expect(dataCitibila("2021-12-31T23:59:00", true)).toBe("31 Dec 2021");
	});
});

describe("timpCitire", () => {
	test("rounds up at 225 words per minute", () => {
		expect(timpCitire(Array(226).fill("cuvânt").join(" "))).toBe(2);
		expect(timpCitire(Array(225).fill("cuvânt").join(" "))).toBe(1);
	});

	test("empty text takes no time", () => {
		expect(timpCitire("")).toBe(0);
	});

	test("numarCuvinte splits on any whitespace", () => {
		expect(numarCuvinte("  unu\n doi\ttrei ")).toBe(3);
	});
});

describe("vecini", () => {
	const articole = [
		{ slug: "nou", date: "2021-09-14T11:40:00" },
		{ slug: "mijloc", date: "2021-09-13T19:45:00" },
		{ slug: "vechi", date: "2021-09-12T19:45:00" },
	];

	test("the middle article has an older and a newer neighbour", () => {
		const { precedent, urmator } = vecini(articole, "mijloc");
		expect(precedent?.slug).toBe("vechi");
		expect(urmator?.slug).toBe("nou");
	});

	test("the newest article has no next one", () => {
		expect(vecini(articole, "nou")).toEqual({ precedent: articole[1], urmator: undefined });
	});

	test("the oldest article has no previous one", () => {
		expect(vecini(articole, "vechi")).toEqual({ precedent: undefined, urmator: articole[1] });
	});

	test("input order does not matter", () => {
		expect(vecini([...articole].reverse(), "mijloc").urmator?.slug).toBe("nou");
	});
});
