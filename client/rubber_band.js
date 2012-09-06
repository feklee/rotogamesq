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

define(['util'], function (util) {
    'use strict';

    var sideLen, // side length of canvas
        corner1 = [0, 0],
        corner2 = [0, 0],
        isBeingDragged = false,
        needsToBeRemoved = false,
        lineWidth = 1,
        el;

    // may be negative
    function width() {
        return corner2[0] - corner1[0];
    }

    // may be negative
    function height() {
        return corner2[1] - corner1[1];
    }

    function renderRubberBand() {
        var ctx = el.getContext('2d');

        if (!needsToBeRemoved) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = lineWidth;
            ctx.lineJoin = 'round';
            ctx.strokeRect(corner1[0], corner1[1], width(), height());
        } else {
            needsToBeRemoved = false;
        }
    }

    // Also clears the canvas.
    function updateDimensions(newSideLen) {
        el.height = el.width = sideLen = newSideLen;
        lineWidth = 0.005 * sideLen;
    }

    function needsToBeRendered(newSideLen) {
        return sideLen !== newSideLen || isBeingDragged || needsToBeRemoved;
    }

    function onDragStart(pos) {
        corner2 = corner1 = pos;
        isBeingDragged = true;
    }

    function onDrag(pos) {
        corner2 = pos;
    }

    function onDragEnd() {
        isBeingDragged = false;
        needsToBeRemoved = true;
    }

    // Assumption: Rubber band canvas is located in the upper left corner.
    function onMouseDown(e) {
        onDragStart([e.pageX, e.pageY]);
    }

    function onTouchStart(e) {
        var touches = e.changedTouches;

        e.preventDefault();
        if (touches.length > 0) {
            onDragStart([touches[0].pageX, touches[0].pageY]);
        }
    }

    function onMouseMove(e) {
        if (isBeingDragged) {
            onDrag([e.pageX, e.pageY]);
        }
    }

    function onTouchMove(e) {
        var touches = e.changedTouches;

        e.preventDefault();
        if (isBeingDragged) {
            if (touches.length > 0) {
                onDrag([touches[0].pageX, touches[0].pageY]);
            }
        }
    }

    function onMouseUp(e) {
        if (isBeingDragged) {
            onDragEnd();
        }
    }

    function onTouchEnd(e) {
        var touches = e.changedTouches;

        e.preventDefault();
        if (isBeingDragged) {
            onDragEnd();
        }
    }

    function render(newSideLen) {
        if (needsToBeRendered(newSideLen) && el !== undefined) {
            updateDimensions(newSideLen);
            renderRubberBand();
        }
    }

    function onDocumentIsReady() {
        el = document.getElementById('rubberBandCanvas');

        el.addEventListener('mousedown', onMouseDown);
        el.addEventListener('touchstart', onTouchStart);

        // Some events are assigned to `window` so that they are also
        // registered when the mouse is moved outside of the window.
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('touchmove', onTouchMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('touchend', onTouchEnd);
    }

    util.whenDocumentIsReady(onDocumentIsReady);

    return Object.defineProperties({}, {
        'render': {value: render},
        'corner1': {get: function () { return Object.freeze(corner1); }},
        'corner2': {get: function () { return Object.freeze(corner2); }}
    });
});
