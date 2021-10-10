<script>
	import style from '../../assets/resources/style.css';
	import DeHeader from '../components/DeHeader.svelte';
	import DeFooter from '../components/DeFooter.svelte';
	import { onMount } from 'svelte';
	export let templateHtml, helpers, request;

	let scriptReady = false;
	let mounted = false;

	onMount(() => {
		mounted = true;
		if (scriptReady) {
			loadScriptElements();
		}
	});

	function scriptLoaded() {
		scriptReady = true;
		if (mounted) {
			loadScriptElements();
		}
	}

	function loadScriptElements() {
		console.log('loadScriptElements ran');
	}
</script>

<svelte:head>
	<!-- optimize -->
	<link rel="preload" href="/resources/archivo-var.woff2" as="font" type="font/woff2" crossorigin />

	<!-- SEO -->
	<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
	<meta name="og:site_name" content="DeDeDe.ro" />
	<meta name="og:type" content="website" />
	<meta name="og:locale" content="ro_RO" />
	<meta name="og:image:width" content="1200" />
	<meta name="og:image:height" content="630" />
	<meta name="og:email" content="contact@dedede.ro" />
	<meta name="og:phone_number" content="+40749263606" />
	<meta name="article:publisher" content="DeDeDe.ro" />
	<meta name="fb:app_id" content="811489239521802" />
	<meta name="twitter:site" content="@TODO" />
	<meta name="twitter:creator" content="@TODO" />
	<meta name="twitter:card" content="summary_large_image" />

	<!-- design -->
	<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
	<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
	<link rel="icon" type="image/x-icon" href="/favicon.ico" />
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
	<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#00214d" />
	<meta name="msapplication-TileColor" content="#fde24f" />
	<link rel="manifest" href="/site.webmanifest" />
	<meta name="apple-mobile-web-app-title" content="DeDeDe.ro - Spații fără dăunători" />
	<meta name="application-name" content="DeDeDe.ro" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="default" />
	<meta name="mobile-web-app-capable" content="yes" />
	<meta name="apple-touch-fullscreen" content="yes" />
	<meta name="theme-color" content="#fde24f" />
</svelte:head>

<svelte:body itemscope itemtype="https://schema.org/WebPage" />

<div class="Container">
	<a href="#continut" class="ScreenReaders">Sari la conținut</a>
	<DeHeader {helpers} {request} />
	<a href="#header" id="continut" class="ScreenReaders">Accesează meniul</a>
	{@html templateHtml}
	<DeFooter {helpers} {request} />
	<script defer src="/resources/script.js" on:load={scriptLoaded}></script>
	<noscript>
		<iframe id="noScriptIframe" title="Google Tag Manager Non-scripting Inject" src="https://www.googletagmanager.com/ns.html?id=GTM-NGTSNLX" height="0" width="0" sandbox="allow-same-origin allow-scripts allow-forms allow-popups" />
	</noscript>
</div>
