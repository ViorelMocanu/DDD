# Contact Form + Resend Endpoint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the `/contact/` static page and the `/api/contact` SSR POST endpoint that replaces `sideform.php`, preserving full field/class/id parity from the baseline, wiring the Resend SDK for email dispatch, updating `script.js` with the new POST target, and covering the entire surface with Vitest unit tests and Playwright E2E tests.

**Architecture:** `src/pages/contact.astro` is a pure static page whose form HTML is lifted verbatim from `parity/baseline/html/contact/index.html` — no framework island, no client-side JS in the `.astro` file itself. `src/pages/api/contact.ts` is the sole `prerender=false` Worker route; it parses a JSON body, runs zod validation, executes a honeypot check, applies a best-effort in-process rate-limit, then calls `Resend.emails.send()`. All form interaction (AJAX submit, UTM population, `dataLayer` events) lives in `public/resources/script.js` with only the POST target URL changed from `https://dedede.ro/sideform.php` to `/api/contact`.

**Tech Stack:** Astro 6, `@astrojs/cloudflare` adapter, TypeScript strictest, Resend SDK (`resend ^6.12.4`), zod (transitive via `astro:content`), Vitest 4, Playwright 1.60, `@axe-core/playwright`.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/pages/contact.astro` | Static contact page — preserves every field `id`/`name`/`required`/`aria` from baseline verbatim, analytics ON, honeypot field added |
| Create | `src/pages/api/contact.ts` | POST-only Worker endpoint — zod validation, honeypot, rate-limit, Resend dispatch, JSON response |
| Modify | `public/resources/script.js` | Change hardcoded `sideform.php` target to `/api/contact` (two occurrences); fix UTM `URLSearchParams` population bug |
| Create | `.env.example` | Documents `RESEND_API_KEY`, `RESEND_FROM`, `CONTACT_TO` shape (placeholder values) |
| Create | `src/tests/unit/contact-endpoint.test.ts` | Vitest unit tests for the endpoint logic (valid, invalid, honeypot, GET) |
| Create | `src/tests/e2e/contact.spec.ts` | Playwright E2E — happy path, validation, honeypot, `dataLayer` events |

---

## Parity constraints for `contact.astro`

**Source files:**
- Authoritative markup: `parity/baseline/html/contact/index.html`
- Legacy component reference (structure only): `src/routes/contact/Contact.svelte`

**Transformation rules:**

1. Use `BaseLayout.astro` (from plan 01-scaffold) with `analytics={true}`.
2. Copy the `<section class="Hero ContentPage">` block verbatim from the baseline HTML — preserve `itemscope`/`itemtype` BreadcrumbList microdata, all class names, all text content including Romanian diacritics.
3. Copy the `<main class="FormContainer LimitWidth">` form block verbatim. Preserve:
   - `<form id="sideform" class="Form ContactForm" action="/api/contact" method="post">` — **action changes from `https://dedede.ro/sideform.php` to `/api/contact`**; `method` stays `post`.
   - Every `<input>` id/name/type/class/maxlength/required/aria-required/autocomplete/tabindex verbatim.
   - Field order: `side_name` (tabindex=1), `side_telephone` (tabindex=2), `side_email` (tabindex=3), `side_tip` select (tabindex=4), `side_mesaj` textarea (tabindex=5).
   - GDPR checkbox: `id="gdpr" name="gdpr" value="1" required="required" aria-required="true" tabindex="6"`.
   - Hidden fields: `id="urlAjax" name="urlAjax"`, `id="side_url" name="side_url"`, `id="utm_source" name="utm_source"`, `id="utm_medium" name="utm_medium"`, `id="utm_term" name="utm_term"`, `id="utm_content" name="utm_content"`, `id="utm_campaign" name="utm_campaign"`, `id="gclid" name="gclid"` — all `class="Hidden" type="hidden"`.
   - Submit: `id="side_submit" name="side_submit"` button with inner `<span id="side_submit_text">`.
   - Output: `<output class="Raspuns" name="raspuns" id="raspuns" for="side_name side_telephone side_email side_tip side_mesaj">`.
4. **Honeypot field** — add immediately before the `<button type="submit"...>` inside the `CTAFieldset`:
   ```html
   <label class="HoneypotLabel" aria-hidden="true" tabindex="-1">
   	<input type="text" name="hp_field" id="hp_field" class="Honeypot" autocomplete="off" tabindex="-1" value="">
   </label>
   ```
   The `Honeypot` CSS class must set `display:none` or `visibility:hidden; position:absolute; left:-9999px` in the SCSS so smart bots that check `type=hidden` see a visible-but-off-screen text input.
5. Copy the `<section class="Contact LimitWidth"...>` contact-info block verbatim (phone, email, chat, Batman SVG, footer nav) from the baseline.
6. **`<body class="contact">`** — pass `bodyClass="contact"` prop to `BaseLayout`.
7. **Head meta** — emit exactly the values from `parity/baseline/meta/contact.json`:
   - `title`: `Contactează specialiștii în DeDeDe chiar acum!`
   - `description`: `Programează-te acum la Dezinfecție, Dezinsecție sau Deratizare! Scapă de 🐜 gândaci, 🐀 șobolani, 🦟 ploșnițe, 🦠 viruși sau alți ☠️ dăunători! București + Ilfov`
   - `og:image`: `https://dedede.ro/images/og-image-contact.jpg`
   - `article:published_time`: `2021-09-19T19:35:55+03:00`
   - `article:modified_time`: `2021-09-19T19:35:55+03:00`
   - `og:type`: `website` (NOT `article` — contact is not an article page)
   - Omit `twitter:site` and `twitter:creator` (WAIVER-SEO-01).

**What to preserve verbatim (do NOT alter):** all `id=`, `name=`, `class=`, `required=`, `aria-required=`, `tabindex=`, `maxlength=`, `autocomplete=` attribute values; all inline SVG paths; all Romanian text strings; the BreadcrumbList microdata positions (1/2); the `<output>` element with its `for=` attribute.

**Acceptance check:** visual diff ≤ 0.1% vs `parity/baseline/screenshots/contact__*.png` at all three viewports, except for the honeypot field area (CSS-hidden, zero pixel impact expected). Meta diff matches `parity/baseline/meta/contact.json` accounting for WAIVER-SEO-01 (no `twitter:site`/`twitter:creator`).

---

## Task 1: Vitest tests for the endpoint (write first — TDD)

**Files:**
- Create: `src/tests/unit/contact-endpoint.test.ts`

- [ ] **Step 1.1: Write the test file**

