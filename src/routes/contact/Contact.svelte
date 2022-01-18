<script>
	import { onMount } from 'svelte';
	export let data, helpers, request, settings;
	//const url = require('url');
	//console.log(request.req.path, request.req.originalUrl, request.req.query, request.req.search);
	//const current_url = new URL();
	/*const search_params = current_url.searchParams;
	const utm_source = search_params.get('utm_source');
	console.log(utm_source);*/
	/*var url_string = window.location.href;
	var url = new URL(url_string);
	var c = url.searchParams.get("c");
	console.log(c);*/
	const urlParams = [];
	let result = null,
		urlAjax = 'https://dedede.ro/sideform.php',
		side_url = settings.origin + request.permalink,
		utm_source = urlParams['utm_source'] != undefined ? urlParams['utm_source'] : '',
		utm_medium = urlParams['utm_medium'] != undefined ? urlParams['utm_medium'] : '',
		utm_term = urlParams['utm_term'] != undefined ? urlParams['utm_term'] : '',
		utm_content = urlParams['utm_content'] != undefined ? urlParams['utm_content'] : '',
		utm_campaign = urlParams['utm_campaign'] != undefined ? urlParams['utm_campaign'] : '',
		gclid = urlParams['gclid'] != undefined ? urlParams['gclid'] : '',
		side_name,
		side_telephone,
		side_email,
		side_tip,
		side_mesaj;

	/*
	function handleMouseOver(e) {
		console.log('mouseover peste ', urlAjax);
	}
	async function doPost(e) {
		e.preventDefault();
		console.log('FORMULAR de trimis la ', urlAjax);
		const datasent = true;
		const res = await fetch(urlAjax, {
			method: 'POST',
			body: JSON.stringify({
				datasent,
				side_name,
				side_telephone,
				side_email,
				side_tip,
				side_mesaj,
				urlAjax,
				side_url,
				utm_source,
				utm_medium,
				utm_term,
				utm_content,
				utm_campaign,
				gclid,
			}),
		});

		const json = await res.json();
		result = JSON.stringify(json);
		console.log(result);
	}
	*/
</script>

<svelte:head>
	<title>Contactează specialiștii în DeDeDe chiar acum!</title>
	<meta name="description" content="Programează-te acum la Dezinfecție, Dezinsecție sau Deratizare! Scapă de 🐜 gândaci, 🐀 șobolani, 🦟 ploșnițe, 🦠 viruși sau alți ☠️ dăunători! București + Ilfov" />
	<link rel="canonical" href="{settings.origin}{request.permalink}" />
	<meta name="og:title" content="Contactează specialiștii în DeDeDe chiar acum!" />
	<meta name="og:description" content="Programează-te acum la Dezinfecție, Dezinsecție sau Deratizare! Scapă de 🐜 gândaci, 🐀 șobolani, 🦟 ploșnițe, 🦠 viruși sau alți ☠️ dăunători! București + Ilfov" />
	<meta name="og:url" content="{settings.origin}{request.permalink}" />
	<meta name="og:image" content="https://dedede.ro/images/og-image-contact.jpg" />
	<meta name="og:image:alt" content="DeDeDe.ro - Programează-te la Dezinsecție, Dezinfecție sau Deratizare" />
	<meta name="article:published_time" content="2021-09-19T19:35:55+03:00" />
	<meta name="article:modified_time" content="2021-09-19T19:35:55+03:00" />
</svelte:head>

