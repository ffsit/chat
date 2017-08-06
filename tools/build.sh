#!/bin/sh

javaCmd=`which java`

cd ..
$javaCmd -jar "tools/closure-compiler-v20170626.jar" --js_output_file="src/js/util.min.js" --js="src/js/src/irc/util/*.js"
$javaCmd -jar "tools/closure-compiler-v20170626.jar" --js_output_file="src/js/chat-kiwi.min.js" src/js/src/irc/chat-defs.js src/js/src/irc/connectors/kiwi/kiwi-protocol.js src/js/src/irc/connectors/kiwi/kiwi-connector.js src/js/src/irc/chat.js
