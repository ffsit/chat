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

	<div class="center_helper">
		<div id="settings-container" class="hidden">
			<h2>Settings</h2>
			<div id="settings">
				<a href="" id="toggle_smoothscroll">Disable Smooth Scroll</a>
				<a href="" id="toggle_modem">Enable Turbo Only</a>
			</div>
		</div>
	</div>

	<div class="center_helper">
		<div id="debug_wrapper">
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
	<div id="wrapper1">
		<div class="channel-container">
			<!-- Serves as a template to create other channels. -->
			<div id="channel-tab-template" class="channel-tab">
				<div class="center_helper">
					<div class="user-list-wrapper hidden">
						<h2>User List</h2>
						<div class="user-list mid-size"></div>
					</div>
				</div>
				<!-- Chat messages and events go here. -->
				<div class="channel-window small"></div>
				<!-- Adaptive chat buttons -->
				<div class="lower-ui">
					<div class="right">
						<span class="button-container userlist">
							<i class="fa fa-users fa-inverse button" aria-hidden="true" title="Show or hide user list" alt="?" role="button"></i>
						</span>
						<span class="button-container user-settings">
							<i class="fa fa-cog fa-inverse button" aria-hidden="true" title="Show or hide settings" alt="?" role="button"></i>
						</span>
						<span class="button-container user-support">
							<i class="fa fa-exclamation-circle  fa-inverse button" aria-hidden="true" title="Support" alt="!" role="button"></i>
						</span>
					</div>
					<!-- Input here to chat. -->
					<div class="left">
						<input type="text" class="chatbox_input" maxlength="300">
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
