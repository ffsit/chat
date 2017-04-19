<!DOCTYPE html>
<html>
<head>
	<title>VGAIRC</title>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
	<link rel="stylesheet" type="text/css" href="/chat.css">
	<link rel="icon" type="image/png"  href="/favicon.png">
	<!--[if IE]>
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		<script type="text/javaScript" src="./iekludges.js"></script>
	<![endif]-->
	<!--[if lt IE 9]>
		<script type="text/javaScript" src="./IE9.js"></script>
	<![endif]-->
</head>
<body>
	<div id="wrapper1">
		<div class="center_helper hidden">
			<div id="debug_wrapper" class="center-floating-container">
				<p id="debugoutput"></p>
				<form class="debug" id="vgairc_debugform" method="post" action="/debug.php">
						<input type="submit" value="Send debug output">
				</form>
			</div>
		</div>

		<div class="center_helper">
			<div id="login-wrapper">
				<div id="slide_message" class="hidden"></div>
				<div id="slide_login" class="slide_page">
					<h1>Login</h1>
					<div>Please read &amp; follow the <a href="http://videogamesawesome.com/the-rule-compendium/">chat rules</a>.</div>
					<img class="spinner" src="/img/spinner<?php print(strval(rand(1,5))); ?>.gif" alt="One moment">
					<form action="#" name="vgairc_loginform" id="vgairc_loginform">
						<label for="nickname">Name:</label>
						<input type="text" id="nickname" maxlength="32" value="<?php if(isset($_GET['nick'])) { print(htmlspecialchars($_GET['nick'])); } ?>">
						<label for="password">Password:</label>
						<input type="password" id="password" maxlength="128" value="">
						<label for="channel">Channel:</label>
						<input type="text" id="channel" maxlength="128" list="channels" placeholder="#ffstv">
							<datalist id="channels">
								<option value="#ffstv">
								<option value="#spoilers">
								<option value="#support">
							</datalist>
						<button id="Login" type="button">Login</button>
					</form>
				</div>
			</div>
		</div>
		<div class="channel-container">
			<div class="center_helper">
				<div id="settings-container" class="center-floating-container hidden">
					<h2>Settings</h2>
					<div class="settings-body">
						<div id="settings-smooth-scroll" class="settings-item" title="Toggles the smooth scroll feature.">
							<i class="fa fa-2x fa-toggle-on settings-item-smooth-scroll" aria-hidden="true" role="button"></i>
							<span>Disable Smooth Scroll</span>
						</div>
						<div class="settings-item" title="Enables T-t-turbo mode!">
							<i class="fa fa-2x fa-toggle-on settings-item-enable-turbo-mode" data-channels="ffstv" aria-hidden="true" role="button"></i>
							<span>Enable Turbo Only</span>
						</div>
						<div class="settings-item" title="Toggles Fraser's special show mode">
							<i class="fa fa-2x fa-toggle-off settings-item-enable-frash-show-mode" aria-hidden="true" role="button"></i>
							<span>Frash Show Mode</span>
						</div>
						<div id="settings-enable-join-messages" class="settings-item" title="Shows you when a user joins or leaves the chat.">
							<i class="fa fa-2x fa-toggle-off settings-item-enable-join-messages" aria-hidden="true" role="button"></i>
							<span>Show Join/Leave</span>
						</div>
					</div>
				</div>
			</div>
			<!-- Serves as a template to create other channels. -->
			<div id="channel-tab-template" class="channel-tab">
				<div class="center_helper">
					<!-- Users go into sections within this list. -->
					<div class="user-list-wrapper center-floating-container hidden">
						<h2>User List</h2>
						<div class="user-list mid-size">
							<div class="mod-section hidden">
								<h3>Mods</h3>
								<div class="mod-section-body"></div>
							</div>
							<div class="guest-section hidden">
								<h3>Guests</h3>
								<div class="guest-section-body"></div>
							</div>
							<div class="regular-section hidden">
								<h3>Regulars</h3>
								<div class="regular-section-body"></div>
							</div>
						</div>
					</div>
				</div>
				<!-- Chat messages and events go here. -->
				<div class="channel-window small"></div>
				<!-- Adaptive chat buttons -->
				<div class="lower-ui">
					<div class="right">
						<span class="button-container user-list-button">
							<i class="fa fa-users fa-inverse button" aria-hidden="true" title="Show Users" alt="?" role="button"></i>
						</span>
						<span class="button-container user-settings-button">
							<i class="fa fa-cog fa-inverse button" aria-hidden="true" title="Show My Settings" alt="?" role="button"></i>
						</span>
						<span class="button-container user-support-button">
							<i class="fa fa-exclamation-circle fa-inverse button" aria-hidden="true" title="Support" alt="!" role="button"></i>
						</span>
					</div>
					<!-- Input here to chat. -->
					<div class="left">
						<input type="text" class="chatbox_input" maxlength="300" placeholder="Troll Here!">
					</div>
				</div>
			</div>
		</div>
	</div>
	<link href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet" integrity="sha384-wvfXpqpZZVQGK6TAh5PVlGOfQNHSoD2xbE+QkPxCAFlNEevoEH3Sl0sibVcOQVnN" crossorigin="anonymous">
    <script src="https://code.jquery.com/jquery-2.2.4.min.js" integrity="sha256-BbhdlvQf/xTY9gja0Dq3HiwQF8LaCRTXxZKRutelT44=" crossorigin="anonymous"></script>
	
	<!-- Minimize into a utility script -->
	<script src="/irc/util/globals.js"></script>
	<script src="/irc/util/listener.js"></script>
    <script src="/irc/util/websocket.js"></script>
	
    <!-- Minimize into the chat script -->
	<script src="/irc/chat-defs.js"></script>
    <script src="/irc/chat.js"></script>
	<script src="/irc/chat-start.js"></script>

	<!-- Minimize into the kiwi connector script -->
	<script src="/irc/connectors/kiwi/kiwi-protocol.js"></script>
    <script src="/irc/connectors/kiwi/kiwi-connector.js"></script>

	<!-- Enable Babel -->
	<!--
	<script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>

	<script type="text/babel" src="/irc/util/globals.js"></script>
	<script type="text/babel" src="/irc/util/listener.js"></script>
	<script type="text/babel" src="/irc/util/websocket.js"></script>

	<script type="text/babel" src="/irc/chat-defs.js"></script>
	<script type="text/babel" src="/irc/chat.js"></script>
	<script type="text/babel" src="/irc/connectors/kiwi/kiwi-protocol.js"></script>
	<script type="text/babel" src="/irc/connectors/kiwi/kiwi-connector.js"></script>
	<script type="text/babel" src="/irc/chat-start.js"></script>
	-->

</body>
</html>
