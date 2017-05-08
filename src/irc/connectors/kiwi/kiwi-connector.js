"use strict";

/*
* @license
* Copyright (c) 2016-2017, FarFromSubtle IT
* All rights reserved.
* Author: Ken Anderson <caffeinatedrat at gmail dot com>
* @@@@@@@@@@@@@@@@
* @@@@@@@@@@@@@@@@
* @@@  @@@@@@  @@@
* @@@  @@@@@@  @@@
* @@@@@@@@@@@@@@@@
* @@@          @@@
* @@@          @@@
* @@@@@@@@@@@@@@@@
*    @@@@@@@@@@   
*    @@@@@@@@@@   
* @@@@@@@@@@@@@@@@
* @@@@@@@@@@@@@@@@
*    @@      @@   
*    @@      @@   
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions are met:
*
*     * Redistributions of source code must retain the above copyright
*       notice, this list of conditions and the following disclaimer.
*     * Redistributions in binary form must reproduce the above copyright
*       notice, this list of conditions and the following disclaimer in the
*       documentation and/or other materials provided with the distribution.
*
* THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY
* EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
* WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
* DISCLAIMED. IN NO EVENT SHALL THE AUTHOR AND CONTRIBUTORS BE LIABLE FOR ANY
* DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
* (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
* LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
* ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
* (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
* SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

//Namespace declaration.
var vga = vga || {};
vga.irc = vga.irc || {};
vga.irc.connector = vga.irc.connector || {};
vga.irc.connector.kiwi = vga.irc.connector.kiwi || {};

///////////////////////////////////////////////////////////
// Our Kiwi IRC Connector.
// The connector is our logical abstraction of the IRC & Kiwi protocol.
///////////////////////////////////////////////////////////
(function(){

    //-----------------------------------------------------------------
    //RegExs for the various IRC errors.
    //-----------------------------------------------------------------
    vga.irc.connector.kiwi.accessDeniedRegEx = /^Closing link: [^\r\n]*\[Access denied\]$/;
    vga.irc.connector.kiwi.pingTimeoutRegEx = /^Closing link: [^\r\n]*\[Ping timeout: \d+ seconds\]$/;
    vga.irc.connector.kiwi.registrationTimeOutRegEx = /^Closing link: [^\r\n]*\[Registration timeout\]$/
    vga.irc.connector.kiwi.serverShutDownRegEx = /^Closing link: [^\r\n]*\[Server shutdown\]$/;

    //-----------------------------------------------------------------
    // Default prefix map to mode.
    // This is not used if the IRC server sends its own prefix to mode info.
    //-----------------------------------------------------------------
    const defaultPrefixMap = {'~': 'q', '&': 'a', '@': 'o', '%': 'h', '+': 'v'}

    //-----------------------------------------------------------------
    // IRC mode to Chat role map.
    // This abstracts the IRC modes from the chat in the event chat no longer uses IRC.
    //-----------------------------------------------------------------    
    const modeToRolesMap =  {
        'q': vga.irc.roles.owner,
        'a': vga.irc.roles.admin,
        'o': vga.irc.roles.mod,
        'h': vga.irc.roles.guest,
        'v': vga.irc.roles.turbo
    };

    const channelModeMap =  {
        'm': vga.irc.channelmodes.turbo
    };

    var reverseChannelModeMap =  {};
    reverseChannelModeMap[vga.irc.channelmodes.turbo] = 'm';

    //-----------------------------------------------------------------
    // IRC Method Map
    //-----------------------------------------------------------------
    const methodMap = {
        'connect': 'onConnect',
        'disconnect': 'onDisconnect',
        'reconnect': 'onReconnect',
        'message': 'onMessage',
        'topic': 'onTopic',
        //User events.
        'userlist': 'onUserlist',
        'join': 'onJoin',
        'leave': 'onLeave',
        'quit': 'onQuit',
        'otheruserjoin': 'onOtherUserJoin',
        'otheruserpart': 'onOtherUserLeave',
        //Mode & Channel events
        'channelmode': 'onChannelMode',
        'usermode' : 'onRole',
        'otherusermode': 'onRole',
        //Error events
        'accessdenied': 'onAccessDenied',
        'kicked': 'onKicked',
        'kick': 'onKicked',
        'banned': 'onBanned',
        'error': 'onError'
    };

    //-----------------------------------------------------------------
    // Helper functions
    //-----------------------------------------------------------------

    /**
     * Increments the nickname suffix by one per original vga chat implementation by appending or incrementing a numeric suffix identifier.
     * @method incrementNickname
     * @param {string} nickname to increment.
     * @return {string} incremented nickname.
     */
    function incrementNickname(nickname) {
        let suffixIndex = nickname.lastIndexOf('_');
        let appendIndex = 1;
        if (suffixIndex > -1) {
            appendIndex = (parseInt(nickname.substring(suffixIndex + 1)) || 0) + 1;
            nickname = nickname.substring(0, suffixIndex);
        }
        return `${nickname}_${appendIndex}`;
    }

    /**
     * Sanitizes the nickname by removing the numeric suffix identifier.
     * @method sanitizeNickname
     * @param {string} nickname to sanitized.
     * @return {string} sanitized nickname.
     */
    function sanitizeNickname(nickname) {
        let suffixIndex = nickname.lastIndexOf('_');
        if (suffixIndex > -1) {
            nickname = nickname.substring(0, suffixIndex);
        }
        return nickname;
    }

    /**
     * Class for the kiwi connector.
     * @class vga.irc.connector.kiwi.connector
     * @param {object} options Additional options for the connector.
     */
    vga.irc.connector.kiwi.connector = class {
        constructor (url, options) {

            //-----------------------------------------------------------------
            // Versioning
            //-----------------------------------------------------------------
            vga.irc.connector.kiwi.CLIENT_VERSION = new vga.util.version(1, 0, 0);

            //Normalize.
            options = options || {};
            
            //Channel & Prefix maps.
            this._userListByChannel = {};
            this._prefixMap = {};

            //User Identity information.
            this._nickname = this._identity = '';

            //We can disable the nicknames consolidation (normalization) and allow the mutated nicknames to be an individual entity.
            //This means that all events meant for one person will now only target individual nicknames.
            //For Example: The message meant for cafftest_1 will not longer be sent to cafftest.
            this._consolidateNicknames = (options.consolidateNicknames !== undefined) ? options.consolidateNicknames : false;

            //Autojoin logic.  If this is set we will try to autojoin a channel.
            this._autoJoinChannel = (options.autoJoinChannel !== undefined) ? options.autoJoinChannel : true;
            this._autoJoinChannelComplete = false;

            //Supports the option of having the same user join the same channel multiple times.
            //This voids the 'nickname in use' error.
            //This feature is used in conjunction with the normalizedNicknames feature.
            this._supportConcurrentChannelJoins = (options.supportConcurrentChannelJoins !== undefined) ? options.supportConcurrentChannelJoins : true;

            //Determine if the connection was closed by the user or the protocol.
            this._attemptReconnect = (options.attemptReconnect !== undefined) ? options.attemptReconnect : false;
            this._maxNumberOfReconnectAttempts = options.maxNumberOfReconnectAttempts || 3;
            this._numberOfReconnectsAttempted = 0;

            //Protocol information.
            this._listener = new vga.util.listener(methodMap, options.listeners);
            this._protocol = new vga.irc.connector.kiwi.protocolwrapper(url, {listeners: [this]});
        }
        /**
         * Registers a listening object to the connector layer.
         * @method vga.irc.connector.kiwi.connector.register
         * @param {object} listeningObject A listening object to register.  This can be an array of listening objects.
         */
        register(listeningObject) {
            this._listener.register(listeningObject);
            return this;
        }
        /**
         * Returns the identity of the current user, which may not be the same as the nickname.
         * @method vga.irc.connector.kiwi.connector.getMyIdentity
         * @return {string} the currently authenticated user's identity.
         */
        getMyIdentity() {
            return this._identity;
        }
        /**
         * Returns the normalized nickname assigned to the user on login.
         * @method vga.irc.connector.kiwi.connector.getMyNickname
         * @return {string} the currently authenticated user's nickname.
         */
        getMyNickname() {
            return this.normalizeNickname(this._nickname);
        }
        /**
         * Returns a generated nickname key assigned to the user on login.
         * @method vga.irc.connector.kiwi.connector.getMyNicknameKey
         * @return {string} the currently authenticated user's nickname key.
         */        
        getMyNicknameKey() {
            return this.generateNicknameKey(this._nickname);
        }
        /**
         * A normalized way of determining if the current user's identity or nickname is the same as the authenticated user.
         * NOTE: This method is safe from nickname mutation.
         * @method vga.irc.connector.kiwi.connector.isMe
         * @param {string} entityName the entity's nickname.
         * @return {bool} true if the entity is the currently authenticated user.
         */        
        isMe(entityName){
            return this._nickname.toLocaleLowerCase() === entityName.toLocaleLowerCase() 
                || this._identity.toLocaleLowerCase() === entityName.toLocaleLowerCase();
        }
        /**
         * Normalizes a nickname based on whether the option to consolidate nicknames has been enabled or not.
         * @method normalizeNickname
         * @param {string} nickname to normalized.
         * @return {string} normalized nickname.
         */
        normalizeNickname(nickname) {
            return this._consolidateNicknames ? sanitizeNickname(nickname) : nickname;
        }        
        /**
         * Generates a nickname key.
         * NOTE: For now this is just a lowercase, normalized value.
         * @method generateNicknameKey
         * @param {string} nickname to generate a key.
         * @return {string} a nickname key.
         */
        generateNicknameKey(nickname) {
            return this.normalizeNickname(nickname).toLocaleLowerCase();
        }
        /**
         * Generates a channel key.
         * NOTE: For now this is just a lowercase, normalized value.
         * @method generateChannelKey
         * @param {string} channelName to generate a key.
         * @return {string} a channelName key.
         */
        generateChannelKey(channelName) {
            return channelName.toLocaleLowerCase();
        }        
        /**
         * Attempts to open a connection to the kiwi IRC server.   This method is idempotent and safe as multiple calls have no side-effects.
         * @method vga.irc.connector.kiwi.connector.connect
         * @param {object} authenticationParams authentication parameters to set to the server.
         */
        connect(authenticationParams) {
            //Normalize.
            authenticationParams = authenticationParams || {};

            if (this._protocol) {
                this._protocol.open(authenticationParams);

                //Retain some information as long as the states are valid.
                let currentState = this._protocol.getState();
                if (currentState === vga.irc.connector.kiwi.STATES.CLOSED || currentState === vga.irc.connector.kiwi.STATES.OPENING)
                {
                    //If there is a channel supplied attempt to autojoin it.
                    this._autoJoinChannel = (authenticationParams.channel || '').toLowerCase();
                    this._userListByChannel = {};
                    this._prefixMap = {};

                    //NOTE: That our nickname & identity are assigned to us once per session rather than per channel.
                    this._nickname = this._identity = authenticationParams.nick;
                }
            }
            return this;
        }
        /**
         * Attemps to sends a message to the specific target.
         * @method vga.irc.connector.kiwi.connector.send
         * @param {string} message to send to the specific target.
         * @param {string} target to send the message.
         */
        send(message, target) {
            if (target && message) {
                vga.util.debuglog.info(`[vga.irc.connector.kiwi.connector.send]: Sending to (${target}): ${message}.`);
                this._protocol && this._protocol.sendIRCData('privmsg', {target: target, msg: message });
            }
            return this;
        }
        /**
         * Attemps to sends a user emote action
         * @method vga.irc.connector.kiwi.connector.emote
         * @param {string} target to send the emote action.
         * @param {string} emoteAction to send to the specific target.
         */
        emote(target, emoteAction) {
            if (target && emoteAction) {
                vga.util.debuglog.info(`[vga.irc.connector.kiwi.connector.emote]: Sending to (${target}): ${emoteAction}.`);
                this._protocol && this._protocol.sendIRCData('ctcp', {is_request: true, type: 'ACTION', target: target, params: emoteAction });
            }
            return this;
        }
        /**
         * Attempts to join the channel specified.
         * @method vga.irc.connector.kiwi.connector.join
         * @param {string} channel channel to join after connecting to the IRC server.
         */
        join(channel) {
            if (channel) {
                vga.util.debuglog.info(`[vga.irc.connector.kiwi.connector.join]: Attempting to join channel: ${channel}.`);
                this._protocol && this._protocol.sendIRCData('join', {channel: channel, key: '' });
                return this;
            }
            vga.util.debuglog.info('[vga.irc.connector.kiwi.connector.join]: Invalid channel.', channel);
            return this;
        }
        /**
         * Attempts to leave the channel specified.
         * @method vga.irc.connector.kiwi.connector.leave
         * @param {string} channel channel to leave.
         * @param {string} message message to send to the server when leaving a channel.
         */
        leave(channel, message) {
            if (channel) {
                vga.util.debuglog.info(`[vga.irc.connector.kiwi.connector.leave]: Attempting to leave channel: ${channel}.`);
                this._protocol && this._protocol.sendIRCData('part', {channel: channel, message: message });
                return this;
            }
            vga.util.debuglog.info('[vga.irc.connector.kiwi.connector.leave]: Invalid channel.', channel);
            return this;
        }
        /**
         * Sets the mode for the channel.
         * @method vga.irc.connector.kiwi.connector.setMode
         * @param {string} channel to set the mode.
         * @param {number} mode type to set (vga.irc.channelmodes).
         * @param {number} action type of action (vga.irc.roleModeAction) to apply.
         */
        setMode(channel, mode, action) {
            if (channel) {
                let convertedMode = reverseChannelModeMap[mode];
                vga.util.debuglog.info(`[vga.irc.connector.kiwi.connector.setMode]: (Attempting to ${action == vga.irc.roleModeAction.add ? "add" : "remove"} the mode ${convertedMode} on channel: ${channel}).`);
                this._protocol && this._protocol.sendIRCData('raw', {'data': `MODE ${channel} ${(action == vga.irc.roleModeAction.add ? "+" : "-")}${convertedMode}`});
                return this;
            }
            vga.util.debuglog.info(`[vga.irc.connector.kiwi.connector.setMode]: (Invalid channel ${channel}).`);
            return this;
        }
        /**
         * Attempts to change the nickname of the currently authenticated user.
         * @method vga.irc.connector.kiwi.connector.nick
         * @param {string} nickname the nickname to change to.
         */
        setNickname(nickname) {
            if (nickname) {
                this._nickname = nickname;
                vga.util.debuglog.info(`[vga.irc.connector.kiwi.connector.nick]: (Attempting to change nickname to: ${nickname}).`);
                this._protocol && this._protocol.sendIRCData('nick', {nick: nickname});
            }
            return this;
        }
        /**
         * Disconnects\closes an open connection.  This method is idempotent and safe as multiple calls have no side-effects.
         * @method vga.irc.connector.kiwi.connector.disconnect
         * @param {string} message a temporary message to send when closing the socket.
         */
        disconnect(message) {
            //Perform the cleanup routine.
            this._nickname = this._identity = '';
            //this._numberOfReconnectsAttempted = 0;
            if (this._protocol) {
                vga.util.debuglog.info(`[vga.irc.connector.kiwi.connector.disconnect]: (Attempting to disconnect with message: ${message || 'undefined'}).`);
                this._protocol.sendIRCData('quit', {message: message});
                this._protocol.close(message);
            }
            return this;
        }
        /**
         * Disposes of the connector, cleaning up any additional resources.
         * @method vga.irc.connector.kiwi.connector.dispose
         */
        dispose() {
            this.disconnect();
            this._protocol = vga.util.safeDispose(this._protocol);
            return this;
        }
        //-----------------------------------------------------------------
        // IRC Protocol Events
        // These events are triggered by the Kiwi Protocol Layer.
        //-----------------------------------------------------------------
        /**
         * This event is triggered when a connection has been established with the IRC server.
         * @method vga.irc.connector.kiwi.connector.onConnect
         * @param {object} eventData event data associated with the established connection.
         */
        onConnect(eventData) {
            let channelKey = '';
            this._numberOfReconnectsAttempted = 0;
            vga.util.debuglog.info(`[vga.irc.connector.kiwi.connector.onConnect]: (AutoJoinChannel: ${this._autoJoinChannel !== '' ? this._autoJoinChannel : 'none' }, Nick: ${eventData.nick}).`);
            if (this._autoJoinChannel !== '') {
                this.join(this._autoJoinChannel);
                channelKey = this._autoJoinChannel;
            }
            this._listener.invokeListeners('connect', {channelKey: channelKey});
        }
        /**
         * This event is triggered on a disconnect event regardless of whether it was the user or server.
         * @method vga.irc.connector.kiwi.connector.onDisconnect
         * @param {object} eventData event data associated with a disconnect event.
         */
        onDisconnect(eventData) {
            vga.util.debuglog.info(`[vga.irc.connector.kiwi.connector.onDisconnected]: (Reason: '${eventData.reason}', closedByServer: ${eventData.closedByServer}, existingConnection: ${eventData.existingConnection}).`);
            
            let reason = 'Unable to reach the server.  Try again later.';
            //Determine if we are going to trigger the reconnect logic.
            //The feature must be enabled, the close event triggered by the server only, and an existing connection must have been established.
            if (this._attemptReconnect && eventData.closedByServer && eventData.existingConnection) {
                if (this._numberOfReconnectsAttempted < this._maxNumberOfReconnectAttempts) {
                    this._numberOfReconnectsAttempted++;
                    vga.util.debuglog.info(`[vga.irc.connector.kiwi.connector.onDisconnected]: (Attempt to reconnect is enabled, attempting try: ${this._numberOfReconnectsAttempted}).`);
                    this._listener.invokeListeners('reconnect');
                    return;
                }

                reason = `(Exceeded the number of retry event: ${this._maxNumberOfReconnectAttempts}). Giving up.`;
                vga.util.debuglog.info(`[vga.irc.connector.kiwi.connector.onDisconnected]: ${reason}`);
            }

            this._protocol && this._protocol.close();
            this._listener.invokeListeners('disconnect', {closedByServer: eventData.closedByServer, reason: reason});
        }
        /**
         * This event is triggered when the IRC server sends the options information.
         * @method vga.irc.connector.kiwi.connector.onOptions
         * @param {object} eventData event data associated irc server.
         */
        onOptions(eventData) {
            vga.util.debuglog.info(`[vga.irc.connector.kiwi.connector.onOptions].`);

            //If we don't have prefix map, create one.
            if (vga.util.propertyCount(this._prefixMap) === 0) {
                if (eventData.options && eventData.options.PREFIX) {
                    eventData.options.PREFIX.forEach((prefixItem) => {
                        if (prefixItem.symbol && prefixItem.mode) {
                            this._prefixMap[prefixItem.symbol] = prefixItem.mode;
                        }
                    });
                }
            }
        }
        /**
         * This event is triggered on a nickname change.
         * @method vga.irc.connector.kiwi.connector.onNick
         * @param {object} eventData event data associated with nickname event sent by the server.
         */
        onNick(eventData) {
            vga.util.debuglog.info('[vga.irc.connector.kiwi.connector.onNick].', eventData);

            if (!this.isMe(eventData.nick)) {
                //eventData.newnick;
            }
        }
        /**
         * This event is triggered when a message is generated by the server.
         * @method vga.irc.connector.kiwi.connector.onMessage
         * @param {object} eventData event data associated with a message from the server.
         */
        onMessage(eventData) {
            vga.util.debuglog.info(`[vga.irc.connector.kiwi.connector.onMessage]: (Target: ${eventData.target}, Type: ${eventData.type}, Nickname: ${eventData.nick}, Message: ${eventData.msg}).`);
            
            //Determine if we are dealing with a channel as a target and if so we need to normalize it.
            //We have to make all channel names lowercase.
            let isChannel = (eventData.target.length > 0 && eventData.target[0] === '#');

            //Private Message Example Data: {"type":"message","nick":"messager_nick","ident":"messager_ident","hostname":"::1","target":"messagee_nick","msg":"Hi","connection_id":0}
            //Public Message Example Data: {"type":"message","nick":"messager_nick","ident":"messager_ident","hostname":"::1","target":"#channel","msg":"No worries.","connection_id":0}
            //Action message Example Data: {"is_request":true,"type":"ACTION","target":"#channel","params":"tests an action"}
            if (eventData.type === 'message' || eventData.type === 'action') {
                this._listener.invokeListeners('message', {
                    nicknameKey: this.generateNicknameKey(eventData.nick),
                    identity: this.normalizeNickname(eventData.nick),
                    nickname: eventData.nick,
                    target: isChannel ? this.generateChannelKey(eventData.target) : this.generateNicknameKey(eventData.target),
                    message: eventData.msg,
                    type: eventData.type
                });
            }
        }
        /**
         * This event is triggered when a topic event is triggered by the server.
         * @method vga.irc.connector.kiwi.connector.onTopic
         * @param {object} eventData event data associated with a topic event.
         */
        onTopic(eventData) {
            let channelKey = this.generateChannelKey(eventData.channel);
            vga.util.debuglog.info(`[vga.irc.connector.kiwi.connector.onTopic]: (Topic: ${eventData.topic}, Channel: ${channelKey}).`);
            //Example Data: {"channel":"#channel","topic":"Welcome to Chat!","connection_id":0}
            this._listener.invokeListeners('topic', {
                topic: eventData.topic,
                channelKey: channelKey
            });
        }
        /**
         * This event is triggered for everyone, the authenticated user and everyone in and out of the channel.
         * @method vga.irc.connector.kiwi.connector.onChannel
         * @param {object} eventData event data associated with channel join event.
         */
        onChannel(eventData) {
            let channelKey = this.generateChannelKey(eventData.channel);
            vga.util.debuglog.info(`[vga.irc.connector.kiwi.connector.onChannel]: (Channel: ${channelKey}, Identity: ${eventData.ident}, Type: ${eventData.type}).`);

            //Join Example Data: {"type":"join","channel":"#channel","nick":"joining_user_nick","ident":"joining_user_identity","hostname":"::1","connection_id":0}
            //Leave Example Data: {"type":"part","channel":"#channel","nick":"joining_user_nick","ident":"joining_user_identity","hostname":"::1","connection_id":0}

            //The nickname will vary based on the action.
            //A kick type action will only hold the nickname of the kickee in the kicked property, with the kicker in the nick property.
            //All other actions appear to keep the target's name in the nick.
            let nickname = (eventData.type !== 'kick') ? eventData.nick : eventData.kicked;

            //Determine if we have joined the auto channel.
            this._autoJoinChannelComplete = (eventData.type === 'join' 
                && channelKey === this._autoJoinChannel
                && this.isMe(nickname));

            //Once we join, ask the channel for it's mode information.
            if (eventData.type === 'join') {
                this._protocol && this._protocol.sendIRCData('raw', {'data': `MODE ${this._autoJoinChannel}`});
            }

            //Determine if it is the current user joining or another user.
            //We cannot use the identity since IRC works off nicknames and every nickname can be an independent session for a single ident.
            //So we need to send event notifications on nicknames not the identity; however, we will create a psuedo-identity based on a normalized nickname.
            let eventName = '';
            if (!this.isMe(nickname)) {
                eventName = 'otheruser';
            }

            this._listener.invokeListeners(`${eventName}${eventData.type}`,{
                channelKey: channelKey,
                nicknameKey: this.generateNicknameKey(nickname),
                identity: this.normalizeNickname(nickname),
                nickname: nickname
            });
        }
        /**
         * This event is triggered when queried channel information arrives.
         * @method vga.irc.connector.kiwi.connector.onChannelInfo
         * @param {object} eventData event data associated the channel information event.
         */
        onChannelInfo(eventData) {
            vga.util.debuglog.info(`[vga.irc.connector.kiwi.connector.onChannelInfo]: (Channel: ${eventData.channel}).`);

            //There maybe multiple channel info events, but we only care about the one that contains channel modes one at this time.
            //If there are no modes then discard this event.
            //Example Data: {"channel":"#channel","modes":[{"mode":"+P","param":null},{"mode":"+c","param":null}],"connection_id":0}
            //Example Data2: {"channel":"#channel","created_at":1333071102,"connection_id":0}
            if (eventData.modes) {
                //Transform the irc channel modes into chat channel modes.
                let channelModes = vga.irc.channelmodes.none;
                eventData.modes.forEach((channelModeBlock) => {
                    if (channelModeBlock) {
                        //Only transform positive (additive) channel modes, as channel modes that are removed will generate their own event.
                        if (channelModeBlock.mode.substring(0, 1) === '+') {
                            channelModes = vga.irc.addRole(channelModes, channelModeMap[channelModeBlock.mode.substring(1, 2)]);
                        }
                    }
                });

                this._listener.invokeListeners(`channelmode`, {
                    channelKey: this.generateChannelKey(eventData.channel),
                    action: vga.irc.roleModeAction.add,
                    modes: channelModes
                });
            }
        }
        /**
         * This event is triggered for everyone, the authenticated user and everyone in and out of the channel.
         * @method vga.irc.connector.kiwi.connector.onQuit
         * @param {object} eventData event data associated with channel quit event.
         */        
        onQuit(eventData){
            vga.util.debuglog.info(`[vga.irc.connector.kiwi.connector.onQuit]: (Nick: ${eventData.nick}, Identity: ${eventData.ident}, Message: ${eventData.message}).`);
            //Example Data: {"nick":"quitting_user_nick","ident":"quitting_user_ident","hostname":"::1","message":"Connection closed","connection_id":0}
            this._listener.invokeListeners(`quit`,{
                nicknameKey: this.generateNicknameKey(eventData.nick),
                identity: this.normalizeNickname(eventData.nick),
                nickname: eventData.nick
            });
        }
        /**
         * This event is triggered when a mode event has occured.
         * @method vga.irc.connector.kiwi.connector.onMode
         * @param {object} eventData event data associated with mode event sent by the server.
         */
        onMode(eventData) {
            vga.util.debuglog.info('[vga.irc.connector.kiwi.connector.onMode].');

            //Ignore any events that have no mode information.
            if (eventData.modes.length === 0) {
                return;
            }

            //Iterate through each mode per user.
            //The modes object contains a 1-1 mapping of mode and the user the mode is being applied to.
            //Example Data: {"target":"#channelName","nick":"userApplyingMode","modes":[{"mode":"+v","param":"userAffected"}],"connection_id":0}
            eventData.modes.forEach((modePerUser) => {
                let mode = (modePerUser.mode || '').trim();
                if (mode.length === 0) {
                    return;
                }

                //Parse the mode into an action and mode.
                let action = vga.irc.roleModeAction.add;
                if (mode.length > 1) {
                    action = (mode.substring(0, 1) === '-') ? vga.irc.roleModeAction.remove : vga.irc.roleModeAction.add;
                    mode = mode.substring(1, 2);
                }

                //Determine if we are dealing with a channel or user mode.
                let channelKey = this.generateChannelKey(eventData.target);
                let nickname = modePerUser.param;
                if (nickname !== null) {
                    //Normalize the nickname as defined by the normalization option.
                    let normalizedNickname = this.normalizeNickname(nickname);

                    let eventName = this.isMe(normalizedNickname) ? 'otheruser' : 'user';
                    this._listener.invokeListeners(`${eventName}mode`, {
                        channelKey: channelKey,
                        nicknameKey: this.generateNicknameKey(nickname),
                        identity: normalizedNickname,
                        nickname: nickname,
                        action: action,
                        roles: vga.irc.compileModes([mode], (userMode) => modeToRolesMap[userMode])
                    });
                }
                else {
                    this._listener.invokeListeners(`channelmode`, {
                        channelKey: channelKey,
                        action: action,
                        modes: vga.irc.compileModes([mode], (channelMode) => channelModeMap[channelMode])
                    });
                }
            });
        }
        /**
         * This event is triggered when the userlist has been sent by the server.
         * @method vga.irc.connector.kiwi.connector.onUserlist
         * @param {object} eventData event data associated with userlist sent by the server.
         */
        onUserlist(eventData) {
            vga.util.debuglog.info('[vga.irc.connector.kiwi.connector.onUserlist].');
            
            let prefixMap = vga.util.propertyCount(this._prefixMap) > 0 ? this._prefixMap : defaultPrefixMap;
            let userInfoMap = {};

            //Iterate through all users and extract the prefix and store it.
            //Example Data: {"channel":"#channel", "users": [{"nick":"@operator","modes":["o"]},{"nick":"admin","modes":["q"]},{"nick":"scrub","modes":[]},{"nick":"+voiceuser","modes":["v"]}]}
            //let users = eventData.users.map((user) => {
            eventData.users.forEach((user) => {
                let prefixes = [];
                let nameIndex = 0;
                //Iterate through all the first characters and remove the prefix until the first non-prefix character is found.
                //According to the IRC RFC there can be multiple prefixes.
                for(let i = 0; i < user.nick.length; i++) {
                    if (!prefixMap.hasOwnProperty(user.nick[i])) {
                        break;
                    }

                    prefixes.push(prefixMap[user.nick[i]]);
                    nameIndex++;
                }

                //Remove the prefix from the nickname.
                let parsedNickname = user.nick.substring(nameIndex);

                //Normalize the nickname as defined by the normalization option.
                let normalizedNickname = this.normalizeNickname(parsedNickname);
                let nicknameKey = this.generateNicknameKey(parsedNickname);

                //Determine if we stored the user information by nickname earlier.
                let userInfo = userInfoMap[nicknameKey];
                if (!userInfo) {
                    //Create a key...because IRC is case-insensitive, we have to create a key that is consistent.
                    //NOTE: The other option is to iterate through our 'maps', which is not ideal.
                    let roles = vga.irc.compileModes(user.modes, (mode) => modeToRolesMap[mode]);
                    userInfoMap[nicknameKey] = new vga.irc.userEntity(normalizedNickname, [parsedNickname], roles);
                }
                else {
                    //Keep a collection of all of the alternative nicknames for this user.
                    //For example: While the original user is caffe, let's say another session was opened by him then caffe would be assigned the nickname caffe_1.
                    userInfo.addNickname(parsedNickname);
                }
            });

            //NOTE: There is no RPL_USERSSTART event as defined by the IRC Protocol, so we'll just wait for the RPL_ENDOFUSERS event.
            this._userListByChannel[this.generateChannelKey(eventData.channel)] = userInfoMap;
        }
        /**
         * This event is triggered when the userlist_end has been sent by the server.
         * @method vga.irc.connector.kiwi.connector.onUserlistEnd
         * @param {object} eventData event data associated with userlist_end sent by the server.
         */
        onUserlistEnd(eventData) {
            let channelKey = this.generateChannelKey(eventData.channel);
            vga.util.debuglog.info(`[vga.irc.connector.kiwi.connector.onUserListEnd]: Channel: ${channelKey}`);

            //NOTE: There is no RPL_USERSSTART event as defined by the IRC Protocol, so we'll just wait for the RPL_ENDOFUSERS event.
            if (this._userListByChannel && channelKey && this._userListByChannel.hasOwnProperty(channelKey)) { 
                vga.util.debuglog.info(`[vga.irc.connector.kiwi.connector.onUserListEnd]: (UserList: ${this._userListByChannel[channelKey].users}).`);
                this._listener.invokeListeners('userlist', {
                    users: this._userListByChannel[channelKey],
                    channelKey: channelKey
                });
            }
        }
        /**
         * This event is triggered when an error is generated by the server.
         * @method vga.irc.connector.kiwi.connector.onError
         * @param {object} eventData event data associated with an error event from the server.
         */
        onError(eventData) {
            vga.util.debuglog.info(`[vga.irc.connector.kiwi.connector.onError]: (Error: ${eventData.error}, Reason: ${eventData.reason}).`);

            //Return to complete logic.
            //Break to invoke the unknown error logic.
            switch(eventData.error)
            {
                //Support multiple nicknames per account if it is enabled, otherwise respond with an error.
                case 'nickname_in_use':
                    if (this._supportConcurrentChannelJoins) {
                        this.setNickname(incrementNickname(this._nickname));
                        return;
                    }
                    break;

                //Occurs when someone has been kicked from the channel and tries to commit an action afterwards.
                case 'cannot_send_to_channel':
                    /*
                    this._listener.invokeListeners('kicked', {
                        nicknameKey: this.getMyNicknameKey(),
                        channelKey: this.generateChannelKey(eventData.channel)
                    });
                    */
                    return;

                case 'banned_from_channel':
                    this._listener.invokeListeners('banned', {
                        nicknameKey: this.getMyNicknameKey(),
                        channelKey: this.generateChannelKey(eventData.channel)
                    });
                    return;

                //Ignore this error for now.
                case 'chanop_privs_needed':
                    return;

                case 'channel_is_full':
                    break;

                case 'password_mismatch':
                    this._listener.invokeListeners('accessdenied');
                    return;

                case 'error':
                    if (vga.irc.connector.kiwi.accessDeniedRegEx.test(eventData.reason)) {
                        this._listener.invokeListeners('accessdenied');
                        return;
                    }
                    break;

                default:
                    break;
            }

            //Unknown error.
            this._listener.invokeListeners('error', {reason: eventData.reason});
        }
    }
    //END OF vga.irc.connector.kiwi.connector.prototype = {...
}());