#REM A Windows Batch file that will minify the JS files to the proper location.

cd ..
java -jar "tools/closure-compiler-v20170626.jar" --js_output_file="src/js/util.min.js" --js="src/js/src/irc/util/*.js"
java -jar "tools/closure-compiler-v20170626.jar" --js_output_file="src/js/chat-kiwi.min.js" src/js/src/irc/chat-defs.js src/js/src/irc/connectors/kiwi/kiwi-protocol.js src/js/src/irc/connectors/kiwi/kiwi-connector.js src/js/src/irc/chat.js
