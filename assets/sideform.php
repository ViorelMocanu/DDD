<?php
define('__ROOT__', dirname(__FILE__));
require_once(__ROOT__.'/sendgrid-php/sendgrid-php.php');
use SendGrid\Mail\Mail;
$mtype = "application/json";
header("Content-Type: " . $mtype);

$_POST = json_decode(file_get_contents('php://input'), true);
if ( isset($_SERVER['HTTP_REFERER']) ) $referrer = $_SERVER['HTTP_REFERER']; else $referrer = 'no-referrer';
$globalvars = [];

// @TODO - Honeypot pentru spambots care nu respectă robots.txt în /hp

function strleft ($s1, $s2) {
	return substr($s1, 0, strpos($s1, $s2));
}
function selfURL () {
    $s = empty($_SERVER["HTTPS"]) ? '' : (($_SERVER["HTTPS"] == "on") ? "s" : "");
    $protocol = strleft(strtolower($_SERVER["SERVER_PROTOCOL"]), "/").$s;
    $port = ($_SERVER["SERVER_PORT"] == "80") ? "" : (":".$_SERVER["SERVER_PORT"]);
    return $protocol."://".$_SERVER['SERVER_NAME'].$port.$_SERVER['REQUEST_URI'];
}
if ( !function_exists('_e') ) {
	function _e($s,$c) {
		echo $s;
	}
}
function sanitizeKey( $string ) {
	$string = trim($string);
	$string = preg_replace("/[^a-zA-Z0-9_]+/", "", $string);
	$string = filter_var($string, FILTER_SANITIZE_STRING);
	return $string;
}
function sanitizeValue ( $string, $type, $filterz ) {
	$string = trim($string);
	if ( !in_array($type, array_keys($filterz)) ) $type = "default";
	$string = filter_var($string, $filterz[$type]);
	$string = addslashes( str_replace( array( "<", ">", "&" ), "", html_entity_decode( strip_tags( trim( $string ) ) ) ) );
	return $string;
}
$json_string = "";
$ip = $_SERVER['REMOTE_ADDR'];
if ( isset($_SERVER['HTTP_X_FORWARDED_FOR']) ) {
	$ip .= ' | '.$_SERVER['HTTP_X_FORWARDED_FOR'];
}
$variabile = array();
$eroare = array();
$eroare['side_name'] = '';
$eroare['side_email'] = '';
$eroare['side_telephone'] = '';
$eroare['side_tip'] = '';
$eroare['side_mesaj'] = '';
$filterz = array(
	"side_email" => FILTER_SANITIZE_EMAIL,
	"side_url" => FILTER_SANITIZE_URL,
	"default" => FILTER_SANITIZE_STRING
);
foreach( $_REQUEST as $key => $value ) {
	$key = sanitizeKey($key);
	$value = sanitizeValue($value, $key, $filterz);
	eval('$'.$key.' = "'.$value.'";');
	eval('$globalvars["'.$key.'"] = "'.$value.'";');
	$variabile[] = $key;
}

