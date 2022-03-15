/***************************************************/
/* DeDeDe.ro                                       */
/* Surse și detalii se găsesc pe:                  */
/* https://github.com/ViorelMocanu/DDD             */
/*                                                 */
/***************************************************/
/* INIȚIALIZARE                                    */
console.info('Inițializez aplicația...');

/***************************************************/
/* FORMULAR DE CONTACT                             */
/* Inițializare de variabile                       */
window.dataLayer = window.dataLayer || [];
const body = document.body;
if (window.location.href.indexOf('contact') > -1) {

	const form = document.getElementById('sideform');
	const regexMail = /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
	const regexPhone = /^[0-9]{3,24}$/;
	let raspuns = document.getElementById('raspuns');
	var el_side_name = document.getElementById('side_name');
	var el_side_email = document.getElementById('side_email');
	var el_side_telephone = document.getElementById('side_telephone');
	var el_side_tip = document.getElementById('side_tip');
	var el_side_mesaj = document.getElementById('side_mesaj');
	let side_name = el_side_name ? el_side_name.value : '';
	let side_email = el_side_email ? el_side_email.value : '';
	let side_telephone = el_side_telephone ? el_side_telephone.value : '';
	let side_tip = el_side_tip ? el_side_tip.value : 0;
	let side_mesaj = el_side_mesaj ? el_side_mesaj.value : '';

	// @TODO de ce iau valoarea la dom ready?
	var el_side_submit = document.getElementById('side_submit');
	var el_side_submit_text = document.getElementById('side_submit_text');

	// console.log('VARIABILE:', side_name, side_email, side_telephone, side_tip, side_mesaj);

	/* Funcția care face handling event-ului de form send */
	var trimiteFormular = function (event) {
		/* Inițializare */
		event.preventDefault();
		let deTrimis = true;
		let focused = 100;
		let focusedObj = false;
		side_name = el_side_name.value;
		side_email = el_side_email.value;
		side_telephone = el_side_telephone.value;
		side_tip = el_side_tip.value;
		side_mesaj = el_side_mesaj.value;
		// console.log('VARIABILE:', side_name, side_email, side_telephone, side_tip, side_mesaj);
		const notRequiredFields = ['side_mesaj'];
		window.dataLayer.push({
			'event': 'formularInitializat'
		});
		console.group('Formularul de contact');
		console.warn('Trimiterea de formular s-a inițializat!');
		form.classList.remove("Errors");
		form.classList.add("Sending");
		el_side_submit_text.innerHTML = 'Formularul se trimite...';

		/* Loop-ul de valiare a input-urilor client-side, pentru input-urile selectate */
		var inputuri = document.querySelectorAll('.ContactForm input,.ContactForm textarea,.ContactForm select');
		for (var i = 0; i < inputuri.length; i++) {
			/* Dacă input-ul nu satisface condițiile, treci mai departe */
			var inputObj = inputuri[i];
			if (inputObj.classList.contains('Hidden')) continue;
			var id = inputObj.getAttribute('id');
			if (notRequiredFields.indexOf(id) > -1) continue;
			/* Inițializare */
			var parinte = inputObj.parentNode;
			parinte.classList.remove('Eroare');
			var conditii = (
				inputObj.value == '' ||
				inputObj.value == 'null' ||
				inputObj.value == undefined ||
				inputObj.value.length < 1 ||
				(id == 'side_email' && !regexMail.test(inputObj.value)) ||
				(id == 'side_tip' && inputObj.getAttribute('selectedIndex') == 0) ||
				(id == 'side_telephone' && !regexPhone.test(inputObj.value))
			);
			if (conditii) {
				// console.log(id, 'eroare');
				parinte.classList.add('Eroare');
				if (inputObj.getAttribute('tabindex') < focused) {
					if (focusedObj) focusedObj.blur();
					inputObj.focus();
					focusedObj = inputObj;
					focused = parseInt(inputObj.getAttribute('tabindex'));
				}
				deTrimis = false;
			}
		}

		if (!deTrimis) {
			alert('Te rugăm să completezi corect câmpurile din formular!');
			el_side_submit_text.innerHTML = 'Retrimite formularul &rarr;';
			form.classList.remove("Sending");
			form.classList.add("Errors");
		} else {
			console.warn('Validarea client-side s-a terminat cu succes...');
			for (var i = 0; i < inputuri.length; i++) {
				/* Dacă input-ul nu satisface condițiile, treci mai departe */
				var inputObj = inputuri[i];
				if (inputObj.classList.contains('Hidden')) continue;
				var id = inputObj.getAttribute('id');
				if (notRequiredFields.indexOf(id) > -1) continue;
				/* Scoate clasele de eroare de pe toate input-urile */
				var parinte = inputObj.parentNode;
				parinte.classList.remove('Eroare');
			}
			form.classList.add("Sending");
			form.classList.remove("Errors");

			var theData = ({
				side_name: side_name,
				side_email: side_email,
				side_telephone: side_telephone,
				side_tip: side_tip,
				side_mesaj: side_mesaj,
				datasent: 'true',
				tech: 'ajax',
				utm_source: document.getElementById('utm_source').value,
				utm_medium: document.getElementById('utm_medium').value,
				utm_term: document.getElementById('utm_term').value,
				utm_content: document.getElementById('utm_content').value,
				utm_campaign: document.getElementById('utm_campaign').value,
				gclid: document.getElementById('gclid').value
			});
			const urlAjax = 'https://dedede.ro/sideform.php';
			raspuns.innerHTML = '<progress class="Progress" id="progres" max="4" value="1">Trimitem datele...</progress>';

			postData(theData);
		}
		return false;
	};
	form.addEventListener('submit', trimiteFormular, true);
	/* Funcția asincronă activată la fetch către PHP   */
	async function postData(theData) {
		const options = {
			method: 'POST',
			body: JSON.stringify(theData),
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			}
		}
		function isJson(str) {
			try {
				JSON.parse(str);
			} catch (e) {
				return false;
			}
			return true;
		}
		function gtag() { window.dataLayer.push(arguments); }
		console.warn('Trimiterea de date a fost începută...');
		const urlAjax = 'https://dedede.ro/sideform.php';
		const response = await fetch(urlAjax, options)
			.then((response) => response.text())
			.then((messages) => {
				// console.log(messages);
				if (isJson(messages)) {
					const dataJson = JSON.parse(messages);
					raspuns = document.getElementById('raspuns');
					raspuns.innerHTML = dataJson.message;
					console.warn('Am primit răspuns de la server!');
					window.dataLayer = window.dataLayer || [];
					window.dataLayer.push({
						'event': 'formularTrimis'
					});
					gtag('event', 'conversion', { 'send_to': 'AW-10780123066/z7EnCLOqwPcCELq_rpQo' });
					console.warn('Eveniment succes: formularTrimis');
					flashEroare(true);
				} else {
					raspuns.innerHTML = messages;
					window.dataLayer = window.dataLayer || [];
					window.dataLayer.push({
						'event': 'formularEroare'
					});
					console.error('Eveniment eroare: formularEroare');
					flashEroare(false);
				}
			});
		console.log(response);
	}
	/* Funcția activată la răspunsul serverului        */
	function flashEroare(daSauNu) {
		window.dataLayer = window.dataLayer || [];
		if (el_side_submit_text === undefined)
			var el_side_submit_text = document.getElementById('side_submit_text');
		if (form === undefined)
			var form = document.getElementById('sideform');
		if (daSauNu) {
			console.info('%c Formularul a fost trimis cu succes!', 'color: #0a0');
			el_side_submit_text.innerHTML = 'Formularul a fost trimis!';
			el_side_submit_text.setAttribute('disabled', 'disabled');
			form.classList.remove("Sending");
			form.classList.remove("Errors");
			form.classList.add("Success");
			window.dataLayer.push({
				'event': 'conversieAcceptata'
			});
			console.warn('Eveniment succes: conversieAcceptata');
		} else {
			console.error('Formularul a răspuns cu o eroare pe server!');
			el_side_submit_text.innerHTML = 'Retrimite formularul &rarr;';
			form.classList.remove("Sending");
			form.classList.add("Errors");
			window.dataLayer.push({
				'event': 'formularEroare'
			});
			console.error('Eveniment eroare: formularEroare 2');
		}
		console.groupEnd();
	}
}

