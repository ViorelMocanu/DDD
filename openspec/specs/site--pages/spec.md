# site--pages Specification

## Purpose

Which pages and articles exist, their URLs, content and metadata, kept in parity with the original site.

## Requirements

### Requirement: Public routes are preserved

The site SHALL serve the same nine public URLs as the legacy site, with trailing slashes.

#### Scenario: Every legacy URL resolves

- **GIVEN** the built site
- **WHEN** a visitor requests `/`, `/contact/`, `/informatii-utile/`, `/totul-despre-dezinsectie/`, `/cum-scapi-de-gandaci/`, `/dezinfectie-dezinsectie-deratizare-diferente/`, `/confidentialitate/`, `/cookies/` or `/termeni-si-conditii/`
- **THEN** the response status is 200

### Requirement: Content and metadata match the legacy site

Each page SHALL carry the same visible text, heading structure, links, title, description, canonical link and structured data as the legacy page, apart from the deviations recorded in the change design.

#### Scenario: Structure comparison

- **GIVEN** the legacy page and the rebuilt page for the same URL
- **WHEN** both are reduced to their normalised structure and metadata
- **THEN** the two results are equal

### Requirement: Pages look the same

Each page SHALL render within 0.1% pixel difference of the legacy page at phone, tablet and desktop widths in light and dark colour schemes.

#### Scenario: Pixel comparison

- **GIVEN** a full-page screenshot of the legacy page
- **WHEN** the rebuilt page is captured with the same viewport and colour scheme
- **THEN** the difference ratio is at most 0.001

### Requirement: Articles are authored as Markdown files

An article SHALL be published by adding one Markdown file with validated front matter.

#### Scenario: New article

- **GIVEN** a new Markdown file in the articles collection with valid front matter
- **WHEN** the site is built
- **THEN** the article has its own root-level URL, appears in the listing and in the sitemap

#### Scenario: Invalid front matter

- **GIVEN** an article file missing a required field
- **WHEN** the site is built
- **THEN** the build fails with a message naming the field
