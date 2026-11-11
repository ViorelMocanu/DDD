## ADDED Requirements

### Requirement: Server configuration ships with the build

The build output SHALL contain the Apache configuration, the endpoint and every static file the legacy site served, and nothing that must stay private.

#### Scenario: Output inventory

- **GIVEN** a production build
- **WHEN** the output folder is inspected
- **THEN** it contains `.htaccess`, `sideform.php`, `robots.txt`, `sitemap.xml`, the web manifest and the icons, and contains no `env.php`, source map, SCSS source or vendored PHP library

### Requirement: Security headers

The configuration SHALL keep the live content security policy and transport security, and SHALL NOT send invalid or obsolete headers.

#### Scenario: Header set

- **GIVEN** the shipped `.htaccess`
- **WHEN** its header directives are read
- **THEN** it sets `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, a single-valued `Referrer-Policy` and `Permissions-Policy`, and does not set `Feature-Policy` or `X-XSS-Protection`

### Requirement: Legacy service workers are retired

The site SHALL remove any previously registered service worker and its caches.

#### Scenario: Returning visitor

- **GIVEN** a browser with the legacy worker registered
- **WHEN** it fetches the new worker script
- **THEN** the worker clears all caches and unregisters itself

### Requirement: Deploy mirrors the build safely

A deploy SHALL make the server match the build output while preserving server-only files.

#### Scenario: Stale and protected files

- **GIVEN** a server holding legacy files plus `env.php`, `.well-known/` and `php_errorlog`
- **WHEN** a deploy runs
- **THEN** legacy files absent from the build are removed and the three protected paths are untouched