```typescript
// src/tests/unit/contact-endpoint.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockEmailsSend = vi.fn();

vi.mock("resend", () => ({
	Resend: vi.fn().mockImplementation(() => ({
		emails: { send: mockEmailsSend },
	})),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a Request with a JSON body for POST /api/contact.
 */
function makeRequest(body: Record<string, unknown>, method = "POST"): Request {
	return new Request("http://localhost/api/contact", {
		method,
		headers: { "Content-Type": "application/json" },
		body: method === "GET" ? undefined : JSON.stringify(body),
	});
}

/**
 * Minimal valid payload matching every required field.
 */
function validPayload(): Record<string, unknown> {
	return {
		side_name: "Ion Popescu",
		side_email: "ion@example.com",
		side_telephone: "0744123456",
		side_tip: "dezinsectie",
		side_mesaj: "",
		gdpr: "1",
		hp_field: "",
		urlAjax: "/api/contact",
		side_url: "https://dedede.ro/contact/",
		utm_source: "",
		utm_medium: "",
		utm_term: "",
		utm_content: "",
		utm_campaign: "",
		gclid: "",
	};
}

// ─── Import subject under test AFTER mocks are set ───────────────────────────

// The endpoint is an Astro page file; we import its POST handler directly.
// Adjust the import path once the file exists.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let POST: (ctx: any) => Promise<Response>;

beforeEach(async () => {
	vi.resetModules();
	mockEmailsSend.mockReset();
	// Provide fake env
	process.env["RESEND_API_KEY"] = "re_test_key";
	process.env["RESEND_FROM"] = "noreply@dedede.ro";
	process.env["CONTACT_TO"] = "office@dedede.ro";

	const mod = await import("../../pages/api/contact.js");
	POST = (mod as unknown as { POST: typeof POST }).POST;
});

afterEach(() => {
	delete process.env["RESEND_API_KEY"];
	delete process.env["RESEND_FROM"];
	delete process.env["CONTACT_TO"];
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/contact", () => {
	it("returns 200 and calls Resend when payload is valid", async () => {
		mockEmailsSend.mockResolvedValue({ data: { id: "abc" }, error: null });

		const req = makeRequest(validPayload());
		const res = await POST({ request: req, locals: { runtime: { env: { RESEND_API_KEY: "re_test_key", RESEND_FROM: "noreply@dedede.ro", CONTACT_TO: "office@dedede.ro" } } } });

		expect(res.status).toBe(200);
		const json = (await res.json()) as { success: boolean };
		expect(json.success).toBe(true);
		expect(mockEmailsSend).toHaveBeenCalledOnce();

		const callArg = mockEmailsSend.mock.calls[0]?.[0] as {
			to: string;
			from: string;
			subject: string;
			html: string;
		};
		expect(callArg.to).toBe("office@dedede.ro");
		expect(callArg.from).toBe("noreply@dedede.ro");
		expect(callArg.subject).toContain("Ion Popescu");
		expect(callArg.html).toContain("ion@example.com");
	});

	it("returns 400 when required field is missing (no side_name)", async () => {
		const payload = validPayload();
		delete payload["side_name"];
		const req = makeRequest(payload);
		const res = await POST({ request: req, locals: { runtime: { env: { RESEND_API_KEY: "re_test_key", RESEND_FROM: "noreply@dedede.ro", CONTACT_TO: "office@dedede.ro" } } } });

		expect(res.status).toBe(400);
		const json = (await res.json()) as { success: boolean };
		expect(json.success).toBe(false);
		expect(mockEmailsSend).not.toHaveBeenCalled();
	});

	it("returns 400 when email is malformed", async () => {
		const payload = { ...validPayload(), side_email: "not-an-email" };
		const req = makeRequest(payload);
		const res = await POST({ request: req, locals: { runtime: { env: { RESEND_API_KEY: "re_test_key", RESEND_FROM: "noreply@dedede.ro", CONTACT_TO: "office@dedede.ro" } } } });

		expect(res.status).toBe(400);
		expect(mockEmailsSend).not.toHaveBeenCalled();
	});

	it("returns 400 when side_tip is not an allowed value", async () => {
		const payload = { ...validPayload(), side_tip: "invalid_option" };
		const req = makeRequest(payload);
		const res = await POST({ request: req, locals: { runtime: { env: { RESEND_API_KEY: "re_test_key", RESEND_FROM: "noreply@dedede.ro", CONTACT_TO: "office@dedede.ro" } } } });

		expect(res.status).toBe(400);
		expect(mockEmailsSend).not.toHaveBeenCalled();
	});

	it("returns 200 silently (no email) when honeypot is filled", async () => {
		const payload = { ...validPayload(), hp_field: "i-am-a-bot" };
		const req = makeRequest(payload);
		const res = await POST({ request: req, locals: { runtime: { env: { RESEND_API_KEY: "re_test_key", RESEND_FROM: "noreply@dedede.ro", CONTACT_TO: "office@dedede.ro" } } } });

		expect(res.status).toBe(200);
		const json = (await res.json()) as { success: boolean };
		expect(json.success).toBe(true);
		// Resend must NOT be called — this is the silent discard
		expect(mockEmailsSend).not.toHaveBeenCalled();
	});

	it("returns 405 for GET requests", async () => {
		const req = makeRequest({}, "GET");
		const res = await POST({ request: req, locals: { runtime: { env: { RESEND_API_KEY: "re_test_key", RESEND_FROM: "noreply@dedede.ro", CONTACT_TO: "office@dedede.ro" } } } });

		expect(res.status).toBe(405);
	});
});
```

- [ ] **Step 1.2: Run the tests — expect FAIL (endpoint does not exist yet)**

```
pnpm vitest run src/tests/unit/contact-endpoint.test.ts
```

Expected: multiple test failures — `Cannot find module '../../pages/api/contact.js'`.

- [ ] **Step 1.3: Commit the failing tests**

```
git add src/tests/unit/contact-endpoint.test.ts
git commit -m "test(contact): add failing vitest tests for /api/contact endpoint"
```

---

## Task 2: Implement `src/pages/api/contact.ts`

**Files:**
- Create: `src/pages/api/contact.ts`

- [ ] **Step 2.1: Write the full endpoint**

