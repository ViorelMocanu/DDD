// Contract tests for public/sideform.php. They run the real file on PHP's built-in server inside Docker,
// with mail captured to a file and leads stored in SQLite. Skipped when Docker is not running.
// The tests share one server and one client address, so the order matters: the flooding test runs last.
import { ACCEPTED, RETRY_MESSAGE } from "../fixtures/replies";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";

const PORT = 8899;
const ORIGIN = `http://localhost:${PORT}`;
const ENDPOINT = `${ORIGIN}/sideform.php`;
const IMAGE = "php:8.5-cli-alpine";
const RATE_LIMIT = 14;
const dockerRuns = spawnSync("docker", ["info"], { stdio: "ignore" }).status === 0;

const ENV_PHP = `<?php
$DATABASE_DSN = 'sqlite:/tmp/leads.db';
$ALLOWED_SERVER = 'dedede.ro';
$ALLOWED_SERVER_2 = 'localhost:${PORT}';
$tos = ['backup@example.com' => 'Backup'];
$RATE_LIMIT_MAX = ${RATE_LIMIT};
(new PDO($DATABASE_DSN))->exec('CREATE TABLE IF NOT EXISTS dedede_contact (id INTEGER PRIMARY KEY, side_name TEXT, side_url TEXT, side_email TEXT, side_telephone TEXT, side_mesaj TEXT, side_tip TEXT, data TEXT, ip TEXT)');
`;
const LEADS_PHP = `<?php header('Content-Type: application/json'); echo json_encode((new PDO('sqlite:/tmp/leads.db'))->query('SELECT * FROM dedede_contact ORDER BY id')->fetchAll(PDO::FETCH_ASSOC));`;
const SENDMAIL = `#!/bin/sh\n{ cat; printf '\\n=====MAIL=====\\n'; } >> /app/mail.log\n`;

const valid = { side_name: "Ion Popescu", side_email: "ion@example.com", side_telephone: "0744885566", side_tip: "dezinsectie", side_mesaj: "Am gândaci.", side_url: "https://dedede.ro/contact/", datasent: "true", side_verificare: "" };

interface Reply {
	error: string;
	succes?: string;
	message: string;
	errors?: { text: string }[];
}
interface Mail {
	headers: string;
	body: string;
}

let folder = "";
let container = "";

async function post(body: unknown, headers: Record<string, string> = { Origin: ORIGIN }): Promise<Reply> {
	const response = await fetch(ENDPOINT, { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body), headers: { "Content-Type": "application/json", ...headers } });
	return (await response.json()) as Reply;
}

function mails(): Mail[] {
	const log = join(folder, "mail.log");
	if (!existsSync(log)) return [];
	return readFileSync(log, "utf8")
		.split("\n=====MAIL=====\n")
		.filter((mail) => mail.trim() !== "")
		.map((mail) => {
			const [headers = "", ...rest] = mail.replaceAll("\r\n", "\n").split("\n\n");
			return { headers, body: Buffer.from(rest.join(""), "base64").toString("utf8") };
		});
}

const sentTo = (address: string): Mail[] => mails().filter((mail) => mail.headers.split("\n").includes(`To: ${address}`));

async function leads(): Promise<Record<string, string>[]> {
	return (await (await fetch(`${ORIGIN}/leads.php`)).json()) as Record<string, string>[];
}

