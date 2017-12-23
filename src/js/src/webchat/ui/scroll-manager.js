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
vga.webchat.ui = vga.webchat.ui || {};

///////////////////////////////////////////////////////////
// UI Component that manages scrolling.
///////////////////////////////////////////////////////////
(function(){

    /**
     * Class for the theme manager.
     * @class vga.webchat.ui.scrollmanager
     */
    vga.webchat.ui.scrollmanager = class {
        /**
         * The main constructor for the scroll manager logic.
         * @method vga.webchat.ui.scrollmanager.startThemes
         * @param {object} options Additional optios.
         */
        constructor(options) {
            options = options || {};

            if (!options.$channelContainer) {
                throw new vga.util.exception('ui.scrollmanager', 'The $channelContainer must be set.');
            }

            this._$channelContainer = options.$channelContainer;
            this._smoothScroll = (options.smoothScroll !== undefined) ? options.smoothScroll : true;
            this._smoothScrollState = vga.webchat.smoothScrollState.stopped;
        }
        /**
         * Enables or disables smooth scrolling.
         * @method vga.webchat.ui.scrollmanager.enableSmooth
         * @param {bool} smoothScroll true to enable, false to disable.
         */
        enableSmooth(smoothScroll) {
            this._smoothScroll = smoothScroll;
        }
        /**
         * This is a helper method that starts and handles the Kshade smooth scroll logic.
         * @method vga.webchat.ui.scrollmanager.start
         */
        start() {
            let smoothScroll = () => {
                //If scrolling is stopped prevent recursive calls to this function to continue.
                if (this._smoothScrollState === vga.webchat.smoothScrollState.stopped) {
                    return;
                }
                this._smoothScrollIntervalId = setTimeout(() => {
                    //Prevent any scrolling if scrolling is paused.
                    if (this._smoothScrollState === vga.webchat.smoothScrollState.started) {
                        //Find all available windows except the template.
                        let $windows = this._$channelContainer.find(':not(#channel-tab-template)').find('.channel-window');
                        $.each($windows, (index, e) => {
                            //Begin Kshade's smooth, smoooooth scrolling, awwww yeah.
                            // Caff (12/10/17) [V1.1.4] --- Added logic to prevent calling scrollTop unless is at least some difference in height & top.
                            let scrollHeight = $(e).prop("scrollHeight");
                            let scrollTop = $(e).prop("scrollTop");
                            let scrollBottom = Math.ceil(scrollTop + $(e).height());
                            if (scrollBottom < scrollHeight) {
                                
                                if (this._smoothScroll) {
                                    let scrollDownRate = 1;
                                    if (scrollBottom < scrollHeight - 140) {
                                        scrollDownRate = Math.round(1 + ((scrollHeight - scrollBottom) / 50));
                                    }
                                    //vga.util.debuglog.info(`scrollHeight: ${scrollHeight} scrollTop: ${scrollTop} scrollDownRate: ${scrollDownRate}`);
                                    scrollHeight = scrollTop + scrollDownRate;
                                }

                                $(e).scrollTop(scrollHeight);
                            }
                        });
                    }
                    //Recursively invoke the smooth scroll logic until it is terminated.
                    smoothScroll();
                }, 33);
            }
            this._smoothScrollState = vga.webchat.smoothScrollState.started;
            smoothScroll();
        }
        /**
         * This is a helper method that stops the smooth scrolling.
         * @method vga.webchat.ui.scrollmanager.stop
         */
        stop() {
            this._smoothScrollState = vga.webchat.smoothScrollState.stopped;
            clearTimeout(this._smoothScrollIntervalId);
        }
        /**
         * This is a helper method that pauses the smooth scrolling.
         * @method vga.webchat.ui.scrollmanager.pause
         * @param {bool} activate or deactivate the pause logic 
         */
        pause(activate) {
            if (this._smoothScrollState !== vga.webchat.smoothScrollState.stopped) {
                this._smoothScrollState = activate ? vga.webchat.smoothScrollState.paused : vga.webchat.smoothScrollState.started;
            }
        }
    }
    
}());