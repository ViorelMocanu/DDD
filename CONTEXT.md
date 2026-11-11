# Context

## The business

DeDeDe is a mascot brand ("eroul DeDeDe") for a pest-control service in Bucharest and Ilfov. "DDD" is the Romanian trade name for the three services:

| Romanian    | English        | Notes                 |
| ----------- | -------------- | --------------------- |
| Dezinsecție | Insect control | Cockroaches, bed bugs |
| Dezinfecție | Disinfection   | Viruses, bacteria     |
| Deratizare  | Rodent control | Rats, mice            |

Visitors mostly arrive from Google Ads on `/contact/` and then phone, write on WhatsApp or use the form.

## Glossary

| Term             | Meaning                                     |
| ---------------- | ------------------------------------------- |
| Informații utile | The articles section ("useful information") |
| Articol          | An article; one Markdown file               |
| Formular         | The contact form                            |
| Dăunători        | Pests                                       |
| Lead             | A contact-form submission                   |

Code identifiers are in Romanian where the legacy code was (`articole`, `dataCitibila`, `timpCitire`). Keep that convention inside those modules; documentation for agents is in English.

## Routes

| URL                                                         | Source                                                         | Body class         |
| ----------------------------------------------------------- | -------------------------------------------------------------- | ------------------ |
| `/`                                                         | `src/pages/index.astro`                                        | `home`             |
| `/contact/`                                                 | `src/pages/contact.astro`                                      | `contact`          |
| `/informatii-utile/`                                        | `src/pages/informatii-utile.astro`                             | `informatii-utile` |
| `/<article>/`                                               | `src/pages/[slug].astro` + `src/content/articole/<article>.md` | `informatii-utile` |
| `/confidentialitate/`, `/cookies/`, `/termeni-si-conditii/` | `src/pages/*.astro`                                            | same as the route  |
| `/sitemap.xml`                                              | `src/pages/sitemap.xml.ts`                                     |                    |
| `/sideform.php`                                             | `public/sideform.php`                                          |                    |

Articles are served at the root, not under `/informatii-utile/`. Every URL ends with a slash.

## Things that must stay as they are

- Tag Manager container `GTM-NGTSNLX`, Ads tag `AW-10780123066`, and the `dataLayer` event names `formularInitializat`, `formularTrimis` (with `tip_problema`), `formularEroare`, `conversieAcceptata`, and the contact link events `contactTelefon`, `contactWhatsapp`, `contactEmail`. Google Ads and Analytics reporting depend on them. Consent is handled by Cookiebot inside the Tag Manager container, not in this repo.
- Form field names (`side_name`, `side_email`, `side_telephone`, `side_tip`, `side_mesaj`) and the JSON reply shape of the endpoint: `{ error: "true" | "false", succes?: "true", message, errors?: [{ text }] }`.
- The MySQL table `dedede_contact` and its columns. The endpoint only inserts.
- Image file names in `public/images/`: search engines and social previews link to them.
- Phone number `0744 88 55 66` and `contact@dedede.ro` appear in several components; change them everywhere at once.

## Hosting facts

- SiteGround shared hosting, Apache with `.htaccess`, PHP managed in Site Tools.
- Server-only files that are never in git and never deleted by a deploy: `env.php` (database and form settings), `.well-known/` (certificate challenges), `php_errorlog`.
- Mail is sent with PHP `mail()` from `no-reply@dedede.ro` to `office@dedede.ro`.
