Change Log
-----------

#### 1.0.3
Issues addressed in this version.

##### Fixed a bug in increment nickname.
Addressed an issue with a logic bug in the incrementNickname method that had been introduced by the fix in the previous connector version.  Due to the need to prepend an underscore on invalid nicks, the incrementalNickname method would incorrectly truncate the entire nickname after the first discovered underscore on attempts to connect multiple sessions.  So for example, the nickname 22-caff would become _22-caff, which would be rejected if this was the user's second session due to being in use already.  Once rejected, the connector would attempt to change the nickname and increment it, which would incorrectly truncate the nick so that _22-caff becomes _23.

##### Added additional logic for the cannot_send_to_channel event.
Added logic to invoke a kick event if a user does not have rights to access a channel and attempts to send a message to said channel.

#### 1.0.2
Issues addressed in this version.

##### Support for users with a digit as the first character in their nick.
Addressed an issue where users with a digit as the first character in their nicknames were being rejected by the irc server.  Kiwi binds the identity & nickname together on log on so if the user has a digit as the first character in their identity they are rejected as it is not suppored in the nickname via the IRC RFC.  Additional logic was to prepend a underscore to these users if this specific nickname error was triggered.  Sanitization nickname & normalization methods were modified to support this as well.

#### 1.0.1
Issues addressed in this version.

##### Spammed TURBO Only mode message to all users.
This was caused by a missing check during the onChannel event. When we join the channel for the first time, we ask the server for its mode information.  Without this isMe check, every user that joined triggered this event, which would then return +M indicating the channel was muted, thus the TURBO only mode spam.

##### Missing users from the userlist and messages from users.
This issue was caused by the connector not handling multiple userlist events from IRC.  Each event would overwrite the current userlist.  This was fixed by simply appending to this list.

#### 1.0.0
Official release.

#### 0.1.0
Pre-initial release.
