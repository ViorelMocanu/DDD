<script>
  import style from '../../assets/style.css';
  export let templateHtml;
  //export const settings;
  console.info('init: layout');
</script>

<style>
</style>

<svelte:head>
  <!-- test 1234567 -->
  <!-- SEO -->
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta property="og:title" content="@TODO" /><!-- @TODO -->
  <meta property="og:description" content="@TODO" /><!-- @TODO -->
  <meta property="og:site_name" content="@TODO" /><!-- @TODO -->
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="ro_RO" />
  <meta property="og:url" content="@TODO" /><!-- @TODO -->
  <meta property="og:image" content="./og-image.jpg" /><!-- @TODO -->
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="@TODO" /><!-- @TODO -->
  <meta property="article:publisher" content="@TODO" /><!-- @TODO -->
  <meta property="article:section" content="@TODO" /><!-- @TODO -->
  <meta property="article:published_time" content="2021-06-13T23:27:55+03:00" /><!-- @TODO -->
  <meta property="article:modified_time" content="2021-06-13T23:27:57+03:00" /><!-- @TODO -->
  <meta name="twitter:site" content="@ViorelMocanu" /><!-- @TODO -->
  <meta name="twitter:creator" content="@ViorelMocanu" /><!-- @TODO -->
  <meta name="twitter:card" content="summary_large_image" />

  <!-- design -->
  <link rel="icon" type="image/png" sizes="32x32" href="./favicon-32x32.png" /><!-- @TODO -->
  <link rel="icon" type="image/png" sizes="16x16" href="./favicon-16x16.png" /><!-- @TODO -->
  <link rel="icon" type="image/x-icon" href="./favicon.ico" /><!-- @TODO -->
  <link rel="icon" type="image/svg+xml" href="./favicon.svg" /><!-- @TODO -->
  <link rel="apple-touch-icon" href="./apple-touch-icon.png" /><!-- @TODO -->
  <link rel="mask-icon" href="./safari-pinned-tab.svg" color="#4f6df5" /><!-- @TODO -->
  <meta name="msapplication-TileColor" content="#ffffff" /><!-- @TODO -->
  <link rel="manifest" href="./my.webmanifest" /><!-- @TODO -->
  <meta name="apple-mobile-web-app-title" content="@TODO" /><!-- @TODO -->
  <meta name="application-name" content="@TODO" /><!-- @TODO -->
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-touch-fullscreen" content="yes" />
  <meta name="theme-color" content="#ffffff" /><!-- @TODO -->
  <link rel="stylesheet" href="./style.css" media="all" />

  <!-- optimize -->
  <link rel="preload" href="./Inter-roman.var.woff2?v=3.18" as="font" type="font/woff2" crossorigin /><!-- @TODO -->
</svelte:head>

<div class="Container">
  {@html templateHtml}
</div>
<div class="footer">test 123</div>
