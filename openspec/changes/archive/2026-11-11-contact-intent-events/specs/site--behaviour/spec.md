## ADDED Requirements

### Requirement: Contact link clicks are reported

The site SHALL push a `dataLayer` event when a visitor activates a phone link, a WhatsApp link or the company email link, on any page.

#### Scenario: Phone link

- **GIVEN** any page
- **WHEN** the visitor clicks a link whose address starts with `tel:`
- **THEN** the event `contactTelefon` is pushed once

#### Scenario: WhatsApp link

- **GIVEN** any page
- **WHEN** the visitor clicks a link to `wa.me`
- **THEN** the event `contactWhatsapp` is pushed once

#### Scenario: Company email link

- **GIVEN** any page
- **WHEN** the visitor clicks a link to `mailto:contact@dedede.ro`
- **THEN** the event `contactEmail` is pushed once

#### Scenario: Other links

- **GIVEN** any page
- **WHEN** the visitor clicks a link that is none of the above, including an email link to another address
- **THEN** no contact event is pushed
