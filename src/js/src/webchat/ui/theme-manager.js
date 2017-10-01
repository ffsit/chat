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
// UI Component that manages themes.
///////////////////////////////////////////////////////////
(function(){

    /**
     * Class for the theme manager.
     * @class vga.webchat.ui.thememanager
     */
    vga.webchat.ui.thememanager = class {
        /**
         * The main constructor for the theme manager logic.
         * @method vga.webchat.ui.thememanager.startThemes
         * @param {object} options Additional optios.
         */
        constructor(options) {
            options = options || {};
            this._themes = options.themes || [];
        }
        /**
         * This is a helper method that starts the theme monitor.
         * @method vga.webchat.ui.thememanager.start
         */
        start() {

            //Do not allow the watcher to begin if no themes are present.
            if (this._themes.length === 0) {
                return;
            }

            let themesWatcher = () => {
                this._themesIntervalId = setTimeout(() => {
                    let now = new Date();
                    this._themes.forEach((theme)=>{
                        let beginDate = new Date(theme.beginDate);
                        let endDate = new Date(theme.endDate);
                        beginDate.setFullYear(now.getFullYear());
                        endDate.setFullYear(now.getFullYear());
                        $('body').toggleClass(theme.name, (now >= beginDate && now <= endDate));
                    })

                    //Recursively invoke the smooth scroll logic until it is terminated.
                    themesWatcher();
                }, 1000);
            }
            themesWatcher();
        }
        /**
         * This is a helper method that stops the theme monitor.
         * @method vga.webchat.ui.thememanager.stop
         */
        stop() {
            clearTimeout(this._themesIntervalId);
        }
    }
    
}());