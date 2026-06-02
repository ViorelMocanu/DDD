// src/pages/api/contact.ts
//
// Group E / Tasks 30–31 — SSR POST endpoint that replaces the legacy sideform.php.
//
// Responsibilities:
//   • POST-only (GET → 405).
//   • Parse JSON body (malformed → 400).
//   • zod validation of every field (invalid → 400). zod comes from "astro/zod"
//     (Astro re-exports the full Zod namespace there), so it is NOT a direct dep.
//   • Honeypot check: a filled `hp_field` → silent 200 (no email). The bot gets a
//     success response so it has no signal it was caught.
//   • Best-effort in-process rate-limit (per-IP). Cloudflare Workers are stateless
//     across isolates, so this is per-isolate, not strict global.
//   • Read env from `locals.runtime.env` (Cloudflare binding) with import.meta.env /
//     process.env fallback for local dev. Missing binding → generic 500 (no leak).
//   • Dispatch via the Resend SDK. Resend error / thrown → 502.
//   • Success → 200 JSON `{ success: true, message }`.
//
// RESPONSE CONTRACT — matches public/resources/script.js exactly:
//   script.js does `fetch(...).then(r => r.text())` then `isJson(messages)`:
//     • If the body parses as JSON, it renders `JSON.parse(body).message` into
//       `#raspuns` (sanitized) and fires the success dataLayer events. So a JSON
//       body with a `message` string is the SUCCESS path from the client's view.
//     • A non-JSON body is treated as an error.
//   Therefore: success → `{ success: true, message: "<user-facing HTML/text>" }`.
//   Validation/server failures ALSO return JSON `{ success:false, message }` with a
//   non-2xx status; the `message` is what the client surfaces. We never echo raw
//   internal error details (Resend / which env var) to the client.
import type { APIContext } from "astro";
// `z` from "astro:content" is a value-only const (no type namespace) in Astro v6, so
// `z.infer<...>` in type position fails with "Cannot find namespace 'z'". "astro/zod"
// re-exports the full Zod v4 namespace (value + types) — the Astro-recommended source.
import { z } from "astro/zod";
import { Resend } from "resend";

export const prerender = false;

// ─── Zod schema ──────────────────────────────────────────────────────────────

/** Allowed values for the `side_tip` select — must match the baseline <option> values. */
const ALLOWED_TIP = ["dezinsectie", "dezinfectie", "deratizare", "all"] as const;

const ContactSchema = z.object({
	side_name: z.string().min(2).max(200),
	side_email: z.email().max(200),
	side_telephone: z.string().regex(/^\+?\d{9,15}$/, "Telefon invalid"),
	side_tip: z.enum(ALLOWED_TIP),
	side_mesaj: z.string().max(5000).optional().default(""),
	gdpr: z.literal("1"),
	hp_field: z.string().max(200).optional().default(""),
	// hidden / UTM / tracking fields — optional strings, bounded length.
	urlAjax: z.string().max(500).optional().default(""),
	side_url: z.string().max(500).optional().default(""),
	utm_source: z.string().max(200).optional().default(""),
	utm_medium: z.string().max(200).optional().default(""),
	utm_term: z.string().max(200).optional().default(""),
	utm_content: z.string().max(200).optional().default(""),
	utm_campaign: z.string().max(200).optional().default(""),
	gclid: z.string().max(200).optional().default(""),
	// script.js also sends these two helper flags — accept & ignore them.
	datasent: z.string().optional(),
	tech: z.string().optional(),
});

type ContactPayload = z.infer<typeof ContactSchema>;

// ─── User-facing messages (Romanian) ─────────────────────────────────────────

const SUCCESS_MESSAGE = "Am primit detaliile tale și te vom contacta în curând!";
const INVALID_MESSAGE = "Te rugăm să completezi corect câmpurile din formular!";
const RATE_LIMIT_MESSAGE = "Prea multe cereri. Te rugăm să aștepți câteva minute și să reîncerci.";
const CONFIG_ERROR_MESSAGE = "Eroare de configurare server. Contactați-ne direct la office@dedede.ro.";
const SEND_ERROR_MESSAGE = "Trimiterea a eșuat. Te rugăm să reîncerci sau să ne contactezi direct la office@dedede.ro.";

