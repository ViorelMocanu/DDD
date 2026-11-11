# Contact intent events

## Why

The owner wants audiences for remarketing in Google Ads. The site already reports the form (started, sent, error), but the other ways a visitor reaches the company are invisible: a tap on the phone number, on WhatsApp or on the email address. The problem type chosen in the form is not reported either, so no audience can be built per pest.

Consent is already handled: the Tag Manager container loads Cookiebot, which sets all four Google consent signals to denied by default and grants them when the visitor accepts (checked on the live site on 2026-11-11). No banner work is needed.

## What Changes

- A tap or click on a phone link, a WhatsApp link or the company email link pushes an event to `dataLayer`.
- The existing `formularTrimis` event carries the chosen problem type.

Visitors see no difference. No page text, design or URL changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `site--behaviour`: new requirement for contact link events.
- `contact--form`: the success event carries the problem type.

## Impact

- `src/scripts/site.ts` and `src/scripts/contact-form.ts`, with browser tests.
- No new dependency.
- The events do nothing until the owner adds triggers and tags for them in Tag Manager (steps in `design.md`).

## Non-goals

- No consent banner changes.
- No sending of names, emails or phone numbers to Google (enhanced conversions). That would be a separate change with a privacy policy update.
- No change to existing event names, the Ads conversion or the analytics ids.