describe.skipIf(!dockerRuns)("sideform.php", () => {
	beforeAll(async () => {
		folder = mkdtempSync(join(tmpdir(), "dedede-form-"));
		copyFileSync("public/sideform.php", join(folder, "sideform.php"));
		writeFileSync(join(folder, "env.php"), ENV_PHP);
		writeFileSync(join(folder, "leads.php"), LEADS_PHP);
		writeFileSync(join(folder, "sendmail.sh"), SENDMAIL);
		// display_errors is on here on purpose: the endpoint must switch it off itself, or a PHP warning would corrupt the JSON reply.
		container = execFileSync("docker", ["run", "-d", "--rm", "-p", `${PORT}:8000`, "-v", `${folder}:/app`, IMAGE, "php", "-d", "sendmail_path=/bin/sh /app/sendmail.sh", "-d", "display_errors=1", "-d", "log_errors=1", "-S", "0.0.0.0:8000", "-t", "/app"], { encoding: "utf8" }).trim();
		await vi.waitFor(() => fetch(ENDPOINT), { timeout: 20_000, interval: 200 });
	});

	afterAll(() => {
		if (container) spawnSync("docker", ["rm", "-f", container], { stdio: "ignore" });
		if (folder) rmSync(folder, { recursive: true, force: true });
	});

	test("a GET request gets the legacy 'wrong input' reply", async () => {
		const reply = (await (await fetch(ENDPOINT)).json()) as Reply;
		expect(reply).toEqual({ error: "true", message: RETRY_MESSAGE, errors: [{ text: "Input greșit." }] });
	});

	test("a body without datasent, broken JSON or an oversized body is refused", async () => {
		expect((await post({ side_name: "x" })).errors?.[0]?.text).toBe("Input greșit.");
		expect((await post("{not json")).errors?.[0]?.text).toBe("Input greșit.");
		expect((await post({ ...valid, side_mesaj: "x".repeat(30_000) })).errors?.[0]?.text).toBe("Input greșit.");
		expect(mails()).toHaveLength(0);
	});

	test("a foreign, missing or unreadable origin is refused", async () => {
		expect((await post(valid, { Origin: "https://evil.example" })).error).toBe("true");
		expect((await post(valid, {})).error).toBe("true");
		expect((await post(valid, { Referer: "https://dedede.ro.evil.example/contact/" })).error).toBe("true");
		// An Origin header that is present but not ours must not be rescued by a friendly Referer.
		expect((await post(valid, { Origin: "null", Referer: `${ORIGIN}/contact/` })).error).toBe("true");
		expect(mails()).toHaveLength(0);
		expect(await leads()).toHaveLength(0);
	});

	test("invalid fields are listed and nothing is stored or sent", async () => {
		const reply = await post({ ...valid, side_name: "", side_email: "not-an-email", side_telephone: "12", side_tip: "altceva" });
		expect(reply.error).toBe("true");
		expect(reply.errors?.map((error) => error.text.replace(/<[^>]+>/g, ""))).toEqual(["nu ai introdus numele tău", "ai introdus un email greșit", "ai introdus un telefon invalid", "nu ai ales tipul problemei"]);
		expect(reply.errors?.[0]?.text).toContain('href="#side_name"');
		expect((await post({ ...valid, side_email: "" })).errors?.[0]?.text).toContain("nu ai introdus");
		expect((await post({ ...valid, side_email: "ion@example.com\r\nBcc: evil@example.com" })).error).toBe("true");
		expect((await post({ ...valid, side_name: ["array"] })).error).toBe("true");
		expect(mails()).toHaveLength(0);
		expect(await leads()).toHaveLength(0);
	});

	test("a filled honeypot still reaches the office, marked as possible spam, and sends no confirmation", async () => {
		const reply = await post({ ...valid, side_email: "capcana@example.com", side_verificare: "https://spam.example/<b>" });
		expect(reply).toEqual(ACCEPTED);
		expect(await leads()).toHaveLength(1);

		const sent = mails();
		expect(sent).toHaveLength(1);
		expect(sent[0]?.headers).toMatch(/^To: office@dedede\.ro$/m);
		expect(sent[0]?.headers).toMatch(/^Subject: \[posibil spam\] Contact nou pe DeDeDe\.ro - Ion Popescu$/m);
		expect(sent[0]?.body).toContain("https://spam.example/&lt;b&gt;");
		expect(sentTo("capcana@example.com")).toHaveLength(0);
	});

	test("a phone number written with spaces, dots, dashes or a plus is accepted and stored as digits", async () => {
		expect(await post({ ...valid, side_email: "telefon@example.com", side_telephone: "+40 (744) 885-566" })).toEqual(ACCEPTED);
		expect((await leads()).at(-1)?.["side_telephone"]).toBe("+40744885566");
		for (const phone of ["0744 885", "07448855661234567", "0744+885566", "abc0744885566"]) expect((await post({ ...valid, side_telephone: phone })).errors?.[0]?.text, phone).toContain("telefon invalid");
	});

	test("a request with no Origin header is accepted on its Referer", async () => {
		const reply = await post({ ...valid, side_email: "referer@example.com" }, { Referer: `${ORIGIN}/contact/` });
		expect(reply).toEqual(ACCEPTED);
		expect(sentTo("referer@example.com")).toHaveLength(1);
	});

	test("a valid submission is stored and produces two emails", async () => {
		const before = mails().length;
		const reply = await post({ ...valid, utm_source: "google", gclid: "abc123" });
		expect(reply).toEqual(ACCEPTED);

		const stored = (await leads()).at(-1);
		expect(stored).toMatchObject({ side_name: "Ion Popescu", side_email: "ion@example.com", side_telephone: "0744885566", side_tip: "dezinsectie", side_mesaj: "Am gândaci.", side_url: "https://dedede.ro/contact/" });

		// Times are Romanian time whatever the server's own clock setting is (this test server runs on UTC).
		const inRomania = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Bucharest", dateStyle: "short", timeStyle: "medium" }).format(new Date());
		const asNumber = (time: string): number => Date.parse(`${time.replace(" ", "T")}Z`);
		expect(Math.abs(asNumber(stored?.["data"] ?? "") - asNumber(inRomania))).toBeLessThan(120_000);

		const sent = mails().slice(before);
		expect(sent).toHaveLength(2);
		const [office, visitor] = sent;
		expect(office?.headers).toMatch(/^To: office@dedede\.ro$/m);
		expect(office?.headers).toMatch(/^From: DeDeDe\.ro <no-reply@dedede\.ro>$/m);
		expect(office?.headers).toMatch(/^Reply-To: ion@example\.com$/m);
		expect(office?.headers).toMatch(/^Bcc: backup@example\.com$/m);
		expect(office?.body).toContain("Ion Popescu ne-a trimis un mesaj");
		expect(office?.body).toContain("Am gândaci.");
		expect(office?.body).toContain("<strong>Campaign Source</strong>: google");
		expect(office?.body).toContain("<strong>AdWords ID</strong>: abc123");
		expect(visitor?.headers).toMatch(/^To: ion@example\.com$/m);
		expect(visitor?.headers).toMatch(/^Reply-To: office@dedede\.ro$/m);
		expect(visitor?.headers).not.toMatch(/^Bcc:/m);
		expect(visitor?.body).toContain("Dragă Ion Popescu,");
	});

	test("hostile values are stored literally, escaped in email and cannot add headers", async () => {
		const name = `{\${phpinfo()}}"; DROP TABLE dedede_contact; -- <script>alert(1)</script>\r\nBcc: evil@example.com`;
		const before = mails().length;
		const reply = await post({ ...valid, side_name: name, side_mesaj: "<img src=x onerror=alert(1)>\n' OR 1=1 --", utm_source: "<b>bold</b>", side_url: 'https://dedede.ro/contact/?x="><script>' });
		expect(reply).toEqual(ACCEPTED);

		const stored = (await leads()).at(-1);
		expect(stored?.["side_name"]).toBe(`{\${phpinfo()}}"; DROP TABLE dedede_contact; -- <script>alert(1)</script>Bcc: evil@example.com`);
		expect(stored?.["side_mesaj"]).toBe("<img src=x onerror=alert(1)>\n' OR 1=1 --");

		const [office, visitor] = mails().slice(before);
		expect(office?.headers).not.toMatch(/^Bcc: evil@example\.com/m);
		expect(office?.headers.match(/^Bcc:/gm)).toHaveLength(1);
		expect(office?.body).not.toContain("<script>");
		expect(office?.body).not.toContain("<img src=x");
		expect(office?.body).not.toContain("<b>bold</b>");
		expect(office?.body).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
		expect(office?.body).not.toContain("PHP Version");
		expect(visitor?.body).not.toContain("<script>");
	});

	test("one address gets at most two confirmation emails, while the office still gets every lead", async () => {
		const officeBefore = sentTo("office@dedede.ro").length;
		for (let attempt = 0; attempt < 3; attempt++) expect(await post({ ...valid, side_email: "Repetat@example.com" })).toEqual(ACCEPTED);
		expect(sentTo("office@dedede.ro")).toHaveLength(officeBefore + 3);
		expect(sentTo("Repetat@example.com")).toHaveLength(2);
	});

	test("flooding from one address is cut off", async () => {
		const replies: string[] = [];
		for (let attempt = 0; attempt < RATE_LIMIT + 2; attempt++) replies.push((await post({ ...valid, side_email: `flood${attempt}@example.com` })).error);
		expect(replies.at(-1)).toBe("true");
		expect(await leads()).toHaveLength(RATE_LIMIT);
		expect(sentTo("office@dedede.ro")).toHaveLength(RATE_LIMIT);
	});
});
