<script>
  export let data, helpers, request, settings; // data is mainly being populated from the @elderjs/plugin-markdown
  const { html, frontmatter } = data;

  console.log('REQUEST BLOGPOST = ', request);
</script>

<style>
</style>

<svelte:head>
  <title>POST {frontmatter.title}</title>
  <meta name="description" content={frontmatter.excerpt} />
  <link href="{settings.origin}{request.permalink}" rel="canonical" />
</svelte:head>

<section class="Hero">
  {#if frontmatter.thumbnail}
    <picture class="BigArticlePicture">
      <source
        type="image/webp"
        srcset="./images/{frontmatter.thumbnail.name}-desktop.webp"
        media="(min-width: 850px)" />
      <source type="image/webp" srcset="./images/{frontmatter.thumbnail.name}-mobile.webp" media="(min-width: 100px)" />
      <img
        class="BigArticleImg"
        src="./images/{frontmatter.thumbnail.name}-mobile.jpg"
        alt={frontmatter.thumbnail.alt}
        width="280"
        height="157" />
    </picture>
  {/if}
</section>
<section class="BigArticle LimitWidth">
  <h1 class="BigArticleTitle">{frontmatter.title}</h1>
  <p class="BigArticleIntro">{frontmatter.intro}</p>
  {#if html}
    {@html html}
  {:else}
    <h2>Ne pare rău, nu am găsit articolul Markdown!</h2>
  {/if}
  {#if frontmatter.author}<small>By {frontmatter.author}</small>{/if}
</section>
<nav class="BigArticleNav LimitWidth">
  <ol class="BigArticleList">
    <li class="BigArticleItem">
      <a class="BigArticleLink" href="#" title="Mergi la articolul precedent: @TODO">
        <span class="BALstatus">Articolul precedent:</span>
        <strong>Cum scapi de gândacii de bucătărie</strong>
      </a>
    </li>
    <li class="BigArticleItem">
      <a class="BigArticleLink" href="#" title="Mergi la articolul următor: @TODO">
        <span class="BALstatus">Articolul următor:</span>
        <strong>Totul despre Dezinsecție. Ce este și când ai nevoie de ea.</strong>
      </a>
    </li>
  </ol>
</nav>
