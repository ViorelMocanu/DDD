<script>
  import style from '../../resources/style.css';
  import DeHeader from '../components/DeHeader.svelte';
  import DeFooter from '../components/DeFooter.svelte';
  import { onMount } from 'svelte';
  export let templateHtml, data, helpers, request, settings;

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
  <!-- SEO -->
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta property="og:site_name" content="DeDeDe.ro" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="ro_RO" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="article:publisher" content="DeDeDe.ro" />
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

  <!-- optimize -->
  <link rel="preload" href="/resources/archivo-var.woff2" as="font" type="font/woff2" crossorigin />
</svelte:head>

<div class="Container" itemscope itemtype="https://schema.org/WebPage">
  <a href="#continut" class="ScreenReaders">Sari la conținut</a>
  <DeHeader {helpers} {request} />
  <a href="#header" id="continut" class="ScreenReaders">Accesează meniul</a>
  {@html templateHtml}
  <DeFooter {helpers} {request} />
  <script defer src="/resources/script.js" on:load={scriptLoaded}></script>
</div>