```typescript
// src/pages/api/contact.ts
import type { APIContext } from "astro";
import { z } from "zod";
import { Resend } from "resend";

export const prerender = false;

// ─── Zod schema ──────────────────────────────────────────────────────────────

const ALLOWED_TIP = ["dezinsectie", "dezinfectie", "deratizare", "all"] as const;

const ContactSchema = z.object({
	side_name: z.string().min(2).max(200),
	side_email: z.string().email().max(200),
	side_telephone: z.string().regex(/^\+?\d{9,15}$/, "Telefon invalid"),
	side_tip: z.enum(ALLOWED_TIP),
	side_mesaj: z.string().max(5000).optional().default(""),
	gdpr: z.literal("1"),
	hp_field: z.string().max(200).optional().default(""),
	// hidden / UTM fields — optional strings, max 500 chars each
	urlAjax: z.string().max(500).optional().default(""),
	side_url: z.string().max(500).optional().default(""),
	utm_source: z.string().max(200).optional().default(""),
	utm_medium: z.string().max(200).optional().default(""),
	utm_term: z.string().max(200).optional().default(""),
	utm_content: z.string().max(200).optional().default(""),
	utm_campaign: z.string().max(200).optional().default(""),
	gclid: z.string().max(200).optional().default(""),
});

type ContactPayload = z.infer<typeof ContactSchema>;

// ─── Rate-limit (best-effort in-process) ─────────────────────────────────────

/**
 * Simple in-memory rate-limit bucket. Cloudflare Workers are stateless
 * (may run across isolates) so this is best-effort, not strict global.
 * Key = IP address; value = { count, resetAt }.
 *
 * Limit: 5 submissions per IP per 10-minute window.
 */
const RL_WINDOW_MS = 10 * 60 * 1000;
const RL_MAX = 5;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Check and increment the in-process rate-limit for the given IP.
 *
 * @param {string} ip - Client IP address.
 * @returns {boolean} `true` if the request is within limits, `false` if it should be blocked.
 */
function checkRateLimit(ip: string): boolean {
	const now = Date.now();
	const entry = rateLimitMap.get(ip);

	if (!entry || now > entry.resetAt) {
		rateLimitMap.set(ip, { count: 1, resetAt: now + RL_WINDOW_MS });
		return true;
	}

	if (entry.count >= RL_MAX) {
		return false;
	}

	entry.count++;
	return true;
}

// ─── Email builder ────────────────────────────────────────────────────────────

/**
 * Build an HTML notification email body from a validated contact payload.
 *
 * @param {ContactPayload} p - The validated contact form payload.
 * @returns {string} HTML email body string.
 */
function buildEmailHtml(p: ContactPayload): string {
	const utmBlock =
		p.utm_source || p.utm_medium || p.utm_term || p.utm_content || p.utm_campaign
			? `<hr><ul>
				<li><strong>Campaign Source:</strong> ${p.utm_source}</li>
				<li><strong>Campaign Medium:</strong> ${p.utm_medium}</li>
				<li><strong>Campaign Term:</strong> ${p.utm_term}</li>
				<li><strong>Campaign Content:</strong> ${p.utm_content}</li>
				<li><strong>Campaign Name:</strong> ${p.utm_campaign}</li>
			</ul><hr>`
			: "";

	const gclidBlock = p.gclid
		? `<ul><li><strong>AdWords ID:</strong> ${p.gclid}</li></ul><hr>`
		: "";

	return `<!DOCTYPE html>
<html lang="ro">
<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><title>Contact DeDeDe</title></head>
<body style="font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5em;">
	<div style="width:90%;margin:0 auto;">
		<div style="padding:1em 3em;background:#eee;border:1px solid #ddd;">
			<h1 style="font-size:24px;font-weight:100;">${p.side_name} a trimis un mesaj pe formularul de contact!</h1>
			<ul>
				<li><strong>Nume:</strong> ${p.side_name}</li>
				<li><strong>E-mail:</strong> <a href="mailto:${p.side_email}">${p.side_email}</a></li>
				<li><strong>Telefon:</strong> <a href="tel:${p.side_telephone}">${p.side_telephone}</a></li>
				<li><strong>A venit de pe:</strong> <a href="${p.side_url}">${p.side_url}</a></li>
				<li><strong>Tip curățenie:</strong> ${p.side_tip}</li>
				<li><strong>Mesaj:</strong> ${p.side_mesaj}</li>
			</ul>
			${utmBlock}${gclidBlock}
		</div>
	</div>
</body>
</html>`;
}

// ─── GET → 405 ────────────────────────────────────────────────────────────────

export async function GET(): Promise<Response> {
	return new Response(JSON.stringify({ success: false, message: "Method not allowed" }), {
		status: 405,
		headers: { "Content-Type": "application/json", Allow: "POST" },
	});
}

// ─── POST handler ─────────────────────────────────────────────────────────────

/**
 * POST /api/contact — validates, honeypot-checks, rate-limits, then dispatches
 * via Resend. Returns JSON matching the shape `script.js` expects:
 * success → `{ success: true, message: "..." }`
 * failure → `{ success: false, message: "...", errors?: [...] }`
 *
 * @param {APIContext} context - Astro API context (request + locals).
 * @returns {Promise<Response>} JSON response.
 */
export async function POST(context: APIContext): Promise<Response> {
	const { request, locals } = context;

	// ── GET forwarded to this handler should not reach here, but guard anyway
	if (request.method !== "POST") {
		return new Response(JSON.stringify({ success: false, message: "Method not allowed" }), {
			status: 405,
			headers: { "Content-Type": "application/json", Allow: "POST" },
		});
	}

	// ── Parse JSON body
	let rawBody: unknown;
	try {
		rawBody = await request.json();
	} catch {
		return Response.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
	}

	// ── Zod validation
	const parsed = ContactSchema.safeParse(rawBody);
	if (!parsed.success) {
		return Response.json(
			{
				success: false,
				message: "Câmpuri invalide",
				errors: parsed.error.issues.map((i) => ({ field: i.path.join("."), text: i.message })),
			},
			{ status: 400 },
		);
	}

	const payload = parsed.data;

	// ── Honeypot: bot filled a CSS-hidden text field → silent 200
	if (payload.hp_field && payload.hp_field.trim().length > 0) {
		return Response.json({ success: true, message: "Am primit detaliile tale și te vom contacta în curând!" });
	}

	// ── Rate-limit
	const ip =
		request.headers.get("CF-Connecting-IP") ??
		request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ??
		"unknown";

	if (!checkRateLimit(ip)) {
		return Response.json(
			{ success: false, message: "Prea multe cereri. Te rugăm să aștepți câteva minute și să reîncerci." },
			{ status: 429 },
		);
	}

	// ── Env: prefer Cloudflare runtime bindings, fall back to process.env for local dev
	const env = (locals as { runtime?: { env?: Record<string, string> } }).runtime?.env ?? {};
	const apiKey = env["RESEND_API_KEY"] ?? process.env["RESEND_API_KEY"] ?? "";
	const fromAddress = env["RESEND_FROM"] ?? process.env["RESEND_FROM"] ?? "";
	const toAddress = env["CONTACT_TO"] ?? process.env["CONTACT_TO"] ?? "";

	if (!apiKey || !fromAddress || !toAddress) {
		// Missing binding — return 500 without leaking which var is missing
		return Response.json(
			{ success: false, message: "Eroare de configurare server. Contactați-ne direct la office@dedede.ro." },
			{ status: 500 },
		);
	}

	// ── Send via Resend
	const resend = new Resend(apiKey);

	try {
		const { error } = await resend.emails.send({
			from: fromAddress,
			to: toAddress,
			replyTo: `${payload.side_name} <${payload.side_email}>`,
			subject: `Contact nou pe DeDeDe.ro - ${payload.side_name}`,
			html: buildEmailHtml(payload),
		});

		if (error) {
			// Resend returned a structured error — do NOT echo error.message to client
			return Response.json(
				{ success: false, message: "Trimiterea a eșuat. Te rugăm să reîncerci sau să ne contactezi direct la office@dedede.ro." },
				{ status: 502 },
			);
		}
	} catch {
		return Response.json(
			{ success: false, message: "Trimiterea a eșuat. Te rugăm să reîncerci sau să ne contactezi direct la office@dedede.ro." },
			{ status: 502 },
		);
	}

	return Response.json({ success: true, message: "Am primit detaliile tale și te vom contacta în curând!" });
}
```