// ─── Small JSON helpers ──────────────────────────────────────────────────────

/**
 * Build a JSON `Response` with the standard `application/json` content type.
 * @param body - Any JSON-serializable value to send as the response body.
 * @param status - The HTTP status code for the response.
 * @param extraHeaders - Optional extra response headers to merge in (e.g. `Allow: POST` on a 405).
 * @returns A `Response` whose body is `JSON.stringify(body)` and whose headers include `Content-Type: application/json` plus any `extraHeaders`.
 */
function json(body: unknown, status: number, extraHeaders?: Record<string, string>): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json", ...extraHeaders },
	});
}

// ─── Rate-limit (best-effort in-process) ─────────────────────────────────────

// Cloudflare Workers may run across isolates, so this map is per-isolate — a
// best-effort speed bump for casual abuse, not a strict global limit. A KV /
// Durable-Object-backed counter would be the production-grade upgrade (out of scope).
const RL_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RL_MAX = 5; // submissions per IP per window
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Check, and on success increment, the best-effort in-process rate-limit for one IP.
 *
 * The counter lives in a per-isolate `Map`, so on Cloudflare Workers the budget is
 * per-isolate rather than strictly global — adequate for basic abuse mitigation, not
 * a hard global quota.
 * @param ip - The client IP address, or `"unknown"` when it cannot be determined.
 * @returns `true` if the request is within the per-IP window budget, `false` if it should be blocked.
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
 * HTML-escape a user-supplied string before it is interpolated into the email body,
 * neutralising `& < > " '` so submitted content cannot inject markup into the email.
 * @param s - The raw, untrusted user input.
 * @returns The same text with HTML-significant characters replaced by entities, safe for an HTML context.
 */
