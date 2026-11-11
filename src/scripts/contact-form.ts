// Runs only on /contact/. It has no imports on purpose: Astro puts a small script without imports straight into the page,
// which saves a phone on a slow connection two requests. `window.dataLayer` and `window.gtag` are set up by analytics.ts.
const ENDPOINT = "/sideform.php";
const ADS_CONVERSIE = "AW-10780123066/z7EnCLOqwPcCELq_rpQo";
const REGEX_EMAIL = /^([a-zA-Z0-9_.\-+])+@(([a-zA-Z0-9-])+\.)+[a-zA-Z0-9]{2,}$/;
// The same rule as in public/sideform.php: spaces, dots, dashes and brackets are ignored, then 9 to 15 digits with an optional +.
const REGEX_TELEFON = /^\+?[0-9]{9,15}$/;
const SEPARATORI_TELEFON = /[\s.\-()]+/g;
const CAMPURI_URMARIRE = ["utm_source", "utm_medium", "utm_term", "utm_content", "utm_campaign", "gclid"] as const;
const CAMPURI_OPTIONALE = new Set(["side_mesaj"]);
const TEXT_RETRIMITE = "Retrimite formularul →";

type Camp = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

interface Raspuns {
	error?: string;
	message?: string;
	errors?: { text?: string }[];
}

function eveniment(nume: string, date: Record<string, string> = {}): void {
	window.dataLayer.push({ event: nume, ...date });
}

function eInvalid(camp: Camp): boolean {
	if (camp.value === "") return true;
	if (camp.id === "side_email") return !REGEX_EMAIL.test(camp.value);
	if (camp.id === "side_telephone") return !REGEX_TELEFON.test(camp.value.replace(SEPARATORI_TELEFON, ""));
	return false;
}

/** Server messages may carry links; only their text is shown. */
function doarText(html: string): string {
	return new DOMParser().parseFromString(html, "text/html").body.textContent ?? "";
}

function porneste(form: HTMLFormElement): void {
	const textButon = document.getElementById("side_submit_text");
	const raspuns = document.getElementById("raspuns");

	const valoare = (id: string): string => form.querySelector<Camp>(`#${id}`)?.value ?? "";

	const stare = (nume: "Sending" | "Errors" | "Success", text: string): void => {
		form.classList.remove("Sending", "Errors", "Success");
		form.classList.add(nume);
		if (textButon) textButon.textContent = text;
	};

	/** Marks invalid fields and focuses the first one. Returns whether the form can be sent. */
	const valideaza = (): boolean => {
		let primul: Camp | undefined;
		for (const camp of form.querySelectorAll<Camp>("input, textarea, select")) {
			if (camp.classList.contains("Hidden") || CAMPURI_OPTIONALE.has(camp.id)) continue;
			const invalid = eInvalid(camp);
			camp.parentElement?.classList.toggle("Eroare", invalid);
			if (invalid) primul ??= camp;
		}
		primul?.focus();
		return !primul;
	};

	const arataEroare = (mesaj: string): void => {
		if (raspuns) raspuns.textContent = mesaj;
		stare("Errors", TEXT_RETRIMITE);
		eveniment("formularEroare");
	};

	const trimite = async (): Promise<void> => {
		const date: Record<string, string> = { datasent: "true", side_url: window.location.href };
		for (const id of ["side_name", "side_email", "side_telephone", "side_tip", "side_mesaj", "side_verificare", ...CAMPURI_URMARIRE]) date[id] = valoare(id);

		let rezultat: Raspuns;
		try {
			const raspunsServer = await fetch(ENDPOINT, { method: "POST", body: JSON.stringify(date), headers: { "Content-Type": "application/json", "Accept": "application/json" } });
			rezultat = ((await raspunsServer.json()) ?? {}) as Raspuns;
		} catch {
			arataEroare("Nu am putut trimite formularul. Te rugăm să încerci din nou sau să ne suni.");
			return;
		}

		if (rezultat.error !== "false") {
			const motive = (rezultat.errors ?? []).map((eroare) => doarText(eroare.text ?? "")).join(", ");
			arataEroare(`${rezultat.message ?? ""}${motive}`);
			return;
		}

		if (raspuns) raspuns.textContent = rezultat.message ?? "";
		// The problem type is one of the fixed options, so it can feed audiences without carrying personal data.
		eveniment("formularTrimis", { tip_problema: valoare("side_tip") });
		window.gtag("event", "conversion", { send_to: ADS_CONVERSIE });
		stare("Success", "Formularul a fost trimis!");
		eveniment("conversieAcceptata");
	};

	// Campaign parameters from the landing URL travel with the lead.
	const parametri = new URLSearchParams(window.location.search);
	for (const id of CAMPURI_URMARIRE) {
		const camp = form.querySelector<HTMLInputElement>(`#${id}`);
		if (camp) camp.value = parametri.get(id) ?? "";
	}

	form.addEventListener("submit", (trimitere) => {
		trimitere.preventDefault();
		eveniment("formularInitializat");
		stare("Sending", "Formularul se trimite...");

		if (!valideaza()) {
			alert("Te rugăm să completezi corect câmpurile din formular!");
			stare("Errors", TEXT_RETRIMITE);
			return;
		}

		const progres = document.createElement("progress");
		progres.className = "Progress";
		progres.id = "progres";
		progres.max = 4;
		progres.value = 1;
		progres.textContent = "Trimitem datele...";
		raspuns?.replaceChildren(progres);
		void trimite();
	});
}

const formular = document.querySelector<HTMLFormElement>("#sideform");
if (formular) porneste(formular);
