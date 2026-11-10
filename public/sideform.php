<?php
/**
 * Contact form endpoint for dedede.ro.
 *
 * Accepts a same-origin JSON POST from /contact/, stores the lead and sends two emails
 * (office notification, visitor confirmation). Replies with JSON in the shape the page expects.
 *
 * Settings come from env.php next to this file (server only, never in git): see DEPLOY.md.
 * Request values are never executed, never concatenated into SQL and always escaped in emails.
 */

declare(strict_types=1);

// A PHP warning printed into the reply would corrupt the JSON and reveal server paths. Problems go to the error log instead.
ini_set('display_errors', '0');

const OFFICE_EMAIL = 'office@dedede.ro';
const FROM_EMAIL = 'no-reply@dedede.ro';
const FROM_NAME = 'DeDeDe.ro';
const MAX_BODY_BYTES = 20000;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_SECONDS = 600;
// The confirmation goes to an address typed by a stranger, so it is capped: nobody can use the form to mail-bomb someone else.
const CONFIRMATIONS_PER_ADDRESS = 2;
const CONFIRMATIONS_IN_TOTAL = 30;
const PROBLEM_TYPES = ['dezinsectie', 'dezinfectie', 'deratizare', 'all'];
const RETRY_MESSAGE = 'Te rugăm să încerci să retrimiți formularul, pentru că ';
const SUCCESS = ['error' => 'false', 'succes' => 'true', 'message' => 'Am primit detaliile tale și te vom contacta în curând!'];
const MAIL_PROBLEM = 'avem o problemă cu serverul de e-mail. Te rugăm să ne contactezi direct la: <a href="mailto:' . OFFICE_EMAIL . '" title="Trimite-ne un mail!">' . OFFICE_EMAIL . '</a>!';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

/** Sends the JSON reply and stops. */
function reply(array $payload): never
{
	echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
	exit;
}

function refuse(string ...$reasons): never
{
	reply(['error' => 'true', 'message' => RETRY_MESSAGE, 'errors' => array_map(static fn (string $text): array => ['text' => $text], $reasons)]);
}

/** A trimmed, single-line or multi-line text field, cut to a maximum length. Anything that is not a string becomes ''. */
function field(array $input, string $name, int $maxLength, bool $multiline = false): string
{
	$value = $input[$name] ?? '';
	if (!is_string($value)) {
		return '';
	}
	$value = preg_replace($multiline ? '/[^\P{C}\n\t]/u' : '/\p{C}/u', '', $value) ?? '';
	return mb_substr(trim($value), 0, $maxLength);
}

function esc(string $value): string
{
	return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** The host (and port, if any) of a URL, or null when there is none. */
function host(string $url): ?string
{
	$parts = parse_url($url);
	if (!isset($parts['host'])) {
		return null;
	}
	return strtolower($parts['host'] . (isset($parts['port']) ? ':' . $parts['port'] : ''));
}

/** A private folder next to the web root (never inside it), so the counters cannot be read or planted by anyone else. */
function countersFolder(): string
{
	$folder = dirname(__DIR__) . '/dedede-form-limits';
	return is_dir($folder) || @mkdir($folder, 0700) ? $folder : sys_get_temp_dir();
}

/** Counts one more use of $key and says whether it is still within $max uses per time window. */
function withinRateLimit(string $key, int $max): bool
{
	$handle = @fopen(countersFolder() . '/dedede-form-' . sha1($key) . '.json', 'c+');
	if ($handle === false) {
		return true;
	}
	flock($handle, LOCK_EX);
	$now = time();
	$recent = array_values(array_filter((array) json_decode((string) stream_get_contents($handle), true), static fn ($time): bool => is_int($time) && $time > $now - RATE_LIMIT_SECONDS));
	$allowed = count($recent) < $max;
	if ($allowed) {
		$recent[] = $now;
	}
	ftruncate($handle, 0);
	rewind($handle);
	fwrite($handle, (string) json_encode($recent));
	flock($handle, LOCK_UN);
	fclose($handle);
	return $allowed;
}

function sendHtmlMail(string $to, string $subject, string $html, string $replyTo, array $bcc = []): bool
{
	$headers = [
		'MIME-Version: 1.0',
		'Content-Type: text/html; charset=utf-8',
		'Content-Transfer-Encoding: base64',
		'From: ' . FROM_NAME . ' <' . FROM_EMAIL . '>',
		'Reply-To: ' . $replyTo,
		'X-Organization: DeDeDe',
	];
	if ($bcc !== []) {
		$headers[] = 'Bcc: ' . implode(', ', $bcc);
	}
	return mail($to, mb_encode_mimeheader($subject, 'UTF-8', 'B', "\r\n"), chunk_split(base64_encode($html)), implode("\r\n", $headers), '-f' . FROM_EMAIL);
}

/** Every argument is trusted HTML: escape request values with esc() before passing them in. */
function mailPage(string $title, string $heading, string $content, string $footer): string
{
	return "<html><head><meta http-equiv='Content-Type' content='text/html; charset=utf-8'><title>$title</title></head><body>"
		. "<div style='font-family:Helvetica,Arial,Verdana,sans-serif;font-size:12px;line-height:1.5em;width:90%;margin:0 auto;'>"
		. "<div style='display:block;padding:1em 3em;background:#eee !important;border:1px solid #ddd !important;'>"
		. "<h1 style='display:block;font-size:24px;line-height:36px;font-weight:100;color:#000;'>$heading</h1>$content</div>"
		. "<div style='font-size:9pt;padding:1em 3em;border-bottom:1px solid #ddd;background:#fff !important;color:#666;'>$footer</div>"
		. '</div></body></html>';
}

// --- Request guards -------------------------------------------------------------------------

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
	refuse('Input greșit.');
}
$raw = (string) file_get_contents('php://input', false, null, 0, MAX_BODY_BYTES + 1);
$input = strlen($raw) > MAX_BODY_BYTES ? null : json_decode($raw, true);
if (!is_array($input) || ($input['datasent'] ?? '') !== 'true') {
	refuse('Input greșit.');
}

