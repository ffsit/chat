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
    // Notes on chat & the connector to help alleviate confusion.
    //-----------------------------------------------------------------
    // 
    // Connector Identity
    // ----------------------------
    // The identity is provided by the connector.  The identity is what is displayed in the user list and the user messages to visually identify a user.
    //
    // Connector Nickname (s)
    // ----------------------------
    // An indirect identity, a user can have multiple nicknames if he or she has multiple sessions.
    // If a user has more htan one nickname it will be visible on the user list while hovering over his or her name.
    //
    // ChannelKey
    // ----------------------------
    // The channelkey is a connector specific field that uniquely identifies a channel.
    //
    // UserKey
    // ----------------------------
    // The userkey is a connector specific field that uniquely identifies a user.

    //-----------------------------------------------------------------
    // Expected structures note.
    //-----------------------------------------------------------------
    // Since JS is a dynamic language, we cannot force structures to conform to a specific format.
    // We can document what type of structure needs to be provided to the chat by a connector.
    // Event: onConnect({channelKey: string}})
    // Event: onDisconnect({closedByServer: bool})
    // Event: onReconnect()
    // Event: onTopic ({ topic: string, channelKey: string })
    // Event: onNick ({ userKey: string, identity: string, nickname: string, newNickName: string, isMe: bool })
    // Event: onMessage ({ userKey: string, identity: string, nickname: string, target: string, message: string, type: string })
    // Event: onUserlist ({ channelKey: string, users: { roles: bitarray, prefixes: [ {prefix: string} ], nicknames: [string] })
    // Event: onJoin ({ channelKey: string, userKey: string, identity: string, nickname: string, isMe: bool })
    // Event: onLeave ({ channelKey: string, userKey: string, identity: string, nickname: string, isMe: bool })
    // Event: onQuit ({ userKey: string, identity: string, nickname: string, isMe: bool })
    // Event: onChannelMode ({ channelKey: string, modes: bitarray, action: vga.irc.roleModeAction })
    // Event: onRole ({ channelKey: string, userKey: string, identity: string, nickname: string, isMe: bool, action: vga.irc.roleModeAction, roles: bitarray })
    // Event: onStatus ({ channelKey: string, userKey: string, identity: string, nickname: string, isMe: bool, action: vga.irc.roleModeAction, status: bitarray })
    // Event: onAccessDenied()
    // Event: onKicked ({ identity: string, userKey: string, channelKey: string, isMe: bool })
    // Event: onBanned ({ identity: string, userKey: string, channelKey: string })
    // Event: onError ({ reason: string })

    //-----------------------------------------------------------------
    // Chat constants.
    //-----------------------------------------------------------------
    const frashShowModeId = 'frash-show-mode';
    const turboModeId = 'turbo-mode';
    const joinModeId = 'join-mode';
    const smoothScrollModeId = 'smooth-scroll-mode';

    //-----------------------------------------------------------------
    // Role helper methods.
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
     * Returns a status name based on the most significant status of the user.
     * @method getStatusName
     * @param {number} status a bitarray of status assigned to the user.
     * @return {string} the CSS class assigned to the most significant status.
     */
    function getStatusName(status) {
        return (vga.irc.getMostSignificantStatus(status) === vga.irc.status.banned) ? 'banned' : '';
    };

    /**
     * Determines if the roles provided have mod capabilities, which is any role above mod.
     * @method hasModRoles
     * @param {int} roles bitArray of roles
     * @return {bool} true if the roles contain mod capabilities.
     */
    function hasModCapabilities(roles) {
        return vga.irc.getMostSignificantRole(roles) >= vga.irc.roles.mod;
    }

    /**
     * Determines if the roles provided have guest capabilities.
     * @method hasModRoles
     * @param {int} roles bitArray of roles
     * @return {bool} true if the roles contain guest capabilities.
     */
    function hasGuestCapabilities(roles) {
        return vga.irc.getMostSignificantRole(roles) === vga.irc.roles.guest;
    }

    //-----------------------------------------------------------------
    // Misc Chat Helper functions
    //-----------------------------------------------------------------

    function toggleLoginWindow(show) {
        $('#login-wrapper').toggleClass('hidden', !show);
        show && $nickname.focus();
    }

    function toggleSpinner(show) {
        $('.spinner').toggleClass('hidden', !show);
        $('#vgairc_loginform').toggleClass('hidden', show);
    }

    function setStatus(message, timeout) {
        let $slideMessage = $('#slide_message');
        $slideMessage.text(message || '').toggleClass('hidden', !message);
        
        //Hide the spinner on a status update.
        toggleSpinner(false);
        
        if (timeout) {
            setTimeout(() => {
                $slideMessage.fadeOut( "slow", () => {
                    $slideMessage.toggleClass('hidden', true).css('display', '');
                });
            }, timeout);
        }
    }

    /**
     * Returns a nickColor class based on Kshade's initial algorithm.
     * @method getNickColorClass
     * @param {string} name to evaluate and calculate a color.
     * @param {number} seed an optional seed value.
     * @return {string} the CSS nickColor generated.
     */
    function getNickColorClass(name, seed) {
        let color = 0 + (seed || 0);
        for (var i = 0; i < name.length; i++) {
            color += name.charCodeAt(i);
        }
        return `${(color % 7) + 1}`;
    };

    //-----------------------------------------------------------------
    // jQuery presentation logic.
    //-----------------------------------------------------------------
    var $channelContainer = $('.channel-container');
    var $settingsContainer = $('#settings-container');
    var $channel = $('#channel');
    var $nickname = $('#nickname');
    var $password = $('#password');

    //-----------------------------------------------------------------
    // Channel Helper functions
    //-----------------------------------------------------------------

    /**
     * Creates a channel tab and returns a reference to it.
     * This function is idempotent and will have no side effects if called multiple times.
     * @method getRoleName
     * @param {string} channelName the name of the channel tab object to create.
     * @return {object} a jQuery channel tab object.
     */
    function createChannelTab(channelName) {
        //Create a tab if one does not already exist.
        let $channelTab = $channelContainer.find(`#channel-tab-${channelName.replace('#', '')}`);
        if ($channelTab.length === 0) {
            let $template = $channelContainer.find('#channel-tab-template');
            $channelTab = $template.clone();
            $channelTab.attr('id', `channel-tab-${channelName.replace('#', '')}`).removeClass('hidden').data('channel', channelName).data('channel', channelName);
            $template.addClass('hidden');
            $channelContainer.append($channelTab);
        }

        return $channelTab;
    }

    /**
     * Returns a jQuery channel tab object.
     * @method getChannelTab
     * @param {string} channelName the name of the channel tab object to return.
     * @return {object} a jQuery channel tab object.
     */
    function getChannelTab(channelName) {
        return $channelContainer.find(`#channel-tab-${channelName.replace('#', '')}`);
    }

    /**
     * Returns a jQuery channel tab, window object.
     * @method getChannelWindow
     * @param {string} channelName the name of the channel tab, window object to return.
     * @return {object} a jQuery channel tab object.
     */
    function getChannelWindow(channelName) {
        return getChannelTab(channelName).find('.channel-window');
    }

    /**
     * Pulses a channel window.
     * @method pulseChannelWindow
     * @param {string} channelName the name of the channel tab to pulsate.
     * @param {bool} activate to pulsate channel tab.
     */
    function pulseChannelWindow(channelName, activate) {
        let $channelWindow = getChannelWindow(channelName);
        $channelWindow.toggleClass('pulse', activate);
    };

    /**
     * Enables or disables the lower ui for the specific channel.
     * @method toggleLowerUI
     * @param {string} channelName the name of the channel tab to pulsate.
     * @param {bool} enable or disable the lower ui for this specific channel.
     */
    function enableLowerUI(channelName, enable) {
        let $channelTab = getChannelTab(channelName);
        
        //Enable the user list & support buttons.
        $channelTab.find('.user-list-button,.user-support-button').toggleClass('disabled', !enable);
        
        //Enable the chatbox and give it focus.
        let $chatBox = $channelTab.find('.chatbox');
        $chatBox.prop('disabled', !enable);
        if (enable) {
            $chatBox.focus();
        }
    }

    //-----------------------------------------------------------------
    // Channel Window Helper functions
    //-----------------------------------------------------------------

    /**
     * Writes an informative message to the channel window.
     * @method writeInformationalMessage
     * @param {string} channelName of the channel to write the message.
     * @param {string} message to write.
     */
    function writeInformationalMessage(channelName, message) {
        let $channelWindow = getChannelWindow(channelName);
        $channelWindow.append(`<div class="informative"><span class="message">${vga.util.encodeHTML(message)}</span></div>`);
    };

    /**
     * Updates the channel window with the proper user information.
     * @method updateDisplay
     * @param {string} channelName of the channel to update the user in.
     * @param {object} user to update.
     */
    function updateDisplay(channelName, user) {
        let $channelWindow = getChannelWindow(channelName);
        let $userEntry = $channelWindow.find(`.user-entry[data-identity=${user.identity}]`);

        //If the user has a banned status then remove all of his or her messages.
        if (vga.irc.getMostSignificantStatus(user.status) === vga.irc.status.banned) {
            $userEntry.remove();
        }
        else {
            let roleName = getRoleName(user.roles);
            let $userRole = $userEntry.find('.role');
            $userRole.removeClass().addClass(`role ${roleName}`).find('.icon').attr('title', roleName);
        }
    };

    //-----------------------------------------------------------------
    // User List Helper functions
    //-----------------------------------------------------------------

    /**
     * Constructs an HTML entity element for the user list.
     * @method buildUserListEntry
     * @param {object} user to build an entity element for.
     * @return {string} an HTML element in string form.
     */
    function buildUserListEntry(user) {
        let nicknames = '';
        user.nicknames.forEach((nickname) => {
            nicknames += `${(nicknames.length > 0 ? ',' : '')}${nickname}`;
        });

        //Status overrides roles.
        let statusName = getStatusName(user.status);
        let roleName = (!statusName) ? getRoleName(user.roles) : statusName;
        return (`<div data-identity='${user.identity}' class='user-entry'><div class='role ${roleName}'>`
            + `<div class="icon" title="${roleName}"></div>`
            + `<div class='username' title="Nicknames: ${nicknames}">${user.identity}</div>`
            + '</div></div>');
    }

    /**
     * Updates the user entity in the user list.
     * @method updateUserEntityInList
     * @param {string} channelName of the channel's user list to update.
     * @param {object} user to add, remove, or update from the user list in this specific channel.
     */
    function updateUserEntityInList(channelName, user) {

        //Find the user list and user entity for this channel.
        let $userList = getChannelTab(channelName).find('.user-list-wrapper .user-list');
        
        //Get all the sections.
        let $modSection = $userList.find('.mod-section-body');
        let $guestSection = $userList.find('.guest-section-body');
        let $regularSection = $userList.find('.regular-section-body');

        //If the user no longer has any registered nicknames then remove him or her from the user list.
        //let $userEntry = $userList.find(`#user-list-${user.identity}`);
        let $userEntry = $userList.find(`.user-entry[data-identity=${user.identity}]`);
        if (user.nicknames.length === 0) {
            $userEntry.remove();
        }
        //Otherwise add or update the user entity to the appropriate user list section.
        else {
            //Determine which section to add a new user.
            let $userListSection = $regularSection;
            if (hasModCapabilities(user.roles)) {
                $userListSection = $modSection;
            }
            else if (hasGuestCapabilities(user.roles)) {
                $userListSection = $guestSection;
            }

            //If the user entity already exists then remove it.
            if ($userEntry.length !== 0) {
                $userEntry.remove();
            }

            //Add the new or updated user to the appropriate user list section.
            $userListSection.append(buildUserListEntry(user));
        }

        //Toggle the hidden status of each section depending on whether users have shifted into and out of these sections.
        $modSection.parent().toggleClass('hidden', $modSection.find('div').length == 0);
        $guestSection.parent().toggleClass('hidden', $guestSection.find('div').length == 0);
        $regularSection.parent().toggleClass('hidden', $regularSection.find('div').length == 0);
    };

    /**
     * Creates the user list for this specific channel.
     * @method createUserList
     * @param {string} channelName of the channel's user list to create.
     * @param {array} users to construct the user list for this specific channel.
     */
    function createUserList(channelName, users) {
        //Find the user list object.
        let $userList = getChannelTab(channelName).find('.user-list-wrapper .user-list');
        
        //Find each of the 3 sections.
        let $modSection = $userList.find('.mod-section-body');
        let $guestSection = $userList.find('.guest-section-body');
        let $regularSection = $userList.find('.regular-section-body');
        
        //Clear the sections.
        $modSection.html('');
        $guestSection.html('');
        $regularSection.html('');

        //Write a collection of users to the list if there is one.
        if (users) {
            vga.util.forEach(users, (username, user)=>{
                
                //Determine which section to add a new user.
                let $userListSection = $regularSection;
                if (hasModCapabilities(user.roles)) {
                    $userListSection = $modSection;
                }
                else if (hasGuestCapabilities(user.roles)) {
                    $userListSection = $guestSection;
                }
                
                //Add the new user.
                $userListSection.append(buildUserListEntry(user));
            });
        }

        //Toggle the hidden status of each section depending on whether users have shifted in to or out of these sections.
        $modSection.parent().toggleClass('hidden', $modSection.find('div').length === 0);
        $guestSection.parent().toggleClass('hidden', $guestSection.find('div').length === 0);
        $regularSection.parent().toggleClass('hidden', $regularSection.find('div').length === 0);
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
            vga.irc.chat.CLIENT_VERSION = new vga.util.version(0, 1, 1);

            //Internal variables.
            this._userChannels = {};
            this._smoothScrollState = vga.irc.smoothScrollState.stopped;

            //Chat settings.
            this._hostname = options.hostname;
            this._port = options.port;
            this._ssl = (options.ssl === undefined ? false : options.ssl);
            this._debug = (options.debug == undefined ? false : options.debug);
            this._wallRegEx = options.wallRegEx || /^%! ([^\r\n]*)/;
            this._defaultChannel = options.defaultChannel;
            this._themes = options.themes || [];
            this._showUserJoinLeaveMessage = (options.showUserJoinLeaveMessage !== undefined) ? options.showUserJoinLeaveMessage : false;
            this._smoothScroll = (options.smoothScroll !== undefined) ? options.smoothScroll : true;
            this._timedBanDurationInSeconds = (options.timedBanDurationInSeconds !== undefined) ? options.timedBanDurationInSeconds : 300;
            this._nicknameColorSeedFunction = options.nicknameColorSeedFunction;

            let consolidateNicknames = (options.consolidateNicknames !== undefined) ? options.consolidateNicknames : false;
            let enableFrashShowMode = (options.enableFrashShowMode !== undefined ? options.enableFrashShowMode : false);
            let enableReconnect = (options.enableReconnect !== undefined) ? options.enableReconnect : true;
            let autoJoinChannel = (!this._defaultChannel);

            //If Frash Show Mode is enabled then set Frash Show Mode to true, and make the option visible.
            //By making the option visible it can be toggled in that a user may want to turn the feature off.
            if (enableFrashShowMode) {
                this.setFrashShowMode(true);
            }

            if (this._debug) {
                vga.util.enableDebug();
            }

            //Load additional settings from cookies if they exist.
            this.bindEvents();
            this.onLoadSettings();

            //The connector.  This guy has abstracted all the IRC & Kiwi IRC logic away.
            //If we switch to another IRC type, a new connector can be written to handle this without rewriting all of chat.
            this.connector = new vga.irc.connector.kiwi.connector(options.url, {
                supportConcurrentChannelJoins: options.supportConcurrentChannelJoins,
                autoJoinChannel: autoJoinChannel,
                attemptReconnect: enableReconnect,
                consolidateNicknames: consolidateNicknames,
                listeners: [this]
            });
        }

        //-----------------------------------------------------------------
        // Presentation methods
        // These are presentation methods.
        //-----------------------------------------------------------------

        writeToChannelWindow(channelName, user, message, type) {
            
            //Normalize.
            type = type || 'message';

            //Setup any additional message classes.
            let additionalMessageClasses = `${(type === 'action' ? 'allowColor' : '')}`;
            
            //Determine if I am a mod and if I can view the timeout option.
            let optionBody = '';
            let channel = this._userChannels[channelName];
            if (channel) {
                let me = channel[this.connector.getMyUserKey()];
                if (me && hasModCapabilities(me.roles)) {
                    optionBody = '<span class="timeout"><i class="fa fa-ban" role="button" title="Timeout Chatter!"></i></span>'
                }
            }

            //Verify the person performing the wall (shout) has mod capabilities and that it is a wall message.
            if ( (this._wallRegEx.test(message)) && hasModCapabilities(user.roles)) {
                //The first capture group must exist in the regex in order for it to work.
                let messages = this._wallRegEx.exec(message);
                if (messages.length > 1) {
                    message = messages[1];
                    additionalMessageClasses = ((additionalMessageClasses.length > 0) ? ' ' : '') + 'modbroadcast';
                }
            }

            //Encode all HTML characters.
            message = vga.util.encodeHTML(message);

            //Generate the nickname color and change it based on the seed function, if defined.
            let nickColor = getNickColorClass(user.identity, this._nicknameColorSeedFunction && this._nicknameColorSeedFunction());

            let identity = (user !== undefined) ? user.identity : 'undefined';
            let roleName = getRoleName((user !== undefined) ? user.roles : vga.irc.roles.shadow);

            let $channelWindow = getChannelWindow(channelName);
            $channelWindow.append(`<div class='user-entry nickColor${nickColor}' data-identity='${identity}'><div class='role ${roleName}'>`
                + `<div class="icon" title="${roleName}"></div>${optionBody}`
                + `<div class='prefix'></div>`
                + `<div class='username allowColor'>${(type === 'private' ? `To [${identity}]` : identity)}${(type !== 'action' ? ':' : '')}</div>`
                + `<div class='message ${additionalMessageClasses}'>${message}</div>`
                + `</div></div>`);
        }
        /**
         * This is a helper method that will show or hide a setting.
         * @method vga.irc.chat.showToggleSetting
         * @param {string} settingsName to show or hide.
         * @param {bool} visible is true to show the setting feature.
         */
        showToggleSetting(settingsName, visible) {
            $settingsContainer.find(`.settings-item[data-settings-type='${settingsName}']`).toggleClass('hidden', !visible);
        }
        /**
         * This is a helper method that will perform toggle the setting icon.
         * @method vga.irc.chat.toggleSettingItem
         * @param {string} settingsName to toggle on or off.
         * @param {bool} activate or deactivate this specific setting item.
         */
        toggleSettingItem(settingsName, activate) {
            $settingsContainer.find(`.settings-item[data-settings-type='${settingsName}'] > i`).toggleClass('fa-toggle-off', !activate).toggleClass('fa-toggle-on', activate);
        }
        /**
         * This is a helper method to handle all the little details of turning Frash Show Mode on and off.
         * @method vga.irc.chat.setFrashShowMode
         * @param {bool} activate or deactivate frash show mode.
         */
        setFrashShowMode(activate) {
            this._frashShowMode = activate;

            //Hide Join/Show modes when frash show mode is active.
            //NOTE: This feature is disabled through out the chat logic if frash show mode is enabled.
            this.showToggleSetting(joinModeId, !activate);
            
            //Show this option always once it has been turned on (or enabled).
            this.showToggleSetting(frashShowModeId, true);
            this.toggleSettingItem(frashShowModeId, activate);

            //Toggle the styles for frash show mode.
            $('html').toggleClass(frashShowModeId, activate);
        }

        //----------------------
        // Themes methods
        //----------------------

        /**
         * This is a helper method that starts the theme monitor.
         * @method vga.irc.chat.startThemes
         */        
        startThemes() {
            let themesWatcher = () => {
                this._themesIntervalId = setTimeout(() => {
                    let now = new Date();
                    this._themes.forEach((theme)=>{
                        let beginDate = new Date(theme.beginDate);
                        let endDate = new Date(theme.endDate);
                        beginDate.setFullYear(now.getFullYear());
                        endDate.setFullYear(now.getFullYear());
                        $('body').toggleClass(theme.name, (now >= beginDate && now <= endDate));
                    })

                    //Recursively invoke the smooth scroll logic until it is terminated.
                    themesWatcher();
                }, 33);
            }
            themesWatcher();
        }
        /**
         * This is a helper method that stops the theme monitor.
         * @method vga.irc.chat.stopThemes
         */
        stopThemes() {
            clearTimeout(this._themesIntervalId);
        }

        //----------------------
        // Smooth Scroll methods
        //----------------------

        /**
         * This is a helper method that starts and handles the Kshade smooth scroll logic.
         * @method vga.irc.chat.startSmoothScrolling
         */
        startSmoothScrolling() {
            let smoothScroll = () => {
                //If scrolling is stopped prevent recursive calls to this function to continue.
                if (this._smoothScrollState === vga.irc.smoothScrollState.stopped) {
                    return;
                }
                this._smoothScrollIntervalId = setTimeout(() => {
                    //Prevent any scrolling if scrolling is paused.
                    if (this._smoothScrollState === vga.irc.smoothScrollState.started) {
                        //Find all available windows except the template.
                        let $windows = $channelContainer.find(':not(#channel-tab-template)').find('.channel-window');
                        $.each($windows, (index, e) => {
                            //Begin Kshade's smooth, smoooooth scrolling, awwww yeah.
                            let scrollHeight = $(e).prop("scrollHeight");
                            if (this._smoothScroll) {
                                let scrollTop = $(e).prop("scrollTop");
                                let scrollBottom =scrollTop + $(e).height();
                                let scrollDownRate = 1;
                                if (scrollBottom < scrollHeight - 140) {
                                    scrollDownRate = Math.round(1 + ((scrollHeight - scrollBottom) / 50));
                                }
                                scrollHeight = scrollTop + scrollDownRate;
                            }

                            $(e).scrollTop(scrollHeight);
                        });
                    }
                    //Recursively invoke the smooth scroll logic until it is terminated.
                    smoothScroll();
                }, 33);
            }
            this._smoothScrollState = vga.irc.smoothScrollState.started;
            smoothScroll();
        }
        /**
         * This is a helper method that stops the smooth scrolling.
         * @method vga.irc.chat.stopSmoothScrolling
         */
        stopSmoothScrolling() {
            this._smoothScrollState = vga.irc.smoothScrollState.stopped;
            clearTimeout(this._smoothScrollIntervalId);
        }
        /**
         * This is a helper method that pauses the smooth scrolling.
         * @method vga.irc.chat.pauseSmoothScrolling
         * @param {bool} activate or deactivate the pause logic 
         */
        pauseSmoothScrolling(activate) {
            if (this._smoothScrollState !== vga.irc.smoothScrollState.stopped) {
                this._smoothScrollState = activate ? vga.irc.smoothScrollState.paused : vga.irc.smoothScrollState.started;
            }
        }

        //-----------------------------------------------------------------
        // Chat Methods
        // These are chat methods to invoke.
        //-----------------------------------------------------------------

        /**
         * Attempts to connect a user to the chat server.
         * @method vga.irc.chat.connect
         * @param {string} nickname the user's nickname to authenticate with.
         * @param {string} password the user's password to authenticate with.
         * @param {string} channel the channel the user is attempting to autojoin.
         */
        connect(nickname, password, channel) {
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
         * @param {string} channelName to join after connecting.
         */
        join(channelName) {
            this.connector && this.connector.join(channelName);
            return this;
        }
        /**
         * Attempts to leave a channel.
         * @method vga.irc.chat.leave
         * @param {string} channelName to leave.
         * @param {string} message the message to send to the server when leaving a channel.
         */   
        leave(channelName, message) {
            this.connector && this.connector.leave(channelName, message);
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
                //Check for any known commands.
                if (message[0] === '/') {
                    let messageCommand = message.trim().toLowerCase();
                    let args = '';
                    let indexOfFirstSpace = message.indexOf(' ');
                    if (indexOfFirstSpace > -1) {
                        messageCommand = message.substring(0, indexOfFirstSpace).trim().toLowerCase();
                        args = message.substring(indexOfFirstSpace + 1).split(' ');
                    }

                    switch(messageCommand) {
                        case '/quit':
                            this.close(args[0] || '');
                            break;

                        case '/join':
                            this.join(args[0] || '');
                            break;
                        
                        case '/leave': 
                            this.leave((args[0] || ''), (args[1] || ''));
                            break;

                        case '/e':
                        {
                            let emote = (args[0] || '');
                            this.connector.emote(channelName, emote);
                            let channel = this._userChannels[channelName];
                            if (channel) {
                                let user = channel[this.connector.getMyUserKey()];
                                this.writeToChannelWindow(channelName, user, emote, 'action');
                            }
                        }
                        break;

                        case '/r':
                        {
                            let name = args[0] || '';
                            let msg = args[1] || '';
                            this.connector && this.connector.send(msg, name);
                            let channel = this._userChannels[channelName];
                            if (channel) {
                                let user = channel[this.connector.getMyUserKey()];
                                this.writeToChannelWindow(channelName, user, `${msg}`, 'private');
                            }
                        }
                        break;
                    }
                }
                //Send messages as normal.
                else {
                    this.connector && this.connector.send(message, channelName);
                    let channel = this._userChannels[channelName];
                    if (channel) {
                        let user = channel[this.connector.getMyUserKey()];
                        this.writeToChannelWindow(channelName, user, message);
                    }
                }
            }
            return this;
        }
        /**
         * Attempts to set turbo mode on the channel.
         * @method vga.irc.chat.setTurboMode
         * @param {string} channelName to apply turbo mode.
         * @param {bool} activate or disables the turbo mode.
         */
        setTurboMode(channelName, activate) {
            if (this.connector) {
                this.connector.setMode(`#${channelName}`, vga.irc.channelmodes.turbo, (activate ? vga.irc.roleModeAction.add : vga.irc.roleModeAction.remove));
                this.toggleSettingItem(turboModeId, activate);
            }
            return this;
        }
        /**
         * Attempts to set a timed ban on the user identity in the specific channel.
         * @method vga.irc.chat.setTimedBan
         * @param {string} channelName the user is occupying.
         * @param {string} identity of the user to apply a status.
         * @param {bool} activate or disables the turbo mode.
         */
        setTimedBan(channelName, identity, activate) {
            if (this.connector) {
                let status = vga.irc.bitArray.add(0, vga.irc.status.banned | vga.irc.status.timed);
                let action = (activate ? vga.irc.roleModeAction.add : vga.irc.roleModeAction.remove);
                this.connector.setUserStatus(channelName, identity, status, action, {duration: this._timedBanDurationInSeconds});
                this.connector.kick(channelName, identity);
            }
            return this;
        }

        //-----------------------------------------------------------------
        // Chat events
        // These are chat events.
        //-----------------------------------------------------------------

        /**
         * An event that is triggered on a successful connection to the chat server.
         * @method vga.irc.chat.onConnect
         * @param {object} eventData information.
         */
        onConnect(eventData) {
            setStatus();
            createChannelTab(eventData.channelKey);
            pulseChannelWindow(eventData.channelKey, false);
            enableLowerUI(eventData.channelKey, true);
            toggleLoginWindow(false);
            this.startSmoothScrolling();
            this.startThemes();
        }

        /**
         * An event that is triggered when a disonnect event happens.
         * @method vga.irc.chat.onDisconnect
         * @param {object} eventData information.
         */
        onDisconnect(eventData) {
            this.stopSmoothScrolling();
            this.stopThemes();
            toggleLoginWindow(true);

            if (eventData.closedByServer)
            {
                setStatus(eventData.reason, 5000);
            }

            vga.util.forEach(this._userChannels, (channelName, channelData)=>{
                enableLowerUI(channelName, false);
                pulseChannelWindow(channelName, false);
                writeInformationalMessage(channelName, eventData.closedByServer ? 'Disconnected by the server.' : 'You have quit.');
            });
        }

        ///TODO: Temporary Reconnect logic, merge with the connect logic currently in the index.php.
        /**
         * An event that is triggered when a topic event occurs.
         * @method vga.irc.chat.onReconnect
         */
        onReconnect() {
            setStatus('The server stopped responding...retrying.', 5000);
            this.onLogin();
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
         * An event that is triggered when a channel mode changes.
         * @method vga.irc.chat.onChannelMode
         * @param {object} eventData
         */
        onChannelMode(eventData) {
            let channel = this._userChannels[eventData.channelKey];
            if (channel) {
                let $channelTab = getChannelTab(eventData.channelKey);

                //Handle the turbo mode events.
                if (eventData.modes === vga.irc.channelmodes.turbo) {
                    
                    //Toggle the turbo mode setting.
                    this.toggleSettingItem(turboModeId, eventData.action === vga.irc.roleModeAction.add);

                    //Determine if turbo mode has been turned on or off.
                    if (eventData.action === vga.irc.roleModeAction.add) {
                        writeInformationalMessage(eventData.channelKey, `The room is now in TURBO only mode.`);
                        
                        //Disable the chatbox if the user is a shadow when turbo mode is on.
                        let me = channel[this.connector.getMyUserKey()];
                        $channelTab.find('input.chatbox').prop('disabled', vga.irc.getMostSignificantRole(me.roles) === vga.irc.roles.shadow);
                    }
                    else {
                        writeInformationalMessage(eventData.channelKey, `The room is now free for all chatters.`);
                        $channelTab.find('input.chatbox').prop('disabled', false);
                    }
                }
            }
        }
        /**
         * This event is triggered on a nickname change.
         * @method vga.irc.connector.kiwi.connector.onNick
         * @param {object} eventData event data associated with nickname event sent by the server.
         */
        onNick(eventData) {

            //This event occurs across channels so we have to update them all.
            vga.util.forEach(this._userChannels, (channelKey, users) => {
                //Find the user for the current channel.
                let user = users[eventData.userKey];
                if (user) {
                    user.identity = eventData.identity;
                    user.removeNickname(eventData.nickname).addNickname(eventData.newNickName);
                }

                //The keys have changed too, update that as well.
                if (eventData.userKey !== eventData.newUserKey) {
                    users[eventData.newUserKey] = user;
                    users[eventData.userKey] = undefined;
                }

                //Update the display when a nickname changes.
                updateUserEntityInList(channelKey, user);
                updateDisplay(channelKey, user);
            });
        }
        /**
         * An event that is triggered when receiving a message from the chat server.
         * @method vga.irc.chat.onMessage
         * @param {string} eventData broadcasted to the channel.
         */
        onMessage(eventData) {
            if (!this._wallRegEx.test(eventData.message) || !this._frashShowMode) {
                let channel = this._userChannels[eventData.target];
                if (channel) {
                    let user = channel[eventData.userKey];
                    this.writeToChannelWindow(eventData.target, user, eventData.message, eventData.type);
                }
            }
        }
        /**
         * An event that is triggered when a user list is provided.
         * @method vga.irc.chat.onUserlist
         * @param {object} eventData An object that contains the channel and the users associated with that channel.
         */ 
        onUserlist(eventData) {
            this._userChannels[eventData.channelKey] = eventData.users;
            createUserList(eventData.channelKey, eventData.users);
        }
        /**
         * An event that is triggered when the a user has joined a channel.
         * @method vga.irc.chat.onJoin
         * @param {object} eventData
         */
        onJoin(eventData) {
            let channel = this._userChannels[eventData.channelKey];
            if (channel) {
                //Retrieve the user entity if he or she already exists in the userlist.
                let user = channel[eventData.userKey];
                //If the user is new then add him or her to the userlist and channel information block.
                if (!user) {
                    user = new vga.irc.userEntity(eventData.identity, eventData.nickname);
                    channel[eventData.userKey] = user;
                    if (!this._frashShowMode && this._showUserJoinLeaveMessage && !eventData.isMe) {
                        this.writeToChannelWindow(eventData.channelKey, user, `has joined.`, 'action');
                    }
                }

                //Add any new nicknames to the user entity and update the userlist.
                user.addNickname(eventData.nickname);
                updateUserEntityInList(eventData.channelKey, user);
            }
            else if (eventData.isMe) {
                writeInformationalMessage(eventData.channelKey, `Joined ${eventData.channelKey} channel.`);
            }
        }
        /**
         * An event that is triggered when a user has left the channel.
         * @method vga.irc.chat.onLeave
         * @param {object} eventData
         */
        onLeave(eventData){
            let channel = this._userChannels[eventData.channelKey];
            if (channel) {
                //If the user exists then remove this nickname from the user entity, otherwise ignore the event.
                let user = channel[eventData.userKey];
                if (user) {
                    user.removeNickname(eventData.nickname);
                    //If we have exhasted the number of nicknames then we need to remove the user entity from the channel information block.
                    if (user.nicknames.length === 0) {
                        channel[eventData.userKey] = undefined;
                        if (!this._frashShowMode && this._showUserJoinLeaveMessage && !eventData.isMe) {
                            this.writeToChannelWindow(eventData.channelKey, user, `has left.`, 'action');
                        }
                    }

                    updateUserEntityInList(eventData.channelKey, user);
                }
            }
            else if (eventData.isMe) {
                writeInformationalMessage(eventData.channelKey, `Left ${eventData.channelKey} channel.`);
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
                this.onLeave({
                    channelKey: channelKey,
                    userKey: eventData.userKey,
                    nickname: eventData.nickname,
                    isMe: eventData.IsMe
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
                let user = channel[eventData.userKey];
                if (user) {
                    user.applyRoles(eventData.action, eventData.roles);
                    updateUserEntityInList(eventData.channelKey, user);
                    updateDisplay(eventData.channelKey, user);

                    //If the user is me and I have been granted mod capabilities then show the mode toggle option.
                    if (eventData.isMe) {
                        let me = channel[this.connector.getMyUserKey()];
                        this.showToggleSetting(turboModeId, (me && hasModCapabilities(me.roles)));
                    }
                }
            }
        }
        /**
         * An event that is triggered on a status assignment either with the authenticated user or another user in chat.
         * @method vga.irc.chat.onStatus
         * @param {object} eventData contains the status information for the specific channel per user.
         */
        onStatus (eventData) {
            let channel = this._userChannels[eventData.channelKey];
            if (channel) {
                //An internal helper function.
                let handleStatus = (userKey) => {
                    let user = channel[userKey];
                    if (user) {
                        user.applyStatus(eventData.action, eventData.status);
                        updateUserEntityInList(eventData.channelKey, user);
                        updateDisplay(eventData.channelKey, user);
                    }
                };
                //Determine if the userkey is a wildcard if so, find all users.
                if ((eventData.userKey === '*') && (eventData.identities)) {
                    for (let identity of eventData.identities) {
                        handleStatus(identity);
                    }
                }
                else {
                    handleStatus(eventData.userKey);
                }

                //Handle events specific to me slightly different.
                if (eventData.isMe) {

                    //TODO: Find a way to consolidate this with the banned event that is triggered when a banned user tries to log into a channel.
                    if (eventData.status === vga.irc.status.banned) {
                        writeInformationalMessage(eventData.channelKey, (eventData.action === vga.irc.roleModeAction.add ? `You have been timed out.` : 'Your timeout has expired.'));
                    }
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
            if (eventData.isMe) {
                this.close();
                setStatus('You have been kicked.');
            }
        }
        /**
         * An event that is triggered when the user is banned from the channel.
         * @method vga.irc.chat.onBanned
         * @param {object} eventData additional banned information.
         */
        onBanned(eventData) {
            //TODO: Close channel window.
            //For now, disconnect the user if he or she is kicked from the channel.
            this.close();
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
            setStatus('Sorry, an unknown error has occured.');
            vga.util.debuglog.error(eventData.reason);
        }

        //-----------------------------------------------------------------
        // Presentation events
        // These are presentation methods.
        //-----------------------------------------------------------------

        /**
         * This method binds the presentation events.
         * @method vga.irc.chat.bindEvents
         */
        bindEvents() {
            $('#vgairc_loginform').off().on('click', 'input[type=submit]', (e) => {
                this.onLogin();
                e.preventDefault();
            }).on('keyup', 'input', (e) => {
                if (e.which === 13) {
                    this.onLogin();
                }
            });

            $channelContainer.off().on('keyup', 'input', (e) => {
                this.onSendCommandMessage($(e.currentTarget), e.which);
            }).on('click', '.user-list-button', (e) => {
                this.onUserListToggle($(e.currentTarget));
                e.preventDefault();
            }).on('click', '.user-settings-button', (e) => {
                this.onGlobalSettingsMenu($(e.currentTarget));
                e.preventDefault();
            }).on('click', '.settings-item', (e) => {
                this.onSettingsItemToggle($(e.currentTarget));
                e.preventDefault();
            }).on('mouseenter mouseleave', '.channel-window', (e) => {
                this.onChannelWindowHover(e.type === "mouseenter")
            }).on('click', '.timeout', (e) => {
                this.onTimeoutUser($(e.currentTarget));
                e.preventDefault();
            });
        }
        /**
         * This event is triggered when a user triggers the chat login event.
         * @method vga.irc.chat.onLogin
         */
        onLogin() {
            let channelName = $channel.val();
            toggleSpinner(true);
            pulseChannelWindow(channelName, true);
            this.connect($nickname.val(), $password.val(), channelName);
        }
        /**
         * This event is triggered when a user toggles the user list for a specific channel.
         * @method vga.irc.chat.onUserListToggle
         * @param {object} $this is a jQuery object that triggered the event.
         */
        onUserListToggle($this) {
            if (!$this.hasClass('disabled')) {
                let $userListWrapper = $this.parents('.channel-tab').find('.user-list-wrapper');
                $userListWrapper.toggleClass('hidden', !$userListWrapper.hasClass('hidden'));
            }
        }
        /**
         * This event is triggered when a user toggles the global settings menu.
         * @method vga.irc.chat.onGlobalSettingsMenu
         * @param {object} $this is a jQuery object that triggered the event.
         */
        onGlobalSettingsMenu($this) {
            let $container = $('#settings-container');
            $container.toggleClass('hidden', !$container.hasClass('hidden'));
        }
        /**
         * This event is triggered when a the load cookie setting event is triggered.
         * @method vga.irc.chat.onLoadSettings
         */
        onLoadSettings() {
            let joinMode = (vga.util.readCookie(joinModeId, 'false') === 'true');
            let smoothScroll = (vga.util.readCookie(smoothScrollModeId, 'true') === 'true');
            
            this._showUserJoinLeaveMessage = joinMode;
            this._smoothScroll = smoothScroll;

            this.toggleSettingItem(joinModeId, joinMode);
            this.toggleSettingItem(smoothScrollModeId, smoothScroll);
        }
        /**
         * This event is triggered when a user toggles a setting from the global settings menu.
         * @method vga.irc.chat.onSettingsItemToggle
         * @param {object} $this is a jQuery object that triggered the event.
         */
        onSettingsItemToggle($this) {
            let $toggleButton = $this.find('i');
            let toggledState = !$toggleButton.hasClass('fa-toggle-on');
            switch($this.data('settings-type'))
            {
                case frashShowModeId:
                    this.setFrashShowMode(toggledState);
                    break;

                case turboModeId:
                    let channelName = $this.data('channels');
                    this.setTurboMode(channelName, toggledState);
                    break;

                case joinModeId:
                    this._showUserJoinLeaveMessage = toggledState;
                    $toggleButton.toggleClass('fa-toggle-off', !toggledState).toggleClass('fa-toggle-on', toggledState);
                    vga.util.setCookie(joinModeId, toggledState);
                    break;

                case smoothScrollModeId:
                    this._smoothScroll = toggledState;
                    $toggleButton.toggleClass('fa-toggle-off', !toggledState).toggleClass('fa-toggle-on', toggledState);
                    vga.util.setCookie(smoothScrollModeId, toggledState);
                    break;
            }
        }
        /**
         * This event is triggered when a mod clicks on the timeout icon next to a user.
         * @method vga.irc.chat.onChannelWindowHover
         * @param {object} $this is a jQuery object that triggered the event.
         */        
        onTimeoutUser($this) {
            let $userEntry = $this.parents('.user-entry');
            let $channel = $userEntry.parents('.channel-tab');
            let identity = $userEntry.data('identity');
            let channelName = $channel.data('channel');
            if (identity && channelName) {
                this.setTimedBan(channelName, identity, true);
            }
        }
        /**
         * This event is triggered when a user hovers over the current channel window.
         * @method vga.irc.chat.onChannelWindowHover
         * @param {object} $this is a jQuery object that triggered the event.
         */
        onChannelWindowHover(isHovering) {
            this.pauseSmoothScrolling(isHovering);
        }
        /**
         * This event is triggered when a user sends a command or message to the chat.
         * @method vga.irc.chat.onSendCommandMessage
         * @param {object} $this is a jQuery object that triggered the event.
         */
        onSendCommandMessage($this, key) {
            let value = $this.val();
            if (key === 13 && value !== '') {
                let channelName = $this.parents('.channel-tab').data('channel');
                this.send(channelName, value);
                $this.val('');
            }
        }        
    }

}());