- [ ] **Step 2.2: Run the unit tests — expect PASS**

```
pnpm vitest run src/tests/unit/contact-endpoint.test.ts
```

Expected: all 5 tests pass.

- [ ] **Step 2.3: Commit**

```
git add src/pages/api/contact.ts
git commit -m "feat(contact): add /api/contact SSR endpoint with zod validation, honeypot, rate-limit, Resend"
```

---

## Task 3: Create `.env.example`

> **SPINE RECONCILIATION:** `.env.example` is already created once in the scaffold (spine **Task 7** / appendix `01-scaffold-config.md` Task 7) — that is the single authoritative create. Do NOT create it a second time here. Treat this task as a CONTENT spec for that one file: the richer operational comments below (Resend DNS verification, Cloudflare binding steps, missing-binding-is-500 note) should be merged into the Task 7 file. The three var names (`RESEND_API_KEY`, `RESEND_FROM`, `CONTACT_TO`) and placeholder values are identical in both.

**Files:**
- Modify (content of the file created in spine Task 7): `.env.example`

- [ ] **Step 3.1: Write the file**

```ini
# .env.example — Contact form environment variables
# Copy this file to .env and fill in real values for local development.
# Production values are set as Cloudflare environment bindings (never committed).
#
# Operational prerequisites (outside the repo, before production deploy):
# 1. Verify the sending domain in Resend (DNS TXT/MX/DKIM records for dedede.ro).
# 2. In Cloudflare dashboard → Workers & Pages → project → Settings →
#    Environment variables → add all three vars for both Preview and Production.
# 3. A missing binding causes a runtime 500, not a build error.

# Resend API key (create at https://resend.com/api-keys)
RESEND_API_KEY=re_your_api_key_here

# Verified sender address — must be on a domain verified in Resend
RESEND_FROM=noreply@dedede.ro

# Recipient inbox for incoming leads
CONTACT_TO=office@dedede.ro
```

- [ ] **Step 3.2: Verify `.env` is gitignored (it must already be)**

Check `.gitignore` contains `.env` (and not `.env.example`). If `.env` is missing from `.gitignore`, add it.

- [ ] **Step 3.3: Commit**

```
git add .env.example
git commit -m "chore(contact): add .env.example documenting Resend env var shape"
```

---

## Task 4: Create `src/pages/contact.astro`

**Files:**
- Create: `src/pages/contact.astro`
- Source: `parity/baseline/html/contact/index.html` (authoritative)
- Reference: `src/routes/contact/Contact.svelte` (structure only)

- [ ] **Step 4.1: Write the page**

The `<body>` class on the contact baseline is `contact`. Head meta values come from `parity/baseline/meta/contact.json`. Use the `BaseLayout` component (plan 01). The honeypot field goes inside the `CTAFieldset` immediately before the submit button.

> **SPINE RECONCILIATION (the spine wins).** The `<BaseLayout>` invocation below uses `articlePublished`/`articleModified`; the locked prop names (spine Task 20) are **`articlePublishedTime`/`articleModifiedTime`**. Rename both attributes when you write the file so they map to BaseHead's `<meta name="article:published_time">` / `<meta name="article:modified_time">`. All other props (`title`, `description`, `canonical`, `ogImage`, `ogImageAlt`, `ogType`, `analytics`, `bodyClass`) already match the locked interface.

