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
    // IRC Method Map
    //-----------------------------------------------------------------
    var methodMap = {
        'connect': 'onConnect',
        'disconnect': 'onDisconnect',
        'message': 'onMessage',
        'userlist': 'onUserlist',
        'topic': 'onTopic',
        'join': 'onJoin',
        'leave': 'onLeave',
        'userMode' : 'onMode',
        'otherUserJoin': 'onOtherUserJoining',
        'otherUserLeave': 'onOtherUserLeaving',
        'otherUserMode': 'onOtherUserMode',
        'channelMode': 'onChannelMode',
        'accessDenied': 'onAccessDenied',
        'error': 'onError',
        'kicked': 'onKicked',
        'kick': 'onKicked',
        'banned': 'onBanned'
    };

    //RegExs for the various IRC errors.
    vga.irc.connector.kiwi.accessDeniedRegEx = /^Closing link: [^\r\n]*\[Access denied\]$/;
    vga.irc.connector.kiwi.pingTimeoutRegEx = /^Closing link: [^\r\n]*\[Ping timeout: \d+ seconds\]$/;
    vga.irc.connector.kiwi.registrationTimeOutRegEx = /^Closing link: [^\r\n]*\[Server shutdown\]$/
    vga.irc.connector.kiwi.serverShutDownRegEx = /^Closing link: [^\r\n]*\[Server shutdown\]$/;

    /**
     * Increments the nickname suffix by one per original vga chat implementation.
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
     * Sanitizes the nickname by removing the incremental suffix.
     * @method incrementNickname
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
     * Constructor for the kiwi connector.
     * @method vga.irc.connector.kiwi.connector
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
            
            //Channel specific information.
            this._userListByChannel = {};

            //User Identity information.
            this._nickname = this._identity = '';

            //Autojoin logic.  If this is set we will try to autojoin a channel.
            this._autoJoinChannel = '';
            this._autoJoinChannelComplete = false;

            //Supports the option of having the same user join the same channel multiple times.
            //This voids the nickname in use error.
            this._supportConcurrentChannelJoins = (options._supportConcurrentChannelJoins !== undefined) ? options._supportConcurrentChannelJoins : true;

            //Determine if the connection was closed by the user or the protocol.
            this._attemptReconnect = (options.attemptReconnect !== undefined) ? options.attemptReconnect : false;
            this._numberOfReconnectAttempts = options.numberOfReconnectAttempts || 3;

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
         * Returns the identity of the user, which may not be the same as the nickname.
         * @method vga.irc.connector.kiwi.connector.getIdentity
         * @return {string} current user's identity.
         */
        getIdentity() {
            return this._identity;
        }
        getNickname() {
            return this._nickname;
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
                    this._autoJoinChannel = authenticationParams.channel || '';
                    this._nickname = this._identity = authenticationParams.nick;
                }
            }           
        }
        /**
         * Attemps to sends a message to the specific target.
         * @method vga.irc.connector.kiwi.connector.send
         * @param {string} message a temporary message to send when closing the socket.
         */
        send(message, target) {
            if (target && message) {
                vga.util.debuglog.info(`[vga.irc.connector.kiwi.connector.send]: Sending to (${target}): ${message}.`);
                this._protocol && this._protocol.sendIRCData('privmsg', {target: target, msg: message });
            }
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
                return;
            }
            vga.util.debuglog.info('[vga.irc.connector.kiwi.connector.join]: Invalid channel.', channel);
        }
        /**
         * Attempts to leave the channel specified.
         * @method vga.irc.connector.kiwi.connector.leave
         * @param {string} channel channel to leave.
         */            
        leave(message, channel) {
            if (channel) {
                vga.util.debuglog.info(`[vga.irc.connector.kiwi.connector.leave]: Attempting to leave channel: ${channel}.`);
                this._protocol && this._protocol.sendIRCData('part', {channel: channel, message: message });
                return;
            }
            vga.util.debuglog.info('[vga.irc.connector.kiwi.connector.leave]: Invalid channel.', channel);
        }
        /**
         * Attempts to change the nickname of the currently authenticated user.
         * @method vga.irc.connector.kiwi.connector.nick
         * @param {string} nickname the nickname to change to.
         */             
        nick(nickname) {
            if (nickname) {
                this._nickname = nickname;
                vga.util.debuglog.info(`[vga.irc.connector.kiwi.connector.nick]: Attempting to change nickname to: ${nickname}.`);
                this._protocol && this._protocol.sendIRCData('nick', {nick: nickname});
            }
        }
        /**
         * Disconnects\closes an open connection.  This method is idempotent and safe as multiple calls have no side-effects.
         * @method vga.irc.connector.kiwi.connector.disconnect
         * @param {string} message a temporary message to send when closing the socket.
         */
        disconnect(message) {
            if (this._protocol) {
                vga.util.debuglog.info(`[vga.irc.connector.kiwi.connector.disconnect]: Attempting to disconnect with message: ${message}.`);
                this._protocol.sendIRCData('quit', {message: message});
                this._protocol.close(message);
            }
        }
        /**
         * Disposes of the connector, cleaning up any additional resources.
         * @method vga.irc.connector.kiwi.connector.dispose
         */     
        dispose() {
            this.disconnect();
            this._protocol = vga.util.safeDispose(this._protocol);
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
            vga.util.debuglog.info('[vga.irc.connector.kiwi.connector.onConnect]', eventData);
            if (this._autoJoinChannel !== '') {
                this.join(this._autoJoinChannel);
            }
            this._listener.invokeListeners('connect');
        }
        /**
         * This event is triggered when a disconnect event is triggered by the server.
         * @method vga.irc.connector.kiwi.connector.onDisconnect
         * @param {object} eventData event data associated with a disconnect event.
         */        
        onDisconnect(eventData) {

            /*
            if(this._attemptReconnect && !this._closedByUser) {
                this.connect();
            }
            */

            vga.util.debuglog.info(`[vga.irc.connector.kiwi.connector.onDisconnected]: Reason: ${eventData.reason}.`);
            this._protocol && this._protocol.close();
            this._listener.invokeListeners('disconnect');
        }        
        /**
         * This event is triggered when a user has successfully joined a channel.
         * This event will be triggered for both the authenticated user and other users in the channel.
         * @method vga.irc.connector.kiwi.connector.onChannel
         * @param {object} eventData event data associated with channel joinn event.
         */        
        onChannel(eventData) {
            vga.util.debuglog.info('[vga.irc.connector.kiwi.connector.onChannel]', eventData);

            //Determine if we have joined the auto channel.
            this._autoJoinChannelComplete = (eventData.type === 'join' 
                && eventData.channel === this._autoJoinChannel
                && eventData.ident === this.getIdentity());

            //The nickname will vary based on the action.
            //A kick type action will only hold the nickname of the kickee in the kicked property, with the kicker in the nick property.
            //All other actions appear to keep the target's name in the nick. 
            let nickname = (eventData.type !== 'kick') ? eventData.nick : eventData.kicked;

            //Determine if it is the current user joining or another user.
            let eventName = '';
            //if (this.getIdentity() !== eventData.indent) {
            if (this.getNickname() !== nickname) {
                eventName = 'otherUser';
            }

            this._listener.invokeListeners(`${eventName}${eventData.type}`,{
                identity: eventData.ident,
                nickname: nickname,
                channel: eventData.channel
            });
        }
        /**
         * This event is triggered when a mode event has occured.
         * @method vga.irc.connector.kiwi.connector.onMode
         * @param {object} eventData event data associated with mode event sent by the server.
         */            
        onMode(eventData) {
            vga.util.debuglog.info('[vga.irc.connector.kiwi.connector.onMode] ', eventData);

            //Determine if it is the current user joining or another user.
            let eventName = '';
            if (this.getIdentity() !== eventData.indent) {
                eventName = 'otherUser';
            }

            //NOTE:
            //4{"method":"irc","params":[{"command":"mode","data":{"target":"#ffstv","nick":"ChanServ","modes":[{"mode":"+v","param":"cafftest_1"}],"connection_id":0}},null]}
            //4{"method":"irc","params":[{"command":"mode","data":{"target":"#ffstv","nick":"ChanServ","modes":[{"mode":"+v","param":"caffeinatedrat"}],"connection_id":0}},null]}

            this._listener.invokeListeners(`${eventName}Mode`, {
                modes: eventData.modes,
                channel: eventData.target
            });
        }        
        /**
         * This event is triggered when an error is generated by the server.
         * @method vga.irc.connector.kiwi.connector.onError
         * @param {object} eventData event data associated with an error event from the server.
         */
        onError(eventData) {
            vga.util.debuglog.info(`[vga.irc.connector.kiwi.connector.onError]: Error: ${eventData.error}, Reason: ${eventData.reason}.`);

            //Return to complete logic.
            //Break to invoke the unknown error logic.
            switch(eventData.error)
            {
                //Support multiple nicknames per account if it is enabled, otherwise respond with an error.
                case 'nickname_in_use':
                    if (this._supportConcurrentChannelJoins) {
                        this.nick(incrementNickname(this._nickname));                       
                        return;
                    }
                    break;

                //Occurs when someone has been kicked from the channel and tries to commit an action afterwards.
                case 'cannot_send_to_channel':
                    this._listener.invokeListeners('kicked', {
                        identity: this.getIdentity(),
                        nickname: this.getNickname(),
                        channel: eventData.channel
                    });
                    return;

                case 'banned_from_channel':
                    this._listener.invokeListeners('banned', {
                        identity: this.getIdentity(),
                        nickname: this.getNickname(),
                        channel: eventData.channel
                    });
                    return;

                case 'channel_is_full':
                    break;

                case 'error':
                    if (vga.irc.connector.kiwi.accessDeniedRegEx.test(eventData.reason)) {
                        this._listener.invokeListeners('accessDenied');
                        return;
                    }
                    break;

                default:
                    break;
            }

            //Unknown error.
            this._listener.invokeListeners('error', {reason: eventData.reason});
        }
        /**
         * This event is triggered when a message is generated by the server.
         * @method vga.irc.connector.kiwi.connector.onMessage
         * @param {object} eventData event data associated with a message from the server.
         */        
        onMessage(eventData) {
            vga.util.debuglog.info('[vga.irc.connector.kiwi.connector.onMessage]', eventData);
            if (eventData.type === 'message' || eventData.type === 'action') {
                this._listener.invokeListeners('message', {
                    nick: eventData.nick,
                    ident: eventData.ident,
                    target: eventData.target,
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
            vga.util.debuglog.info('[vga.irc.connector.kiwi.connector.onTopic]', eventData);
            this._listener.invokeListeners('topic', {
                topic: eventData.topic,
                channel: eventData.channel
            });
        } 
        /**
         * This event is triggered when the userlist has been sent by the server.
         * @method vga.irc.connector.kiwi.connector.onUserlist
         * @param {object} eventData event data associated with userlist sent by the server.
         */     
        onUserlist(eventData) {
            vga.util.debuglog.info('[vga.irc.connector.kiwi.connector.onUserlist] ', eventData);
            
            //TODO: Dynamically discover based on the options block the server sends.
            //TODO: Have a backup static list if the server does not provide a list of prefix & modes.
            //TODO: Adjust these to match a global set of modes.
            let defaultPrefixMap = {'~': 'q', '&': 'a', '@': 'o', '%': 'h', '+': 'v'  }

            //Iterate through all users and extract the prefix and store it.
            eventData.users = eventData.users.map((user) => {
                let prefixes = [];
                let nameIndex = 0;
                //Iterate through all the first characters and remove the prefix until the first non-prefix character is found.
                //According to the IRC RFC there can be multiple prefixes.
                for(let i = 0; i < user.nick.length; i++) {
                    if (!defaultPrefixMap.hasOwnProperty(user.nick[i])) {
                        break;
                    }

                    prefixes.push(defaultPrefixMap[user.nick[i]]);
                    nameIndex++;                    
                }

                //Preparse the nickname.
                return {
                    modes: user.modes,
                    prefixes: prefixes,
                    nick: user.nick.substring(nameIndex)
                };
            });           

            //NOTE: There is no RPL_USERSSTART event as defined by the IRC Protocol, so we'll just wait for the RPL_ENDOFUSERS event.
            this._userListByChannel[eventData.channel] = eventData;
        }
        onUserlistEnd(eventData) {
            vga.util.debuglog.info('[vga.irc.connector.kiwi.connector.onUserListEnd] ', eventData);
                       
            //NOTE: There is no RPL_USERSSTART event as defined by the IRC Protocol, so we'll just wait for the RPL_ENDOFUSERS event.
            if (this._userListByChannel && eventData.channel && this._userListByChannel.hasOwnProperty(eventData.channel)) { 
                this._listener.invokeListeners('userlist', {
                    users: this._userListByChannel[eventData.channel].users,
                    channel: this._userListByChannel[eventData.channel].channel
                });
            }
        }
    }
    //END OF vga.irc.connector.kiwi.connector.prototype = {...
}());
