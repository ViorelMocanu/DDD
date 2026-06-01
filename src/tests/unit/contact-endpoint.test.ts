// src/tests/unit/contact-endpoint.test.ts
//
// Group E / Tasks 30–31 — Vitest unit tests for the /api/contact SSR endpoint.
//
// The endpoint imports `z` from "astro/zod" (a real, node-resolvable path), so the
// schema validation runs exactly as at runtime — no mocking of zod is needed.
//
// The Resend SDK is mocked so no real network/email dispatch happens; we assert
// on the mapped { to, from, subject, html } payload instead.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// `vi.hoisted` runs before the (hoisted) `vi.mock` factory, so the shared
// `mockEmailsSend` spy is initialised in time and survives `vi.resetModules()`.
const { mockEmailsSend } = vi.hoisted(() => ({ mockEmailsSend: vi.fn() }));

vi.mock("resend", () => ({
	// A real class so `new Resend(apiKey)` constructs correctly even after
	// `vi.resetModules()` re-evaluates this factory between tests.
	Resend: class {
		emails = { send: mockEmailsSend };
		constructor(_apiKey?: string) {
			void _apiKey;
		}
	},
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a Request with a JSON body for POST /api/contact.
 * @param body - The JSON payload to send as the request body.
 * @param method - HTTP method (defaults to `"POST"`; a `"GET"` omits the body entirely).
 * @returns A Fetch API `Request` the endpoint handler can consume directly.
 */
function makeRequest(body: Record<string, unknown>, method = "POST"): Request {
	// Build init without an explicit `body: undefined` — `exactOptionalPropertyTypes`
	// rejects a present-but-undefined RequestInit.body. GET requests simply omit it.
	const init: RequestInit = {
		method,
		headers: { "Content-Type": "application/json" },
	};
	if (method !== "GET") {
		init.body = JSON.stringify(body);
	}
	return new Request("http://localhost/api/contact", init);
}

/**
 * Minimal valid payload matching every required + tracking field.
 * @returns A payload object that passes the endpoint's zod validation.
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

/**
 * Build the Cloudflare-style `locals.runtime.env` context the endpoint reads from.
 * @returns An APIContext-shaped `locals` object carrying the three Resend env vars.
 */
function localsWithEnv(): { runtime: { env: Record<string, string> } } {
	return {
		runtime: {
			env: {
				RESEND_API_KEY: "re_test_key",
				RESEND_FROM: "noreply@dedede.ro",
				CONTACT_TO: "office@dedede.ro",
			},
		},
	};
}

// ─── Import subject under test AFTER mocks are set ───────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let POST: (ctx: any) => Promise<Response>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let GET: (ctx?: any) => Promise<Response>;

beforeEach(async () => {
	vi.resetModules();
	mockEmailsSend.mockReset();
	// Provide fake env for the process.env fallback path too.
	process.env["RESEND_API_KEY"] = "re_test_key";
	process.env["RESEND_FROM"] = "noreply@dedede.ro";
	process.env["CONTACT_TO"] = "office@dedede.ro";

	const mod = (await import("../../pages/api/contact.ts")) as unknown as {
		POST: typeof POST;
		GET: typeof GET;
	};
	POST = mod.POST;
	GET = mod.GET;
});

afterEach(() => {
	delete process.env["RESEND_API_KEY"];
	delete process.env["RESEND_FROM"];
	delete process.env["CONTACT_TO"];
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/contact", () => {
	it("returns 200 and calls Resend with correctly-mapped to/from/subject/html when payload is valid", async () => {
		mockEmailsSend.mockResolvedValue({ data: { id: "abc" }, error: null });

		const req = makeRequest(validPayload());
		const res = await POST({ request: req, locals: localsWithEnv() });

		expect(res.status).toBe(200);
		const json = (await res.json()) as { success: boolean; message: string };
		expect(json.success).toBe(true);
		expect(typeof json.message).toBe("string");
		expect(json.message.length).toBeGreaterThan(0);
		expect(mockEmailsSend).toHaveBeenCalledOnce();

		const callArg = mockEmailsSend.mock.calls[0]?.[0] as {
			to: string;
			from: string;
			subject: string;
			html: string;
			replyTo?: string;
		};
		expect(callArg.to).toBe("office@dedede.ro");
		expect(callArg.from).toBe("noreply@dedede.ro");
		// subject carries the sender's name so the inbox preview is useful
		expect(callArg.subject).toContain("Ion Popescu");
		// html body must include the submitter's email and message-derived data
		expect(callArg.html).toContain("ion@example.com");
		expect(callArg.html).toContain("Ion Popescu");
		// replyTo should be set so a reply goes back to the lead
		expect(callArg.replyTo).toContain("ion@example.com");
	});

	it("returns 400 when a required field is missing (no side_name)", async () => {
		const payload = validPayload();
		delete payload["side_name"];
		const req = makeRequest(payload);
		const res = await POST({ request: req, locals: localsWithEnv() });

		expect(res.status).toBe(400);
		const json = (await res.json()) as { success: boolean };
		expect(json.success).toBe(false);
		expect(mockEmailsSend).not.toHaveBeenCalled();
	});

	it("returns 400 when email is malformed", async () => {
		const payload = { ...validPayload(), side_email: "not-an-email" };
		const req = makeRequest(payload);
		const res = await POST({ request: req, locals: localsWithEnv() });

		expect(res.status).toBe(400);
		const json = (await res.json()) as { success: boolean };
		expect(json.success).toBe(false);
		expect(mockEmailsSend).not.toHaveBeenCalled();
	});

	it("returns 400 when side_tip is not an allowed value", async () => {
		const payload = { ...validPayload(), side_tip: "invalid_option" };
		const req = makeRequest(payload);
		const res = await POST({ request: req, locals: localsWithEnv() });

		expect(res.status).toBe(400);
		expect(mockEmailsSend).not.toHaveBeenCalled();
	});

	it("returns 400 when the JSON body is malformed", async () => {
		const req = new Request("http://localhost/api/contact", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: "{ this is not json",
		});
		const res = await POST({ request: req, locals: localsWithEnv() });

		expect(res.status).toBe(400);
		expect(mockEmailsSend).not.toHaveBeenCalled();
	});

	it("returns 200 silently (no email sent) when the honeypot is filled", async () => {
		const payload = { ...validPayload(), hp_field: "i-am-a-bot" };
		const req = makeRequest(payload);
		const res = await POST({ request: req, locals: localsWithEnv() });

		expect(res.status).toBe(200);
		const json = (await res.json()) as { success: boolean };
		// Client sees success=true so the bot gets no signal it was caught…
		expect(json.success).toBe(true);
		// …but Resend must NOT be called — this is the silent discard.
		expect(mockEmailsSend).not.toHaveBeenCalled();
	});

	it("returns 405 for GET requests routed through POST", async () => {
		const req = makeRequest({}, "GET");
		const res = await POST({ request: req, locals: localsWithEnv() });

		expect(res.status).toBe(405);
		expect(mockEmailsSend).not.toHaveBeenCalled();
	});

	it("exposes a dedicated GET handler that returns 405 with Allow: POST", async () => {
		const res = await GET({ request: makeRequest({}, "GET"), locals: localsWithEnv() });
		expect(res.status).toBe(405);
		expect(res.headers.get("Allow")).toBe("POST");
	});

	it("returns 500 (generic) when required env bindings are missing", async () => {
		const req = makeRequest(validPayload());
		// No runtime env and clear the process.env fallback too.
		delete process.env["RESEND_API_KEY"];
		delete process.env["RESEND_FROM"];
		delete process.env["CONTACT_TO"];
		const res = await POST({ request: req, locals: {} });

		expect(res.status).toBe(500);
		const json = (await res.json()) as { success: boolean; message: string };
		expect(json.success).toBe(false);
		// Must NOT leak which variable is missing.
		expect(json.message).not.toContain("RESEND_API_KEY");
		expect(json.message).not.toContain("CONTACT_TO");
		expect(mockEmailsSend).not.toHaveBeenCalled();
	});

	it("returns 502 when Resend responds with a structured error", async () => {
		mockEmailsSend.mockResolvedValue({ data: null, error: { message: "domain not verified" } });

		const req = makeRequest(validPayload());
		const res = await POST({ request: req, locals: localsWithEnv() });

		expect(res.status).toBe(502);
		const json = (await res.json()) as { success: boolean; message: string };
		expect(json.success).toBe(false);
		// The raw Resend error message must not be echoed to the client.
		expect(json.message).not.toContain("domain not verified");
		expect(mockEmailsSend).toHaveBeenCalledOnce();
	});

	it("returns 502 when the Resend SDK throws", async () => {
		mockEmailsSend.mockRejectedValue(new Error("network down"));

		const req = makeRequest(validPayload());
		const res = await POST({ request: req, locals: localsWithEnv() });

		expect(res.status).toBe(502);
		const json = (await res.json()) as { success: boolean };
		expect(json.success).toBe(false);
	});

	it("maps every field correctly into the email html body", async () => {
		mockEmailsSend.mockResolvedValue({ data: { id: "abc" }, error: null });

		const payload = {
			...validPayload(),
			side_name: "Maria Ionescu",
			side_email: "maria@example.com",
			side_telephone: "0721000111",
			side_tip: "deratizare",
			side_mesaj: "Am sobolani in pod",
			side_url: "https://dedede.ro/contact/?x=1",
			utm_source: "google",
			utm_medium: "cpc",
			utm_campaign: "spring",
			gclid: "GCLID123",
		};
		const req = makeRequest(payload);
		const res = await POST({ request: req, locals: localsWithEnv() });

		expect(res.status).toBe(200);
		const html = (mockEmailsSend.mock.calls[0]?.[0] as { html: string }).html;
		expect(html).toContain("Maria Ionescu");
		expect(html).toContain("maria@example.com");
		expect(html).toContain("0721000111");
		expect(html).toContain("deratizare");
		expect(html).toContain("Am sobolani in pod");
		expect(html).toContain("google");
		expect(html).toContain("GCLID123");
	});
});