```astro
---
// src/pages/contact.astro
import BaseLayout from "@layouts/BaseLayout.astro";

const title = "Contactează specialiștii în DeDeDe chiar acum!";
const description =
	"Programează-te acum la Dezinfecție, Dezinsecție sau Deratizare! Scapă de 🐜 gândaci, 🐀 șobolani, 🦟 ploșnițe, 🦠 viruși sau alți ☠️ dăunători! București + Ilfov";
const canonical = "https://dedede.ro/contact/";
const ogImage = "https://dedede.ro/images/og-image-contact.jpg";
const ogImageAlt = "DeDeDe.ro - Programează-te la Dezinsecție, Dezinfecție sau Deratizare";
const articlePublished = "2021-09-19T19:35:55+03:00";
const articleModified = "2021-09-19T19:35:55+03:00";
---

<BaseLayout
	title={title}
	description={description}
	canonical={canonical}
	ogImage={ogImage}
	ogImageAlt={ogImageAlt}
	ogType="website"
	articlePublished={articlePublished}
	articleModified={articleModified}
	analytics={true}
	bodyClass="contact"
>
	<!-- Hero / breadcrumb — preserved verbatim from parity/baseline/html/contact/index.html -->
	<section class="Hero ContentPage" role="banner">
		<div class="HeroContainer LimitWidth">
			<ol class="Breadcrumbs" itemscope itemtype="https://schema.org/BreadcrumbList">
				<li class="BreadcrumbItem" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
					<a class="BreadcrumbLink" itemprop="item" href="/">
						<span class="BreadcrumbText" itemprop="name">DeDeDe.ro</span>
					</a>
					<span class="ScreenReaders" itemprop="position">1</span>
				</li>
				<li class="BreadcrumbItem" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
					<span class="BreadcrumbText" itemprop="name">Contactează-l pe DeDeDe.ro</span>
					<span class="ScreenReaders" itemprop="position">2</span>
				</li>
			</ol>
			<div class="ContactHeroContainer">
				<div class="HeroContent">
					<h1 class="HeroTitle">Contact DeDeDe</h1>
					<p class="HeroText">Vrei să afli cât te costă o deratizare, o dezinfecție sau o dezinsecție? Vrei să scapi de 🐜 gândaci, 🐀 șobolani, 🦟 ploșnițe, 🦠 viruși sau alți ☠️ dăunători? Dă-i datele tale lui DeDeDe în formularul de mai jos și te va contacta în cel mai scurt timp!</p>
				</div>
				<img class="HeroImage" src="/images/dedede-hero.svg" loading="lazy" width="130" height="328" alt="Supereroul DeDeDe este tot timpul la un click distanță, gata să te ajute cu problemele tale de dezinfecție, dezinsecție și deratizare!" />
			</div>
		</div>
	</section>

	<!-- Contact form — action points to the new SSR endpoint -->
	<main class="FormContainer LimitWidth">
		<form id="sideform" class="Form ContactForm" action="/api/contact" method="post">
			<fieldset class="Fieldset">
				<legend class="Legend">Introdu datele tale de contact</legend>
				<label class="Label">
					<span class="LabelText">Numele tău complet:</span>
					<input id="side_name" name="side_name" type="text" class="Input" placeholder="Completează numele aici..." maxlength="200" required="required" aria-required="true" autocomplete="on" tabindex="1" />
				</label>
				<label class="Label">
					<span class="LabelText">Telefonul tău:</span>
					<input id="side_telephone" name="side_telephone" type="tel" class="Input" placeholder="Completează telefonul aici..." maxlength="15" required="required" aria-required="true" autocomplete="on" title="Telefonul ar trebui să conțină numai cifre, eventual și simbolul +" tabindex="2" />
				</label>
				<label class="Label">
					<span class="LabelText">Email-ul tău:</span>
					<input id="side_email" name="side_email" type="email" class="Input" placeholder="Completează email-ul aici..." maxlength="200" required="required" aria-required="true" autocomplete="on" tabindex="3" />
				</label>
			</fieldset>
			<fieldset class="Fieldset">
				<legend class="Legend">Introdu informațiile despre intervenție</legend>
				<label class="Label">
					<span class="LabelText">Tipul problemei:</span>
					<select id="side_tip" name="side_tip" class="Select" required="required" aria-required="true" tabindex="4">
						<option value="">Alege o opțiune...</option>
						<option value="dezinsectie">Dezinsecție</option>
						<option value="dezinfectie">Dezinfecție</option>
						<option value="deratizare">Deratizare</option>
						<option value="all">Nu știu</option>
					</select>
				</label>
				<label class="Label">
					<span class="LabelText">Problema detaliată:</span>
					<textarea id="side_mesaj" name="side_mesaj" class="Textarea" rows="15" autocomplete="on" tabindex="5"></textarea>
				</label>
			</fieldset>
			<fieldset class="Fieldset CTAFieldset">
				<legend class="Legend Hidden">Trimite un mesaj lui DeDeDe acum</legend>
				<label class="Label LabelCheckbox">
					<input class="Checkbox" type="checkbox" id="gdpr" name="gdpr" value="1" required="required" aria-required="true" tabindex="6" />
					<span class="CheckboxText">&quot;Am citit și sunt de acord cu <a href="/termeni-si-conditii" target="_blank" rel="noopener noreferrer">Termenii și condițiile</a> de prelucrare a datelor.</span>
				</label>
				<!-- Hidden UTM / tracking fields — populated by script.js at page load -->
				<input class="Hidden" type="hidden" id="urlAjax" name="urlAjax" value="/api/contact" />
				<input class="Hidden" type="hidden" id="side_url" name="side_url" value="" />
				<input class="Hidden" type="hidden" id="utm_source" name="utm_source" value="" />
				<input class="Hidden" type="hidden" id="utm_medium" name="utm_medium" value="" />
				<input class="Hidden" type="hidden" id="utm_term" name="utm_term" value="" />
				<input class="Hidden" type="hidden" id="utm_content" name="utm_content" value="" />
				<input class="Hidden" type="hidden" id="utm_campaign" name="utm_campaign" value="" />
				<input class="Hidden" type="hidden" id="gclid" name="gclid" value="" />
				<!-- Honeypot: CSS-hidden text field; bots that fill it are silently discarded server-side -->
				<label class="HoneypotLabel" aria-hidden="true" tabindex="-1">
					<input type="text" name="hp_field" id="hp_field" class="Honeypot" autocomplete="off" tabindex="-1" value="" />
				</label>
				<button type="submit" id="side_submit" name="side_submit" class="Button ButtonPrimary" title="Contactează-mă acum!" tabindex="7">
					<span class="ButtonText" id="side_submit_text">Trimite mesajul acum →</span>
					<!-- Submit SVG icon — preserved verbatim from baseline -->
					<svg class="ButtonIcon" width="30" height="30" title="Trimite mesajul lui DeDeDe" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 30C17.9667 30 20.8668 29.1203 23.3335 27.472C25.8003 25.8238 27.7229 23.4811 28.8582 20.7403C29.9935 17.9994 30.2905 14.9834 29.7118 12.0736C29.133 9.16393 27.7044 6.49119 25.6066 4.3934C23.5088 2.29562 20.8361 0.867006 17.9263 0.288227C15.0166 -0.290551 12.0006 0.00649924 9.25975 1.14181C6.51885 2.27713 4.17618 4.19972 2.52796 6.66645C0.879734 9.13319 0 12.0333 0 15C0 18.9782 1.58035 22.7936 4.3934 25.6066C7.20644 28.4196 11.0217 30 15 30ZM7.698 10.776C7.87591 10.3471 8.18084 9.98301 8.5718 9.73256C8.96277 9.4821 9.42103 9.35733 9.885 9.375C11.583 9.375 13.281 9.375 14.985 9.375C16.689 9.375 18.393 9.375 20.085 9.375C20.5427 9.3556 20.9959 9.47311 21.3865 9.71251C21.7771 9.95191 22.0875 10.3023 22.278 10.719C22.3161 10.7719 22.341 10.8332 22.3506 10.8978C22.3601 10.9623 22.3541 11.0282 22.3329 11.0899C22.3118 11.1516 22.2761 11.2073 22.229 11.2524C22.1819 11.2975 22.1246 11.3306 22.062 11.349L15.3 14.88C15.2146 14.9289 15.1179 14.9547 15.0195 14.9547C14.9211 14.9547 14.8244 14.9289 14.739 14.88L7.887 11.319C7.83354 11.3025 7.78471 11.2736 7.74446 11.2348C7.7042 11.1959 7.67364 11.1481 7.65525 11.0953C7.63686 11.0424 7.63114 10.986 7.63857 10.9305C7.64599 10.8751 7.66635 10.8221 7.698 10.776ZM8.145 13.029C10.275 14.143 12.403 15.253 14.529 16.359C14.672 16.4437 14.8352 16.4885 15.0015 16.4885C15.1678 16.4885 15.331 16.4437 15.474 16.359C17.59 15.249 19.709 14.149 21.831 13.059C21.893 13.0245 21.9597 12.9993 22.029 12.984C22.0855 12.9647 22.1459 12.9598 22.2048 12.9699C22.2637 12.9799 22.3191 13.0046 22.3659 13.0416C22.4128 13.0786 22.4496 13.1268 22.473 13.1817C22.4965 13.2366 22.5057 13.2966 22.5 13.356C22.5 14.77 22.5 16.183 22.5 17.595C22.5172 17.9615 22.5041 18.3287 22.461 18.693C22.3758 19.2371 22.097 19.7322 21.6759 20.0871C21.2548 20.4421 20.7197 20.6331 20.169 20.625C18.777 20.625 17.385 20.625 15.996 20.625H9.879C9.3587 20.6368 8.8496 20.473 8.43378 20.1601C8.01796 19.8471 7.71967 19.4032 7.587 18.9C7.53223 18.7046 7.50299 18.5029 7.5 18.3C7.5 16.668 7.5 15.036 7.5 13.401C7.5 12.99 7.764 12.834 8.145 13.029Z"></path></svg>
				</button>
			</fieldset>
			<fieldset class="FinalFieldset">
				<legend class="Legend">Mulțumim pentru mesaj!</legend>
				<output class="Raspuns" name="raspuns" id="raspuns" for="side_name side_telephone side_email side_tip side_mesaj"> </output>
			</fieldset>
		</form>
	</main>
	<!-- Contact info section — preserved verbatim from baseline (phone / email / chat / Batman SVG) -->
	<!-- IMPLEMENTOR NOTE: Copy the full <section class="Contact LimitWidth"...> block from
	     parity/baseline/html/contact/index.html lines 69-117. It contains the ProfessionalService
	     microdata, phone/WhatsApp/email/chat CTAs, and the Batman SVG signal.
	     Do NOT retype it here — use the baseline HTML as the exact source. -->
</BaseLayout>

<style lang="scss">
	@use "@styles/tokens" as *;

	/* Honeypot — hidden from all users; bots that fill it are discarded server-side */
	.HoneypotLabel {
		visibility: hidden;
		position: absolute;
		left: -9999px;
		height: 0;
		overflow: hidden;
	}

	.Honeypot {
		display: none;
	}
</style>
```

