declare global {
	interface Window {
		dataLayer: unknown[];
		gtag: (...argumente: unknown[]) => void;
	}
}

const GTM_ID = "GTM-NGTSNLX";
const ADS_ID = "AW-10780123066";

/** Google's tag library only understands the raw `arguments` object, not an array. */
function gtag(..._argumente: unknown[]): void {
	// eslint-disable-next-line prefer-rest-params
	window.dataLayer.push(arguments);
}

function incarca(src: string): void {
	const script = document.createElement("script");
	script.async = true;
	script.src = src;
	document.head.append(script);
}

/** Starts Tag Manager and the Ads tag. `window.gtag` is shared with the contact form script, as in Google's own snippet. */
export function pornesteAnalytics(): void {
	window.dataLayer = window.dataLayer || [];
	window.gtag = gtag;
	window.dataLayer.push({ "gtm.start": Date.now(), "event": "gtm.js" });
	incarca(`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`);
	gtag("js", new Date());
	gtag("config", ADS_ID);
	incarca(`https://www.googletagmanager.com/gtag/js?id=${ADS_ID}`);
}
