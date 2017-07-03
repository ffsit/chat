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
The following events are expected by the chat library.  These events can be implemented using the vga.util.listener class or can be your own implementation.  The events in the vga.irc.chat class are simply public methods that can be called at anytime.

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

**onConnect**

`{channelKey: string}`

**onDisconnect**

`{closedByServer: bool}`

**onReconnect**

**onTopic**

`{ topic: string, channelKey: string }`

**onNick**

`{ userKey: string, identity: string, nickname: string, newNickName: string, isMe: bool }`

**onMessage**

`{ userKey: string, identity: string, nickname: string, target: string, message: string, type: string }`

**onUserlist**

`{ channelKey: string, users: { roles: bitarray, prefixes: [ {prefix: string} ], nicknames: [string] }`

**onJoin**

`{ channelKey: string, userKey: string, identity: string, nickname: string, isMe: bool }`

**onLeave**

`{ channelKey: string, userKey: string, identity: string, nickname: string, isMe: bool }`

**onQuit**

`{ userKey: string, identity: string, nickname: string, isMe: bool }`

**onChannelMode**

`{ channelKey: string, modes: bitarray, action: vga.irc.roleModeAction }`

**onRole**

`{ channelKey: string, userKey: string, identity: string, nickname: string, isMe: bool, action: vga.irc.roleModeAction, roles: bitarray }`

**onStatus**

`{ channelKey: string, userKey: string, identity: string, nickname: string, isMe: bool, action: vga.irc.roleModeAction, status: bitarray }`

**onAccessDenied**

**onKicked**

`{ identity: string, userKey: string, channelKey: string, isMe: bool }`

**onBanned**

`{ identity: string, userKey: string, channelKey: string }`

**onError**

`{ reason: string }`