/************************************************************/
/* ARTIFICII DE NAVIGARE                                    */
/* Toggle de meniu principal                                */
const menuToggle = document.getElementById('menuToggle');
const mainMenuParent = document.getElementById('header');
menuToggle.addEventListener('click', () => {
	mainMenuParent.classList.toggle('Active');
});
/* Intersection observer pentru back to top link visibility */
const hero = document.getElementsByClassName('Hero')[0];
const config = {
	rootMargin: '0px 0px 1500px 0px',
	threshold: 0
};
let scroll = new IntersectionObserver(function (entries, self) {
	entries.forEach(entry => {
		if (entry.isIntersecting) {
			body.classList.add('HideBackTop');
		} else {
			body.classList.remove('HideBackTop');
		}
	});
}, config);
scroll.observe(hero);
/* Mutation observer pentru ștergerea clasei Active de pe meniu */
const mediaQuery = window.matchMedia('(min-width:850px)');
mediaQuery.onchange = (e) => {
	if (e.matches) {
		document.getElementById('header').classList.remove('Active');
	}
};

/***************************************************/
/* DARK MODE                                       */
/* verifică dacă 'darkMode' există în localStorage */
let darkMode = localStorage.getItem('darkMode');
const darkModeToggle = document.getElementById('darkMode');
const enableDarkMode = () => {
	/* Adaugă / scoate clasa pe / de pe body */
	document.body.classList.add('darkmode');
	document.body.classList.remove('lightmode');
	/* Setează variabila corectă în local storage */
	localStorage.setItem('darkMode', 'enabled');
};
const disableDarkMode = () => {
	/* Adaugă / scoate clasa pe / de pe body */
	document.body.classList.remove('darkmode');
	document.body.classList.add('lightmode');
	/* Setează variabila corectă în local storage */
	localStorage.setItem('darkMode', 'disabled');
};
/* Dacă userul a vizitat site-ul în trecut și a inițializat darkMode, setează-l corect */
if (darkMode === 'enabled') {
	enableDarkMode();
} else if (darkMode === 'disabled') {
	disableDarkMode();
}
/* Dacă userul dă click pe buton */
darkModeToggle.addEventListener('click', () => {
	/* Ia valoarea din localstorage */
	darkMode = localStorage.getItem('darkMode');
	/* Dacă nu e activat, activează-l */
	if (darkMode !== 'enabled') {
		enableDarkMode();
	/* Altfel, dezactivează-l */
	} else {
		disableDarkMode();
	}
});

