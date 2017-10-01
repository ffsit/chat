REM A Windows Batch file that will minify the JS files to the proper location.

cd ..
java -jar "tools/closure-compiler-v20170626.jar" --js_output_file="src/js/util.min.js" --js="src/js/src/util/*.js"
java -jar "tools/closure-compiler-v20170626.jar" --js_output_file="src/js/chat-kiwi.min.js" src/js/src/webchat/chat-defs.js src/js/src/webchat/user-entity.js src/js/src/webchat/connectors/kiwi/*.js src/js/src/webchat/ui/*.js src/js/src/webchat/chat.js
