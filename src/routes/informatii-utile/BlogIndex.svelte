<script>
  export let data, helpers, request, settings;
  const { html, frontmatter } = data;

  console.log('REQUEST INDEX = ', request);
</script>

<style>
</style>

<svelte:head>
  <title>INDEX HERE</title>
  <link href="{settings.origin}{request.permalink}" rel="canonical" />
</svelte:head>

<a href="/">&LeftArrow; Home</a>

<div class="title">
  <h1>INDEX HERE</h1>
</div>
