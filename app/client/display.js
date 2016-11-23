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

/*jslint browser: true, maxlen: 80 */

/*global define */

define([
    'tiles_canvas', 'arrow_canvas', 'rubber_band_canvas', 'rot_anim_canvas',
    'display_c_sys'
], function (tilesCanvas, arrowCanvas, rubberBandCanvas, rotAnimCanvas,
             displayCSys) {
    'use strict';

    var style, render,
        isVisible = false,
        needsToBeRendered = true,
        layout = {width: 1, height: 1, left: 0, top: 0};

    style = function () {
        return document.getElementById('display').style;
    };

    render = function () {
        var s = style();

        s.width = layout.sideLen + 'px';
        s.height = layout.sideLen + 'px';
        s.top = layout.top + 'px';
    };

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

        layout: {set: function (newLayout) {
            layout = newLayout;
            displayCSys.sideLen = layout.sideLen;
            tilesCanvas.sideLen = layout.sideLen;
            arrowCanvas.sideLen = layout.sideLen;
            rubberBandCanvas.sideLen = layout.sideLen;
            rotAnimCanvas.sideLen = layout.sideLen;
            needsToBeRendered = true;
        }},

        isVisible: {set: function () {
            isVisible = true;
        }}
    });
});
