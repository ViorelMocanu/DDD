<script>
	import DataCitibila from '../../components/DataCitibila.svelte';
	import TimpCitire from '../../components/TimpCitire.svelte';
	export let data, helpers, request, settings;
	const { html, frontmatter } = data;
</script>

<svelte:head>
	<title>Informații utile pentru Dezinsecție, Dezinfecție, Deratizare</title>
	<meta name="description" content="Citește toate articolele scrise de echipa DeDeDe în legătură cu felul cum ai putea și tu să scapi de 🐜 gândaci, 🐀 șobolani, 🦟 ploșnițe sau alți ☠️ dăunători." />
	<link rel="canonical" href="{settings.origin}{request.permalink}" />
	<meta name="og:title" content="Informații utile pentru Dezinsecție, Dezinfecție, Deratizare" />
	<meta name="og:description" content="Citește toate articolele scrise de echipa DeDeDe în legătură cu felul cum ai putea și tu să scapi de 🐜 gândaci, 🐀 șobolani, 🦟 ploșnițe sau alți ☠️ dăunători." />
	<meta name="og:url" content="{settings.origin}{request.permalink}" />
	<meta name="og:image" content="https://dedede.ro/images/og-image-blogindex.jpg" />
	<meta name="og:image:alt" content="DeDeDe.ro - Articole utile despre Dezinfecție, Dezinsecție sau Deratizare" />
	<meta name="article:published_time" content="2021-09-19T19:35:55+03:00" />
	<meta name="article:modified_time" content="2021-09-19T19:35:55+03:00" />
</svelte:head>

<section class="Hero ContentPage" role="banner">
	<div class="HeroContainer IndexHeroContainer LimitWidth">
		<ol class="Breadcrumbs" itemscope itemtype="https://schema.org/BreadcrumbList">
			<li class="BreadcrumbItem" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
				<a class="BreadcrumbLink" itemprop="item" href="/">
					<span class="BreadcrumbText" itemprop="name">DeDeDe.ro</span>
				</a>
				<span class="ScreenReaders" itemprop="position">1</span>
			</li>
			<li class="BreadcrumbItem" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
				<span class="BreadcrumbText" itemprop="name">Informații utile</span>
				<span class="ScreenReaders" itemprop="position">2</span>
			</li>
		</ol>
		<h1 class="HeroTitle">Informații utile</h1>
		<p class="HeroText">Articole folositoare dacă vrei să scapi de 🐜 gândaci, 🐀 șobolani, 🦟 ploșnițe sau alți ☠️ dăunători.</p>
	</div>
</section>

