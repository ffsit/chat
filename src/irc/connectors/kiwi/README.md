Change Log
-----------

#### 0.1.0
Pre-initial release.

#### 1.0.0
Official release.

#### 1.0.1
Issues addressed in this version.

##### Spammed TURBO Only mode message to all users.
This was caused by a missing check during the onChannel event. When we join the channel for the first time, we ask the server for its mode information.  Without this isMe check, every user that joined triggered this event, which would then return +M indicating the channel was muted, thus the TURBO only mode spam.

##### Missing users from the userlist and messages from users.
This issue was caused by the connector not handling multiple userlist events from IRC.  Each event would overwrite the current userlist.  This was fixed by simply appending to this list.