$DATABASE_HOST = $DATABASE_NAME = $DATABASE_USERNAME = $DATABASE_PASSWORD = $DATABASE_DSN = null;
$ALLOWED_SERVER = $ALLOWED_SERVER_2 = $ALLOWED_SERVER_3 = null;
$tos = [];
$RATE_LIMIT_MAX = RATE_LIMIT_MAX;
if (!is_file(__DIR__ . '/env.php')) {
	error_log('sideform: env.php is missing');
	refuse('Probleme la evaluarea fișierelor critice.');
}
require __DIR__ . '/env.php';

$allowedHosts = array_values(array_filter([$ALLOWED_SERVER, $ALLOWED_SERVER_2, $ALLOWED_SERVER_3], 'is_string'));
// Browsers always send Origin with this kind of request. Referer is only the fallback for when Origin is absent.
$origin = host((string) ($_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? ''));
if ($origin === null || !in_array($origin, $allowedHosts, true)) {
	refuse('Cerere neautorizată.');
}

// Bots fill every field they find; people never see this one. A browser's autofill can fill it too, so a caught
// submission is not thrown away: it goes to the office marked as possible spam, and nothing is mailed to the visitor.
$trap = field($input, 'side_verificare', 200);

// --- Validation -----------------------------------------------------------------------------

$name = field($input, 'side_name', 200);
$email = field($input, 'side_email', 150);
// People type phone numbers with spaces, dots, dashes and brackets. Only the digits and a leading + are kept.
$phone = (string) preg_replace('/[\s.\-()]+/', '', field($input, 'side_telephone', 30));
$type = field($input, 'side_tip', 20);
$message = field($input, 'side_mesaj', 5000, true);
$pageUrl = field($input, 'side_url', 150);
$campaign = [];
foreach (['utm_source' => 'Campaign Source', 'utm_medium' => 'Campaign Medium', 'utm_term' => 'Campaign Term', 'utm_content' => 'Campaign Content', 'utm_campaign' => 'Campaign Name', 'gclid' => 'AdWords ID'] as $key => $label) {
	$value = field($input, $key, 200);
	if ($value !== '') {
		$campaign[$label] = $value;
	}
}

$problems = [];
if (mb_strlen($name) < 2) {
	$problems[] = 'nu ai introdus <a href="#side_name" title="Te rugăm să introduci numele tău în formular">numele tău</a>';
}
if ($email === '') {
	$problems[] = 'nu ai introdus <a href="#side_email" title="Te rugăm să introduci email-ul tău în formular">email-ul tău</a>';
} elseif (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
	$problems[] = 'ai introdus un <a href="#side_email" title="Te rugăm să introduci un email valid în formular">email greșit</a>';
}
if (preg_match('/^\+?\d{9,15}$/', $phone) !== 1) {
	$problems[] = 'ai introdus un <a href="#side_telephone" title="Te rugăm să introduci un telefon valid">telefon invalid</a>';
}
if (!in_array($type, PROBLEM_TYPES, true)) {
	$problems[] = 'nu ai ales <a href="#side_tip" title="Te rugăm să alegi tipul problemei">tipul problemei</a>';
}
if ($problems !== []) {
	refuse(...$problems);
}

