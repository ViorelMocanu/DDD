# Design

## Context

Tag Manager (`GTM-NGTSNLX`) owns GA4 (`G-6GTBW520N1`), Clarity, Cookiebot and a second Ads tag. The repo only loads the container and one Ads tag, and pushes named events to `dataLayer`. Existing event names are Romanian camelCase: `formularInitializat`, `formularTrimis`, `formularEroare`, `conversieAcceptata`.

## Decisions

1. **Events go to `dataLayer`, not straight to GA4.** The GA4 tag lives in Tag Manager, and Tag Manager applies the consent state. The repo stays free of GA4 ids.
2. **One delegated click listener on the document** in `site.ts`, matching links by `href`: `tel:`, `wa.me`, and `mailto:contact@dedede.ro`. It covers the header, the footer, the floating bubbles and page text without touching the ported markup. Other `mailto:` links (the data protection authority) are not contact intent and are ignored.
3. **Event names:** `contactTelefon`, `contactWhatsapp`, `contactEmail`, in the style of the existing ones.
4. **Problem type:** `formularTrimis` is pushed as `{ event: "formularTrimis", tip_problema: "<value of #side_tip>" }`. The value is one of the fixed options in the dropdown, never free text and never personal data.
5. **No consent logic in the repo.** Pushing to `dataLayer` stores nothing and sends nothing; tags decide under the consent state.

## Deliberate differences from the live behaviour

- Three new `dataLayer` events on contact link clicks.
- `formularTrimis` has one extra key.

## Owner steps in Google (after deploy)

1. Tag Manager: a Data Layer Variable `tip_problema`.
2. Tag Manager: four Custom Event triggers (`contactTelefon`, `contactWhatsapp`, `contactEmail`, `formularTrimis`).
3. Tag Manager: GA4 Event tags on those triggers, for example `contact_phone`, `contact_whatsapp`, `contact_email`, `generate_lead` (with parameter `problem_type` = `{{tip_problema}}`). Publish.
4. GA4: register `problem_type` as an event-scoped custom dimension; mark the events as key events.
5. GA4: build audiences (visited `/contact/` without `generate_lead`, called, per problem type) and link GA4 to Google Ads so they appear there.

## Risks

- `site.ts` must stay small enough for Astro to inline it; check the built page.
- A click event fires on intent, not on a completed call. Audiences and reports should treat it as such.
