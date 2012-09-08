// Shows rotation animation.

// Copyright 2012 Felix E. Klee <felix.klee@inka.de>
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy
// of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.

/*jslint browser: true, maxerr: 50, maxlen: 79 */

/*global define */

define(function () {
    'use strict';

    var sideLen,
        requestRedraw = true;

//fixme:    var sideLen; // side length of canvas

    function render() {
        var el = document.getElementById('rotAnimCanvas'),
            ctx = el.getContext('2d');

        el.width = el.height = sideLen; // also clears canvas

        ctx.save();

        ctx.restore();
    }

/*fixme:    function mainEl() {
        return document.getElementById('rotationCanvas');
    }*/

/*fixme:    function needsToBeRendered(newSideLen) {
        return sideLen !== newSideLen;
    }*/

    // Also clears the canvas.
/*fixme:    function updateDimensions(newSideLen) {
        var el = mainEl();
        el.height = el.width = sideLen = newSideLen;
    }*/

/*fixme:    function render(newSideLen) {
        updateDimensions(newSideLen);
    }*/

    return Object.create(null, {
        animationStep: {value: function () {
/*fixme:            if (needsToBeRendered(newSideLen)) {
                render(newSideLen);
            }*/
        }},

        sideLen: {set: function (x) {
            if (x !== sideLen) {
                sideLen = x;
                requestRedraw = true;
            }
        }},

        staticCtx: {value: staticCtx},

        animIsRunning: {value: false}, // fixme

        // fixme: createAnimation from tilesCanvas, when it is detected that
        // tiles have changed but board stayed the same. Use last rotation as
        // rotation (`board.lastRotation` - stored separate from undo/redo
        // history, if defined).
        //
        // fixme: perhaps don't trigger from outside
        //
        // fixme: use posFromPosT, etc. from `tiles_canvas`
        //
        // Rotate with CSS3 transforms (margin: -50%, -50%)
        //
        // fixme: redraw when size changes
        createAnimation: {value: function () {
            // fixme: use lastRotation
        }}
    });
});