> **IMPLEMENTOR NOTE for step 4.1:** The `<section class="Contact LimitWidth"...>` contact-info block (lines 69–117 in `parity/baseline/html/contact/index.html`) must be copied verbatim into the slot above the closing `</BaseLayout>` tag. It is not shown here to avoid re-typing the full baseline HTML (per plan conventions), but it is mandatory for parity. Include the `schema.org/ProfessionalService` microdata, the phone/WhatsApp/email CTAs, the chat section, the footer nav, and the Batman SVG. Do NOT alter any class names, SVG paths, or Romanian text.

- [ ] **Step 4.2: Run `pnpm build` — expect success (no TS errors)**

```
pnpm build
```

Expected: build succeeds; `dist/contact/index.html` contains `id="sideform"`.

- [ ] **Step 4.3: Run `pnpm astro check` — expect zero errors on contact.astro**

```
pnpm astro check
```

- [ ] **Step 4.4: Commit**

```
git add src/pages/contact.astro
git commit -m "feat(contact): add static contact.astro with preserved form fields and honeypot"
```

---

## Task 5: Update `public/resources/script.js`

**Files:**
- Modify: `public/resources/script.js`

**Changes required (two occurrences + UTM bug fix):**

The legacy `script.js` has two hardcoded references to the old PHP endpoint and a known bug in UTM population.

**Change 1 — hardcoded `urlAjax` constant in `postData` (line 220 and line 248):**

Old:
```javascript
const urlAjax = 'https://dedede.ro/sideform.php';
```

New (both occurrences):
```javascript
const urlAjax = '/api/contact';
```

**Change 2 — UTM / URL hidden-field population bug fix.**

The legacy code declares `urlParams = []` (an empty array) and never populates hidden fields from `window.location.search`. SPEC §5 explicitly flags this as a legacy bug that the rebuild must fix. Add the following block immediately after the `if (window.location.href.indexOf('contact') > -1) {` opening brace, before the `const form = ...` line:

Old (line 107–125 area):
```javascript
if (window.location.href.indexOf('contact') > -1) {

	const form = document.getElementById('sideform');
```

New:
```javascript
if (window.location.href.indexOf('contact') > -1) {

	// Populate hidden UTM / URL fields from window.location on page load.
	// Legacy bug fix: the Svelte version used urlParams = [] (never read from URL).
	(function populateHiddenFields() {
		var params = new URLSearchParams(window.location.search);
		var sideUrlEl = document.getElementById('side_url');
		var utmSourceEl = document.getElementById('utm_source');
		var utmMediumEl = document.getElementById('utm_medium');
		var utmTermEl = document.getElementById('utm_term');
		var utmContentEl = document.getElementById('utm_content');
		var utmCampaignEl = document.getElementById('utm_campaign');
		var gclidEl = document.getElementById('gclid');
		if (sideUrlEl) sideUrlEl.value = window.location.href;
		if (utmSourceEl) utmSourceEl.value = params.get('utm_source') || '';
		if (utmMediumEl) utmMediumEl.value = params.get('utm_medium') || '';
		if (utmTermEl) utmTermEl.value = params.get('utm_term') || '';
		if (utmContentEl) utmContentEl.value = params.get('utm_content') || '';
		if (utmCampaignEl) utmCampaignEl.value = params.get('utm_campaign') || '';
		if (gclidEl) gclidEl.value = params.get('gclid') || '';
	})();

	const form = document.getElementById('sideform');
```

**Change 3 — `dataLayer` events already fire correctly.** Verify (do not change) that `formularInitializat` (line 143), `formularTrimis` (line 265), `conversieAcceptata` (line 304), and `formularEroare` (lines 280, 313) events remain intact after edits.

**Change 4 — the JSON response check.** The existing `isJson` / `dataJson.message` path in `postData` assumes the server returns `{ message: "..." }`. The new endpoint returns `{ success: boolean, message: string }`. The `script.js` success condition is: `isJson(messages) === true`. When the endpoint returns `{ success: true, message: "..." }`, `isJson` returns true and `dataJson.message` is the HTML content rendered into `#raspuns` — this already works with the new endpoint's response shape. No change needed for the response parsing.

- [ ] **Step 5.1: Apply the three changes to `public/resources/script.js`**

Use the Edit tool to apply each change precisely. After editing, verify the file still parses as valid JS:

```
node --input-type=module < public/resources/script.js
```

(Expect the script to throw a DOM error at runtime since there's no browser — that's fine; it confirms there are no syntax errors.)

- [ ] **Step 5.2: Run `pnpm build` — expect success**

```
pnpm build
```

- [ ] **Step 5.3: Commit**

```
git add public/resources/script.js
git commit -m "fix(contact): update AJAX target from sideform.php to /api/contact; fix UTM URLSearchParams population"
```

---

## Task 6: Playwright E2E tests

