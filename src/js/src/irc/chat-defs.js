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
vga.irc = vga.irc || {};

vga.irc.roles = {
    owner:  32,
    admin:  16,
    mod:    8,
    guest:  4,
    turbo:  2,
    shadow: 1,
    none: 0
};

vga.irc.status = {
    muted:  4,
    timed: 2,
    banned: 1,
    nominal: 0
};

vga.irc.roleModeAction = {
    remove: 0,
    add: 1
};

vga.irc.channelmodes = {
    turbo: 1,
    none: 0
};

vga.irc.smoothScrollState = {
    stopped: 0,
    started: 1,
    paused: 2
}

vga.irc.messageType = {
    message: 0,
    action: 1,
    whisper: 2
}

//-----------------------------------------------------------------
// BitArray methods.
//-----------------------------------------------------------------

//TODO: Make this a class.
vga.irc.bitArray = vga.irc.bitArray || {};

/**
 * Finds the most significant value based on the bit weight of the type.
 * @method vga.irc.bitArray.getMostSignificantRole
 * @param {number} values bitarray of values.
 * @param {object} types defined 'enum' type.
 * @param {number} defaultValue
 * @return most significant value.
 * @api public
 */
vga.irc.bitArray.getMostSignificantValue = function(values, types, defaultValue) {
    let numOfValues = vga.util.propertyCount(types);
	for(let bitNum = numOfValues - 1; bitNum >= 0; bitNum--) {
		let bitVal = (1 << bitNum);
		if ((values & bitVal) === bitVal) {
			return bitVal;
		}
	}
	return defaultValue;
};

/**
 * Applies a one or more values to the current bitarray.
 * @method vga.irc.bitArray.add
 * @param {number} value bitarray of values.
 * @param {number} valueToApply bitarray of a value or values to apply.
 * @return updated values bitarray.
 * @api public
 */
vga.irc.bitArray.add = function(value, valueToApply) {
    return (value | valueToApply);
};

/**
 * Removes a one or more values to the current bitarray.
 * @method vga.irc.bitArray.remove
 * @param {number} value bitarray of values.
 * @param {number} valueToApply bitarray of a value or values to apply.
 * @return updated values bitarray.
 * @api public
 */
vga.irc.bitArray.remove = function(value, valueToApply) {
    return (value ^ (value & valueToApply));
};

/**
 * Determines if valueToEvaluate is in the bitarray.
 * @method vga.irc.bitArray.contains
 * @param {number} value bitarray of values.
 * @param {number} valueToEvaluate in the bitarray.
 * @return true if the bitarray contains the valueToEvaluate.
 * @api public
 */
vga.irc.bitArray.contains = function(value, valueToEvaluate) {
    return (value & valueToEvaluate === valueToEvaluate);
};

/**
 * A helper method that will compile an array of values into a bitarray.
 * @method vga.irc.bitArray.compileBitArray
 * @param {array} valueArray array of values.
 * @param {function} transformFunction the transformation function that transforms an array into a bitarray.
 * @param {number} defaultValue that is used if nothing is transformed or the valueArray is empty.
 * @return a compiled bitarray.
 * @api public
 */
vga.irc.bitArray.compileBitArray = function(valueArray, transformFunction, defaultValue){
    //Normalize the valueArray.
    valueArray = valueArray || [];

    if (!transformFunction) {
        throw new "The transformFunction is undefined.";
    }

    //Initialize the values to the defaultValue.
    let values = (defaultValue !== undefined ? defaultValue : 0);
    if (valueArray.length === 0) {
        return values;
    }
    else if (valueArray.length === 1) {
        return values | (transformFunction(valueArray[0]) || 0);
    }
    else {
        //Initialize the accumulator with the shadow role.
        return valueArray.reduce((a, b)=>{
            return a | (transformFunction[b] || 0);
        }, values);
    }
};

//-----------------------------------------------------------------
// Helper methods.
//-----------------------------------------------------------------

/**
 * Finds the most significant role based on the bit weight.
 * @method vga.irc.getMostSignificantRole
 * @param {number} roles bitarray of roles.
 * @return most significant role.
 * @api public
 */
vga.irc.getMostSignificantRole = function(roles) {
    return vga.irc.bitArray.getMostSignificantValue(roles, vga.irc.roles, vga.irc.roles.shadow);
};

/**
 * Finds the most significant status based on the bit weight.
 * @method vga.irc.getMostSignificantStatus
 * @param {number} status bitarray of status.
 * @return most significant status.
 * @api public
 */
vga.irc.getMostSignificantStatus = function(status) {
    return vga.irc.bitArray.getMostSignificantValue(status, vga.irc.status, vga.irc.status.nominal);
};
