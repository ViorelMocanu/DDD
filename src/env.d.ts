/// <reference types="astro/client" />

// JSX intrinsic-attribute widening for parity-baseline markup.
//
// The deployed HTML (parity/baseline/html/<route>/index.html) — the pixel-parity oracle —
// carries a handful of attributes that are valid in the rendered DOM but that Astro's
// strict `astroHTML.JSX` attribute interfaces (astro/tsconfigs/strictest) do not model.
// Removing them from the page bodies would BREAK parity, so we widen the relevant
// interfaces here instead. This changes NO rendered output; it only tells `astro check`
// these attributes are permitted. Each addition corresponds to a concrete baseline usage:
//
//   • SVG `title`     — accessible tooltip on the inline service/meta/button icons
//                       (index.astro, contact.astro, src/components/Articol.astro,
//                       src/pages/[slug].astro heritage). Valid SVG <title> shorthand.
//   • SVG `alt`       — legacy authoring artifact on two meta icons (Articol.astro).
//   • SVG `itemprop`  — schema.org/Service microdata on the three service icons (index.astro).
//   • HTMLAttributes `content`  — schema.org `datePublished` value on <strong> in the legal
//                       pages (confidentialitate / cookies / termeni-si-conditii) and articles.
//   • HTMLAttributes `type`     — list marker on <ul type="disc"> in confidentialitate.astro.
//   • SourceHTMLAttributes `loading` — eager/lazy hint on <picture><source> (Articol.astro).
//   • InputHTMLAttributes `this`     — legacy Svelte-baked attribute preserved verbatim on the
//                       hidden tracking inputs in contact.astro (present in the baseline HTML).
declare namespace astroHTML.JSX {
	interface HTMLAttributes {
		content?: string | undefined | null;
		type?: string | undefined | null;
	}

	interface SVGAttributes {
		title?: string | undefined | null;
		alt?: string | undefined | null;
		itemprop?: string | undefined | null;
	}

	interface SourceHTMLAttributes {
		loading?: "eager" | "lazy" | (string & {}) | undefined | null;
	}

	interface InputHTMLAttributes {
		this?: string | undefined | null;
	}
}
