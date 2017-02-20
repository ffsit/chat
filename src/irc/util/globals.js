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
* All rights reserved.
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
var vga = vga || { };
vga.util = vga.util || { debug: false };

///////////////////////////////////////////////////////////
// Global functionality.
///////////////////////////////////////////////////////////
vga.util.debuglog = vga.util.debuglog || {};

/**
 * Global console.log method that is only invoked if debugging is enabled.
 * @method vga.util.debuglog.info
 * @param {String} msg Contains the message to write to the console.
 * @arguments writes all argumenst to the console if more than one is passed.
 * @api public
 */
vga.util.debuglog.info = function(msg) { vga.util.debug && console.log((arguments.length === 1) ? msg : arguments); };

/**
 * Global console.warning method that is only invoked if debugging is enabled.
 * @method vga.util.debuglog.warning
 * @param {String} msg Contains the message to write to the console.
 * @arguments writes all argumenst to the console if more than one is passed.
 * @api public
 */
vga.util.debuglog.warning = function(msg) { vga.util.debug && console.warn((arguments.length === 1) ? msg : arguments); };

/**
 * Global console.error method that is only invoked if debugging is enabled.
 * @method vga.util.debuglog.error
 * @param {String} msg Contains the message to write to the console.
 * @arguments writes all argumenst to the console if more than one is passed.
 * @api public
 */
vga.util.debuglog.error = function(msg) { vga.util.debug && console.error((arguments.length === 1) ? msg : arguments); };

/**
 * Enables or disables the global debug flag.
 * @method vga.util.enableDebug
 * @param {bool} enable Determines if global debugging is enabled or not.
 * @api public
 */
vga.util.enableDebug = function (enable) { vga.util.debug = ((enable === undefined) ? true : enable); }

/**
 * Safely disposes of the object.
 * @method vga.util.safeDispose
 * @param {object} obj to dispose.
 * @api public
 */
vga.util.safeDispose = (obj) => {
    obj && obj.dispose && obj.dipose();
    return obj = null;
}

/**
 * Encodes HTML characters in the string.
 * @method vga.util.encodeHTML
 * @param {string} rawString to sanitize by encoding any HTML characters.
 * @api public
 */
vga.util.encodeHTML = (rawString) => {
    return rawString.replace(/[&<>'"]/g, (c) => {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&apos;'
        }[c];
    });
}

//-----------------------------------------------------------------
// Version object
//-----------------------------------------------------------------

/**
 * Creates a version object.
 * @method vga.util.enableDebug
 * @param {int} Major major version number.
 * @param {int} Minor minor version number.
 * @param {int} Revision revision version number.
 * @api public
 */
vga.util.version = class {
    constructor(Major, Minor, Revision) {
        this.Major = Major || 0;
        this.Minor = Minor || 0;
        this.Revision = Revision || 0;
    }

    /**
    * @return {string} Returns the version number as a string as the format Major.Minor.Revision.
    * @override
    */
    toString() {
        return `${this.Major}.${this.Minor}.${this.Revision}`;
    }

    /**
    * Returns true if this version is equal to the passed version.
    * @param {object} The version to compare against.
    * @return {bool} Returns true if the version numbers are equal.
    */
    equal(version) {
        if (version instanceof vga.util.version) {
            return (version.Major === this.Major)
                && (version.Minor === this.Minor)
                && (version.Revision === this.Revision);
        }

        return false;
    }
};

//-----------------------------------------------------------------
// Exceptions
//-----------------------------------------------------------------

/**
* @constructor
*/
vga.util.exception = class {
    constructor(caller, message) {
        this._caller = caller;
        this._message = message;
    }
    toString() {
        return `vga${((caller !== undefined) ? ("." + caller) : "")}:${message}`;
    }
}