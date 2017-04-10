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
    // Event: onConnect({channelKey: string}})
    // Event: onDisconnect({closedByServer: bool})
    // Event: onReconnect()
    // Event: onTopic ({ topic: string, channelKey: string })
    // Event: onMessage ({ nicknameKey: string, identity: string, nickname: string, target: string, message: string, type: string })
    // Event: onUserlist ({ channelKey: string, users: { roles: bitarray, prefixes: [ {prefix: string} ], nicknames: [string] })
    // Event: onJoin ({ channelKey: string, nicknameKey: string, identity: string, nickname: string })
    // Event: onLeave ({ channelKey: string, nicknameKey: string, identity: string, nickname: string })
    // Event: onOtherUserJoin ({ channelKey: string, nicknameKey: string, identity: string, nickname: string })
    // Event: onOtherUserLeave ({ channelKey: string, nicknameKey: string, identity: string, nickname: string })
    // Event: onQuit ({ nicknameKey: string, identity: string, nickname: string })
    // Event: onChannelMode ({ channelKey: string, modes: bitarray, action: vga.irc.roleAction })
    // Event: onRole ({ channelKey: string, nicknameKey: string, identity: string, nickname: string, action: vga.irc.roleAction, roles: bitarray })
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

    /**
     * Determines if the roles provided have mod capabilities, which is any role above mod.
     * @method hasModRoles
     * @param {*} roles 
     * @return {bool} true if the roles contain mod capabilities.
     */
    function hasModCapabilities(roles) {
        return vga.irc.getMostSignificantRole(roles) >= vga.irc.roles.mod;
    }

    //-----------------------------------------------------------------
    // jQuery presentation logic.
    //-----------------------------------------------------------------
    var $channelContainer = $('#channel-container');
    var $channel = $('#channel');
    var $nickname = $('#nickname');
    var $password = $('#password');

    //-----------------------------------------------------------------
    // Helper functions
    //-----------------------------------------------------------------

    /**
     * Creates a channel tab and returns a reference to it.
     * This function is idempotent and will have no side effects if called multiple times.
     * @method getRoleName
     * @param {string} channelName the name of the channel tab to create.
     * @return {string} the CSS class assigned to the most significant role.
     */
    function createChannelTab(channelName) {
        //Create a tab if one does not already exist.
        let $channelTab = $channelContainer.find(`#channel-tab-${channelName.replace('#', '')}`);
        if ($channelTab.length === 0) {
            let $template = $channelContainer.find('#channel-tab-template');
            $channelTab = $template.clone();
            $channelTab.attr('id', `channel-tab-${channelName.replace('#', '')}`).removeClass('hidden').data('channel', channelName);
            $template.addClass('hidden');
            $channelContainer.append($channelTab);
        }

        return $channelTab;
    }

    function getChannelTab(channelName) {
        return $channelContainer.find(`#channel-tab-${channelName.replace('#', '')}`);
    }

    function getChannelWindow(channelName) {
        return getChannelTab(channelName).find('.channel-window');
    }

    function updateIcon(roles) {
        let roleName = getRoleName(roles);
        return `<div class="icon role ${roleName}" title="${roleName}"></div>`;
    };

    //Chat history functions
    function writeInformationalMessage(channelName, message) {
        let $channelWindow = getChannelWindow(channelName);
        $channelWindow.append(`<div class="informative"><span class="message">${vga.util.encodeHTML(message)}</span></div>`);
    };

    function updateDisplay(channelName, user) {
        let $channelWindow = getChannelWindow(channelName);
        $channelWindow.find(`.user-entry[data-nickname=${user.identity}] > .role`).replaceWith(updateIcon(user.roles));
    };

    //Userlist functions
    function buildUserListEntry(user) {
        let nicknames = '';
        user.nicknames.forEach((nickname) => {
            nicknames += `${(nicknames.length > 0 ? ',' : '')}${nickname}`;
        });

        return (`<div id="user-list-${user.identity}" class='user-entry'>`
            + updateIcon(user.roles)
            + `<div class="username" title="Nicknames: ${nicknames}">${user.identity}</div>`
            + '</div>');
    }

    function updateUserInList(channelName, user) {
        let $userList = getChannelTab(channelName).find('.user-list-wrapper .user-list');
        let $userEntry = $userList.find(`#user-list-${user.identity}`);
        if (user.nicknames.length > 0) {
            if ($userEntry.length === 0) {
                $userList.append(buildUserListEntry(user));
            }
            else {
                $userEntry.replaceWith(buildUserListEntry(user)); 
            }
        }
        else {
            $userEntry.remove();
        }
    };

    function writeUserList(channelName, users) {
        let $userList = getChannelTab(channelName).find('.user-list-wrapper .user-list');
        $userList.html('');
        //Write a collection of users to the list if there is one.
        if (users) {
            vga.util.forEach(users, (username, user)=>{
                $userList.append(buildUserListEntry(user));
            });
            return;
        }
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

    function pulseChannelTab(channelName, enable) {
        let $channelWindow = getChannelWindow(channelName);
        $channelWindow.toggleClass('pulse', enable);
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

        //-----------------------------------------------------------------
        // Presentation methods
        // These are presentation methods.
        //-----------------------------------------------------------------
        writeToChannelWindow(channelName, user, message, type) {
            let optionBody = '';
            let channel = this._userChannels[channelName];
            if (channel) {
                let me = channel[this.connector.getMyNicknameKey()];
                if (me && hasModCapabilities(me.roles)) {
                    optionBody = '<span class="timeout"><i class="fa fa-clock-o" role="button" title="Timeout Chatter!"></i></span>'
                }
            }

            //Encode all HTML characters.
            message = vga.util.encodeHTML(message);

            let userName = (user !== undefined) ? user.identity : 'undefined';
            let messageBody = '';
            if (type === 'action') {
                messageBody = `<div class="username action">${userName}</div><div class="message action">${message}</div>`;
            }
            else {
                messageBody = `<div class="username">${userName}</div>:&nbsp<div class="message">${message}</div>`;
            }

            let userRoles = (user !== undefined) ? user.roles : vga.irc.roles.shadow; 
            let $channelWindow = getChannelWindow(channelName);
            $channelWindow.append(`<div class="user-entry" data-nickname="${userName}">${updateIcon(userRoles)}${optionBody}${messageBody}</div>`);
        }

        //-----------------------------------------------------------------
        // Chat events
        // These are IRC chat events.
        //-----------------------------------------------------------------

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
         * Attempts to join a channel.
         * @method vga.irc.chat.join
         */
        join(channel) {
            this.connector && this.connector.join(channel);
            return this;
        }
        /**
         * Attempts to leave a channel.
         * @method vga.irc.chat.leave
         * @param {string} message the message to send to the server when leaving a channel.
         */   
        leave(channel, message) {
            this.connector && this.connector.leave(channel, message);
            return this;
        }
        /**
         * Attempts to send a message.
         * @method vga.irc.chat.send
         * @param {string} channelName to send the message to.
         * @param {string} message the message to send to the chat with the specific channel.
         */      
        send(channelName, message) {
            if (channelName) {
                if (message.startsWith("/QUIT")) {
                    this.close(message.substring(6));
                }
                else if (message.startsWith("/JOIN")) {
                    this.join(message.substring(6));
                }
                else if (message.startsWith("/LEAVE")) {
                    this.leave(channelName, message.substring(7));
                }
                else {
                    this.connector && this.connector.send(message, channelName);
                    let channel = this._userChannels[channelName];
                    if (channel) {
                        let user = channel[this.connector.getMyNicknameKey()];
                        this.writeToChannelWindow(channelName, user, message);
                    }
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
         * @param {object} eventData information.
         */
        onConnect(eventData) {
            toggleLoginWindow(false);
            setStatus();
            createChannelTab(eventData.channelKey);
            pulseChannelTab(eventData.channelKey, false);
        }
        /**
         * An event that is triggered when a disonnect event happens.
         * @method vga.irc.chat.onDisconnect
         * @param {object} eventData information.
         */
        onDisconnect(eventData) {
            let channelName = $channel.val() || '';
            pulseChannelTab(channelName, false);
            toggleLoginWindow(true);
            if (eventData.closedByServer)
            {
                setStatus('Unable to reach the server.  Try again later.', 5000);
            }
        }
        ///TODO: Temporary Reconnect logic, merge with the connect logic currently in the index.php.
        /**
         * An event that is triggered when a topic event occurs.
         * @method vga.irc.chat.onReconnect
         */
        onReconnect() {
            let nickname = $nickname.val() || '';
            let password = $password.val() || '';
            let channelName = $channel.val() || '';
            pulseChannelTab(channelName, true);
            //writeInformationalMessage(channelName, 'The server stopped responding...retrying.')
            setStatus('The server stopped responding...retrying.', 5000);
            this.connect(nickname, password, channelName);
        }
        /**
         * An event that is triggered when a topic event occurs.
         * @method vga.irc.chat.onTopic
         * @param {object} eventData information.
         */
        onTopic(eventData) {
            writeInformationalMessage(eventData.channelKey, eventData.topic);
        }
        /**
         * 
         * @method vga.irc.chat.onChannelMode
         * @param {object} eventData
         */
        onChannelMode(eventData) {
            let channel = this._userChannels[eventData.channelKey];
            if (channel) {
                let me = channel[this.connector.getMyNicknameKey()];
                let $channelTab = getChannelTab(eventData.channelKey);

                if (eventData.modes == vga.irc.channelmodes.turbo) {
                    if (eventData.action === vga.irc.roleAction.add) {
                        writeInformationalMessage(eventData.channelKey, `The room is now in TURBO only mode.`);
                        $channelTab.find('input.chatbox_input').prop('disabled', vga.irc.getMostSignificantRole(me.roles) === vga.irc.roles.shadow);
                    }
                    else {
                        writeInformationalMessage(eventData.channelKey, `The room is now free for all chatters.`);
                        $channelTab.find('input.chatbox_input').prop('disabled', false);
                    }
                }
            }
        } 
        /**
         * An event that is triggered when receiving a message from the chat server.
         * @method vga.irc.chat.onMessage
         * @param {string} eventData broadcasted to the channel.
         */
        onMessage(eventData) {
            if (!this._wallRegEx.test(eventData.message) || !this._theaterMode) {
                let channel = this._userChannels[eventData.target];
                let user, me;
                if (channel) {
                    user = channel[eventData.nicknameKey];
                    me = channel[this.connector.getMyNicknameKey()];
                }
                this.writeToChannelWindow(eventData.target, user, eventData.message, eventData.type);
            }
        }
        /**
         * An event that is triggered when a user list is provided.
         * @method vga.irc.chat.onUserlist
         * @param {object} eventData An object that contains the channel and the users associated with that channel.
         */ 
        onUserlist(eventData) {
            this._userChannels[eventData.channelKey] = eventData.users;
            writeUserList(eventData.channelKey, eventData.users);
        }
        /**
         * An event that is triggered when the authenticated user has joined a channel.
         * @method vga.irc.chat.onJoin
         * @param {object} eventData
         */
        onJoin(eventData) {
            writeInformationalMessage(eventData.channelKey, `Joined ${eventData.channelKey} channel`);
        }
        /**
         * An event that is triggered when another user has joined the channel.
         * @method vga.irc.chat.onOtherUserJoin
         * @param {object} eventData
         */
        onOtherUserJoin(eventData) {
            let channel = this._userChannels[eventData.channelKey];
            if (channel) {
                //Retrieve the user entity if he or she already exists in the userlist.
                let user = channel[eventData.nicknameKey];
                let me = channel[this.connector.getMyNicknameKey()];
                //If the user is new then add him or her to the userlist and channel information block.
                if (!user) {
                    user = new vga.irc.userEntity(eventData.identity, eventData.nickname);
                    channel[eventData.nicknameKey] = user;
                    if (!this._theaterMode) {
                        this.writeToChannelWindow(eventData.channelKey, user, `has joined.`, 'action');
                    }
                }

                //Add any new nicknames to the user entity and update the userlist.
                user.addNickname(eventData.nickname);
                updateUserInList(eventData.channelKey, user);
            }
        }
       /**
         * An event that is triggered when another user has left the channel.
         * @method vga.irc.chat.onOtherUserLeave
         * @param {object} eventData
         */
        onOtherUserLeave(eventData) {
            let channel = this._userChannels[eventData.channelKey];
            if (channel) {
                //If the user exists then remove this nickname from the user entity, otherwise ignore the event.
                let user = channel[eventData.nicknameKey];
                let me = channel[this.connector.getMyNicknameKey()];
                if (user) {
                    user.removeNickname(eventData.nickname);
                    //If we have exhasted the number of nicknames then we need to remove the user entity from the channel information block.
                    if (user.nicknames.length === 0) {
                        channel[eventData.nicknameKey] = undefined;
                        if (!this._theaterMode) {
                            this.writeToChannelWindow(eventData.channelKey, user, `has left.`, 'action');
                        }
                    }

                    updateUserInList(eventData.channelKey, user);
                }
            }
        }
        /**
         * An event that is triggered when the authenticated user has joined a channel.
         * @method vga.irc.chat.onJoin
         * @param {object} eventData
         */        
        onQuit(eventData) {
            //Reuse the leave logic but apply it to all channels.
            vga.util.forEach(this._userChannels, (channelKey, users) => {
                this.onOtherUserLeave({
                    channelKey: channelKey,
                    nicknameKey: eventData.nicknameKey,
                    nickname: eventData.nickname
                })
            });
        }
        /**
         * An event that is triggered on a role assignment either with the authenticated user or another user in chat.
         * @method vga.irc.chat.onRole
         * @param {object} eventData contains the role information for the specific channel per user.
         */          
        onRole (eventData) {
            let channel = this._userChannels[eventData.channelKey];
            if (channel) {
                let user = channel[eventData.nicknameKey];
                if (user) {
                    user.applyRoles(eventData.action, eventData.roles);
                    updateUserInList(eventData.channelKey, user);
                    updateDisplay(eventData.channelKey, user);
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
         * @param {object} eventData additional kick information.
         */
        onKicked(eventData) {
            //TODO: Close channel window.
            //For now, disconnect the user if he or she is kicked from the channel.
            this.close();
            setStatus('You have been kicked.');
        }
        /**
         * An event that is triggered when the user is banned from the channel.
         * @method vga.irc.chat.onBanned
         * @param {object} eventData additional banned information.
         */
        onBanned(eventData) {
            //TODO: Close channel window.
            //For now, disconnect the user if he or she is kicked from the channel.
            //this.close();
            setStatus('You have been banned.');
        }
        /**
         * An event that is triggered when the user is banned from the channel.
         * @method vga.irc.chat.onError
         * @param {object} eventData additional error information.
         */
        onError(eventData) {
            //TODO: Close channel window.
            //For now, disconnect the user if he or she is kicked from the channel.
            this.close();
            setStatus('Sorry, an unknown error has occured.');
            vga.util.debuglog.error(eventData.reason);
        }
    }

}());