/************************************/
/* PWA                              */
/* Instanțierea service worker-ului */
/*if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').then(function (registration) {
    console.log('Service worker registration succeeded:', registration);
  },
  // catch
  function (error) {
    console.log('Service worker registration failed:', error);
  });
} else {
  console.log('Service workers are not supported.');
}*/

/************************************/
/* Google Tag Manager               */
console.log('Pornesc Google Tag Manager');
(function (w, d, s, l, i) {
	w[l] = w[l] || [];
	w[l].push({
		'gtm.start': new Date().getTime(), event: 'gtm.js'
	});
	let f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
	j.async = true;
	j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
	// j.integrity = 'sha384-XpJJ3Pui8gxNDLc6NU2EYl3hzFNr0ay6UVRxtOOeA2+x26vawSvDsxfHRr6GAIXE';
	// j.crossOrigin = 'anonymous';
	f.parentNode.insertBefore(j, f);
	console.log('Am pornit Google Tag Manager');
})(window, document, 'script', 'dataLayer', 'GTM-NGTSNLX');
/************************************/
/* Google Ads                       */
console.log('Pornesc Google Ads');
(function (w, d, s, l, i) {
	w[l] = w[l] || [];
	function gtag() { w[l].push(arguments); }
	gtag('js', new Date());
	gtag('config', 'AW-10780123066');
	let f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
	j.async = true;
	j.src = 'https://www.googletagmanager.com/gtag/js?id=' + i;
	f.parentNode.insertBefore(j, f);
	console.log('Am pornit Google Ads');
})(window, document, 'script', 'dataLayer', 'AW-10780123066');