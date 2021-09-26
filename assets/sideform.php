<?php

// @TODO - Honeypot pentru spambots care nu respectă robots.txt în /hp

$mailuriDeSpamat = array('viorel.mocanu@gmail.com', 'office@gyocleaning.ro', 'office@dedede.ro');

function getallheadersddd() {
	$headers = '';
	foreach ($_SERVER as $name => $value) {
		if (substr($name, 0, 5) == 'HTTP_') {
			$headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
		}
	}
	print_r($headers);
	return $headers;
}
getallheadersddd();

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

$proces = "";
$side_url = "";
$side_name = "";
$side_email = "";
$side_telephone = "";
$side_tip = "";
$side_mesaj = "";
$datasent = false;
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
	eval('$_SESSION["'.$key.'"] = "'.$value.'";');
	$variabile[] = $key;
}

if ( isset($_POST['utm_source']) && $_POST['utm_source'] != '' ) $_SESSION['utm_source'] = $_POST['utm_source'];
if ( isset($_POST['utm_medium']) && $_POST['utm_medium'] != '' ) $_SESSION['utm_medium'] = $_POST['utm_medium'];
if ( isset($_POST['utm_term']) && $_POST['utm_term'] != '' ) $_SESSION['utm_term'] = $_POST['utm_term'];
if ( isset($_POST['utm_content']) && $_POST['utm_content'] != '' ) $_SESSION['utm_content'] = $_POST['utm_content'];
if ( isset($_POST['utm_campaign']) && $_POST['utm_campaign'] != '' ) $_SESSION['utm_campaign'] = $_POST['utm_campaign'];
if ( isset($_POST['gclid']) && $_POST['gclid'] != '' ) $_SESSION['gclid'] = $_POST['gclid'];

print '<h1>Session</h1>';
print_r($_SESSION);
print '<h1>Request</h1>';
print_r($_REQUEST);

if ( $side_url == '' ) {
	$side_url = selfURL();
	$_SESSION['side_url'] = $side_url;
}

$server = $_SERVER['HTTP_HOST'];
$errormessage = "";