<section class="Hero ContentPage" role="banner">
	<div class="HeroContainer LimitWidth">
		<ol class="Breadcrumbs" itemscope itemtype="https://schema.org/BreadcrumbList">
			<li class="BreadcrumbItem" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
				<a class="BreadcrumbLink" itemprop="item" href="/">
					<span class="BreadcrumbText" itemprop="name">DeDeDe.ro</span>
				</a>
				<span class="ScreenReaders" itemprop="position">1</span>
			</li>
			<li class="BreadcrumbItem" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
				<span class="BreadcrumbText" itemprop="name">Contactează-l pe DeDeDe.ro</span>
				<span class="ScreenReaders" itemprop="position">2</span>
			</li>
		</ol>
		<div class="ContactHeroContainer">
			<div class="HeroContent">
				<h1 class="HeroTitle">Contact DeDeDe</h1>
				<p class="HeroText">Vrei să afli cât te costă o deratizare, o dezinfecție sau o dezinsecție? Vrei să scapi de 🐜 gândaci, 🐀 șobolani, 🦟 ploșnițe, 🦠 viruși sau alți ☠️ dăunători? Dă-i datele tale lui DeDeDe în formularul de mai jos și te va contacta în cel mai scurt timp!</p>
			</div>
			<img
				class="HeroImage"
				src="/images/dedede-hero.svg"
				loading="lazy"
				width="130"
				height="328"
				alt="Supereroul DeDeDe este tot timpul la un click distanță, gata să te ajute cu problemele tale de dezinfecție, dezinsecție și deratizare!" />
		</div>
	</div>
