// Shows arrow indicating direction of rotation.

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
    'display_c_sys', 'display_canvas_factory'
], function (displayCSys, displayCanvasFactory) {
    'use strict';

    var sideLen,
        isVisible = false,
        visibilityNeedsToBeUpdated = true,
        needsToBeRendered = false,
        rotation,
        object;

    function renderArrow(ctx, posT) {
        var pos = displayCSys.posFromPosT(posT),
            tsl = displayCSys.tileSideLen;

        ctx.beginPath();
        ctx.lineWidth = tsl / 20;
        ctx.arc(pos[0] + tsl * 3 / 4, pos[1] + tsl * 3 / 4,
                tsl / 8, 0, Math.PI);
        ctx.stroke();
    }

    function render(el) {
        var ctx = el.getContext('2d');

        el.height = el.width = sideLen; // also clears canvas

        if (rotation !== undefined) {
            renderArrow(ctx, rotation.rectT[1]);
        }
    }

    object = Object.create(displayCanvasFactory.create(), {
        animationStep: {value: function () {
            var el = document.getElementById('arrowCanvas');

            if (this.visibilityNeedsToBeUpdated) {
                this.updateVisibility(el);
                if (this.isVisible) {
                    needsToBeRendered = true;
                }
            }

            if (needsToBeRendered) {
                render(el);
                needsToBeRendered = false;
            }
        }},

        rotation: {set: function (x) {
            if (rotation === undefined || !rotation.isEqualTo(x)) {
                rotation = x;
                if (this.isVisible) {
                    needsToBeRendered = true;
                }
            }
        }},

        sideLen: {set: function (x) {
            if (x !== sideLen) {
                sideLen = x;
                if (this.isVisible) {
                    needsToBeRendered = true;
                }
            }
        }}
    });

    object.hide();

    return object;
});