if( $datasent == 'true' ) {

	$proces = '';

	if( $side_name == '' || strlen( $side_name ) < 2 ) {
		if( $errormessage != '' ) $errormessage .= ', ';
		$errormessage .= 'nu ai introdus <a href="#side_name" title="Te rugăm să introduci numele tău în formular">numele tău</a>';
		$eroare['side_name'] = ' Eroare';
	}
	if( $side_email == '' || strlen( $side_email ) < 2 ) {
		if( $errormessage != '' ) $errormessage .= ', ';
		$errormessage .= 'nu ai introdus <a href="#side_email" title="Te rugăm să introduci email-ul tău în formular">email-ul tău</a>';
		$eroare['side_email'] = ' Eroare';
	}
	if( !preg_match( "/^"."[a-z0-9]+([_\\.-][a-z0-9]+)*"."@"."([a-z0-9]+([\\.-][a-z0-9]+)*)+"."\\.[a-z]{2,}"."$/i", $side_email ) ) {
		if( $errormessage != '' ) $errormessage .= ', ';
		$errormessage .= 'ai introdus un <a href="#side_email" title="Te rugăm să introduci un email valid în formular">email greșit</a>';
		$eroare['side_email'] = ' Eroare';
	}
	if( strlen( $side_telephone ) <= 8 || !preg_match('/\+?\d{9,}/i', $side_telephone) ) {
		if( $errormessage != '' ) $errormessage .= ', ';
		$errormessage .= 'ai introdus un <a href="#side_telephone" title="Te rugăm să introduci un telefon valid">telefon invalid</a>';
		$eroare['side_telephone'] = ' Eroare';
	}

	if ( $errormessage != '' ) {
		$errormessage = 'Te rugăm să încerci să retrimiți formularul, pentru că '.$errormessage.'.';
	} else {
		require_once('env.php');
		$link = false;
		if( $server == $ALLOWED_SERVER || $server == $ALLOWED_SERVER_2 || $server == $ALLOWED_SERVER_3 ) {
			$link = mysqli_connect( $DATABASE_HOST, $DATABASE_USERNAME, $DATABASE_PASSWORD, $DATABASE_NAME );
			if ( !$link ) {
				$errormessage .= "Eroare: nu m-am putut conecta la MySQL.\n" . PHP_EOL;
				$errormessage .= "Număr de debugging: " . mysqli_connect_errno() . PHP_EOL;
				$errormessage .= "Eroare de debugging: " . mysqli_connect_error() . PHP_EOL;
			}
		} else {
			$errormessage .= 'Sunt pe un server greșit!'.$server;
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
					$errormessage .= '<h2 class="Attention">Eroare '.mysqli_error($link).' în <pre><code>' . $drop[ $argument ] . '</code></pre>!</h2>';
					}
					if ( !mysqli_query($link, $comanda) ) {
					$errormessage .= '<h2 class="Attention">Eroare '.mysqli_error($link).' în <pre><code>'.$comanda.'</code></pre>!</h2>';
					}
				}
				foreach($info as $comanda) {
					if ( !mysqli_query($link, $comanda) ) {
					$errormessage .= '<h2 class="Attention">Eroare '.mysqli_error($link).' în <pre><code>' . $comanda . '</code></pre>!</h2>';
					}
				}
			}
			mysqli_free_result($resource_auth);

			if ( $errormessage == '' ) {
				$queryLead = "INSERT INTO
					dedede_contact (  `side_name` , `side_url` , `side_email`, `side_telephone` , `side_mesaj` , `side_tip` , `data` , `ip` )
					     VALUES ( '$side_name', '$side_url', '$side_email', '$side_telephone', '$side_mesaj', '$side_tip', NOW( ) , '" . $ip . "' ); ";
				if ( !mysqli_query($link, $queryLead) ) {
					$errormessage .= 'Eroare la introducerea în baza de date.';
				}
				//print "<pre>".$queryLead."</pre><q>".mysqli_error($link)."</q>";
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
					<li><strong>A venit de pe</strong>: <a href='".strtok($_SESSION['side_url'],'?')."'>$side_url</a></li>
					<li><strong>Tip curățenie</strong>: $side_tip</li>
					<li><strong>Mesaj</strong>: $side_mesaj</li>
				</ul>";
				if ( $_SESSION['utm_source'] != '' || $_SESSION['utm_medium'] != '' || $_SESSION['utm_term'] != '' || $_SESSION['utm_content'] != '' || $_SESSION['utm_campaign'] != '') {
					$message .= "
				<hr />
				<ul style='color:#000;'>
					<li><strong>Campaign Source</strong>: " . $_SESSION['utm_source'] . "</li>
					<li><strong>Campaign Medium</strong>: " . $_SESSION['utm_medium'] . "</li>
					<li><strong>Campaign Term</strong>: " . $_SESSION['utm_term'] . "</li>
					<li><strong>Campaign Content</strong>: " . $_SESSION['utm_content'] . "</li>
					<li><strong>Campaign Name</strong>: " . $_SESSION['utm_campaign'] . "</li>
				</ul>
				<hr />";
				}
				if ( $_SESSION['gclid'] != '' ) {
					$message .= "
				<ul style='color:#000;'>
					<li><strong>AdWords ID</strong>: " . $_SESSION['gclid'] . "</li>
				</ul>
				<hr />";
				}
				$message .= "
			</div>
			<div style='font-size:9pt;padding:1em;border-bottom:1px solid #ddd;background:#fff !important;color:#666;'>E-mail trimis automat de pe <a href='".$_SERVER['HTTP_REFERER']."?utm_source=ConfirmationMail&amp;utm_medium=email&amp;utm_campaign=DeDede-Contact'>DeDeDe.ro</a> pe ".date('d.m.Y').", ".date('G:i')." de pe IP-ul ".$ip." (<a href='mailto:$side_email'>$side_name</a>).</div>
		</div> 
	</body>
</html>";
				$additional = '-f'.$side_email;
				foreach ( $mailuriDeSpamat as $m ) {
					if( !mail( $m, "$subject", "$message", "$headers", "$additional" ) ) {
					$errormessage = 'Avem o problemă cu serverul de e-mail. Te rugăm să ne contactezi direct la: <a href="mailto:office@dedede.ro" title="Trimite-ne un mail!">office@dedede.ro</a> !';
					}
				}

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
			<div style='font-size:9pt;padding:1em 3em;border-bottom:1px solid #ddd;background:#fff !important;color:#666;'>E-mail trimis automat de pe <a href='".$_SERVER['HTTP_REFERER']."?utm_source=ConfirmationMail&amp;utm_medium=email&amp;utm_campaign=DeDeDe-Contact'>dedede.ro</a> pe ".date('d.m.Y').", ".date('G:i')." de pe IP-ul ".$ip.".</div>
		</div>
	</body>
</html>";
					$additional = '-f' . $side_email;
					if (!mail("$side_email", "$subject", "$message", "$headers", "$additional")) {
					$errormessage .= 'Avem o problemă cu serverul de e-mail. Te rugăm să ne contactezi direct la: <a href="mailto:office@dedede.ro" title="Trimite-ne un mail!">office@dedede.ro</a> !';
					}
				}
			}
		}
	}

	if( $errormessage == '' ) {
		$errormessage = '<h2 class="Success">Mulțumim!</h2><p>Am primit detaliile tale și te vom contacta în curând!</p><script type="text/javascript">var scriptul = setTimeout("flashEroare(1);",100);</script>';
	} else {
		$errormessage = '<h2 class="Attention">Detaliile tale nu au fost trimise!</h2><p>'.$errormessage.'</p><script type="text/javascript">var scriptul = setTimeout("flashEroare(0);",100);</script>';
	}

	$proces = $errormessage;

}