<main>
	<ol class="ArticleIndexList">
		{#each data.markdown['informatii-utile'] as articol}
			<li class="ArticleIndexItem LimitWidth">
				<a
					class="ArticleIndexLink"
					href={helpers.permalinks['informatii-utile']({ slug: articol.slug })}
					title="Citește articolul {articol.frontmatter.title}">
					{#if articol.frontmatter.thumbnail}
						<picture class="ArticleThumbnail">
							<source
								type="image/webp"
								srcset="/images/{articol.frontmatter.thumbnail.name}-desktop.webp"
								media="(min-width: 850px)"
								loading="lazy" />
							<source
								type="image/webp"
								srcset="/images/{articol.frontmatter.thumbnail.name}-mobile.webp"
								media="(min-width: 100px)"
								loading="lazy" />
							<img
								src="/images/{articol.frontmatter.thumbnail.name}-mobile.jpg"
								alt={articol.frontmatter.thumbnail.alt}
								loading="lazy"
								width="280"
								height="157" />
						</picture>
					{/if}
					<div class="ArticleIndexContent">
						<h2 class="ArticleTitle">{articol.frontmatter.title}</h2>
						{#if articol.frontmatter.author}
							<p class="ArticleAuthor">
								Articol scris de {articol.frontmatter.author}
							</p>
						{/if}
						<p class="ArticleExcerpt">{articol.frontmatter.excerpt}</p>
						<div class="ArticleMeta">
							<div class="ArticleTimestamp">
								<span class="MetaText"><DataCitibila dataNecitibila={articol.frontmatter.date} eScurta={true} /></span>
								<svg
									class="ButtonIcon"
									width="20"
									height="20"
									viewBox="0 0 30 30"
									xmlns="http://www.w3.org/2000/svg"
									title="Data publicării articolului">
									<path
										d="M13.3333 12.2224H11.111C10.4977 12.2224 10 12.7197 10 13.3334V14.4444C10 15.058 10.4977 15.5554 11.111 15.5554H13.3333C13.947 15.5554 14.4443 15.058 14.4443 14.4444V13.3334C14.4443 12.7197 13.947 12.2224 13.3333 12.2224Z" />
									<path
										d="M18.889 12.2224H16.6667C16.053 12.2224 15.5557 12.72 15.5557 13.3334V14.4444C15.5557 15.058 16.053 15.5554 16.6667 15.5554H18.889C19.5027 15.5554 20 15.058 20 14.4444V13.3334C20 12.7197 19.5027 12.2224 18.889 12.2224Z" />
									<path
										d="M24.4444 12.2224H22.2224C21.6087 12.2224 21.111 12.72 21.111 13.3334V14.4444C21.111 15.058 21.6087 15.5554 22.2224 15.5554H24.4444C25.058 15.5554 25.5557 15.058 25.5557 14.4444V13.3334C25.5557 12.7197 25.058 12.2224 24.4444 12.2224Z" />
									<path
										d="M7.77767 17.0223H5.55534C4.94167 17.0223 4.44434 17.5197 4.44434 18.1333V19.2443C4.44434 19.858 4.94167 20.3557 5.55534 20.3557H7.77767C8.39134 20.3557 8.88867 19.858 8.88867 19.2443V18.1333C8.889 17.5197 8.39134 17.0223 7.77767 17.0223Z" />
									<path
										d="M13.3333 17.0223H11.111C10.4977 17.0223 10 17.5197 10 18.1333V19.2443C10 19.858 10.4977 20.3557 11.111 20.3557H13.3333C13.947 20.3557 14.4443 19.858 14.4443 19.2443V18.1333C14.4443 17.5197 13.947 17.0223 13.3333 17.0223Z" />
									<path
										d="M18.889 17.0223H16.6667C16.053 17.0223 15.5557 17.5197 15.5557 18.1333V19.2443C15.5557 19.858 16.053 20.3557 16.6667 20.3557H18.889C19.5027 20.3557 20 19.858 20 19.2443V18.1333C20 17.5197 19.5027 17.0223 18.889 17.0223Z" />
									<path
										d="M24.4444 17.0223H22.2224C21.6087 17.0223 21.111 17.5197 21.111 18.1333V19.2443C21.111 19.858 21.6087 20.3557 22.2224 20.3557H24.4444C25.058 20.3557 25.5557 19.858 25.5557 19.2443V18.1333C25.5557 17.5197 25.058 17.0223 24.4444 17.0223Z" />
									<path
										d="M7.77767 21.822H5.55534C4.94167 21.822 4.44434 22.3197 4.44434 22.9334V24.0444C4.44434 24.658 4.94167 25.1554 5.55534 25.1554H7.77767C8.39134 25.1554 8.88867 24.658 8.88867 24.0444V22.9334C8.889 22.32 8.39134 21.822 7.77767 21.822Z" />
									<path
										d="M13.3333 21.822H11.111C10.4977 21.822 10 22.32 10 22.9334V24.0444C10 24.658 10.4977 25.1554 11.111 25.1554H13.3333C13.947 25.1554 14.4443 24.658 14.4443 24.0444V22.9334C14.4443 22.32 13.947 21.822 13.3333 21.822Z" />
									<path
										d="M18.889 21.822H16.6667C16.053 21.822 15.5557 22.3197 15.5557 22.9334V24.0444C15.5557 24.658 16.053 25.1554 16.6667 25.1554H18.889C19.5027 25.1554 20 24.658 20 24.0444V22.9334C20 22.32 19.5027 21.822 18.889 21.822Z" />
									<path
										d="M26.6667 3.33337H25.2777V5.00004C25.2777 6.37837 24.1563 7.50004 22.7777 7.50004C21.3993 7.50004 20.2777 6.37837 20.2777 5.00004V3.33337H17.5V5.00004C17.5 6.37837 16.3787 7.50004 15 7.50004C13.6217 7.50004 12.5 6.37837 12.5 5.00004V3.33337H9.72233V5.00004C9.72233 6.37837 8.601 7.50004 7.22233 7.50004C5.844 7.50004 4.72233 6.37837 4.72233 5.00004V3.33337H3.33333C1.49533 3.33337 0 4.82871 0 6.66671V26.2667C0 28.1047 1.49533 29.6 3.33333 29.6H26.6667C28.5047 29.6 30 28.1047 30 26.2667V6.66671C30 4.82871 28.5047 3.33337 26.6667 3.33337ZM27.7777 26.2667C27.7777 26.8794 27.2793 27.3777 26.6667 27.3777H3.33333C2.72067 27.3777 2.22233 26.8794 2.22233 26.2667V11.111C2.22233 10.4974 2.72 10 3.33333 10H26.6667C27.2803 10 27.7777 10.4974 27.7777 11.111V26.2667Z" />
									<path
										d="M7.22233 6.66667C8.143 6.66667 8.889 5.92033 8.889 5V1.66667C8.889 0.746 8.143 0 7.22233 0C6.302 0 5.55566 0.746 5.55566 1.66667V5C5.55566 5.92033 6.30166 6.66667 7.22233 6.66667Z" />
									<path
										d="M15 6.66667C15.9206 6.66667 16.6666 5.92033 16.6666 5V1.66667C16.6666 0.746 15.9206 0 15 0C14.0796 0 13.3333 0.746 13.3333 1.66667V5C13.3333 5.92033 14.0796 6.66667 15 6.66667Z" />
									<path
										d="M22.7777 6.66667C23.6984 6.66667 24.4444 5.92033 24.4444 5V1.66667C24.4444 0.746 23.6984 0 22.7777 0C21.8574 0 21.111 0.746 21.111 1.66667V5C21.111 5.92033 21.8574 6.66667 22.7777 6.66667Z" />
								</svg>
							</div>
							<div class="ArticleDuration">
								<span class="MetaText"><TimpCitire textOriginal={articol.html} /> min.</span>
								<svg
									class="ButtonIcon"
									width="20"
									height="20"
									viewBox="0 0 20 20"
									fill="currentColor"
									xmlns="http://www.w3.org/2000/svg"
									title="Durata citirii articolului">
									<path
										d="M10 20C8.02219 20 6.08879 19.4135 4.4443 18.3147C2.79981 17.2159 1.51809 15.6541 0.761209 13.8268C0.00433284 11.9996 -0.1937 9.98891 0.192152 8.0491C0.578004 6.10929 1.53041 4.32746 2.92894 2.92894C4.32746 1.53041 6.10929 0.578004 8.0491 0.192152C9.98891 -0.1937 11.9996 0.00433284 13.8268 0.761209C15.6541 1.51809 17.2159 2.79981 18.3147 4.4443C19.4135 6.08879 20 8.02219 20 10C19.997 12.6512 18.9424 15.193 17.0677 17.0677C15.193 18.9424 12.6512 19.997 10 20ZM10 1.91425C8.40079 1.91425 6.83749 2.38847 5.5078 3.27694C4.1781 4.16542 3.14173 5.42824 2.52974 6.90572C1.91775 8.3832 1.75762 10.009 2.06961 11.5775C2.3816 13.1459 3.1517 14.5867 4.28251 15.7175C5.41332 16.8483 6.85407 17.6184 8.42255 17.9304C9.99103 18.2424 11.6168 18.0823 13.0943 17.4703C14.5718 16.8583 15.8346 15.8219 16.7231 14.4922C17.6115 13.1625 18.0858 11.5992 18.0858 10C18.0837 7.85615 17.2312 5.80068 15.7153 4.28475C14.1993 2.76881 12.1439 1.91627 10 1.91425V1.91425ZM15.0421 10.4441C15.0426 10.3183 15.0182 10.1936 14.9703 10.0772C14.9224 9.96088 14.8519 9.85517 14.7629 9.76619C14.6739 9.67721 14.5682 9.60673 14.4519 9.55881C14.3355 9.51089 14.2108 9.48648 14.085 9.48699H10.9571V4.89281C10.9571 4.63896 10.8563 4.39551 10.6768 4.21602C10.4973 4.03652 10.2538 3.93569 10 3.93569C9.74616 3.93569 9.50271 4.03652 9.32322 4.21602C9.14372 4.39551 9.04288 4.63896 9.04288 4.89281V10.4441C9.04288 10.698 9.14372 10.9414 9.32322 11.1209C9.50271 11.3004 9.74616 11.4012 10 11.4012H14.085C14.3388 11.4012 14.5823 11.3004 14.7618 11.1209C14.9413 10.9414 15.0421 10.698 15.0421 10.4441Z"
										fill="currentColor" />
								</svg>
							</div>
						</div>
						<span class="Button">Citește articolul &rarr;</span>
					</div>
				</a>
			</li>
		{/each}
	</ol>
</main>
