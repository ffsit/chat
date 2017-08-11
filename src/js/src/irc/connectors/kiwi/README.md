Change Log
-----------

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
