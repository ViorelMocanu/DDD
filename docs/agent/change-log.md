# Change log

Milestones, retrospectives and `/simplify` runs. Newest first.

## 2026-11-11: Contact intent events (OpenSpec change `contact-intent-events`)

Contact link clicks and the problem type now reach `dataLayer`; the owner wired them to GA4 in Tag Manager the same day. Archived as `2026-11-11-contact-intent-events`.

### Retrospective

- **Worked well:** probing the live site in a throwaway browser before building. It showed the Cookiebot banner already sets all four consent signals, so no banner work was needed.
- **Surprise:** the Tag Manager container holds an older set of tags (prefix WZC) that the repo cannot show: its own click events, a second Ads account, and a conversion tag that fires on form submit instead of on success. Ask for a look at the container before planning analytics work.
- **Watch next time:** Google's admin screens had moved (key events are a tab under Events). Written click paths for Google tools need a screenshot check.

## 2026-11-11: Astro rewrite live

Deployed with the manual workflow (dry run, then the real run), checked with `pnpm verify:live`, confirmed by one real form submission from the owner. OpenSpec change archived as `2026-11-11-astro-rewrite`; its requirements are now the main specs.

### Retrospective

- **Worked well:** the dry run. Its delete list (the old mail library, an example file, three style sources) could be read and approved before anything changed on the server.
- **Worked well:** protecting `_elderjs/` and `resources/script.js` in the deploy, so pages cached before the switch kept working.
- **Surprise:** SiteGround's page cache kept serving the old site after the upload, so the first live check failed on 8 points that were all correct on the server. Flush the cache after every deploy.
- **Surprise:** static files are served by SiteGround's nginx, not Apache, so cache headers set for them in `.htaccess` do not arrive. The live check now accepts nginx's one-year `max-age`.
- **Watch next time:** local previews cannot run PHP. Testing the form locally needs the Docker PHP copy.

### /simplify runs

| Date                    | Base      | End point                             | Notes                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------- | --------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-11 (second run) | `a235dfd` | `ed4d7ea` + working tree              | Scope: the contact intent events (`site.ts`, `contact-form.ts`, two browser tests) and the earlier live-check fix, about 60 lines, reviewed inline without subagents. Fixed: the success event reads the problem type through the existing `valoare` helper instead of a second lookup with its own fallback. Nothing skipped. The next run starts from the owner's commit of this work. |
| 2026-11-11              | `e74b585` | `76f27dd` + working tree, uncommitted | Small diff (timezone line, two endpoint test changes, Dependabot config, the live-check change), reviewed inline without subagents. Fixed: the asset cache check in `scripts/verify-live.mjs` split into a fetch and a comparison. Nothing skipped. The next run starts from the owner's commit of this work.                                                                            |

## 2026-11-10: Astro rewrite (OpenSpec change `astro-rewrite`)

Rebuilt the site 1:1 in Astro on top of commit `0e426f0`, as one uncommitted working tree for the owner to commit.

### What changed

- Elder.js, Svelte, Rollup and Babel replaced by Astro static output. Direct packages: 31 before, 15 now (1 runtime).
- `sideform.php` rewritten as one dependency-free file: no `eval`, prepared statements, same-origin check, honeypot, rate limit, escaped emails. The vendored SendGrid SDK (101 PHP files) is gone; mail goes through the host.
- `.htaccess` rebuilt from the live server copy; broken and obsolete headers fixed; private files denied.
- Parity proven against a local copy of the live site: 9 structure and metadata comparisons and 54 screenshot comparisons, all within 0.1% pixel difference.
- Slim agent harness, CI, and a manual-trigger rsync deploy workflow.

### Retrospective

- **Worked well:** porting the Svelte templates with a script and letting the parity oracle find the differences. Eight of nine pages matched on the first run; the ninth differed by one typographic character.
- **Worked well:** using the downloaded server copy as the baseline. It showed the repo and server had drifted, that articles live at the root, and that the endpoint was unchanged on the server.
- **Surprise:** the legacy stylesheet could not be used as native nested CSS (one invalid selector, and older browsers would lose all styles), so it was compiled once to flat CSS.
- **Surprise:** the legacy form script reported every JSON reply as success and fired the Ads conversion even when the server refused the submission. Campaign fields were never filled. Both are fixed.
- **Not test-first everywhere:** the format helpers and the endpoint were written in the same step as their tests, not strictly after a failing run. The parity and behaviour suites were run red first.
- **Watch next time:** two local static servers stalled under parallel Playwright workers; the suite runs with one worker.

### /simplify runs

| Date                    | Base      | End point                                               | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------- | --------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-10 (second run) | `0e426f0` | `0e426f0` + working tree, still uncommitted             | Full run with four parallel reviewers (reuse, simplification, efficiency, altitude), plus a security review of the endpoint and a spec check. Fixed: confirmation email capped per recipient and in total; `display_errors` forced off; Referer no longer rescues a bad Origin; rate-limit counters moved out of the shared temp folder; wider and case-insensitive deny list and `no-store` for the endpoint in `.htaccess`; deploy refuses a path that does not end in `/public_html`; email pattern that could freeze the page; page scripts now inlined (no shared import); route list replaced by the sitemap in the tests and the live check; `prettier-plugin-astro` removed (it formatted nothing); hooks only check, they no longer rewrite files; browser tests added to CI; test preview moved off Astro's default port. Skipped: a shared setup action for the two workflows, image-file checks in the article schema, sending the confirmation after the reply. The next run starts from the owner's commit of this work. |
| 2026-11-10              | `0e426f0` | `0e426f0` + working tree (all of M0 to M7, uncommitted) | One run for the whole rewrite, done inline on the hand-written code. Fixed: three copies of the route list merged into `scripts/routes.mjs`; duplicated success reply and double `date()` call in `sideform.php`; duplicate `start` script. Skipped: repeated setup steps in the two workflows (small, clearer inline). The next run starts from the owner's commit of this work.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
