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
vga.util = vga.util || {};

///////////////////////////////////////////////////////////
// Websocket wrapper.
///////////////////////////////////////////////////////////
(function(){

    /**
     * Defines the various websocket states.
     */
    vga.util.websocket_states = {
        CONNECTING: 0,
        OPEN: 1,
        CLOSING: 2,
        CLOSED: 3
    }

    const whiteListedMethods = {
        'onOpen': 'onOpen',
        'onClose' : 'onClose',
        'onMessage': 'onMessage',
        'onError': 'onError'
    };

    /**
     * Websocket wrapper class.
     * @class vga.util.websocket
     */
    vga.util.websocket = class {
        /**
         * Constructor for the websocket wrapper.
         * @method vga.util.websocket
         * @param {string} url The URL to attempt to open a websocket connection with.
         * @param {object} options Additional options for the websocket wrapper.
         * @param {object} protocols Additional websocket protocols to pass to the server.
         */ 
        constructor(url, options, protocols) {
            //Normalize the options.
            options = options || {};
            
            this._url = url || '';
            this._protocols = protocols || []; 

            //Determines if the JSON data is dumped to the console.
            //By default is disabled.
            this._listener = new vga.util.listener(whiteListedMethods, options.listeners);
        }
        /**
         * Registers a listening object to the socket.
         * @method vga.util.websocket.register
         * @param {object} listeningObject A listening object to register.  This can be an array of listening objects.
         */
        register(listeningObject) {
            this._listener.register(listeningObject);
        }
        /**
         * Attempts to open a websocket connection at the URL.
         * @method vga.util.websocket.open
         * @param {object} authenticationParams A collection of additional authentication parameters depending on the server. This information is sent immediately after the socket is opened.
         */
        open(authenticationParams) {
            if (!this._webSocket) {
                this._webSocket = new WebSocket(this._url, this._protocols);
                this._webSocket.onopen = (event) => { this._listener.invokeListeners('onOpen', event, authenticationParams); };
                this._webSocket.onclose = (event) =>  { this.close(); this._listener.invokeListeners('onClose', event); };
                this._webSocket.onmessage = (event) => { this._listener.invokeListeners('onMessage', event); };
                this._webSocket.onerror = (event) => { this._listener.invokeListeners('onError', event); };
            }
        }
        /**
         * Attempts to send data through the open websocket connection.
         * @method vga.util.websocket.send
         * @param {object} data Data to send through the websocket.
         */
        send(data) {
            if (this._webSocket) {
                if (this._webSocket.readyState === vga.util.websocket_states.OPEN || this._webSocket.readyState === vga.util.websocket_states.OPENING) {
                    vga.util.debuglog.info(`[vga.util.websocket.send] (ReadyState: ${this._webSocket.readyState}): `, data);
                    this._webSocket.send(data);
                    return;
                }
            }
            
            vga.util.debuglog.info('[vga.util.websocket.send]: The socket is no longer open.');
        }
        /**
         * Attempts to close any open websocket connections.
         * @method vga.util.websocket.close
         */
        close(status, message) {
            if (this._webSocket) {
                if (this._webSocket.readyState === vga.util.websocket_states.OPEN || this._webSocket.readyState === vga.util.websocket_states.OPENING) {
                    vga.util.debuglog.info('[vga.util.websocket.close]: Closing the socket.');
                    this._webSocket.close(status, message);
                }
            }

            this._webSocket = null;
        }
        /**
         * Disposes of the wrapper, cleaning up any additional resources.
         * @method vga.util.websocket.dispose
         */
        dispose() {
            vga.util.debuglog.info('[vga.util.websocket.dispose]: Invoked.');
            this.close();
        }
    }
    //END OF vga.util.websocket = class {...
}());

