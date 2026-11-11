# Design

## Context

Baseline is the live site, captured in `_backup/live/public_html` (gitignored). The legacy sources remain readable through `git show 0e426f0:<path>`.

## Decisions

1. **Astro static output, no adapter.** `dist/` is uploaded as-is to SiteGround. `trailingSlash: "always"`, directory-style URLs, matching the live site.
2. **Plain flat CSS.** The legacy `style.scss` was compiled once with Sass into `src/styles/global.css`. Native nesting was rejected: older browsers would lose the whole stylesheet, and one legacy selector is invalid when nested.
3. **Articles as a content collection** in `src/content/articole/*.md`, rendered at the root (`/[slug]/`). Adding an article is adding one file.
4. **Browser scripts as small TypeScript modules** in `src/scripts/`, bundled by Astro. Same element ids, same `dataLayer` events, same Tag Manager and Ads ids.
5. **Contact endpoint: one PHP file** (`public/sideform.php`), no dependencies.
    - Accepts only a JSON `POST`; anything else gets the legacy "Input greșit." reply.
    - Guards: same-origin check, honeypot field, per-address rate limit, body size cap, allow-listed fields with length caps.
    - Stores the lead with a PDO prepared statement, then sends two emails with `mail()`: notification to the office, confirmation to the visitor. All interpolated values are HTML-escaped; header values are stripped of line breaks.
    - Reads its settings from the server-only `env.php`. The same variable names as today keep working.
    - A failed insert is logged and does not block the emails. A failed office email returns the legacy error shape.
6. **`.htaccess` rebuilt from the live copy** with minimal edits: remove the dead PHP 7 block (it enabled `display_errors`), fix `Referrer-Policy`, replace `Feature-Policy` with `Permissions-Policy`, drop `X-XSS-Protection`, deny access to `env.php`, logs, source maps and dot files. Access-control directives that work on the live server stay verbatim.
7. **Service worker kill switch.** `service-worker.js` unregisters itself and clears caches, because old clients registered the legacy cache-first worker.
8. **Parity oracle is migration tooling.** Playwright compares the new build with the local copy of the live site (structure, metadata, pixels). It needs `_backup/live` and is skipped when the folder is absent, for example in CI.
9. **Deploy:** manual-trigger GitHub workflow, `rsync --delete` over SSH with protect filters for `env.php`, `.well-known/` and `php_errorlog`.

## Deliberate deviations from the live site

Not visible to a visitor:

- Open Graph tags use `property=` (the live `name=` form is ignored by Facebook).
- Twitter `@TODO` handles removed.
- Logo fallback image uses an absolute path (the relative path caused about 9,000 missing-file hits).
- Article time prints zero-padded minutes.
- `humans.txt` names the current stack.
- SCSS source and CSS source map are no longer published.
- A hidden honeypot input (`side_verificare`) is added to the form. A submission with the honeypot filled is answered as a success, stored, and mailed to the office with `[posibil spam]` in the subject; the visitor gets no confirmation. It is not dropped, because a browser's autofill can fill the field for a real visitor.
- The page scripts are inlined into the HTML by Astro (they are under 4 kB and have no imports), so a page needs no script request of its own. The legacy site loaded one `script.js`. This relies on `'unsafe-inline'` in the Content-Security-Policy, which the live policy already has.
- Scripts are ES modules. Browsers from before about 2020 run none of them: no Tag Manager, and the form posts natively.
- `formularEroare` is pushed to the data layer once per failed reply. The legacy script pushed it twice.
- The request no longer carries `tech: "ajax"`; neither endpoint ever read it.
- The email pattern in the form accepts the same addresses as before but can no longer freeze the page on a long malformed one.
- Stored leads: `data` is set by PHP's clock, pinned to Romanian time (the legacy query used MySQL's `NOW()`); the time in the emails is Romanian time too, and `ip` holds only the connecting address (the legacy value appended `X-Forwarded-For`).
- The server validates more strictly than the legacy endpoint: problem type from a fixed list, email checked by PHP's validator, message cut at 5000 characters, email at 150, request body at 20 kB.
- At most 5 accepted submissions per address in 10 minutes. The visitor confirmation is limited further (2 per recipient, 30 in total per 10 minutes); the office notification never is.
- A failed or skipped visitor confirmation is logged and does not change the reply. The legacy endpoint reported it as an error although the lead had arrived.

- Campaign fields (`utm_*`, `gclid`) and the page URL are now sent with the lead. The legacy script never filled them.
- One print-only CSS rule with an invalid selector was removed. Browsers already ignored it.
- Pages are served with `Cache-Control: no-cache` and hashed assets with a one-year lifetime, so a deploy can never leave a cached page pointing at deleted files.

Visible:

- Article cards on the home page and the listing show the real reading time. The legacy site printed "0 min." there because of a bug.
- The footer copyright shows the current year range.
- The phone field accepts numbers typed with spaces, dots, dashes, brackets and a leading `+` (for example `0744 885 566` or `+40744885566`) and requires 9 to 15 digits. The legacy form accepted only 3 to 24 bare digits. Page and server apply the same rule, and the number is stored without the separators. Approved by the owner on 2026-11-11.
- A server-side error reply is shown as an error with its reasons. The legacy script treated every JSON reply as success and fired the Ads conversion event even when the server refused the submission.
- When the request fails or the reply is not JSON, the form shows "Nu am putut trimite formularul. Te rugăm să încerci din nou sau să ne suni." The legacy script stayed on "sending" forever, or printed the raw server text.

## Risks

- `mail()` deliverability for the visitor confirmation is unverified until the first live test submission.
- The rate limit counts per connecting address. If SiteGround's proxy hands PHP its own address, all visitors share one counter and real leads are refused after the fifth in ten minutes. `DEPLOY.md` step 5 checks this.
- A bot that fills the honeypot can still put up to 5 marked emails per 10 minutes in the office inbox. Accepted so that a real visitor caught by autofill is never lost.
- The tests store leads in SQLite, so the field lengths the endpoint allows were never checked against the real MySQL columns. A failed insert is logged and the emails still go out.
- `markdown.smartypants` is deprecated in Astro 7.4 and prints a warning on every build; its replacement needs an extra package. To revisit at the next Astro major.
- The server runs PHP 8.6; tests run on PHP 8.5, the newest available image.
- The endpoint requires one of the `$ALLOWED_SERVER` values in `env.php` on the server to be exactly `dedede.ro`; the values were not read during the rewrite.
