## ADDED Requirements

### Requirement: Navigation toggle

The header SHALL open and close the main menu on small screens.

#### Scenario: Toggle

- **GIVEN** a phone-width viewport
- **WHEN** the visitor activates the menu button
- **THEN** the header gains the active state, and loses it on the next activation

### Requirement: Dark mode preference persists

The site SHALL remember an explicit dark or light choice across page loads.

#### Scenario: Choice survives navigation

- **GIVEN** a visitor who enabled dark mode
- **WHEN** they open another page
- **THEN** the page is shown in dark mode

### Requirement: Back-to-top visibility

The back-to-top control SHALL be hidden while the hero is in view and shown after scrolling past it.

#### Scenario: Scroll

- **GIVEN** a long page at the top
- **WHEN** the visitor scrolls well past the hero
- **THEN** the control becomes visible

### Requirement: Analytics loaders are unchanged

The site SHALL load the same Tag Manager container and Ads tag, and push the same `dataLayer` events as the legacy site.

#### Scenario: Loaders requested

- **GIVEN** any page
- **WHEN** it finishes loading
- **THEN** requests for container `GTM-NGTSNLX` and tag `AW-10780123066` were made
