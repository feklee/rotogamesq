// Shows the interactive board, for playing.

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

define([
    'tiles_canvas', 'arrow_canvas', 'rubber_band_canvas', 'rot_anim_canvas',
    'display_c_sys', 'boards'
], function (tilesCanvas, arrowCanvas, rubberBandCanvas, rotAnimCanvas,
             displayCSys, boards) {
    'use strict';

    var isVisible = false,
        sideLen,
        needsToBeRendered = true;

    function render() {
        var s = document.getElementById('display').style;

        if (isVisible) {
            s.display = 'block';
        }
        s.width = sideLen + 'px';
        s.height = sideLen + 'px';
    }

    return Object.create(null, {
        animStep: {value: function () {
            if (isVisible) {
                if (needsToBeRendered) {
                    render();
                    needsToBeRendered = false;
                }
                displayCSys.animStep();
                tilesCanvas.animStep();
                arrowCanvas.animStep();
                rubberBandCanvas.animStep();
                rotAnimCanvas.animStep();
            }
        }},

        sideLen: {set: function (newSideLen) {
            if (newSideLen !== sideLen) {
                sideLen = newSideLen;
                displayCSys.sideLen = sideLen;
                tilesCanvas.sideLen = sideLen;
                arrowCanvas.sideLen = sideLen;
                rubberBandCanvas.sideLen = sideLen;
                rotAnimCanvas.sideLen = sideLen;
                needsToBeRendered = true;
            }
        }},

        show: {value: function () {
            isVisible = true;
            needsToBeRendered = true;
        }}
    });
});
