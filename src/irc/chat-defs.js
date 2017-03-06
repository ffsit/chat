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
    owner:  32, //classes: 'owner' },
    admin:  16, //classes: 'admin' },
    mod:    8,  //classes: 'op' },
    guest:  4,  //classes: 'guest' },
    turbo:  2,  //classes: 'turbo' },
    shadow: 1,  //classes: 'shadow' }
};

vga.irc.roleAction = {
    remove: 0,
    add: 1
}

vga.irc.channelmodes = {
    turbo: 1
};

/**
 * Finds the most significant role based on the bit weight.
 * @method vga.irc.getMostSignificantRole
 * @param {number} roles bitarray of roles.
 * @return most significant role.
 * @api public
 */
vga.irc.getMostSignificantRole = function(roles) {
    let numOfRoles = vga.util.propertyCount(vga.irc.roles);
	for(let bitNum = numOfRoles - 1; bitNum >= 0; bitNum--) {
		let bitVal = (1 << bitNum);
		if ((roles & bitVal) === bitVal) {
			return bitVal;
		}
	}
	return vga.irc.roles.shadow;
};

/**
 * Applies a one or more roles to the current roles bitarray.
 * @method vga.irc.addRole
 * @param {number} roles bitarray of roles.
 * @param {number} roleToApply bitarray of a role or roles to apply.
 * @return updated roles bitarray.
 * @api public
 */
vga.irc.addRole = function(roles, roleToApply) {
    return (roles | roleToApply);
};

/**
 * Removes a one or more roles to the current roles bitarray.
 * @method vga.irc.removeRole
 * @param {number} roles bitarray of roles.
 * @param {number} roleToRemove bitarray of a role or roles to remove.
 * @return updated roles bitarray.
 * @api public
 */
vga.irc.removeRole = function(roles, roleToRemove) {
    return (roles ^ (roles & roleToRemove));
};