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

vga.irc.roles = {
    owner: 32,
    admin: 16,
    mod: 8,
    guest: 4,
    turbo: 2,
    shadow: 1
};

vga.irc.classes = {
    owner: 'owner',
    admin: 'admin',
    mod: 'op',
    guest: 'guest',
    turbo: 'turbo',
    shadow: 'shadow'
};

vga.irc.channelmodes = {
    turbo: 1
};

vga.irc.getMostSignificantRole = function(roles) {

    //Unrolled loop to find the most significant role.
    //Since the number of roles are limited and more than likely never increase beyond this, we'll use an un-rolled loop for now.
    if (roles & vga.irc.roles.owner === vga.irc.roles.owner) {
        return vga.irc.roles.owner;
    }
    else if (roles & vga.irc.roles.admin === vga.irc.roles.admin) {
        return vga.irc.roles.admin;
    }
    else if (roles & vga.irc.roles.mod === vga.irc.roles.mod) {
        return vga.irc.roles.mod;
    }
    else if (roles & vga.irc.roles.guest === vga.irc.roles.guest) {
        return vga.irc.roles.guest;
    }
    else if (roles & vga.irc.roles.turbo === vga.irc.roles.turbo) {
        return vga.irc.roles.turbo;
    }

    return vga.irc.roles.shadow;
}