import { pornesteAnalytics } from "./analytics";

const CHEIE_DARK_MODE = "darkMode";
const body = document.body;
const header = document.getElementById("header");

// Main menu toggle; the open state is dropped when the layout switches to the desktop menu.
document.getElementById("menuToggle")?.addEventListener("click", () => header?.classList.toggle("Active"));
window.matchMedia("(min-width:850px)").addEventListener("change", (schimbare) => {
	if (schimbare.matches) header?.classList.remove("Active");
});

// The back-to-top link stays hidden while the hero is near the viewport.
const hero = document.querySelector(".Hero");
if (hero) {
	const observator = new IntersectionObserver(
		(intrari) => {
			for (const intrare of intrari) body.classList.toggle("HideBackTop", intrare.isIntersecting);
		},
		{ rootMargin: "0px 0px 1500px 0px", threshold: 0 },
	);
	observator.observe(hero);
}

function seteazaDarkMode(activ: boolean): void {
	body.classList.toggle("darkmode", activ);
	body.classList.toggle("lightmode", !activ);
	localStorage.setItem(CHEIE_DARK_MODE, activ ? "enabled" : "disabled");
}

// Without a saved choice the stylesheet follows the system colour scheme.
const salvat = localStorage.getItem(CHEIE_DARK_MODE);
if (salvat === "enabled" || salvat === "disabled") seteazaDarkMode(salvat === "enabled");
document.getElementById("darkMode")?.addEventListener("click", () => seteazaDarkMode(localStorage.getItem(CHEIE_DARK_MODE) !== "enabled"));

pornesteAnalytics();
