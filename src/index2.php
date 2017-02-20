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
		<div id="user_list_wrapper">
			<h2>User List</h2>
			<div class="user_list" id="user_list"></div>
		</div>
	</div>

	<div class="center_helper">
		<div id="settings_wrapper">
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
			<div id="slide_message"></div>
			<div id="slide_login" class="slide_page">
				<h1>Login</h1>
				<div>Please read &amp; follow the <a href="http://videogamesawesome.com/the-rule-compendium/">chat rules</a>.</div>
				<img class="spinner" src="http://irc.videogamesawesome.com/img/spinner3.gif" alt="One moment">
				<form action="#" name="vgairc_loginform" id="vgairc_loginform">
					<label for="nickname">Name:</label>
					<input type="text" id="nickname" maxlength="32" value="">
					<label for="password">Password:</label>
					<input type="password" id="password" maxlength="128" value="">
					<label for="channel">Channel:</label>
					<input type="text" id="channel" maxlength="128" value="#ffstv" list="channels">
						<datalist id="channels">
							<option value="#ffstv">
							<option value="#spoilers">
						</datalist>
					<button id="Login" type="button">Login</button>
				</form>
			</div>
		</div>
	</div>

	<div id="wrapper1">
	<div class="wrapper2">
		<div id="upper_ui">
			<div id="chathistory_wrapper">
				<div class="chathistory" id="chathistory"></div>
			</div>
		</div>
	</div>

	<div class="wrapper3">
		<div id="lower_wrapper">
            <div id="lower_ui">
                <div class="wrapper2">
                    <div class="wrapper4">
                        <form class="chatui_form" method="post" action="#DoChat">
                            <input type="text" name="message" id="chatbox_input" maxlength="300" disabled="disabled">
                        </form>
                        <div id="chatui_buttons">
                            <a title="Troll Now!" id="chatui_button_go" href=""><img src="http://irc.videogamesawesome.com/img/go_button.png" alt="↵"/></a><a title="Show or hide user list" id="chatui_button_nicklist" href=""><img src="http://irc.videogamesawesome.com/img/nicklist_button.png" alt="☃"/></a><a title="Show or hide settings" id="chatui_button_settings" href=""><img src="http://irc.videogamesawesome.com/img/settings_button.png" alt="✔"/></a><a title="Show or hide debug stuff" id="chatui_button_debug" href=""><img src="http://irc.videogamesawesome.com/img/debug_button.png" alt="☣"/></a>
                        </div>
                    </div>
                </div>
            </div>
		</div>
	</div>

	</div>
    <script src="https://code.jquery.com/jquery-2.2.4.min.js" integrity="sha256-BbhdlvQf/xTY9gja0Dq3HiwQF8LaCRTXxZKRutelT44=" crossorigin="anonymous"></script>
    <script src="/irc/util/globals.js"></script>
    <script src="/irc/util/websocket.js"></script>
    <script src="/irc/connectors/kiwi/kiwi-protocol.js"></script>
    <script src="/irc/connectors/kiwi/kiwi-connector.js"></script>
    <script src="/irc/chat.js"></script>
    <script>
        vga.util.enableDebug();           
        $(function(){

            var chat = new vga.irc.chat({
				url: "ws://valhalla.ffsit.net:7778/?transport=websocket",
				hostname: "valhalla.ffsit.net",
				port: "6667"
			});

            $('#Login').click(function(e){
                var nickname = $('#nickname').val();
                var password = $('#password').val();
                var channel = $('#channel').val();
                chat.connect(nickname, password, channel);
                e.preventDefault();
            });
        });

    </script>    
</body>
</html>