$address = (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
if (!withinRateLimit($address, (int) $RATE_LIMIT_MAX)) {
	refuse('ai trimis prea multe mesaje într-un timp scurt. Te rugăm să ne suni sau să încerci mai târziu.');
}

// --- Store the lead ---------------------------------------------------------------------------
// A database failure is logged but never blocks the emails: the lead must still reach the office.

try {
	$database = new PDO($DATABASE_DSN ?? "mysql:host=$DATABASE_HOST;dbname=$DATABASE_NAME;charset=utf8mb4", $DATABASE_USERNAME, $DATABASE_PASSWORD, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 5]);
	$insert = $database->prepare('INSERT INTO dedede_contact (side_name, side_url, side_email, side_telephone, side_mesaj, side_tip, data, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
	// The ip column is VARCHAR(16), so a long IPv6 address is cut here. The office email shows it in full.
	$insert->execute([$name, $pageUrl, $email, $phone, $message, $type, date('Y-m-d H:i:s'), mb_substr($address, 0, 16)]);
} catch (Throwable $problem) {
	error_log('sideform: lead not stored: ' . $problem->getMessage());
}

// --- Emails -----------------------------------------------------------------------------------

$safeName = esc($name);
$safeEmail = esc($email);
$safePhone = esc($phone);
$sentOn = date('d.m.Y, G:i');
$bcc = [];
foreach ((array) $tos as $key => $value) {
	foreach ([$key, $value] as $candidate) {
		if (is_string($candidate) && filter_var($candidate, FILTER_VALIDATE_EMAIL) !== false) {
			$bcc[] = $candidate;
		}
	}
}

$details = "<ul style='color:#000;'>"
	. "<li><strong>Nume</strong>: $safeName</li>"
	. "<li><strong>E-mail</strong>: <a href='mailto:$safeEmail'>$safeEmail</a></li>"
	. "<li><strong>Telefon</strong>: <a href='tel:$safePhone'>$safePhone</a></li>"
	. '<li><strong>A venit de pe</strong>: ' . esc($pageUrl) . '</li>'
	. '<li><strong>Tip curățenie</strong>: ' . esc($type) . '</li>'
	. '<li><strong>Mesaj</strong>: ' . nl2br(esc($message)) . '</li>'
	. '</ul>';
if ($campaign !== []) {
	$details .= "<hr /><ul style='color:#000;'>";
	foreach ($campaign as $label => $value) {
		$details .= "<li><strong>$label</strong>: " . esc($value) . '</li>';
	}
	$details .= '</ul><hr />';
}
if ($trap !== '') {
	$details .= '<p><strong>Posibil spam</strong>: câmpul ascuns din formular, pe care oamenii nu îl văd, a fost completat cu: ' . esc($trap) . '</p>';
}
$officeMail = mailPage('Contact DeDeDe', "$safeName ne-a trimis un mesaj pe formularul de contact!", $details, "E-mail trimis automat de pe <a href='https://dedede.ro/contact/'>DeDeDe.ro</a> pe $sentOn de pe IP-ul " . esc($address) . " (<a href='mailto:$safeEmail'>$safeName</a>).");

if (!sendHtmlMail(OFFICE_EMAIL, ($trap !== '' ? '[posibil spam] ' : '') . "Contact nou pe DeDeDe.ro - $name", $officeMail, $email, $bcc)) {
	error_log('sideform: office notification was not accepted for delivery');
	refuse(MAIL_PROBLEM);
}
if ($trap !== '') {
	error_log('sideform: honeypot filled, lead sent to the office marked as possible spam');
	reply(SUCCESS);
}

// The lead is already with the office, so a skipped or failed confirmation never changes the reply.
if (!withinRateLimit('to:' . mb_strtolower($email), CONFIRMATIONS_PER_ADDRESS) || !withinRateLimit('confirmations', CONFIRMATIONS_IN_TOTAL)) {
	error_log('sideform: visitor confirmation skipped, too many in a short time');
	reply(SUCCESS);
}

$thanks = "<p>Dragă $safeName,</p>"
	. "<p>Îți mulțumim pentru interesul arătat serviciilor de curățenie <a href='https://dedede.ro/?utm_source=ConfirmationMail&amp;utm_medium=email&amp;utm_campaign=DeDeDe-Products'>DeDeDe.ro</a>!</p>"
	. '<p>Te vom contacta în cel mai scurt timp pentru a continua discuția. Așteaptă-te la un telefon sau e-mail din partea noastră în câteva ore după trimiterea acestui mesaj automat de confirmare.</p>'
	. '<p>Toate cele bune,</p><p>Echipa DeDeDe.ro</p>';
$visitorMail = mailPage('DeDeDe te va contacta cât se poate de repede!', 'Echipa DeDeDe îți mulțumește pentru mesaj!', $thanks, "E-mail trimis automat de pe <a href='https://dedede.ro/contact/?utm_source=ConfirmationMail&amp;utm_medium=email&amp;utm_campaign=DeDeDe-Contact'>dedede.ro</a> pe $sentOn.");
if (!sendHtmlMail($email, 'DeDeDe te va contacta cât se poate de repede!', $visitorMail, OFFICE_EMAIL)) {
	error_log('sideform: visitor confirmation was not accepted for delivery');
}

reply(SUCCESS);
