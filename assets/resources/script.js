console.info('Inițializez aplicația...');

/* Toggle de meniu principal */
const menuToggle = document.getElementById('menuToggle');
const mainMenuParent = document.getElementById('header');
menuToggle.addEventListener('click', () => {
  mainMenuParent.classList.toggle('Active');
});

/* mutation observer pentru ștergerea clasei Active de pe meniu */
const mediaQuery = window.matchMedia('(min-width:850px)');
mediaQuery.onchange = (e) => {
  if (e.matches) {
    document.getElementById('header').classList.remove('Active');
  }
};

// check for saved 'darkMode' in localStorage
let darkMode = localStorage.getItem('darkMode');

const darkModeToggle = document.getElementById('darkMode');

const enableDarkMode = () => {
  // 1. Add the class to the body
  document.body.classList.add('darkmode');
  document.body.classList.remove('lightmode');
  // 2. Update darkMode in localStorage
  localStorage.setItem('darkMode', 'enabled');
};

const disableDarkMode = () => {
  // 1. Remove the class from the body
  document.body.classList.remove('darkmode');
  document.body.classList.add('lightmode');
  // 2. Update darkMode in localStorage
  localStorage.setItem('darkMode', 'disabled');
};

// If the user already visited and enabled darkMode
// start things off with it on
if (darkMode === 'enabled') {
  enableDarkMode();
} else if (darkMode === 'disabled') {
  disableDarkMode();
}

// When someone clicks the button
darkModeToggle.addEventListener('click', () => {
  // get their darkMode setting
  darkMode = localStorage.getItem('darkMode');

  // if it not current enabled, enable it
  if (darkMode !== 'enabled') {
    enableDarkMode();
    // if it has been enabled, turn it off
  } else {
    disableDarkMode();
  }
});

/* instanțierea service worker-ului */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').then(function (registration) {
    console.log('Service worker registration succeeded:', registration);
  }, /*catch*/ function (error) {
    console.log('Service worker registration failed:', error);
  });
} else {
  console.log('Service workers are not supported.');
}

// Google Tag Manager
console.log('Pornesc Google Tag Manager');
(function (w, d, s, l, i) {
  w[l] = w[l] || [];
  w[l].push({
    'gtm.start': new Date().getTime(), event: 'gtm.js'
  });
  let f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
  j.async = true;
  j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
  f.parentNode.insertBefore(j, f);
  console.log('Am pornit Google Tag Manager');
})(window, document, 'script', 'dataLayer', 'GTM-NGTSNLX');