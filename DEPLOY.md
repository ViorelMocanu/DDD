# Deploying dedede.ro

The site is static HTML plus one PHP file. `pnpm build` writes everything the server needs into `dist/`; a deploy makes the server's `public_html` match that folder.

## Server-only files

These live only on the server. They are not in git, and a deploy never touches them.

| File           | Purpose                                          |
| -------------- | ------------------------------------------------ |
| `env.php`      | Settings for the contact form (see below)        |
| `.well-known/` | SSL certificate challenges written by SiteGround |
| `php_errorlog` | PHP's error log                                  |

### `env.php`

The existing file keeps working as it is. The form reads these variables:

```php
<?php
$DATABASE_HOST = "localhost";
$DATABASE_NAME = "...";
$DATABASE_USERNAME = "...";
$DATABASE_PASSWORD = "...";
// Hosts allowed to submit the form (compared with the request's Origin).
$ALLOWED_SERVER = "dedede.ro";
$ALLOWED_SERVER_2 = "www.dedede.ro";
$ALLOWED_SERVER_3 = "";
// Addresses that get a hidden copy of every lead.
$tos = ["someone@example.com" => "Name"];
```

**Check before the first deploy:** one of the three `$ALLOWED_SERVER` values must be exactly `dedede.ro`, or every submission is refused as unauthorised.

Two optional settings exist mainly for the tests: `$RATE_LIMIT_MAX` (accepted submissions per address in ten minutes, default 5) and `$DATABASE_DSN` (a full PDO connection string that replaces host and name).

A `putenv('SENDGRID_API_KEY=...')` line and `$mailuriDeSpamat`, if the file has them, are no longer used and can be removed. Mail now goes through the server's own mail system, from `no-reply@dedede.ro`.

### Files the form writes outside `public_html`

The form keeps its rate-limit counters in a folder named `dedede-form-limits` next to `public_html` (one level up, so it can never be downloaded). It creates the folder itself. The files are a few bytes each and can be deleted at any time.

## First deploy checklist

1. In Site Tools > Email > Accounts, make sure `no-reply@dedede.ro` exists (or is an alias). Mail from an address the server does not know is more likely to be rejected.
2. Check `env.php` as described above.
3. Deploy (either method below).
4. Run `pnpm verify:live`. It reads the live sitemap and checks every page in it, the headers, that pages arrive compressed and that private files are not served. It does not submit the form. Two of its checks depend on SiteGround settings and not on this repo: the `www` redirect (needs DNS and a certificate for `www.dedede.ro`) and the exact `Cache-Control: no-cache` header (SiteGround's cache may rewrite it). If only those fail, the deploy itself is fine.
5. Submit the form once yourself on `https://dedede.ro/contact/`. Then check four things:
    - The office email and the confirmation email both arrive.
    - A row appears in `dedede_contact`.
    - The address at the bottom of the office email ("de pe IP-ul ...") is your own public address, not one of SiteGround's. If it is SiteGround's, all visitors share one rate limit: raise `$RATE_LIMIT_MAX` in `env.php` to a few hundred until the endpoint is taught to read the forwarded address.
    - `php_errorlog` in `public_html` has no new `sideform:` line. A "lead not stored" line usually means a value was longer than its column: compare `SHOW CREATE TABLE dedede_contact` with the limits near the top of the validation block in `public/sideform.php`.
6. In Site Tools > Speed > Caching, flush the cache.
7. Because the old endpoint could run code sent by visitors, treat the server as possibly tampered with: change the database password (and update `env.php`), revoke the SendGrid API key, and look through `public_html` for files you do not recognise.
8. One week later, delete `_elderjs/` and `resources/script.js` on the server and remove their two `--filter='P ...'` lines from `.github/workflows/deploy.yml`. They are kept at first so browsers holding a cached copy of an old page still find its CSS and JavaScript.

## Method A: GitHub Actions (recommended)

The workflow "Deploy to SiteGround" runs only when you start it by hand. It verifies, tests, builds, then mirrors `dist/` with `rsync` over SSH and finishes with `pnpm verify:live`.

One-time setup:

1. Site Tools > Devs > SSH Keys Manager: create a key pair, and note the host name, user name and port shown under "SSH Credentials".
2. On your machine, get the server's host key: `ssh-keyscan -p <port> <host>`.
3. In GitHub > Settings > Secrets and variables > Actions, add:

| Secret                   | Value                                                                         |
| ------------------------ | ----------------------------------------------------------------------------- |
| `SITEGROUND_SSH_KEY`     | The private key (if it has a passphrase, create one without for this purpose) |
| `SITEGROUND_KNOWN_HOSTS` | The output of `ssh-keyscan`                                                   |
| `SITEGROUND_HOST`        | Host name                                                                     |
| `SITEGROUND_PORT`        | Port                                                                          |
| `SITEGROUND_USER`        | User name                                                                     |
| `SITEGROUND_PATH`        | Absolute path of the site's `public_html`, without a trailing slash           |

The workflow refuses to run unless `SITEGROUND_PATH` ends in `/public_html`. Everything in that folder that is not in `dist/` and not protected is deleted, so read the dry-run list for files you put there yourself (`.user.ini`, `php.ini`, `error_log`, `cgi-bin/`) and tell me to protect them if they appear.

Run it: Actions > Deploy to SiteGround > Run workflow. Leave "Only list what would change" ticked the first time and read the list: lines starting with `*deleting` are files that will be removed. If the list looks right, run it again with the box unticked.

## Method B: by hand

1. `pnpm verify && pnpm test && pnpm build`
2. Upload the contents of `dist/` to `public_html` with SFTP, including the hidden `.htaccess`.
3. Delete on the server what is no longer in `dist/`: `sendgrid-php/`, `env-exemplu.php`, `resources/style.scss`, `resources/style.css`, `resources/style.css.map`. A week later also `_elderjs/` and `resources/script.js`.
4. Continue with step 4 of the checklist.

## Changing the PHP version

SiteGround writes an `AddHandler application/x-httpd-php86` line at the end of `.htaccess`. The same line is in `public/.htaccess`. When you change the PHP version in Site Tools, update that line in the repo too, or the next deploy puts the old one back.

## Rolling back

Site Tools > Security > Backups restores `public_html` from a daily backup. The pre-rewrite site is also in git at commit `0e426f0`.