$standardUrl = strtok($_SERVER["REQUEST_URI"],'?');
$contactFormClass = 'SideFormForm';
$contactFieldsetClass = 'Fieldset';
$contactListClass = 'SideList';
$contactItemClass = 'SideItem';
$contactLabelClass = '';
$contactInoutClass = 'SideInput';
$contactButtomClass = 'SideSubmit';

echo $proces;

?>

<!--div id="proces" class="Proces<?php if ( $proces != '' ) echo ' ProcesActiv'; ?>"><?php echo $proces; ?></div>
<div id="eroare" class="Hidden">&nbsp;</div>
<form id="sideform" class="Form <?php echo $contactFormClass; ?>" action="/sideform.php" method="post">
	<fieldset class="Fieldset">
		<legend class="Legend">Introdu datele tale de contact</legend>
		<label class="Label <?php echo $eroare['side_name']; ?>">
			<span class="LabelText">Numele tău complet:</span>
			<input
				id="side_name"
				name="side_name"
				type="text"
				class="Input"
				placeholder="Completează numele aici..."
				value="<?php echo $side_name; ?>"
				maxlength="200"
				required="required"
				aria-required="true"
				autocomplete="on"
				accesskey="n"
				tabindex="1"
			/>
		</label>
		<label class="Label <?php echo $eroare['side_telephone']; ?>">
			<span class="LabelText">Telefonul tău:</span>
			<input
				id="side_telephone"
				name="side_telephone"
				type="tel"
				class="Input"
				placeholder="Completează telefonul aici..."
				value="<?php echo $side_telephone; ?>"
				maxlength="15"
				pattern="\+?\d{9,}"
				required="required"
				aria-required="true"
				autocomplete="on"
				accesskey="t"
				tabindex="2"
				title="Telefonul ar trebui să conțină numai cifre, eventual și simbolul +"
			/>
		</label>
		<label class="Label <?php echo $eroare['side_email']; ?>">
			<span class="LabelText">Email-ul tău:</span>
			<input
				id="side_email"
				name="side_email"
				type="email"
				class="Input"
				placeholder="Completează email-ul aici..."
				value="<?php echo $side_email; ?>"
				maxlength="200"
				required="required"
				aria-required="true"
				autocomplete="on"
				accesskey="e"
				tabindex="3"
			/>
		</label>
	</fieldset>
	<fieldset class="Fieldset">
		<legend class="Legend">Introdu informațiile despre intervenție</legend>
		<label class="Label <?php echo $eroare['side_tip']; ?>">
			<span class="LabelText">Tipul problemei:</span>
			<select
				id="side_tip"
				name="side_tip"
				class="Select"
				required="required"
				aria-required="true"
				accesskey="p"
				tabindex="4"
			>
				<option value="" <?php echo $side_tip[0]; ?>>Alege o opțiune...</option>
				<option value="dezinsectie" <?php echo $side_tip[1]; ?>>Dezinsecție</option>
				<option value="dezinfectie" <?php echo $side_tip[2]; ?>>Dezinfecție</option>
				<option value="deratizare" <?php echo $side_tip[3]; ?>>Deratizare</option>
				<option value="all" <?php echo $side_tip[4]; ?>>Nu știu</option>
			</select>
		</label>
		<label class="Label <?php echo $eroare['side_mesaj']; ?>">
			<span class="LabelText">Problema detaliată:</span>
			<textarea
				id="side_mesaj"
				name="side_mesaj"
				class="Textarea"
				rows="15"
				required="required"
				aria-required="true"
				autocomplete="on"
				accesskey="m"
				tabindex="5"
			><?php echo $side_mesaj; ?></textarea>
		</label>
	</fieldset>
	<fieldset class="Fieldset CTAFieldset">
		<legend class="Legend Hidden">Trimite un mesaj lui DeDeDe acum</legend>

		<input class="Hidden" type="hidden" id="urlAjax" name="urlAjax" value="https://<?php echo $server; if ( $server == 'viorelmocanu.ro' ) : ?>/dedede.ro<?php else: ?><?php endif; ?>/sideform.php" />
		<input class="Hidden" type="hidden" id="side_url" name="side_url" value="<?php echo $_SESSION['side_url']; ?>" />
		<input class="Hidden" type="hidden" id="utm_source" name="utm_source" value="<?php if ( isset( $_SESSION['utm_source'] ) ) { echo $_SESSION['utm_source']; } ?>" />
		<input class="Hidden" type="hidden" id="utm_medium" name="utm_medium" value="<?php if ( isset( $_SESSION['utm_medium'] ) ) { echo $_SESSION['utm_medium']; } ?>" />
		<input class="Hidden" type="hidden" id="utm_term" name="utm_term" value="<?php if ( isset( $_SESSION['utm_term'] ) ) { echo $_SESSION['utm_term']; } ?>" />
		<input class="Hidden" type="hidden" id="utm_content" name="utm_content" value="<?php if ( isset( $_SESSION['utm_content'] ) ) { echo $_SESSION['utm_content']; } ?>" />
		<input class="Hidden" type="hidden" id="utm_campaign" name="utm_campaign" value="<?php if ( isset( $_SESSION['utm_campaign'] ) ) { echo $_SESSION['utm_campaign']; } ?>" />
		<input class="Hidden" type="hidden" id="gclid" name="gclid" value="<?php if ( isset( $_SESSION['gclid'] ) ) { echo $_SESSION['gclid']; } ?>" />

		<button type="submit" id="side_submit" name="side_submit" class="Button ButtonPrimary" title="Contactează-mă acum!" tabindex="6">
			<span class="ButtonText">Trimite mesajul acum &rarr;</span>
		<svg
			class="ButtonIcon"
			width="30"
			height="30"
			alt="Trimite mesajul lui DeDeDe"
			viewBox="0 0 30 30"
			fill="none"
			xmlns="http://www.w3.org/2000/svg">
			<path
			d="M15 30C17.9667 30 20.8668 29.1203 23.3335 27.472C25.8003 25.8238 27.7229 23.4811 28.8582 20.7403C29.9935 17.9994 30.2905 14.9834 29.7118 12.0736C29.133 9.16393 27.7044 6.49119 25.6066 4.3934C23.5088 2.29562 20.8361 0.867006 17.9263 0.288227C15.0166 -0.290551 12.0006 0.00649924 9.25975 1.14181C6.51885 2.27713 4.17618 4.19972 2.52796 6.66645C0.879734 9.13319 0 12.0333 0 15C0 18.9782 1.58035 22.7936 4.3934 25.6066C7.20644 28.4196 11.0217 30 15 30ZM7.698 10.776C7.87591 10.3471 8.18084 9.98301 8.5718 9.73256C8.96277 9.4821 9.42103 9.35733 9.885 9.375C11.583 9.375 13.281 9.375 14.985 9.375C16.689 9.375 18.393 9.375 20.085 9.375C20.5427 9.3556 20.9959 9.47311 21.3865 9.71251C21.7771 9.95191 22.0875 10.3023 22.278 10.719C22.3161 10.7719 22.341 10.8332 22.3506 10.8978C22.3601 10.9623 22.3541 11.0282 22.3329 11.0899C22.3118 11.1516 22.2761 11.2073 22.229 11.2524C22.1819 11.2975 22.1246 11.3306 22.062 11.349L15.3 14.88C15.2146 14.9289 15.1179 14.9547 15.0195 14.9547C14.9211 14.9547 14.8244 14.9289 14.739 14.88L7.887 11.319C7.83354 11.3025 7.78471 11.2736 7.74446 11.2348C7.7042 11.1959 7.67364 11.1481 7.65525 11.0953C7.63686 11.0424 7.63114 10.986 7.63857 10.9305C7.64599 10.8751 7.66635 10.8221 7.698 10.776ZM8.145 13.029C10.275 14.143 12.403 15.253 14.529 16.359C14.672 16.4437 14.8352 16.4885 15.0015 16.4885C15.1678 16.4885 15.331 16.4437 15.474 16.359C17.59 15.249 19.709 14.149 21.831 13.059C21.893 13.0245 21.9597 12.9993 22.029 12.984C22.0855 12.9647 22.1459 12.9598 22.2048 12.9699C22.2637 12.9799 22.3191 13.0046 22.3659 13.0416C22.4128 13.0786 22.4496 13.1268 22.473 13.1817C22.4965 13.2366 22.5057 13.2966 22.5 13.356C22.5 14.77 22.5 16.183 22.5 17.595C22.5172 17.9615 22.5041 18.3287 22.461 18.693C22.3758 19.2371 22.097 19.7322 21.6759 20.0871C21.2548 20.4421 20.7197 20.6331 20.169 20.625C18.777 20.625 17.385 20.625 15.996 20.625H9.879C9.3587 20.6368 8.8496 20.473 8.43378 20.1601C8.01796 19.8471 7.71967 19.4032 7.587 18.9C7.53223 18.7046 7.50299 18.5029 7.5 18.3C7.5 16.668 7.5 15.036 7.5 13.401C7.5 12.99 7.764 12.834 8.145 13.029Z" />
		</svg>
		</button>
	</fieldset>
</form-->

<?php
	if ( sizeof($variabile) > 0 ) {
		foreach ( $variabile as $key => $val ) {
			unset( $_SESSION[$val] );
		}
	}
?>