if ( !isset($side_name) ) {
	$side_name = isset($_POST['side_name']) ? $_POST['side_name'] : false;
	$globalvars['side_name'] = $side_name;
}
if ( !isset($side_email) ) {
	$side_email = isset($_POST['side_email']) ? $_POST['side_email'] : false;
	$globalvars['side_email'] = $side_name;
}
if ( !isset($side_telephone) ) {
	$side_telephone = isset($_POST['side_telephone']) ? $_POST['side_telephone'] : false;
	$globalvars['side_telephone'] = $side_telephone;
}
if ( !isset($side_tip) ) {
	$side_tip = isset($_POST['side_tip']) ? $_POST['side_tip'] : false;
	$globalvars['side_tip'] = $side_tip;
}
if ( !isset($side_mesaj) ) {
	$side_mesaj = isset($_POST['side_mesaj']) ? $_POST['side_mesaj'] : false;
	$globalvars['side_mesaj'] = $side_mesaj;
}
if ( !isset($datasent) ) {
	$datasent = isset($_POST['datasent']) ? $_POST['datasent'] : false;
	$globalvars['datasent'] = $datasent;
}
if ( !isset($tech) ) {
	$tech = isset($_POST['tech']) ? $_POST['tech'] : false;
	$globalvars['tech'] = $tech;
}
if ( !isset($utm_source) ) {
	$utm_source = isset($_POST['utm_source']) ? $_POST['utm_source'] : false;
	$globalvars['utm_source'] = $utm_source;
}
if ( !isset($utm_medium) ) {
	$utm_medium = isset($_POST['utm_medium']) ? $_POST['utm_medium'] : false;
	$globalvars['utm_medium'] = $utm_medium;
}
if ( !isset($utm_term) ) {
	$utm_term = isset($_POST['utm_term']) ? $_POST['utm_term'] : false;
	$globalvars['utm_term'] = $utm_term;
}
if ( !isset($utm_content) ) {
	$utm_content = isset($_POST['utm_content']) ? $_POST['utm_content'] : false;
	$globalvars['utm_content'] = $utm_content;
}
if ( !isset($utm_campaign) ) {
	$utm_campaign = isset($_POST['utm_campaign']) ? $_POST['utm_campaign'] : false;
	$globalvars['utm_campaign'] = $utm_campaign;
}
if ( !isset($gclid) ) {
	$gclid = isset($_POST['gclid']) ? $_POST['gclid'] : false;
	$globalvars['gclid'] = $gclid;
}
if ( !isset($side_url) ) {
	$side_url = isset($_POST['side_url']) ? $_POST['side_url'] : false;
	$globalvars['side_url'] = $side_url;
}

/*print_r($_POST);
print_r($globalvars);
print_r($variabile);*/

if ( !isset($side_url) ) {
	$side_url = selfURL();
	$globalvars['side_url'] = $side_url;
}

$server = $_SERVER['HTTP_HOST'];
$errormessage = "";