**Files:**
- Create: `src/tests/e2e/contact.spec.ts`

These tests run against `astro preview` (or a local dev server). They mock the Resend network call via Playwright's `page.route()` so no real emails are sent.

- [ ] **Step 6.1: Write the E2E spec**

```typescript
// src/tests/e2e/contact.spec.ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// All tests assume the dev/preview server is running at baseURL from playwright.config.ts

test.describe("Contact page — /contact/", () => {
	test("page loads with correct title and h1", async ({ page }) => {
		await page.goto("/contact/");
		await expect(page).toHaveTitle("Contactează specialiștii în DeDeDe chiar acum!");
		await expect(page.locator("h1.HeroTitle")).toHaveText("Contact DeDeDe");
	});

	test("form has the correct action attribute", async ({ page }) => {
		await page.goto("/contact/");
		const form = page.locator("#sideform");
		await expect(form).toHaveAttribute("action", "/api/contact");
		await expect(form).toHaveAttribute("method", "post");
	});

	test("all required fields are present with correct ids", async ({ page }) => {
		await page.goto("/contact/");
		await expect(page.locator("#side_name")).toBeVisible();
		await expect(page.locator("#side_email")).toBeVisible();
		await expect(page.locator("#side_telephone")).toBeVisible();
		await expect(page.locator("#side_tip")).toBeVisible();
		await expect(page.locator("#side_mesaj")).toBeVisible();
		await expect(page.locator("#gdpr")).toBeVisible();
		await expect(page.locator("#raspuns")).toBeAttached();
	});

	test("hidden UTM fields exist in DOM", async ({ page }) => {
		await page.goto("/contact/");
		await expect(page.locator("#utm_source")).toBeAttached();
		await expect(page.locator("#utm_medium")).toBeAttached();
		await expect(page.locator("#utm_campaign")).toBeAttached();
		await expect(page.locator("#gclid")).toBeAttached();
		await expect(page.locator("#side_url")).toBeAttached();
	});

	test("UTM fields are populated from URL query params", async ({ page }) => {
		await page.goto("/contact/?utm_source=google&utm_medium=cpc&utm_campaign=test&gclid=abc123");
		// script.js runs deferred — wait for field population
		await page.waitForLoadState("networkidle");
		await expect(page.locator("#utm_source")).toHaveValue("google");
		await expect(page.locator("#utm_medium")).toHaveValue("cpc");
		await expect(page.locator("#utm_campaign")).toHaveValue("test");
		await expect(page.locator("#gclid")).toHaveValue("abc123");
	});

	test("honeypot field is not visible to the user", async ({ page }) => {
		await page.goto("/contact/");
		const hp = page.locator("#hp_field");
		await expect(hp).toBeAttached();
		// Must be hidden (CSS class Honeypot sets display:none or visibility:hidden)
		await expect(hp).toBeHidden();
	});

	test("client-side validation blocks submit when required fields empty", async ({ page }) => {
		await page.goto("/contact/");
		// Click submit without filling anything
		await page.locator("#side_submit").click();
		// The form should add class Errors and NOT navigate away
		await expect(page.locator("#sideform")).toHaveClass(/Errors/);
		await expect(page).toHaveURL(/\/contact\//);
	});

	test("happy path — valid form submit reaches /api/contact and shows success", async ({ page }) => {
		// Intercept the fetch to /api/contact — return a success response
		await page.route("/api/contact", (route) => {
			void route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ success: true, message: "Am primit detaliile tale și te vom contacta în curând!" }),
			});
		});

		const dataLayerEvents: string[] = [];
		await page.addInitScript(() => {
			window.dataLayer = window.dataLayer || [];
			const originalPush = window.dataLayer.push.bind(window.dataLayer);
			window.dataLayer.push = function (...args) {
				if (args[0] && typeof args[0] === "object" && "event" in args[0]) {
					(window as unknown as { __capturedEvents: string[] }).__capturedEvents ??= [];
					(window as unknown as { __capturedEvents: string[] }).__capturedEvents.push(
						(args[0] as { event: string }).event,
					);
				}
				return originalPush(...args);
			};
		});

		await page.goto("/contact/");
		await page.waitForLoadState("networkidle");

		// Fill all required fields
		await page.fill("#side_name", "Ion Popescu");
		await page.fill("#side_telephone", "0744123456");
		await page.fill("#side_email", "ion@example.com");
		await page.selectOption("#side_tip", "dezinsectie");
		await page.check("#gdpr");

		await page.locator("#side_submit").click();

		// Wait for success state
		await expect(page.locator("#sideform")).toHaveClass(/Success/, { timeout: 10000 });
		await expect(page.locator("#raspuns")).toContainText("Am primit detaliile tale");

		// Collect captured dataLayer events
		const events = await page.evaluate(() => {
			return (window as unknown as { __capturedEvents?: string[] }).__capturedEvents ?? [];
		});
		dataLayerEvents.push(...events);

		expect(dataLayerEvents).toContain("formularInitializat");
		expect(dataLayerEvents).toContain("formularTrimis");
		expect(dataLayerEvents).toContain("conversieAcceptata");
	});

	test("server error path — shows error and pushes formularEroare to dataLayer", async ({ page }) => {
		await page.route("/api/contact", (route) => {
			void route.fulfill({
				status: 502,
				contentType: "application/json",
				body: JSON.stringify({ success: false, message: "Trimiterea a eșuat." }),
			});
		});

		await page.addInitScript(() => {
			window.dataLayer = window.dataLayer || [];
			const originalPush = window.dataLayer.push.bind(window.dataLayer);
			window.dataLayer.push = function (...args) {
				(window as unknown as { __capturedEvents: string[] }).__capturedEvents ??= [];
				if (args[0] && typeof args[0] === "object" && "event" in args[0]) {
					(window as unknown as { __capturedEvents: string[] }).__capturedEvents.push(
						(args[0] as { event: string }).event,
					);
				}
				return originalPush(...args);
			};
		});

		await page.goto("/contact/");
		await page.waitForLoadState("networkidle");

		await page.fill("#side_name", "Ion Popescu");
		await page.fill("#side_telephone", "0744123456");
		await page.fill("#side_email", "ion@example.com");
		await page.selectOption("#side_tip", "dezinsectie");
		await page.check("#gdpr");

		await page.locator("#side_submit").click();

		await expect(page.locator("#sideform")).toHaveClass(/Errors/, { timeout: 10000 });

		const events = await page.evaluate(() => {
			return (window as unknown as { __capturedEvents?: string[] }).__capturedEvents ?? [];
		});

		expect(events).toContain("formularEroare");
	});

	test("honeypot filled — server silently returns 200 (no success class from JS perspective)", async ({
		page,
	}) => {
		// The endpoint returns success=true (silent discard) when hp_field is filled.
		// The client receives success=true, so it should show success state.
		await page.route("/api/contact", async (route) => {
			const body = route.request().postDataJSON() as Record<string, unknown>;
			if (body["hp_field"] && String(body["hp_field"]).length > 0) {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ success: true, message: "Am primit detaliile tale și te vom contacta în curând!" }),
				});
			} else {
				await route.continue();
			}
		});

		await page.goto("/contact/");
		await page.waitForLoadState("networkidle");

		// Forcibly fill the honeypot via JS (as a bot would)
		await page.evaluate(() => {
			const el = document.getElementById("hp_field") as HTMLInputElement | null;
			if (el) el.value = "i-am-a-bot";
		});

		await page.fill("#side_name", "Ion Popescu");
		await page.fill("#side_telephone", "0744123456");
		await page.fill("#side_email", "ion@example.com");
		await page.selectOption("#side_tip", "dezinsectie");
		await page.check("#gdpr");

		await page.locator("#side_submit").click();

		// From the client's perspective the server returned success=true
		await expect(page.locator("#sideform")).toHaveClass(/Success/, { timeout: 10000 });
	});

	test("a11y — no serious axe violations on /contact/", async ({ page }) => {
		await page.goto("/contact/");
		const results = await new AxeBuilder({ page }).analyze();
		const seriousViolations = results.violations.filter(
			(v) => v.impact === "serious" || v.impact === "critical",
		);
		expect(seriousViolations).toHaveLength(0);
	});
});

// ─── API endpoint direct tests (no browser) ──────────────────────────────────

test.describe("POST /api/contact — direct fetch", () => {
	test("GET returns 405", async ({ request }) => {
		const res = await request.get("/api/contact");
		expect(res.status()).toBe(405);
	});

	test("POST with empty body returns 400", async ({ request }) => {
		const res = await request.post("/api/contact", {
			headers: { "Content-Type": "application/json" },
			data: {},
		});
		expect(res.status()).toBe(400);
	});
});
```

