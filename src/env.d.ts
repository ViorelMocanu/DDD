// The page markup is kept identical to the legacy site, which uses a few attributes the HTML typings do not know.
// Declaring them here keeps `astro check` strict for everything else.
declare namespace astroHTML.JSX {
	interface SVGAttributes {
		alt?: string;
		title?: string;
		itemprop?: string;
	}
	interface HTMLAttributes {
		content?: string;
		type?: string;
	}
	interface SourceHTMLAttributes {
		loading?: string;
	}
}
