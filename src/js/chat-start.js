"use strict";

/*
* @license
* Copyright (c) 2016-2017, FarFromSubtle IT
* All rights reserved.
* Github: https://github.com/ffsit/chat/
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
vga.webchat = vga.webchat || {};

///////////////////////////////////////////////////////////
// The main VGA chat application entry point.
// Configuration details go here.
///////////////////////////////////////////////////////////
$(function(){

    let frashModeBegin = vga.util.inUrl('farshar');

    // Caff (7/23/17) [V1.0.3 Feature] --- Added the ability to enable debug via the URL.
    let debug = vga.util.inUrl('debug');

    //Just like Farshar mode can be enabled with the term in the querystring, so can the themes be disabled.
    //By default, themes are enabled.
    let themes = [];
    if (!vga.util.inUrl('disableThemes')) {
        //NOTE: The year in the date string has no meaning, it will be replaced with the current UTC year.
        themes = [{ name: 'halloween', beginDate: '10/2/2010 PDT', endDate: '11/1/2010 PDT' }, { name: 'xmas', beginDate: '12/23/2010 PDT', endDate: '12/27/2010 PDT' }];
    }

    //Create the chat object.
    //Set the configuration options here.
    var chat = new vga.webchat.chat({
        url: "wss://turbo.chat/kiwi/?transport=websocket",
        hostname: 'turbo.chat',
        port: "6667",
        defaultChannel: '#ffstv',
        wallRegEx: /^%! ([^\r\n]*)/,
        //This determines when this setting shows up.
        enableFrashShowMode: frashModeBegin,
        consolidateNicknames: true,
        enableReconnect: true,
        themes: themes,
        //This changes the chatter's nicknames once a month so there is less complaining about hated colors.
        //This can be disabled by commenting this out.
        //nicknameColorSeedFunction: () => new Date().getUTCMonth(),
        nicknameColorSeedFunction: function() { return new Date().getUTCMonth() },
        //Set this value to change the tban time in seconds.
        timedBanDurationInSeconds: 900,
        debug: debug,
        // --- Caffe (12/11/17) --- Version [1.1.4] --- Adding a tilde to the regex to fix the Dissy links.
        hyperlinkRegEx: /https?:\/\/[\w.\/?&~#%=\-,+@!:\[\]\(\)\$';]+/ig
    });
});