if( $datasent == 'true' ) {

	if( $side_name == '' || strlen( $side_name ) < 2 ) {
		$errormessage .= '{"text": "nu ai introdus <a href=\"#side_name\" title=\"Te rugăm să introduci numele tău în formular\">numele tău</a>"}';
		$eroare['side_name'] = ' Eroare';
	}
	if( $side_email == '' || strlen( $side_email ) < 2 ) {
		$errormessage .= ',{"text": "nu ai introdus <a href=\"#side_email\" title=\"Te rugăm să introduci email-ul tău în formular\">email-ul tău</a>"}';
		$eroare['side_email'] = ' Eroare';
	}
	if( !preg_match( "/^"."[a-z0-9]+([_\\.-][a-z0-9]+)*"."@"."([a-z0-9]+([\\.-][a-z0-9]+)*)+"."\\.[a-z]{2,}"."$/i", $side_email ) ) {
		$errormessage .= ',{"text": "ai introdus un <a href=\"#side_email\" title=\"Te rugăm să introduci un email valid în formular\">email greșit</a>"}';
		$eroare['side_email'] = ' Eroare';
	}
	if( strlen( $side_telephone ) <= 8 || !preg_match('/\+?\d{9,}/i', $side_telephone) ) {
		$errormessage .= ',{"text": "ai introdus un <a href=\"#side_telephone\" title=\"Te rugăm să introduci un telefon valid\">telefon invalid</a>"}';
		$eroare['side_telephone'] = ' Eroare';
	}

	if ( $errormessage != '' ) {
		$errormessage = '{"error": "true", "message": "Te rugăm să încerci să retrimiți formularul, pentru că ", "errors": ['.$errormessage.']}';
	} else {
		require_once('env.php');
		if ( !isset($mailuriDeSpamat) || !isset($ALLOWED_SERVER) || !isset($DATABASE_HOST) ) {
			die('{"error": "true", "message": "Probleme la evaluarea fișierelor critice"}');
		}
		$link = false;
		if( $server == $ALLOWED_SERVER || $server == $ALLOWED_SERVER_2 || $server == $ALLOWED_SERVER_3 ) {
			$link = mysqli_connect( $DATABASE_HOST, $DATABASE_USERNAME, $DATABASE_PASSWORD, $DATABASE_NAME );
			if ( !$link ) {
				$errormessage .= ',{"text": "Eroare: nu m-am putut conecta la MySQL."}';
				$errormessage .= ',{"text": "Număr de debugging: '.mysqli_connect_errno().'"}';
				$errormessage .= ',{"text": "Eroare de debugging: '.mysqli_connect_error().'"}';
			}
		} else {
			$errormessage .= '{"text": "Sunt pe un server greșit: '.$server.'"},';
		}

		if ( $errormessage == '' ) {
			$drop['dedede_contact'] = "DROP TABLE IF EXISTS dedede_contact";
			$creare['dedede_contact'] = "CREATE TABLE dedede_contact (
				`id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY ,
				`side_name` VARCHAR( 200 ) NOT NULL DEFAULT 'n/a',
				`side_url` VARCHAR( 150 ) NOT NULL DEFAULT 'n/a',
				`side_email` VARCHAR( 150 ) NOT NULL DEFAULT 'n/a',
				`side_telephone` VARCHAR( 20 ) NOT NULL DEFAULT 'n/a',
				`side_mesaj` TEXT,
				`side_tip` VARCHAR( 20 ) NOT NULL DEFAULT 'n/a',
				`data` TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
				`ip` VARCHAR( 16 ) NOT NULL DEFAULT '0.0.0.0'
				) ENGINE = MYISAM CHARACTER SET utf8 COLLATE utf8_bin";
			$drop['dedede_admin'] = "DROP TABLE IF EXISTS dedede_admin";
			$creare['dedede_admin'] = "CREATE TABLE dedede_admin (
				`id` mediumint(8) unsigned NOT NULL auto_increment,
				`admin_name` VARCHAR( 100 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
				`admin_pass` VARCHAR( 100 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
				`date_edited` TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
				PRIMARY KEY  (`id`),
				UNIQUE KEY `id` (`id`)
				) ENGINE = MYISAM CHARACTER SET utf8 COLLATE utf8_bin";
			$username = 'admin';
			$password = 'pass';
			$info['dedede_admin'] = "INSERT INTO dedede_admin (
				  id,
				  admin_name,
				  admin_pass
				) VALUES ( 
				  1,
				  '".$username."',
				  '".md5($password)."'
				);";
			$sql_auth = "SELECT * FROM dedede_admin WHERE 1";
			$resource_auth = mysqli_query($link, $sql_auth);
			if ( !$resource_auth || mysqli_num_rows($resource_auth) < 1 ) {
				foreach($creare as $argument => $comanda) {
					if ( !mysqli_query($link, $drop[$argument]) ) {
					$errormessage .= ',{"text": "Eroare '.mysqli_error($link).' în <code>'.$drop[$argument].'</code>!"}';
					}
					if ( !mysqli_query($link, $comanda) ) {
					$errormessage .= ',{"text": "Eroare '.mysqli_error($link).' în <code>'.$comanda.'</code>!"}';
					}
				}
				foreach($info as $comanda) {
					if ( !mysqli_query($link, $comanda) ) {
					$errormessage .= ',{"text": "Eroare '.mysqli_error($link).' în <pre><code>'.$comanda.'</code>!"}';
					}
				}
			}
			mysqli_free_result($resource_auth);

			if ( $errormessage == '' ) {
				$queryLead = "INSERT INTO
					dedede_contact (  `side_name` , `side_url` , `side_email`, `side_telephone` , `side_mesaj` , `side_tip` , `data` , `ip` )
					     VALUES ( '$side_name', '$side_url', '$side_email', '$side_telephone', '$side_mesaj', '$side_tip', NOW( ) , '" . $ip . "' ); ";
				$queryLeadSanitized = sprintf('INSERT INTO dedede_contact (  `side_name` , `side_url` , `side_email`, `side_telephone` , `side_mesaj` , `side_tip` , `data` , `ip` ) VALUES ( "%1$s", "%2$s", "%3$s", "%4$s", "%5$s", "%6$s", NOW(), "%7$s" );', $side_name, $side_url, $side_email, $side_telephone, $side_mesaj, $side_tip, $ip);
				if ( !mysqli_query($link, $queryLeadSanitized) ) {
					$errormessage .= ',{"text": "Eroare la introducerea în baza de date."}';
				}
				mysqli_close($link);

				$varContent = '';

				$formType = 'de contact';

				$subject  = "Contact nou pe DeDeDe.ro - $side_name";
				$headers  = 'MIME-Version: 1.0
';
				$headers .= 'Content-Type: text/html; charset="utf-8"
';
				$headers .= 'From: "DeDeDe" <no-reply@dedede.ro>
';
				$headers .= 'Reply-To: '.$side_name.' <'.$side_email.'>
';
				$headers .= 'Return-Path: '.$side_name.' <'.$side_email.'>
';
				$headers .= 'X-Sender: Formularul de pe DeDeDe.ro <'.$side_email.'>
';
				$headers .= 'X-Mailer: PHP/'.phpversion().'
';
				$headers .= 'X-Organization: DeDeDe
';
				$headers .= 'Content-Transfer-Encoding: base64
';
				$headers .= 'X-Priority: 2
';
				$message = "<html>
	<head>
		<meta http-equiv='Content-Type' content='text/html; charset=utf-8'> 
		<title>Contact DeDeDe</title>
	</head>
	<body>
		<div id='framework' style='font-family:Helvetica,Arial,Verdana,sans-serif;font-size:12px;line-height:1.5em;width:90%;margin:0 auto;'>
			<div id='content' style='display:block;padding:1em 3em;background:#eee !important;border:1px solid #ddd !important;'>
				<h1 style='display:block;font-size:24px;line-height:36px;font-weight:100;color:#000;'>$side_name ne-a trimis un mesaj pe formularul $formType!</h1>
				<ul style='color:#000;'>
					<li><strong>Nume</strong>: $side_name</li>
					<li><strong>E-mail</strong>: <a href='mailto:$side_email'>$side_email</a></li>
					<li><strong>Telefon</strong>: <a href='tel:$side_telephone'>$side_telephone</a></li>
					<li><strong>A venit de pe</strong>: <a href='".strtok($globalvars['side_url'],'?')."'>$side_url</a></li>
					<li><strong>Tip curățenie</strong>: $side_tip</li>
					<li><strong>Mesaj</strong>: $side_mesaj</li>
				</ul>";
				if ( $globalvars['utm_source'] != '' || $globalvars['utm_medium'] != '' || $globalvars['utm_term'] != '' || $globalvars['utm_content'] != '' || $globalvars['utm_campaign'] != '') {
					$message .= "
				<hr />
				<ul style='color:#000;'>
					<li><strong>Campaign Source</strong>: " . $globalvars['utm_source'] . "</li>
					<li><strong>Campaign Medium</strong>: " . $globalvars['utm_medium'] . "</li>
					<li><strong>Campaign Term</strong>: " . $globalvars['utm_term'] . "</li>
					<li><strong>Campaign Content</strong>: " . $globalvars['utm_content'] . "</li>
					<li><strong>Campaign Name</strong>: " . $globalvars['utm_campaign'] . "</li>
				</ul>
				<hr />";
				}
				if ( $globalvars['gclid'] != '' ) {
					$message .= "
				<ul style='color:#000;'>
					<li><strong>AdWords ID</strong>: " . $globalvars['gclid'] . "</li>
				</ul>
				<hr />";
				}
				$message .= "
			</div>
			<div style='font-size:9pt;padding:1em;border-bottom:1px solid #ddd;background:#fff !important;color:#666;'>E-mail trimis automat de pe <a href='".$referrer."?utm_source=ConfirmationMail&amp;utm_medium=email&amp;utm_campaign=DeDede-Contact'>DeDeDe.ro</a> pe ".date('d.m.Y').", ".date('G:i')." de pe IP-ul ".$ip." (<a href='mailto:$side_email'>$side_name</a>).</div>
		</div> 
	</body>
</html>";
				$additional = '-f'.$side_email;
				/*error_reporting(-1);
				ini_set('display_errors', 'On');
				set_error_handler("var_dump");*/
				$email = new Mail();
				$email->setFrom("no-reply@dedede.ro", "DeDeDe.ro");
				$email->setSubject($subject);
				$email->addTo("office@dedede.ro", "Echipa DeDeDe.ro");
				$email->addBccs($tos);
				$email->addContent("text/html", $message);
				$sendgrid = new \SendGrid(getenv('SENDGRID_API_KEY'));
				try {
					$response = $sendgrid->send($email);
					if ( $response->statusCode() >= 200 && $response->statusCode() < 300 ) {
						// all good
					} else {
						$errormessage .= ',{"text": "Avem o problemă cu serverul de e-mail: '.$response->statusCode().' = '.$response->body().'. Te rugăm să ne contactezi direct la: <a href="mailto:office@dedede.ro" title="Trimite-ne un mail!">office@dedede.ro</a>!"}';
					}
					/*$errormessage .= ',{"text": "Status Code: '.$response->statusCode().'"}';
					$errormessage .= ',{"text": "Response Headers: '.implode($response->headers()).'"}';
					$errormessage .= ',{"text": "Response Body: '.$response->body().'"}';*/
				} catch (Exception $e) {
					$errormessage .= ',{"text": "Caught exception: '.$e->getMessage().'"}';
				}
				/*foreach ( $mailuriDeSpamat as $m ) {
					if( !mail( $m, "$subject", "$message", "$headers", "$additional" ) ) {
						$m = (null !== error_get_last()) ? error_get_last()['message'] : '';
						$errormessage .= ',{"text": "Avem o problemă cu serverul de e-mail: '.$m.'. Te rugăm să ne contactezi direct la: <a href="mailto:office@dedede.ro" title="Trimite-ne un mail!">office@dedede.ro</a>!"}';
						if ( !imap_mail( $m, "$subject", "$message", "$headers" ) ) {
							$m = (null !== error_get_last()) ? (error_get_last()['message']) : ('');
							$errormessage .= ',{"text": "NU MERGE NICI CU IMAP '.$m.'"}';
						}
					}
				}*/

				if ( $errormessage == '' ) {
					$subject = "DeDeDe te va contacta cât se poate de repede!";
					$headers  = 'MIME-Version: 1.0
';
					$headers .= 'Content-Type: text/html; charset="utf-8"
';
					$headers .= 'From: "DeDeDe" <'.'office@dedede.ro'.'>
';
					$headers .= 'Reply-To: '.'office@dedede.ro'.'
';
					$headers .= 'Return-Path: <'.'office@dedede.ro'.'>
';
					$headers .= 'X-Sender: Mulțumiri din partea DeDeDe <'.'office@dedede.ro'.'>
';
					$headers .= 'X-Mailer: PHP/'.phpversion().'
';
					$headers .= 'X-Organization: DeDeDe
';
					$headers .= 'Content-Transfer-Encoding: base64
';
					$headers .= 'X-Priority: 2
';
					$message = "<html>
	<head>
		<meta http-equiv='Content-Type' content='text/html; charset=utf-8'>
		<title>DeDeDe te va contacta cât se poate de repede!</title>
	</head>
	<body>
		<div id='framework' style='font-family:Helvetica,Arial,Verdana,sans-serif;font-size:12px;line-height:1.5em;width:90%;margin:0 auto;'>
			<div id='content' style='display:block;padding:1em 3em;background:#eee !important;border:1px solid #ddd !important;'>
				<h1 style='display:block;font-size:24px;line-height:36px;font-weight:100;color:#000;'>Echipa DeDeDe îți mulțumește pentru mesaj!</h1>
				<p>Dragă $side_name,</p>
				<p>Îți mulțumim pentru interesul arătat serviciilor de curățenie <a href='https://dedede.ro/?utm_source=ConfirmationMail&amp;utm_medium=email&amp;utm_campaign=DeDeDe-Products'>DeDeDe.ro</a>!</p>
				<p>Te vom contacta în cel mai scurt timp pentru a continua discuția. Așteaptă-te la un telefon sau e-mail din partea noastră în câteva ore după trimiterea acestui mesaj automat de confirmare.</p>
				<p>Toate cele bune,</p>
				<p>Echipa DeDeDe.ro</p>
			</div>
			<div style='font-size:9pt;padding:1em 3em;border-bottom:1px solid #ddd;background:#fff !important;color:#666;'>E-mail trimis automat de pe <a href='".$referrer."?utm_source=ConfirmationMail&amp;utm_medium=email&amp;utm_campaign=DeDeDe-Contact'>dedede.ro</a> pe ".date('d.m.Y').", ".date('G:i')." de pe IP-ul ".$ip.".</div>
		</div>
	</body>
</html>";
					$additional = '-f' . $side_email;
					$email2 = new Mail();
					$email2->setFrom("no-reply@dedede.ro", "DeDeDe.ro");
					$email2->setSubject($subject);
					$email2->addTo($side_email, $side_name);
					// $email2->addBccs($tos);
					$email2->addContent("text/html", $message);
					$sendgrid = new \SendGrid(getenv('SENDGRID_API_KEY'));
					try {
						$response = $sendgrid->send($email2);
						if ( $response->statusCode() >= 200 && $response->statusCode() < 300 ) {
							// all good
						} else {
							$errormessage .= ',{"text": "Avem o problemă cu serverul de e-mail: '.$response->statusCode().' = '.$response->body().'. Te rugăm să ne contactezi direct la: <a href="mailto:office@dedede.ro" title="Trimite-ne un mail!">office@dedede.ro</a>!"}';
						}
						/*$errormessage .= ',{"text": "Status Code: '.$response->statusCode().'"}';
						$errormessage .= ',{"text": "Response Headers: '.implode($response->headers()).'"}';
						$errormessage .= ',{"text": "Response Body: '.$response->body().'"}';*/
					} catch (Exception $e) {
						$errormessage .= ',{"text": "Avem o problemă excepțională cu serverul de e-mail: '.$e->getMessage().'. Te rugăm să ne contactezi direct la: <a href="mailto:office@dedede.ro" title="Trimite-ne un mail!">office@dedede.ro</a>!"}';
					}
					/*
					if (!mail("$side_email", "$subject", "$message", "$headers", "$additional")) {
						$m = (null !== error_get_last()) ? error_get_last()['message'] : '';
						$errormessage .= ',{"text": "Avem o problemă cu serverul de e-mail: '.$m.'. Te rugăm să ne contactezi direct la: <a href="mailto:office@dedede.ro" title="Trimite-ne un mail!">office@dedede.ro</a>!"}';
					}
					*/
				}
			}
		}
	}

	if( !isset($errormessage) || $errormessage == '' ) {
		$errormessage = '{"error": "false", "succes": "true", "message": "Am primit detaliile tale și te vom contacta în curând!"}';
	} else {
		$errormessage = '{"error": "true", "message": "Te rugăm să încerci să retrimiți formularul, pentru că ", "errors": ['.$errormessage.']}';
	}

	$json_string = $errormessage;

} else {
	$json_string = '{"error": "true", "message": "Te rugăm să încerci să retrimiți formularul, pentru că ", "errors": [{"text": "Input greșit."}]}';
}

$standardUrl = strtok($_SERVER["REQUEST_URI"],'?');

echo $json_string;
/*print_r($_POST);
print_r($globalvars);
print_r($variabile);*/

if ( sizeof($variabile) > 0 ) {
	foreach ( $variabile as $key => $val ) {
		unset( $globalvars[$val] );
	}
}
?>