</section>
<main class="FormContainer LimitWidth">
	<form id="sideform" class="Form ContactForm" action="{urlAjax}" method="post">
		<fieldset class="Fieldset">
			<legend class="Legend">Introdu datele tale de contact</legend>
			<label class="Label">
				<span class="LabelText">Numele tău complet:</span>
				<input
					id="side_name"
					name="side_name"
					type="text"
					class="Input"
					placeholder="Completează numele aici..."
					maxlength="200"
					required="required"
					aria-required="true"
					autocomplete="on"
					tabindex="1"
					bind:value={side_name} />
			</label>
			<label class="Label">
				<span class="LabelText">Telefonul tău:</span>
				<input
					id="side_telephone"
					name="side_telephone"
					type="tel"
					class="Input"
					placeholder="Completează telefonul aici..."
					maxlength="15"
					required="required"
					aria-required="true"
					autocomplete="on"
					title="Telefonul ar trebui să conțină numai cifre, eventual și simbolul +"
					tabindex="2"
					bind:value={side_telephone} />
			</label>
			<label class="Label">
				<span class="LabelText">Email-ul tău:</span>
				<input
					id="side_email"
					name="side_email"
					type="email"
					class="Input"
					placeholder="Completează email-ul aici..."
					maxlength="200"
					required="required"
					aria-required="true"
					autocomplete="on"
					tabindex="3"
					bind:value={side_email} />
			</label>
		</fieldset>
		<fieldset class="Fieldset">
			<legend class="Legend">Introdu informațiile despre intervenție</legend>
			<label class="Label">
				<span class="LabelText">Tipul problemei:</span>
				<select
					id="side_tip"
					name="side_tip"
					class="Select"
					required="required"
					aria-required="true"
					tabindex="4"
					bind:value={side_tip}
				>
					<option value="">Alege o opțiune...</option>
					<option value="dezinsectie">Dezinsecție</option>
					<option value="dezinfectie">Dezinfecție</option>
					<option value="deratizare">Deratizare</option>
					<option value="all">Nu știu</option>
				</select>
			</label>
			<label class="Label">
				<span class="LabelText">Problema detaliată:</span>
				<textarea
					id="side_mesaj"
					name="side_mesaj"
					class="Textarea"
					rows="15"
					autocomplete="on"
					tabindex="5"
					bind:value={side_mesaj}
				/>
			</label>
		</fieldset>
		<fieldset class="Fieldset CTAFieldset">
			<legend class="Legend Hidden">Trimite un mesaj lui DeDeDe acum</legend>
			<input
				class="Hidden"
				type="hidden"
				id="urlAjax"
				name="urlAjax"
				value="https://dedede.ro/sideform.php"
				bind:this={urlAjax}
			/>
			<input class="Hidden" type="hidden" id="side_url" name="side_url" value="" bind:this={side_url} />
			<input class="Hidden" type="hidden" id="utm_source" name="utm_source" value="" bind:this={utm_source} />
			<input class="Hidden" type="hidden" id="utm_medium" name="utm_medium" value="" bind:this={utm_medium} />
			<input class="Hidden" type="hidden" id="utm_term" name="utm_term" value="" bind:this={utm_term} />
			<input class="Hidden" type="hidden" id="utm_content" name="utm_content" value="" bind:this={utm_content} />
			<input class="Hidden" type="hidden" id="utm_campaign" name="utm_campaign" value="" bind:this={utm_campaign} />
			<input class="Hidden" type="hidden" id="gclid" name="gclid" value="" bind:this={gclid} />

			<output class="Raspuns" name="raspuns" id="raspuns" for="side_name side_telephone side_email side_tip side_mesaj" bind:this={result}>&nbsp;</output>

			<button
				type="submit"
				id="side_submit"
				name="side_submit"
				class="Button ButtonPrimary"
				title="Contactează-mă acum!"
				tabindex="6"
			>
				<span class="ButtonText" id="side_submit_text">Trimite mesajul acum &rarr;</span>
				<svg
					class="ButtonIcon"
					width="30"
					height="30"
					title="Trimite mesajul lui DeDeDe"
					viewBox="0 0 30 30"
					fill="none"
					xmlns="http://www.w3.org/2000/svg">
					<path
						d="M15 30C17.9667 30 20.8668 29.1203 23.3335 27.472C25.8003 25.8238 27.7229 23.4811 28.8582 20.7403C29.9935 17.9994 30.2905 14.9834 29.7118 12.0736C29.133 9.16393 27.7044 6.49119 25.6066 4.3934C23.5088 2.29562 20.8361 0.867006 17.9263 0.288227C15.0166 -0.290551 12.0006 0.00649924 9.25975 1.14181C6.51885 2.27713 4.17618 4.19972 2.52796 6.66645C0.879734 9.13319 0 12.0333 0 15C0 18.9782 1.58035 22.7936 4.3934 25.6066C7.20644 28.4196 11.0217 30 15 30ZM7.698 10.776C7.87591 10.3471 8.18084 9.98301 8.5718 9.73256C8.96277 9.4821 9.42103 9.35733 9.885 9.375C11.583 9.375 13.281 9.375 14.985 9.375C16.689 9.375 18.393 9.375 20.085 9.375C20.5427 9.3556 20.9959 9.47311 21.3865 9.71251C21.7771 9.95191 22.0875 10.3023 22.278 10.719C22.3161 10.7719 22.341 10.8332 22.3506 10.8978C22.3601 10.9623 22.3541 11.0282 22.3329 11.0899C22.3118 11.1516 22.2761 11.2073 22.229 11.2524C22.1819 11.2975 22.1246 11.3306 22.062 11.349L15.3 14.88C15.2146 14.9289 15.1179 14.9547 15.0195 14.9547C14.9211 14.9547 14.8244 14.9289 14.739 14.88L7.887 11.319C7.83354 11.3025 7.78471 11.2736 7.74446 11.2348C7.7042 11.1959 7.67364 11.1481 7.65525 11.0953C7.63686 11.0424 7.63114 10.986 7.63857 10.9305C7.64599 10.8751 7.66635 10.8221 7.698 10.776ZM8.145 13.029C10.275 14.143 12.403 15.253 14.529 16.359C14.672 16.4437 14.8352 16.4885 15.0015 16.4885C15.1678 16.4885 15.331 16.4437 15.474 16.359C17.59 15.249 19.709 14.149 21.831 13.059C21.893 13.0245 21.9597 12.9993 22.029 12.984C22.0855 12.9647 22.1459 12.9598 22.2048 12.9699C22.2637 12.9799 22.3191 13.0046 22.3659 13.0416C22.4128 13.0786 22.4496 13.1268 22.473 13.1817C22.4965 13.2366 22.5057 13.2966 22.5 13.356C22.5 14.77 22.5 16.183 22.5 17.595C22.5172 17.9615 22.5041 18.3287 22.461 18.693C22.3758 19.2371 22.097 19.7322 21.6759 20.0871C21.2548 20.4421 20.7197 20.6331 20.169 20.625C18.777 20.625 17.385 20.625 15.996 20.625H9.879C9.3587 20.6368 8.8496 20.473 8.43378 20.1601C8.01796 19.8471 7.71967 19.4032 7.587 18.9C7.53223 18.7046 7.50299 18.5029 7.5 18.3C7.5 16.668 7.5 15.036 7.5 13.401C7.5 12.99 7.764 12.834 8.145 13.029Z" />
				</svg>
			</button>
		</fieldset>
	</form>
</main>
