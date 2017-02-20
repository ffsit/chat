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
vga.util = vga.util || {};

///////////////////////////////////////////////////////////
// Listener class that grants listener capabilities to any class.
///////////////////////////////////////////////////////////
(function(){

    /**
     * Websocket Listener class.
     * @class vga.util.listener
     */
    vga.util.listener = class {
        /**
         * Constructor for the listener class.
         * @method vga.util.listener
         * @param {object} methodMap An object (dictionary) that contains a collection of white-listed methods.
         */        
        constructor(methodMap, listeners) {
            this._methodMap = methodMap;
            this._listeners = listeners || [];
        }
        /**
         * Registers a listening object.
         * @method vga.util.listener.register
         * @param {object} listeningObject A listening object to register.  This can be an array of listening objects.
         */        
        register(listeningObject) {
            //NOTE: According to the MDN: Do not use this method if the second array is very large, because the maximum number of parameters that one function can take is limited in practice. See apply() for more details.
            if (Array.isArray(listeningObject)) {
                Array.prototype.push.apply(this._listeners, listeningObject);
            }
            else {
                this._listeners.push(listeningObject);
            }
        }
        /**
         * Internal method that triggers an event on all registered listeners.
         * @method invokeListeners
         * @param {string} eventName event to trigger.
         * @param {object} data socket event data.
         * @param {object} additionalData an additional block of data.
         */    
        invokeListeners(eventName, data, additionalData) {
            if (this._methodMap === undefined) {
                return;
            }

            if (this._listeners && this._methodMap.hasOwnProperty(eventName)){
                let transformedEventName = this._methodMap[eventName];
                //Iterate through all registered listeners.
                for(let i = 0; i < this._listeners.length; i++) {
                    //If the listener is a valid object and has the supported function then attempt to invoke it.
                    if (typeof(this._listeners[i]) === 'object' && typeof(this._listeners[i][transformedEventName]) === 'function') {
                        try {
                            this._listeners[i][transformedEventName](data, additionalData);
                        }
                        catch(exception) {
                            vga.util.debuglog.error(exception);
                        }
                    }
                }
            }
        }
    }
    //END OF vga.util.listener = class {...
}());