- [ ] **Step 6.2: Run E2E tests against preview — expect PASS (or only API tests that need the server running)**

Start the preview server in one terminal:
```
pnpm preview
```

In another:
```
pnpm playwright test src/tests/e2e/contact.spec.ts
```

Expected: all tests pass. If the `utmFields` test flaps due to deferred script timing, increase `waitForLoadState` timeout in `playwright.config.ts`.

- [ ] **Step 6.3: Commit**

```
git add src/tests/e2e/contact.spec.ts
git commit -m "test(contact): add Playwright E2E — happy path, validation, honeypot, dataLayer events, axe"
```

---

## Task 7: Verify unit tests still pass end-to-end

- [ ] **Step 7.1: Run full Vitest suite**

```
pnpm vitest run
```

Expected: all tests pass including the contact-endpoint tests from Task 1.

- [ ] **Step 7.2: Run `pnpm verify` (the full gate)**

```
pnpm verify
```

Expected: prettier, eslint, astro check/tsc, vitest, playwright all pass.

- [ ] **Step 7.3: Run visual diff for /contact/ against baseline**

From `parity/tools/`:
```
node serve-static.mjs --base http://localhost:4321
```
(In another terminal: `pnpm preview`)

Then:
```
node capture-baseline.mjs --base http://localhost:4321
node diff-screens.mjs
```

Expected: diff ≤ 0.1% at all three viewports (mobile 375×812, tablet 768×1024, desktop 1440×900). The honeypot field is CSS-hidden so it produces zero pixel delta.

- [ ] **Step 7.4: Commit the final gate results note (if any baseline updates are needed)**

```
git add parity/
git commit -m "test(contact): update parity screenshots after contact page implementation"
```

---

## Cloudflare deployment prerequisites (out-of-repo, document before PR)

These steps are **not automated** by this plan. They must be completed by the human operator before the production deploy goes live:

1. **Resend sender domain verification** — In the Resend dashboard, add and verify `dedede.ro` (DNS TXT + DKIM records). Without this, all emails will be rejected. Typically takes 24–48 hours for DNS propagation.

2. **Cloudflare environment bindings** — In Cloudflare dashboard → Workers & Pages → project → Settings → Environment variables, add all three vars (`RESEND_API_KEY`, `RESEND_FROM`, `CONTACT_TO`) for both **Preview** and **Production** environments. A missing binding causes a runtime `500`, not a build error — the contact form will silently break if these are absent.

3. **Rate-limit note** — The in-process rate-limit (`5 requests / IP / 10 min`) is best-effort. Cloudflare Workers may run across many isolates, so the map is per-isolate. For stricter global rate-limiting, configure a Cloudflare Rate Limiting rule in the dashboard (WAF → Rate Limiting) or use a KV-backed counter (future enhancement, out of scope for this phase).

4. **No CAPTCHA in scope** — Cloudflare Turnstile is the recommended next step if spam volume warrants it. It is not in scope for this phase (pixel-parity constraint).

---

## Self-review checklist

| Spec requirement | Task that covers it |
|---|---|
| `export const prerender = false` on the endpoint | Task 2 |
| POST-only, GET → 405 | Task 2 (GET handler + unit test) |
| zod validation of all fields | Task 2 (schema) + Task 1 (unit tests) |
| Honeypot check (filled → silent 200, no email) | Task 2 + Task 1 + Task 6 |
| Resend SDK dispatch via `RESEND_API_KEY`/`RESEND_FROM`/`CONTACT_TO` | Task 2 |
| Runtime env from `locals.runtime.env` (Cloudflare) | Task 2 |
| In-process rate-limit | Task 2 |
| JSON response `{ success: boolean, message: string }` | Task 2 |
| Every form field id/name/required/aria preserved verbatim | Task 4 + parity constraints |
| Honeypot field CSS-hidden (not `type=hidden`) | Task 4 (SCSS) |
| `action="/api/contact"` on the form | Task 4 |
| `analytics={true}` on the page | Task 4 |
| AJAX target updated in `script.js` | Task 5 |
| UTM `URLSearchParams` bug fix | Task 5 |
| `dataLayer` events preserved | Task 5 (verified, not changed) |
| `.env.example` shape | Task 3 |
| Vitest: valid → Resend called | Task 1 |
| Vitest: invalid → 400 | Task 1 |
| Vitest: honeypot → 200 no-send | Task 1 |
| Vitest: GET → 405 | Task 1 |
| E2E: happy path + dataLayer events | Task 6 |
| E2E: validation blocks submit | Task 6 |
| E2E: honeypot | Task 6 |
| E2E: axe no serious violations | Task 6 |
| Cloudflare env bindings note | Task 7 (prerequisites section) |
| Resend domain verification note | Task 7 (prerequisites section) |
| Visual diff ≤ 0.1% | Task 7 |
