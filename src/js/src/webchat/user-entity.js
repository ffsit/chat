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

//-----------------------------------------------------------------
// User Entity class
//-----------------------------------------------------------------

/**
 * Common user entity class used to maintain consistency and normalize the user entity object.
 * @class vga.webchat.userEntity
 */
vga.webchat.userEntity = class  {
    constructor(identity, nickname, roles) {
        this.roles = (roles !== undefined) ? roles : vga.webchat.roles.shadow;
        this.status = vga.webchat.status.nominal;
        //This is the user's true identity that will be shown to everyone.
        this.identity = identity;
        //A collection of nicknames that the user may be assigned if he or she has multiple sessions.
        this.nicknames = (nickname !== undefined) ? (Array.isArray(nickname) ? nickname : [nickname]) : [];
    }
    /**
     * Applies a role based on the action to the current user entity.
     * @method vga.webchat.applyRoles
     * @param {number} roleAction type of action (vga.webchat.roleModeAction) to apply.
     * @param {number} rolesToApply bitarray of roles to apply.
     * @api public
     */
    applyRoles(roleAction, rolesToApply) {
        this.roles = (roleAction === vga.webchat.roleModeAction.add)
            ? vga.webchat.bitArray.add(this.roles, rolesToApply)
            : vga.webchat.bitArray.remove(this.roles, rolesToApply);
        return this;
    }
    /**
     * Applies a status based on the action to the current user entity.
     * @method vga.webchat.applyStatus
     * @param {number} modeAction type of action (vga.webchat.roleModeAction) to apply.
     * @param {number} modesToApply bitarray of modes to apply.
     * @api public
     */    
    applyStatus(modeAction, modesToApply) {
        this.status = (modeAction === vga.webchat.roleModeAction.add)
            ? vga.webchat.bitArray.add(this.status, modesToApply)
            : vga.webchat.bitArray.remove(this.status, modesToApply);
        return this;
    }
    /**
     * Append a nickname to the user entity.
     * @method vga.webchat.addNickname
     * @param {string} nickname a nickname to append to the user.
     * @api public
     */
    addNickname(nickname) {
        if (this.nicknames.indexOf(nickname) === -1) {
            this.nicknames.push(nickname);
        }
        return this;
    }
    /**
     * Removes a nickname from the user entity.
     * @method vga.webchat.removeNickname
     * @param {string} nickname a nickname to remove to the user.
     * @api public
     */
    removeNickname(nickname) {
        let index = this.nicknames.indexOf(nickname);
        if (index > -1) {
            let swap = this.nicknames.pop();
            if (swap && index < this.nicknames.length) { 
                this.nicknames[index] = swap;
            }
        }
        return this;
    }
};