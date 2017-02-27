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
(function(){

    //-----------------------------------------------------------------
    // Expected structures note.
    //-----------------------------------------------------------------
    // Since JS is a dynamic language, we cannot force structures to conform to a specific format.
    // We can document what type of structure needs to be provided to the chat by a connector.
    // Event: onConnect()
    // Event: onDisconnect()
    // Event: onOtherUserJoining ({ identity: string, nickname: string, channel: string })
    // Event: onOtherUserLeaving ({ identity: string, nickname: string, channel: string })
    // Event: onJoin ({ identity: string, nickname: string, channel: string })
    // Event: onLeave ({ identity: string, nickname: string, channel: string })
    // Event: onTopic ({ topic: string, channel: string }): 
    // Event: onMessage ({ identity: string, nickname: string, target: string, message: string, type: string }): 
    // Event: onUserlist ({ channel: string, users: { modes: [ {mode: string} ], prefixes: [ {prefix: string} ], nicknames: [string] }): 
    // Event: onAccessDenied()
    // Event: onKicked ({ identity: string, nickname: string, channel: string })
    // Event: onBanned ({ identity: string, nickname: string, channel: string })
    // Event: onError ({ reason: string })

    //TODO: Consider just ripping this logic out and putting it in the onTopic & onMessage events since they're so distinctly different.
    //TODO: We'll also need the role information and that will be stored in our channel collection in the instance of chat object.
    function writeToDisplay(channel, message, name, type) {
        let $chatHistory = $('#chathistory');
        let messageBody = '';

        //Encode all HTML characters.
        message = vga.util.encodeHTML(message);

        if (type === 'action') {
            messageBody = `<span class="user action" data-nickname="${name}">${name}</span><span class="text action">${message}</span>`;
        }
        else {
            messageBody = `<span class="user" data-nickname="${name}">${name}</span>:&nbsp<span class="text">${message}</span>`;
        }
        
        $chatHistory.append(`<div class="message"><span class="role"></span>${messageBody}</div>`);

        //'<div class="informative"><span class="text">Welcome to Turbo Chat! | FAQ: http://videogamesawesome.com/forums/topic/faq/</span></div>';
    };

    function writeUser(user, $userList) {
        $userList = $userList || $('#user_list');
        let nickname = user.nicknames[0];
        $userList.append(`<div id="user_list_${nickname}">`
            + `<span class="role ${(vga.irc.classes[vga.irc.getMostSignificantRole(user.roles)] || 'regular')}"></span>`
            + `<span class="user">${nickname}</span>`
            + '</div>');
    };

    function updateUserInList(user) {
        $userList = $userList || $('#user_list');
        var $element = $userList.find(`#user_list_${user.name} > span.role`);
        $element.removeClass().addClass(`role ${(vga.irc.classes[vga.irc.getMostSignificantRole(user.roles)] || 'regular')}`);
    };

    function writeUserList(users) {
        let $userList = $('#user_list');
        
        //If no users are supplied then just clear it.
        if (!users) {
            $userList.html('');
            return;
        }

        //Write a collection of users to the list.
        for(let i = 0; i < users.length; i++) {
            writeUser(users[i], $userList);
        }
    };

    function setStatus(message) {
        $('#slide_message').text(message || '').toggleClass('hidden', !message);
    }

    function toggleLoginWindow(show) {
        //$('#chathistory_wrapper').toggleClass('hidden', show);
        $('#login-wrapper').toggleClass('hidden', !show);
    }

    /**
     * Constructor for the chat control.
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
            this.connector = new vga.irc.connector.kiwi.connector(options.url, {listeners: [this]});
        }
        /**
         * Attempts to connect a user to the chat server.
         * @method vga.irc.chat.connect
         * @param {string} nickname the user's nickname to authenticate with.
         * @param {string} password the user's password to authenticate with.
         * @param {string} channel the channel the user is attempting to autojoin.
         */
        connect(nickname, password, channel) {
            setStatus();
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
            let channel = document.getElementById('channel').value;
            this.connector && this.connector.leave(message, channel);
            return this;
        }
        /**
         * Attempts to join a channel.
         * @method vga.irc.chat.join
         */
        join() {
            let channel = document.getElementById('channel').value;
            this.connector && this.connector.join(channel);
            return this;
        }
        /**
         * Attempts to send a message.
         * @method vga.irc.chat.send
         * @param {string} message the message to send to the chat with the specific channel.
         */      
        send(message) {
            let channel = document.getElementById('channel').value;
            
            if (message !== '/QUIT') {
                this.connector && this.connector.send(message, channel);
                writeToDisplay(channel, message, this.connector.getIdentity());
            }
            else {
                this.close(message.substring(6));
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
            toggleLoginWindow(false);
        }
        onDisconnect() {
            toggleLoginWindow(true);
            writeUserList();
        }
        ///TODO: Temporary Reconnect logic, merge with the connect logic currently in the index.php.
        onReconnect() {
            let nickname = $('#nickname').val();
            let password = $('#password').val();
            let channel = $('#channel').val();
            this.connect(nickname, password, channel);
        }
        /**
         * An event that is triggered when receiving a message from the chat server.
         * @method vga.irc.chat.onMessage
         * @param {string} message broadcasted to the channel.
         */
        onMessage(message) {
            if (!this._wallRegEx.test(message.message) || !this._theaterMode) {
                writeToDisplay(message.target, message.message, message.identity, message.type);
            }
        }
        /**
         * An event that is triggered when a topic event occurs.
         * @method vga.irc.chat.onTopic
         * @param {string} topic information.
         */
        onTopic(topic) {
            writeToDisplay(topic.channel, topic.topic);
        }
        /**
         * An event that is triggered when a user list is provided.
         * @method vga.irc.chat.onUserlist
         * @param {object} userListByChannel An object that contains the channel and the users associated with that channel.
         */
        onUserlist (userListByChannel) {
            this._userChannels[userListByChannel.channel] = userListByChannel.users;
            writeUserList(userListByChannel.users);
        }
        onUserMode (userModeByChannel) {
            let channel = this._userChannels[userModeByChannel.channel];
            if (channel) {
                channel[this.connector.getIdentity()].modes = userModeByChannel.modes;
                updateUserInList(this.connector.getIdentity());
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