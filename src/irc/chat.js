"use strict";

/*
* @license
* Copyright (c) 2016-2017, FarFromSubtle IT
* All rights reserved.
* Author: Ken Anderson <caffeinatedrat at gmail dot com>
* NOTE: Chat.js logic is based on the original logic implemented by Kshade.
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

///////////////////////////////////////////////////////////
// The main VGA chat application.
///////////////////////////////////////////////////////////
$(function(){

    //-----------------------------------------------------------------
    // Expected structures note.
    //-----------------------------------------------------------------
    // Since JS is a dynamic language, we cannot force structures to conform to a specific format.
    // We can document what type of structure needs to be provided to the chat by a connector.
    // Event: onConnect()
    // Event: onDisconnect({closedByServer: bool})
    // Event: onOtherUserJoining ({ identity: string, nickname: string, channelKey: string })
    // Event: onOtherUserLeaving ({ identity: string, nickname: string, channelKey: string })
    // Event: onJoin ({ identity: string, nickname: string, channelKey: string })
    // Event: onLeave ({ identity: string, nickname: string, channelKey: string })
    // Event: onTopic ({ topic: string, channelKey: string })
    // Event: onMessage ({ nicknameKey: string, nickname: string, identity: string, target: string, message: string, type: string })
    // Event: onUserlist ({ channelKey: string, users: { roles: bitarray, prefixes: [ {prefix: string} ], nicknames: [string] })
    // Event: onRole ({ channelKey: string, userNameKey: string, userName: string, action: vga.irc.roleAction, roles: bitarray })
    // Event: onChannelMode ({ channelKey: string, modes: bitarray, action: vga.irc.roleAction })
    // Event: onAccessDenied()
    // Event: onKicked ({ identity: string, nicknameKey: string, channelKey: string })
    // Event: onBanned ({ identity: string, nicknameKey: string, channelKey: string })
    // Event: onError ({ reason: string })

    //-----------------------------------------------------------------
    // Intenral helper methods.
    //-----------------------------------------------------------------

    /**
     * Returns a role name based on the most significant role of the user.
     * @method getRoleName
     * @param {number} roles a bitarray of roles assigned to the user.
     * @return {string} the CSS class assigned to the most significant role.
     */
    function getRoleName(roles) {
        switch(vga.irc.getMostSignificantRole(roles))
        {
            case vga.irc.roles.owner:
            case vga.irc.roles.admin:
                return 'crew';
           
            case vga.irc.roles.mod:
                return 'mod';

            case vga.irc.roles.guest:
                return 'guest';

            case vga.irc.roles.turbo:
                return 'turbo';
            
            default:
                return 'shadow';
        }
    };

    //-----------------------------------------------------------------
    // jQuery presentation logic.
    //-----------------------------------------------------------------
    var $chatHistory = $('#channel-ffstv');
    //var $userList = $('#user-list');
    var $channel = $('#channel');
    var $nickname = $('#nickname');
    var $password = $('#password');

    function updateIcon(roles) {
        let roleName = getRoleName(roles);
        return `<div class="icon role ${roleName}" title="${roleName}"></div>`;
    };

    function writeInformationalMessage(channel, message) {
        $chatHistory.append(`<div class="informative"><span class="message">${vga.util.encodeHTML(message)}</span></div>`);
    };

    function writeToChannel(channel, message, user, type) {
        //Encode all HTML characters.
        message = vga.util.encodeHTML(message);

        let name = user.nickname;
        let messageBody = '';
        if (type === 'action') {
            messageBody = `<div class="username action">${name}</div><div class="message action">${message}</div>`;
        }
        else {
            messageBody = `<div class="username">${name}</div>:&nbsp<div class="message">${message}</div>`;
        }

        $chatHistory.append(`<div class="user-entry" data-nickname="${name}">${updateIcon(user.roles)}${messageBody}</div>`);
    };

    function updateDisplay(user) {
        $chatHistory.find(`.user-entry[data-nickname=${user.nickname}] > .role`).replaceWith(updateIcon(user.roles));
    };

    function writeUser($userList, user) {

        let nicknames = '';
        user.nicknames.forEach((nickname) => {
            nicknames += `${(nicknames.length > 0 ? ',' : '')}${nickname}`;
        });

        $userList.append(`<div id="user-list-${user.nickname}" class='user-entry'>`
            + updateIcon(user.roles)
            + `<div class="username" title="Nicknames: ${nicknames}">${user.nickname}</div>`
            + '</div>');
    };

    function writeUserList(channelName, users) {
        let $userList = $(`#channel-container-${channelName.replace('#', '')} .user-list-wrapper .user-list`);
        //Write a collection of users to the list if there is one.
        if (users) {
            vga.util.forEach(users, (username, user)=>{
                writeUser($userList, user);
            });
            return;
        }

        //Otherwise clear the list.
        $userList.html('');
    };

    function updateUserInList(channelName, user) {
        let $userList = $(`#channel-container-${channelName.replace('#', '')} .user-list-wrapper .user-list`);
        $userList.find(`#user-list-${user.nickname} > .role`).replaceWith(updateIcon(user.roles));
    };

    function setStatus(message, timeout) {
        let $slideMessage = $('#slide_message');
        $slideMessage.text(message || '').toggleClass('hidden', !message)
        
        if (timeout) {
            setTimeout(() => {
                $slideMessage.fadeOut( "slow", () => {
                    $slideMessage.toggleClass('hidden', true).css('display', '');
                });
            }, timeout);
        }
    }

    function toggleLoginWindow(show) {
        $('#login-wrapper').toggleClass('hidden', !show);
    }

    function pulseChannelWindow(channel, enable) {
        $chatHistory.toggleClass('pulse', enable);
    };

    //-----------------------------------------------------------------
    // Main chat class.
    //-----------------------------------------------------------------

    /**
     * Main chat logic.
     * @method vga.irc.chat
     * @param {object} options Additional options for chat.
     */
    vga.irc.chat = class {
        constructor (options) {
            options = options || {};

            if (!options.url) {
                throw new vga.util.exception('irc.chat', 'The url cannot be empty.');
            }

            if (!options.hostname) {
                throw new vga.util.exception('irc.chat', 'The hostname must be set.');
            }

            if (!options.port) {
                throw new vga.util.exception('irc.chat', 'The port must be set.');
            }

            //-----------------------------------------------------------------
            // Versioning
            //-----------------------------------------------------------------
            vga.irc.chat.CLIENT_VERSION = new vga.util.version(0, 1, 0);

            //Chat settings.
            this._theaterMode = options.theaterMode;
            this._hostname = options.hostname;
            this._port = options.port;
            this._ssl = (options.ssl === undefined ? false : options.ssl);
            this._debug = (options.debug == undefined ? false : options.debug);
            this._defaultChannel = options.defaultChannel || '#ffstv';
            this._wallRegEx = options.wallRegEx || /^%! [^\r\n]*/;
            this._theaterMode = (options.theaterMode !== undefined ? options.theaterMode : false);

            //User's channel information.
            this._userChannels = {};

            //The connector.  This guy has abstracted all the IRC & Kiwi IRC logic away.
            //If we switch to another IRC type, a new connector can be written to handle this without rewriting all of chat.
            this.connector = new vga.irc.connector.kiwi.connector(options.url, {
                supportConcurrentChannelJoins: options.supportConcurrentChannelJoins,
                autoJoinChannel: options.autoJoinChannel,
                attemptReconnect: true, //options.attemptReconnect,
                normalizeNicknames: true, //Normalized nicknames into one.
                listeners: [this]
            });
        }
        /**
         * Attempts to connect a user to the chat server.
         * @method vga.irc.chat.connect
         * @param {string} nickname the user's nickname to authenticate with.
         * @param {string} password the user's password to authenticate with.
         * @param {string} channel the channel the user is attempting to autojoin.
         */
        connect(nickname, password, channel) {
            //setStatus();
            this.connector.connect({ 
                nick: nickname,
                hostname: this._hostname,
                port: this._port,
                ssl: this._ssl,
                password: password,
                channel: channel || this._defaultChannel
            });
            return this;
        }
        /**
         * Attempts to close the connection.
         * @method vga.irc.chat.close
         * @param {string} message the message to send to the server when closing (disconnecting) the chat.
         */
        close(message) {
            this.connector && this.connector.disconnect(message);
            return this;
        }
        /**
         * Attempts to leave a channel.
         * @method vga.irc.chat.leave
         * @param {string} message the message to send to the server when leaving a channel.
         */   
        leave(message) {
            this.connector && this.connector.leave(message, $channel.val());
            return this;
        }
        /**
         * Attempts to join a channel.
         * @method vga.irc.chat.join
         */
        join(channel) {
            channel = channel || $channel.val();
            this.connector && this.connector.join(channel);
            return this;
        }
        /**
         * Attempts to send a message.
         * @method vga.irc.chat.send
         * @param {string} message the message to send to the chat with the specific channel.
         */      
        send(message) {
            let channelName = $channel.val().toLowerCase();
            
            if (message.startsWith("/QUIT")) {
                this.close(message.substring(6));
            }
            else if (message.startsWith("/JOIN")) {
                this.join(message.substring(6));
            }
            else {
                this.connector && this.connector.send(message, channelName);
                let channel = this._userChannels[channelName];
                if (channel) {
                    let user = channel[this.connector.getNicknameKey()];
                    writeToChannel(channel, message, user);
                }
            }

            return this;
        }

        //-----------------------------------------------------------------
        // Chat events
        // These are IRC chat events.
        //-----------------------------------------------------------------
        /**
         * An event that is triggered on a successful connection to the chat server.
         * @method vga.irc.chat.onConnect
         */
        onConnect() {
            let channelName = $channel.val() || '';
            toggleLoginWindow(false);
            setStatus();
            pulseChannelWindow(channelName, false);
        }
        onDisconnect(eventData) {
            let channelName = $channel.val() || '';
            writeUserList(channelName);
            toggleLoginWindow(true);
            pulseChannelWindow(channelName, false);
            if (eventData.closedByServer)
            {
                setStatus('Unable to reach the server.  Try again later.', 5000);
            }
        }
        ///TODO: Temporary Reconnect logic, merge with the connect logic currently in the index.php.
        onReconnect() {
            let nickname = $nickname.val() || '';
            let password = $password.val() || '';
            let channelName = $channel.val() || '';
            pulseChannelWindow(channelName, true);
            setStatus('The server stopped responding...retrying.', 5000);
            this.connect(nickname, password, channelName);
        }
        /**
         * An event that is triggered when a topic event occurs.
         * @method vga.irc.chat.onTopic
         * @param {string} topic information.
         */
        onTopic(topic) {
            writeInformationalMessage(topic.channelKey, topic.topic);
        }
        /**
         * An event that is triggered when receiving a message from the chat server.
         * @method vga.irc.chat.onMessage
         * @param {string} message broadcasted to the channel.
         */
        onMessage(message) {
            if (!this._wallRegEx.test(message.message) || !this._theaterMode) {
                let channel = this._userChannels[message.target];
                let user;
                if (channel) {
                    user = channel[message.nicknameKey];
                }
                writeToChannel(message.target, message.message, user, message.type);
            }
        }
        /**
         * An event that is triggered when a user list is provided.
         * @method vga.irc.chat.onUserlist
         * @param {object} userListByChannel An object that contains the channel and the users associated with that channel.
         */ 
        onUserlist (userListByChannel) {
            this._userChannels[userListByChannel.channelKey] = userListByChannel.users;
            writeUserList(userListByChannel.channelKey, userListByChannel.users);
        }
        /**
         * An event that is triggered when the authenticated user has joined a channel.
         * @method vga.irc.chat.onJoin
         * @param {object} joinEventByChannel
         */
        onJoin(joinEventByChannel) {
            //TODO: Channel management.
            writeInformationalMessage(joinEventByChannel.channelKey, `Joined ${joinEventByChannel.channelKey} channel`);
        }
        /**
         * An event that is triggered when another user has joined the channel.
         * @method vga.irc.chat.onOtherUserJoin
         * @param {object} joinEventByChannel
         */
        onOtherUserJoin(joinEventByChannel) {

        }
        /**
         * 
         * @method vga.irc.chat.onChannelMode
         * @param {object} channelMode
         */
        onChannelMode(channelMode) {

        }
        /**
         * An event that is triggered on a role assignment either with the authenticated user or another user in chat.
         * @method vga.irc.chat.onRole
         * @param {object} userRoleByChannel contains the role information for the specific channel per user.
         */          
        onRole (userRoleByChannel) {
            let channel = this._userChannels[userRoleByChannel.channelKey];
            if (channel) {
                let user = channel[userRoleByChannel.userNameKey];
                if (user) {
                    user.roles = (userRoleByChannel.action === vga.irc.roleAction.add) 
                        ? vga.irc.addRole(user.roles, userRoleByChannel.roles) 
                        : vga.irc.removeRole(user.roles, userRoleByChannel.roles);
                    updateUserInList(userRoleByChannel.channelKey, user);
                    updateDisplay(user);
                }
            }
        }
        /**
         * An event that is triggered when the authentication information is incorrect.
         * @method vga.irc.chat.onAccessDenied
         */
        onAccessDenied() {
            setStatus('Invalid login, please try again');
        }
        /**
         * An event that is triggered when the user was kicked from the channel.
         * @method vga.irc.chat.onKicked
         * @param {object} kickedInfo additional kick information.
         */
        onKicked(kickedInfo) {
            //TODO: Close channel window.
            //For now, disconnect the user if he or she is kicked from the channel.
            this.close();
            setStatus('You have been kicked.');
        }
        /**
         * An event that is triggered when the user is banned from the channel.
         * @method vga.irc.chat.onBanned
         * @param {object} bannedInfo additional banned information.
         */
        onBanned(bannedInfo) {
            //TODO: Close channel window.
            //For now, disconnect the user if he or she is kicked from the channel.
            //this.close();
            setStatus('You have been banned.');
        }
        /**
         * An event that is triggered when the user is banned from the channel.
         * @method vga.irc.chat.errorInfo
         * @param {object} errorInfo additional error information.
         */
        onError(errorInfo) {
            //TODO: Close channel window.
            //For now, disconnect the user if he or she is kicked from the channel.
            this.close();
            setStatus('Sorry, an unknown error has occured.');
            vga.util.debuglog.error(errorInfo.reason);
        }
    }

}());