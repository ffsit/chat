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

///////////////////////////////////////////////////////////
// The main VGA chat application entry point.
// Configuration details and jQuery event bindings go here.
///////////////////////////////////////////////////////////
$(function(){

    //Create the chat object.
    //Set the configuration options here.
    var chat = new vga.irc.chat({
        url: "ws://valhalla.ffsit.net:7778/?transport=websocket",
        hostname: "valhalla.ffsit.net",
        port: "6667",
        defaultChannel: '#ffstv',
        wallRegEx: /^%! [^\r\n]*/,
        theaterMode: false,
        enableReconnect: true,
        debug: true
    });

    $('#Login').click(function(e){
        let nickname = $('#nickname').val();
        let password = $('#password').val();
        let channel = $('#channel').val();
        chat.connect(nickname, password, channel);
        e.preventDefault();
    });

    $('.channel-container').on('keyup', 'input', function(e){
        let value = $(this).val();
        if (e.which === 13 && value !== '') {
            let channelName = $(this).parents('.channel-tab').data('channel');
            chat.send(channelName, value);
            $(this).val('');
        }
    }).on('click', '.userlist', function(e){
        let $userListWrapper = $(this).parents('.channel-tab').find('.user-list-wrapper');
        $userListWrapper.toggleClass('hidden', !$userListWrapper.hasClass('hidden'));
        e.preventDefault();
    }).on('click', '.user-settings', function(e) {
        let $container = $('#settings-container');
        $container.toggleClass('hidden', !$container.hasClass('hidden'));
    });
});