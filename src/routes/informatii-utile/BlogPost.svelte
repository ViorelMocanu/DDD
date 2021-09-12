<script>
  import DataCitibila from '../../components/DataCitibila.svelte';
  import TimpCitire from '../../components/TimpCitire.svelte';
  export let data, helpers, request, settings; // data is mainly being populated from the @elderjs/plugin-markdown
  const { html, frontmatter } = data;

  //console.log('REQUEST BLOGPOST = ', request);
</script>

<svelte:head>
  <title>{frontmatter.title}</title>
  <meta name="description" content={frontmatter.description} />
  <link rel="canonical" href="{settings.origin}{request.permalink}" />
  <meta property="og:title" content={frontmatter.title} />
  <meta property="og:description" content={frontmatter.description} />
  <meta property="og:url" content="{settings.origin}{request.permalink}" />
  <meta property="og:image" content={frontmatter.ogimage.url} />
  <meta property="og:image:alt" content={frontmatter.ogimage.alt} />
  <meta property="article:published_time" content={frontmatter.date} />
  <meta property="article:modified_time" content={frontmatter.date} />
</svelte:head>

<section class="Hero">
  {#if frontmatter.thumbnail}
    <picture class="BigArticlePicture">
      <source type="image/webp" srcset="/images/{frontmatter.thumbnail.name}-desktop.webp" media="(min-width: 850px)" />
      <source type="image/webp" srcset="/images/{frontmatter.thumbnail.name}-mobile.webp" media="(min-width: 100px)" />
      <img
        class="BigArticleImg"
        src="/images/{frontmatter.thumbnail.name}-mobile.jpg"
        alt={frontmatter.thumbnail.alt}
        width="280"
        height="157" />
    </picture>
  {/if}
</section>
<section class="BigArticle LimitWidth">
  <div class="ArticlePreMeta">
    <p>Articol scris pe <strong><DataCitibila dataNecitibila={frontmatter.date} eScurta={false} /></strong></p>
    <p>Timp de citire estimat: <strong><TimpCitire textOriginal={html} /> min.</strong></p>
  </div>
  <h1 class="BigArticleTitle">{frontmatter.title}</h1>
  {#if frontmatter.author}<p class="ArticleAuthor">Articol scris de {frontmatter.author}</p>{/if}
  <p class="BigArticleIntro">{frontmatter.excerpt}</p>
  {#if html}
    {@html html}
  {:else}
    <h2>Ne pare rău, nu am găsit articolul Markdown!</h2>
  {/if}
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
