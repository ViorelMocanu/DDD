<script>
  // import style from '../../assets/style.css';
  import style from '../../resources/style.css';
  import DeHeader from '../components/DeHeader.svelte';
  import DeFooter from '../components/DeFooter.svelte';
  export let templateHtml, settings;
</script>

<style>
</style>

<svelte:head>
  <!-- setup -->
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />

  <!-- SEO -->
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta property="og:site_name" content="@TODO" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="ro_RO" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="article:publisher" content="@TODO" />
  <meta name="twitter:site" content="@ViorelMocanu" />
  <meta name="twitter:creator" content="@ViorelMocanu" />
  <meta name="twitter:card" content="summary_large_image" />

  <!-- design -->
  <link rel="icon" type="image/png" sizes="32x32" href="./favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="./favicon-16x16.png" />
  <link rel="icon" type="image/x-icon" href="./favicon.ico" />
  <link rel="icon" type="image/svg+xml" href="./favicon.svg" />
  <link rel="apple-touch-icon" href="./apple-touch-icon.png" />
  <link rel="mask-icon" href="./safari-pinned-tab.svg" color="#4f6df5" />
  <meta name="msapplication-TileColor" content="#ffffff" />
  <link rel="manifest" href="./my.webmanifest" />
  <meta name="apple-mobile-web-app-title" content="@TODO" />
  <meta name="application-name" content="@TODO" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-touch-fullscreen" content="yes" />
  <meta name="theme-color" content="#ffffff" />

  <!-- optimize -->
  <link rel="preload" href="@TODO" as="font" type="font/woff2" crossorigin />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="Container">
  <DeHeader />
  {@html templateHtml}
  <DeFooter />
  <script defer src="resources/script.js"></script>
</div>