function esc(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/**
 * Build the HTML notification email body from a validated contact-form payload.
 *
 * Every interpolated field is passed through {@link esc}; the UTM block and the gclid
 * block are each emitted only when at least one of their fields is non-empty.
 * @param p - The validated contact form payload (post-zod, with defaults applied).
 * @returns A complete, self-contained HTML document string for the notification email.
 */
function buildEmailHtml(p: ContactPayload): string {
	const utmBlock =
		p.utm_source || p.utm_medium || p.utm_term || p.utm_content || p.utm_campaign
			? `<hr><ul>
				<li><strong>Campaign Source:</strong> ${esc(p.utm_source)}</li>
				<li><strong>Campaign Medium:</strong> ${esc(p.utm_medium)}</li>
				<li><strong>Campaign Term:</strong> ${esc(p.utm_term)}</li>
				<li><strong>Campaign Content:</strong> ${esc(p.utm_content)}</li>
				<li><strong>Campaign Name:</strong> ${esc(p.utm_campaign)}</li>
			</ul><hr>`
			: "";

	const gclidBlock = p.gclid ? `<ul><li><strong>AdWords ID:</strong> ${esc(p.gclid)}</li></ul><hr>` : "";

	return `<!DOCTYPE html>
<html lang="ro">
<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><title>Contact DeDeDe</title></head>
<body style="font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5em;">
	<div style="width:90%;margin:0 auto;">
		<div style="padding:1em 3em;background:#eee;border:1px solid #ddd;">
			<h1 style="font-size:24px;font-weight:100;">${esc(p.side_name)} a trimis un mesaj pe formularul de contact!</h1>
			<ul>
				<li><strong>Nume:</strong> ${esc(p.side_name)}</li>
				<li><strong>E-mail:</strong> <a href="mailto:${esc(p.side_email)}">${esc(p.side_email)}</a></li>
				<li><strong>Telefon:</strong> <a href="tel:${esc(p.side_telephone)}">${esc(p.side_telephone)}</a></li>
				<li><strong>A venit de pe:</strong> <a href="${esc(p.side_url)}">${esc(p.side_url)}</a></li>
				<li><strong>Tip curățenie:</strong> ${esc(p.side_tip)}</li>
				<li><strong>Mesaj:</strong> ${esc(p.side_mesaj)}</li>
			</ul>
			${utmBlock}${gclidBlock}
		</div>
	</div>
</body>
</html>`;
}

// ─── Env reader ───────────────────────────────────────────────────────────────

/**
 * Resolve the three Resend env vars, preferring the Cloudflare runtime binding,
 * then `import.meta.env`, then `process.env` (the local-dev / Node-test fallback).
 * @param locals - The Astro API context `locals`, which may carry a Cloudflare `runtime.env`.
 * @returns The resolved `{ apiKey, fromAddress, toAddress }`; any value missing from every source comes back as `""`.
 */
function readEnv(locals: APIContext["locals"]): {
	apiKey: string;
	fromAddress: string;
	toAddress: string;
} {
	const runtimeEnv = (locals as { runtime?: { env?: Record<string, string> } }).runtime?.env ?? {};
	// import.meta.env is statically replaced at build; guard for environments without it.
	const metaEnv = (import.meta.env ?? {}) as Record<string, string | undefined>;
	const procEnv = (typeof process !== "undefined" ? process.env : {}) as Record<string, string | undefined>;

	const pick = (key: string): string => runtimeEnv[key] ?? metaEnv[key] ?? procEnv[key] ?? "";

	return {
		apiKey: pick("RESEND_API_KEY"),
		fromAddress: pick("RESEND_FROM"),
		toAddress: pick("CONTACT_TO"),
	};
}

// ─── GET → 405 ────────────────────────────────────────────────────────────────

/**
 * GET handler — the endpoint is POST-only, so every GET is rejected outright.
 * @returns A 405 JSON `Response` carrying an `Allow: POST` header.
 */
export async function GET(): Promise<Response> {
	return json({ success: false, message: "Method not allowed" }, 405, { Allow: "POST" });
}

// ─── POST handler ─────────────────────────────────────────────────────────────

/**
 * POST `/api/contact` — parse the body, zod-validate, honeypot-check, rate-limit, then dispatch via Resend.
 * @param context - The Astro API context (the incoming `request` plus `locals`).
 * @returns A JSON `Response` matching the `script.js` client contract — `{ success, message }`, 2xx on success and a non-2xx status on validation/server failure.
 */
export async function POST(context: APIContext): Promise<Response> {
	const { request, locals } = context;

	// ── Guard: only POST reaches the send path (handles the routed-GET case).
	if (request.method !== "POST") {
		return json({ success: false, message: "Method not allowed" }, 405, { Allow: "POST" });
	}

	// ── Parse JSON body.
	let rawBody: unknown;
	try {
		rawBody = await request.json();
	} catch {
		return json({ success: false, message: INVALID_MESSAGE }, 400);
	}

	// ── zod validation.
	const parsed = ContactSchema.safeParse(rawBody);
	if (!parsed.success) {
		return json(
			{
				success: false,
				message: INVALID_MESSAGE,
				errors: parsed.error.issues.map((i) => ({ field: i.path.join("."), text: i.message })),
			},
			400,
		);
	}

	const payload = parsed.data;

	// ── Honeypot: a real user can't fill the CSS-hidden field → silent success.
	if (payload.hp_field && payload.hp_field.trim().length > 0) {
		return json({ success: true, message: SUCCESS_MESSAGE }, 200);
	}

	// ── Rate-limit (best-effort, per-isolate).
	const ip = request.headers.get("CF-Connecting-IP") ?? request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ?? "unknown";

	if (!checkRateLimit(ip)) {
		return json({ success: false, message: RATE_LIMIT_MESSAGE }, 429);
	}

	// ── Env: Cloudflare binding first, then build/dev fallbacks.
	const { apiKey, fromAddress, toAddress } = readEnv(locals);
	if (!apiKey || !fromAddress || !toAddress) {
		// Missing binding → generic 500. Do NOT leak which var is absent.
		return json({ success: false, message: CONFIG_ERROR_MESSAGE }, 500);
	}

	// ── Dispatch via Resend.
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
			// Structured Resend error — never echo error.message to the client.
			return json({ success: false, message: SEND_ERROR_MESSAGE }, 502);
		}
	} catch {
		return json({ success: false, message: SEND_ERROR_MESSAGE }, 502);
	}

	return json({ success: true, message: SUCCESS_MESSAGE }, 200);
}
