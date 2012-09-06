// Rubber band that the user may drag to select tiles.

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

/*jslint browser: true, devel: true, maxerr: 50, maxlen: 79 */

/*global define */

define(function () {
    'use strict';

    var sideLen, corner1 = [0, 0], corner2 = [0, 0];

    function el() {
        return document.getElementById('rubberBandCanvas');
    }

    function renderRubberBand(e) {
    }

    function updateDimensions(e, newSideLen) {
        e.width = sideLen = newSideLen;
        e.height = newSideLen;
    }

    function needsToBeRendered(newSideLen) {
        return sideLen !== newSideLen;
    }

    function onMouseDown() {
        ;
    }

    function registerMouseEvents(e) {
        e.onmousedown = onMouseDown;
    }

    function render(newSideLen) {
        var e;

        if (needsToBeRendered(newSideLen)) {
            e = el();

            registerMouseEvents(e);
            updateDimensions(e, newSideLen);
            renderRubberBand(e);
        }
    }

    return Object.defineProperties({}, {
        'render': {value: render},
        'corner1': {get: function () { return corner1; }},
        'corner2': {get: function () { return corner2; }}
    });
});
