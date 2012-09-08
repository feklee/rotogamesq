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
    'tiles_display', 'rubber_band_canvas', 'rot_anim_canvas'
], function (tilesDisplay, rubberBandCanvas, rotAnimCanvas) {
    'use strict';

    var isVisible = false, sideLen;

    function el() {
        return document.getElementById('boardDisplay');
    }

    function updateDimensions(newSideLen) {
        var style;

        if (newSideLen !== sideLen) {
            style = el().style;
            style.width = newSideLen + 'px';
            style.height = newSideLen + 'px';
            sideLen = newSideLen;
        }
    }

    return Object.defineProperties({}, {
        animationStep: {value: function (newSideLen) {
            if (isVisible) {
                updateDimensions(newSideLen);
                tilesDisplay.animationStep(newSideLen);
                rubberBandCanvas.animationStep(newSideLen);
                rotAnimCanvas.animationStep(newSideLen);
            }
        }},

        show: {value: function () {
            el().style.display = 'block';
            isVisible = true;
        }}
    });
});
