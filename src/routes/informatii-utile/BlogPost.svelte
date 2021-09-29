<script>
	import { add_resize_listener } from 'svelte/internal';

	import DataCitibila from '../../components/DataCitibila.svelte';
	import TimpCitire from '../../components/TimpCitire.svelte';
	export let data, helpers, request, settings; // data is mainly being populated from the @elderjs/plugin-markdown
	const { html, frontmatter } = data;

	let articolPrecedent = -1,
		articolUrmator = -1;
	const toateArticolele = data.markdown['informatii-utile'];
	for (let i = 0; i < toateArticolele.length; i++) {
		const articol = toateArticolele[i];
		if (Date.parse(articol.frontmatter.date) < Date.parse(frontmatter.date)) {
			articolPrecedent = i;
			break;
		} else if (Date.parse(articol.frontmatter.date) > Date.parse(frontmatter.date)) {
			articolUrmator = i;
		}
	}
</script>

<svelte:head>
	<title>{frontmatter.title}</title>
	<meta name="description" content={frontmatter.description} />
	<link rel="canonical" href="{settings.origin}{request.permalink}" />
	<meta name="og:title" content={frontmatter.title} />
	<meta name="og:description" content={frontmatter.description} />
	<meta name="og:url" content="{settings.origin}{request.permalink}" />
	<meta name="og:image" content={frontmatter.ogimage.url} />
	<meta name="og:image:alt" content={frontmatter.ogimage.alt} />
	<meta name="article:published_time" content={frontmatter.date} />
	<meta name="article:modified_time" content={frontmatter.date} />
	{#if articolPrecedent >= 0}
		<link rel="prev" href={helpers.permalinks['informatii-utile']({ slug: toateArticolele[articolPrecedent].slug })} />
	{/if}
	{#if articolUrmator >= 0}
		<link rel="next" href={helpers.permalinks['informatii-utile']({ slug: toateArticolele[articolUrmator].slug })} />
	{/if}
</svelte:head>

<article class="ArticleContainer" itemscope itemtype="https://schema.org/Article">
	<section class="Hero" role="banner">
		{#if frontmatter.thumbnail}
			<picture class="BigArticlePicture">
				<source
					type="image/webp"
					srcset="/images/{frontmatter.thumbnail.name}-desktop.webp"
					media="(min-width: 850px)" />
				<source
					type="image/webp"
					srcset="/images/{frontmatter.thumbnail.name}-mobile.webp"
					media="(min-width: 100px)" />
				<img
					class="BigArticleImg"
					src="/images/{frontmatter.thumbnail.name}-mobile.jpg"
					alt={frontmatter.thumbnail.alt}
					itemprop="image"
					loading="lazy"
					width="280"
					height="157" />
			</picture>
		{/if}
	</section>
	<main class="BigArticle LimitWidth">
		<ol class="Breadcrumbs" itemscope itemtype="https://schema.org/BreadcrumbList">
			<li class="BreadcrumbItem" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
				<a class="BreadcrumbLink" itemprop="item" href="/">
					<span class="BreadcrumbText" itemprop="name">DeDeDe.ro</span>
				</a>
				<span class="ScreenReaders" itemprop="position">1</span>
			</li>
			<li class="BreadcrumbItem" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
				<a
					class="BreadcrumbLink"
					itemscope
					itemtype="https://schema.org/WebPage"
					itemprop="item"
					itemid="/informatii-utile/"
					href="/informatii-utile/">
					<span class="BreadcrumbText" itemprop="name">Informații utile</span>
				</a>
				<span class="ScreenReaders" itemprop="position">2</span>
			</li>
			<li class="BreadcrumbItem" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
				<span class="BreadcrumbText" itemprop="name">{frontmatter.title}</span>
				<span class="ScreenReaders" itemprop="position">3</span>
			</li>
		</ol>
		<div class="ArticlePreMeta">
			<p>Articol scris pe <strong itemprop="datePublished" content={frontmatter.date}><DataCitibila dataNecitibila={frontmatter.date} eScurta={false} /></strong></p>
			<p>Timp de citire estimat: <strong><TimpCitire textOriginal={html} /> min.</strong></p>
			<p class="ScreenReaders" itemprop="wordCount">{html.trim().split(/\s+/).length}</p>
		</div>
		<h1 class="BigArticleTitle" itemprop="headline">{frontmatter.title}</h1>
		{#if frontmatter.author}
			<p class="ArticleAuthor">Articol scris de<strong itemprop="author">{frontmatter.author}</strong></p>
		{/if}
		<p class="BigArticleIntro">{frontmatter.excerpt}</p>
		<div class="ArticleBody" itemprop="articleBody">
			{#if html}
				{@html html}
			{:else}
				<h2>Ne pare rău, nu am găsit articolul Markdown!</h2>
			{/if}
		</div>
	</main>
	<aside role="complementary">
		<nav class="BigArticleNav LimitWidth">
			<ol class="BigArticleList">
				{#if articolPrecedent >= 0}
					<li class="BigArticleItem BigArticlePrevious">
						<a
							class="BigArticleLink"
							href={helpers.permalinks['informatii-utile']({ slug: toateArticolele[articolPrecedent].slug })}
							title="Mergi la articolul precedent: {toateArticolele[articolPrecedent].frontmatter.title}">
							<span class="BALstatus">Articolul precedent:</span>
							<strong>{toateArticolele[articolPrecedent].frontmatter.title}</strong>
						</a>
					</li>
				{/if}
				{#if articolUrmator >= 0}
					<li class="BigArticleItem BigArticleNext">
						<a
							class="BigArticleLink"
							href={helpers.permalinks['informatii-utile']({ slug: toateArticolele[articolUrmator].slug })}
							title="Mergi la articolul următor: {toateArticolele[articolUrmator].frontmatter.title}">
							<span class="BALstatus">Articolul următor:</span>
							<strong>{toateArticolele[articolUrmator].frontmatter.title}</strong>
						</a>
					</li>
				{/if}
			</ol>
		</nav>
	</aside>
</article>
