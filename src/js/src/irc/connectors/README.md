Connectors
===========
The connector layer is responsible for managing the server-side chat logic and interfacing with the chat layer.

Types of Connectors
-----------
* Kiwi -- An IRC connector specifically designed to interface with the Kiwi IRC server (proxy) ([https://kiwiirc.com/](https://kiwiirc.com/)).
    * Kiwi Connector -- The higer level connector logic for interacting with Kiwi & IRC specific events.
    * Kiwi Protocol -- The lower level connector logic that interfaces with the websocket layer.

Expected Chat Events
-----------
The following events are expected by the chat library.  These events can be implemented using the vga.util.listener class or can be your own implementation.  The events in the vga.webchat.chat class are simply public methods that can be called at anytime.

### Events
* onConnect
* onDisconnect
* onReconnect
* onTopic
* onNick
* onMessage
* onUserlist
* onJoin
* onLeave
* onQuit
* onChannelMode
* onRole
* onStatus
* onAccessDenied
* onKicked
* onBanned
* onError

### Signatures

**onConnect(eventData)**

`eventData: {channelKey: string}`

**onDisconnect(eventData)**

`eventData: {closedByServer: bool}`

**onReconnect**

**onTopic(eventData)**

`eventData: { topic: string, channelKey: string }`

**onNick(eventData)**

`eventData: { userKey: string, identity: string, nickname: string, newNickName: string, isMe: bool }`

**onMessage(eventData)**

`eventData: { userKey: string, identity: string, nickname: string, isChannel: bool, target: string, message: string, type: string }`

**onUserlist(eventData)**

`eventData: { channelKey: string, users: { roles: bitarray, prefixes: [ {prefix: string} ], nicknames: [string] }`

**onJoin(eventData)**

`eventData: { channelKey: string, userKey: string, identity: string, nickname: string, isMe: bool }`

**onLeave(eventData)**

`eventData: { channelKey: string, userKey: string, identity: string, nickname: string, isMe: bool }`

**onQuit(eventData)**

`eventData: { userKey: string, identity: string, nickname: string, isMe: bool }`

**onChannelMode(eventData)**

`eventData: { channelKey: string, modes: bitarray, action: vga.webchat.roleModeAction }`

**onRole(eventData)**

`eventData: { channelKey: string, userKey: string, identity: string, nickname: string, isMe: bool, action: vga.webchat.roleModeAction, roles: bitarray }`

**onStatus(eventData)**

`eventData: { channelKey: string, userKey: string, identity: string, nickname: string, isMe: bool, action: vga.webchat.roleModeAction, status: bitarray }`

**onAccessDenied**

**onKicked(eventData)**

`eventData: { identity: string, userKey: string, channelKey: string, isMe: bool }`

**onBanned(eventData)**

`eventData: { identity: string, userKey: string, channelKey: string }`

**onError(eventData)**

`eventData: { reason: string }`