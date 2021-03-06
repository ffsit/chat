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
vga.webchat.connector = vga.webchat.connector || {};
vga.webchat.connector.kiwi = vga.webchat.connector.kiwi || {};

///////////////////////////////////////////////////////////
// Our Kiwi IRC Protocol.
// This is another abstracted logic layer that happens to extract the more raw kiwi protocol logic and to help clean up the connector class for readability.
// This class can be merged with the kiwi-connector if necessary.
///////////////////////////////////////////////////////////
(function(){

    //-----------------------------------------------------------------
    // Packet Status
    //-----------------------------------------------------------------
    // NOTE: Taken directly from the Kiwi IRC source.
    // https://github.com/prawnsalad/KiwiIRC/blob/6f90124e0f15d4cc373496110d1150ffd75072fc/client/assets/libs/engine.io.js
    vga.webchat.connector.kiwi.PACKET_STATUS = {
          OPEN:     0   // NA
        , CLOSE:    1   // NA
        , PING:     2   
        , PONG:     3
        , MESSAGE:  4
        , UPGRADE:  5   //Shouldn't be needed as the websocket protocol does this implicitly.
        , NOOP:     6
    };

    //-----------------------------------------------------------------
    // Protocol States
    //-----------------------------------------------------------------
    vga.webchat.connector.kiwi.STATES = {
        CLOSED: 0,
        CLOSING: 1,
        OPENING: 2,
        SOCKET_OPENED: 3,
        PROXY_OPENED: 4,
        PROXY_CONNECTED: 5,
        OPENED: 6
    };

    //-----------------------------------------------------------------
    // IRC Method Map
    //-----------------------------------------------------------------
    const methodMap = {
        'connect': 'onConnect',
        'channel': 'onChannel',
        'options': 'onOptions',
        'irc_error': 'onError',
        'disconnect': 'onDisconnect',
        'message': 'onMessage',
        'userlist': 'onUserlist',
        'userlist_end': 'onUserlistEnd',
        'channel_info': 'onChannelInfo',
        'nick': 'onNick',
        'mode': 'onMode',
        'topic': 'onTopic',
        'quit': 'onQuit'
    };

    //-----------------------------------------------------------------
    // Defaults
    //-----------------------------------------------------------------
    vga.webchat.connector.kiwi.DEFAULT_PING_INTERVAL = 15000;
    vga.webchat.connector.kiwi.DEFAULT_HEARTBEAT_INTERVAL = 60000;

    //-----------------------------------------------------------------
    // Prefixes
    //-----------------------------------------------------------------
    vga.webchat.connector.kiwi.PROXY_PREFIX = 'kiwi';
    vga.webchat.connector.kiwi.IRC_PREFIX = 'irc';

    //-----------------------------------------------------------------
    // Helper functions
    //-----------------------------------------------------------------

    /**
     * Internal method to create an authentication packet to conform to the auth packet for the Kiwi IRC server.
     * @method createAuthPacket
     * @param {object} params auth arguments to pass to the Kiwi IRC server.
     * @returns {object} returns an object that conforms to the Kiwi IRC server's authentication block. 
     */
    function createAuthPacket(params) {
        params = params || {};
        return {
            nick: params.nick,
            hostname: params.hostname,
            port: params.port,
            ssl: params.ssl,
            password: params.password
        };
    };
    /**
     * Internal method to create a raw packet to comply with the Kiwi IRC server.
     * @method createRawPacket
     * @param {string} method name of the method to pass to the Kiwi IRC server.
     * @param {object} params additional arguments to pass to the Kiwi IRC server.
     * @returns {object} returns an object that conforms to the Kiwi IRC server's raw packet. 
     */
    function createRawPacket(method, params) {
        return { method: method, params: params };
    };
    /**
     * Internal method to create a packet to relay to the IRC server.
     * @method createIRCPacket
     * @param {number} connectionId assigned to the user on login.
     * @param {string} method name of the method to pass to the IRC server.
     * @param {object} data arguments to pass to the IRC server.
     * @returns {object} returns an object that conforms to the IRC packet.
     */
    function createIRCPacket(connectionId, method, data) {
        return createRawPacket(vga.webchat.connector.kiwi.IRC_PREFIX + '.' + method, [connectionId,data,null]);
    };
    /**
     * Internal method to create a packet to relay to the kiwi server.
     * @method createKiwiProxyPacket
     * @param {string} method name of the method to pass to the Kiwi IRC server.
     * @param {object} params arguments to pass to the Kiwi IRC server.
     * @returns {object} returns an object that conforms to the Kiwi IRC packet. 
     */
    function createKiwiProxyPacket(method, params) {
        return createRawPacket(vga.webchat.connector.kiwi.PROXY_PREFIX + '.' + method, (params || [])); 
    };
    /**
     * Internal method that parses the Kiwi IRC message.
     * @method parseMessage
     * @param {object} message A Kiwi IRC message. 
     * @returns {object} returns a parsed object that contains the status and packet from the Kiwi IRC server. 
     */
    function parseMessage(message) { 
        return {
            status: parseInt(message.substring(0,1)),
            packet: JSON.parse(message.substring(1) || '{}')
        };
    }

    /**
     * Constructor for the kiwi protocol wrapper.
     * @class vga.webchat.connector.kiwi.protocolwrapper
     */
    vga.webchat.connector.kiwi.protocolwrapper = class {
        /**
         * Main constructor for the kiwi protocol wrapper.
         * @method vga.webchat.connector.kiwi.protocolwrapper.constructor
         * @param {string} url the connector is opening.
         * @param {object} options Additional options for the connector.
         */        
        constructor (url, options) {
            //-----------------------------------------------------------------
            // Versioning
            //-----------------------------------------------------------------

            //Normalize.
            options = options || {};

            //Maintain our connection state and additional info.
            this._url = url || '';
            this._state = vga.webchat.connector.kiwi.STATES.CLOSED;
            this._connectionInfo = {};

            //Timer Ids that regulate the heartbeat nad ping intervals.
            this._heartbeatId = null;
            this._pingId = null;

            //Our listeners and socket adapters.
            this._listener = new vga.util.listener(methodMap, options.listeners);
            this._socket = new vga.util.websocket(this._url, {listeners: [this]});
        }
        /**
         * Returns the current state.
         * @method vga.webchat.connector.kiwi.protocolwrapper.getState
         */
        getState() {
            return this._state;
        }
        /**
         * A safe send method to send kiwi specific data to the socket.
         * @method vga.webchat.connector.kiwi.protocolwrapper.sendRawData
         * @param {object} data the data to send to the socket.
         * @param {number} status the kiwi status number.
         * @param {bool} blockLogging blocks logging when instructed.
         */
        sendRawData(data, status, blockLogging) {
            //We'll default to status of message if no status is provided.
            status = (status !== undefined) ? status : vga.webchat.connector.kiwi.PACKET_STATUS.MESSAGE;
            if (this._socket) {
                let message = (data) ? (status + (typeof(data) === 'object' ? JSON.stringify(data) : data)) : status;
                this._socket.send(message, blockLogging);
            }
            return this;
        }
        /**
         * A safe send method that sends IRC data.
         * @method vga.webchat.connector.kiwi.protocolwrapper.sendIRCData
         * @param {number} connectionId assigned to the user on login.
         * @param {string} method name of the method to pass to the IRC server.
         * @param {object} data arguments to pass to the IRC server.
         */ 
        sendIRCData(method, data) {
            return this.sendRawData(createIRCPacket((this._connectionInfo || {connectionId: 0}).connectionId, method, data));
        }
        /**
         * Attempts to open a connection to the kiwi IRC server.   This method is idempotent and safe as multiple calls have no side-effects.
         * @method vga.webchat.connector.kiwi.protocolwrapper.open
         * @param {object} authenticationParams authentication parameters to set to the server.
         */
        open(authenticationParams) {
            //Normalize.
            authenticationParams = authenticationParams || {};

            //Set the state to opening until the socket has opened.
            this._state = vga.webchat.connector.kiwi.STATES.OPENING;
            
            //If the socket is already valid
            if (this._socket) {
                vga.util.debuglog.info('[vga.webchat.connector.kiwi.protocolwrapper.open]: Attempting to open.');
                this._socket.open(authenticationParams);
            }

            return this;
        }
        /**
         * Internal method to clean up after a socket is closed.
         * This method should be idempotent and safe to call multiple times.
         * @method vga.webchat.connector.kiwi.protocolwrapper.cleanUp
         */    
        cleanUp() {
            //Shutdown the heartbeat.
            clearTimeout(this._heartbeatId);
            clearTimeout(this._pingId);
            this._heartbeatId = null;
            this._pingId = null;
            return this;
        }
        /**
         * Closes an open connection.  This method is idempotent and safe as multiple calls have no side-effects.
         * @method vga.webchat.connector.kiwi.protocolwrapper.connect
         * @param {string} message a temporary message to send when closing the socket.
         */       
        close(message) {
            //Clean up all the ancillary processes.
            this.cleanUp();

            //Only close the state if we haven't closed it yet.
            if (this._state !== vga.webchat.connector.kiwi.STATES.CLOSED && this._state !== vga.webchat.connector.kiwi.STATES.CLOSING) {
                this._state = vga.webchat.connector.kiwi.STATES.CLOSING;
                this._socket && this._socket.close();
            }

            return this;
        }
        /**
         * Disposes of the connector, cleaning up any additional resources.
         * @method vga.webchat.connector.kiwi.protocolwrapper.dispose
         */     
        dispose() {
            this.close();
            this._socket = null;
            return this;
        }
        //-----------------------------------------------------------------
        // IRC Events
        // These events are triggered by the Kiwi Proxy server or the IRC server.
        //-----------------------------------------------------------------
        /**
         * This event is triggered when the proxy connection has been opened and the irc server is pending a connection.
         * @method vga.webchat.connector.kiwi.protocolwrapper.onProxyConnected
         * @param {object} proxyInfo proxy info such as sid and timeout information.
         */
        onProxyOpened(proxyInfo) {
            proxyInfo = proxyInfo || {};
            vga.util.debuglog.info(`[vga.webchat.connector.kiwi.protocolwrapper.onProxyOpened]: Proxy Connection Opened (Sid: ${proxyInfo.sid}, PingInterval: ${proxyInfo.pingInterval}, PingTimeout: ${proxyInfo.pingTimeout}).`);
            this._state = vga.webchat.connector.kiwi.STATES.PROXY_OPENED;
            
            this._connectionInfo = {
                sid: proxyInfo.sid,
                pingInterval: proxyInfo.pingInterval,
                pingTimeout: proxyInfo.pingTimeout,
                connectionId: 0
            };
        }
        /**
         * This event is triggered when the proxy connection has connected to the irc server.
         * @method vga.webchat.connector.kiwi.protocolwrapper.onProxyConnected
         * @param {object} proxyInfo proxy info such as sid and timeout information.
         */
        onProxyConnected(proxyInfo) {
            proxyInfo = proxyInfo || {};
            this._state = vga.webchat.connector.kiwi.STATES.PROXY_CONNECTED;
            vga.util.debuglog.info('[vga.webchat.connector.kiwi.protocolwrapper.onProxyConnected]: Proxy Connected.');

            //Create the heartbeat interval.
            if (!this._heartbeatId)
            {
                let heartBeatInterval = (this._connectionInfo.pingTimeout || vga.webchat.connector.kiwi.DEFAULT_HEARTBEAT_INTERVAL);
                let heartbeat = () => {
                    this._heartbeatId = setTimeout(() => {
                        this.sendRawData(createKiwiProxyPacket('heartbeat'));
                        heartbeat();
                    }, heartBeatInterval);
                };
                heartbeat();
            }

            //Create the ping interval.
            if (!this._pingId)
            {
                let pingInterval = (this._connectionInfo.pingInterval || vga.webchat.connector.kiwi.DEFAULT_PING_INTERVAL);
                let ping = () => {
                    this._pingId = setTimeout(() => {
                        this.sendRawData('', vga.webchat.connector.kiwi.PACKET_STATUS.PING);
                        ping();
                    }, pingInterval);
                };
                ping();
            }
        }
        /**
         * This event is triggered when the kiwi connection to IRC has been connected.
         * @method vga.webchat.connector.kiwi.protocolwrapper.onConnect
         * @param {object} event socket event data. 
         */
        onConnect(event) {
            if (this._state === vga.webchat.connector.kiwi.STATES.PROXY_CONNECTED) {
                vga.util.debuglog.info('[vga.webchat.connector.kiwi.protocolwrapper.onConnect]: Received a PROXY_CONNECTED state, setting OPENED state.');
                this._state = vga.webchat.connector.kiwi.STATES.OPENED;
                this._connectionInfo.connectionId = event.connection_id;
            }
        }

        //-----------------------------------------------------------------
        // Socket Events
        // These events are triggered on websocket events only and may contain raw message information that is raw and unparsed.
        //-----------------------------------------------------------------
        /**
         * An event that is triggered when the socket has been opened.
         * @method vga.webchat.connector.kiwi.protocolwrapper.onOpen
         * @param {object} event socket event data. 
         * @param {object} authenticationParams emphemeral authentication parameters passed for authentication, not to be stored in memory.
         */
        onOpen(event, authenticationParams) {
            this._state = vga.webchat.connector.kiwi.STATES.SOCKET_OPENED;
            vga.util.debuglog.info('[vga.webchat.connector.kiwi.protocolwrapper.onOpen]', event);
            this.sendRawData('', vga.webchat.connector.kiwi.PACKET_STATUS.UPGRADE);

            //We have to implement wait logic, as we may already have an open websocket connection, but the Kiwi proxy may still be trying to establish a connection with the IRC server.
            //Failing to implement this wait logic will result in intermittent issues where the authentication information is sent and lost since Kiwi has not established a connection to the IRC Server.
            //this.sendRawData(createKiwiProxyPacket("client_info", [{"build_version": vga.webchat.connector.kiwi.CLIENT_VERSION.toString()}]));
            //this.sendRawData(createKiwiProxyPacket('connect_irc', createAuthPacket(authenticationParams)));
            let wait = () => {
                setTimeout(() => {
                    //Wait until we are in the proxy connected state.
                    if (this._state === vga.webchat.connector.kiwi.STATES.PROXY_CONNECTED) {
                        this.sendRawData(createKiwiProxyPacket("client_info", [{"build_version": vga.webchat.connector.kiwi.CLIENT_VERSION.toString()}]));
                        this.sendRawData(createKiwiProxyPacket('connect_irc', createAuthPacket(authenticationParams)), undefined, false);
                        return;
                    }
                    //Cancel the wait operation if the state changes to CLOSED before completing the transition to the PROXY_CONNECTED state.
                    else if (this._state === vga.webchat.connector.kiwi.STATES.CLOSED) {
                        vga.util.debuglog.info('[vga.webchat.connector.kiwi.protocolwrapper.onOpen]: Received a CLOSED state before completing the transition to the PROXY_CONNECTED state.');
                        return;
                    }

                    wait();
                }, 500);
            };

            //Begin waiting.
            wait();
        }
        /**
         * An event that is triggered when the socket has closed.
         * @method vga.webchat.connector.kiwi.protocolwrapper.onClose
         * @param {object} event socket event data.
         */
        onClose(event) {
            vga.util.debuglog.info(`[vga.webchat.connector.kiwi.protocolwrapper.onClose]: (State before close: ${this._state}).`);
            
            //Determine if the client closed the socket or the server did.
            //If the state is closing then the user initiated the close action, otherwise the server closed the connection.
            let eventData;
            if (this._state === vga.webchat.connector.kiwi.STATES.CLOSING) {
                eventData = {reason: 'User closed the connection.', closedByServer: false, existingConnection: true};
            }
            else {
                let existingConnection = (this._state === vga.webchat.connector.kiwi.STATES.OPENED);
                eventData = {reason: 'Server closed the connection.', closedByServer: true, existingConnection: existingConnection};
            }

            //Set the state to closed and run cleanup if it has not been done already.
            this._state = vga.webchat.connector.kiwi.STATES.CLOSED;
            this.cleanUp();

            //Trigger the disconnect event.
            this._listener.invokeListeners('disconnect', eventData);
        }
        /**
         * An event that is triggered whenever the socket sends a message.
         * @method vga.webchat.connector.kiwi.protocolwrapper.onMessage
         * @param {object} event socket event data.
         */
        onMessage(event) {
            let parsedMessage = parseMessage(event.data); 

            if (parsedMessage.packet === undefined) {
                vga.util.debuglog.info('[vga.webchat.connector.kiwi.protocolwrapper.onMessage]: Empty message.');
                return;
            }

            switch(parsedMessage.status) {
                case vga.webchat.connector.kiwi.PACKET_STATUS.OPEN:
                    this.onProxyOpened(parsedMessage.packet);
                    break;
                case vga.webchat.connector.kiwi.PACKET_STATUS.MESSAGE:
                    {
                        let serverMessage = parsedMessage.packet;
                        let eventData = serverMessage.params[0].data || {};
                        let command = serverMessage.params[0].command.toLowerCase() || '';
                        vga.util.debuglog.info(`[vga.webchat.connector.kiwi.protocolwrapper.onMessage]: (EventData: ${eventData}, Command: ${command}).`, eventData);

                        if (serverMessage.method === vga.webchat.connector.kiwi.PROXY_PREFIX) {
                            this.onProxyConnected(eventData);
                        }
                        else if (serverMessage.method === vga.webchat.connector.kiwi.IRC_PREFIX) {
                            //Special messages.
                            if (command === 'connect') {
                                this.onConnect(eventData);
                            }
                            else if (command == 'disconnect') {
                                this.onClose({reason: eventData.reason});
                                return;
                            }

                            this._listener.invokeListeners(command, eventData);
                        }
                        else {
                            vga.util.debuglog.info(`[vga.webchat.connector.kiwi.protocolwrapper.onMessage]: (Unknown method: ${serverMessage.method}).`);
                        }
                    }
                    break;
                case vga.webchat.connector.kiwi.PACKET_STATUS.PONG:
                    vga.util.debuglog.info("[vga.webchat.connector.kiwi.protocolwrapper.onMessage]: Server Pong.");
                    break;
                case vga.webchat.connector.kiwi.PACKET_STATUS.PING:
                    vga.util.debuglog.info("[vga.webchat.connector.kiwi.protocolwrapper.onMessage]: Server Ping responding with Pong.");
                    this.sendRawData(vga.webchat.connector.kiwi.PACKET_STATUS.PONG);
                    break;
                default:
                    vga.util.debuglog.info(`[vga.webchat.connector.kiwi.protocolwrapper.onMessage]: (Unhandled status: ${parsedMessage.status}).`);
                    break;
            }
        }
    }
    //END OF vga.webchat.connector.kiwi.protocolwrapper = class {...
}());
