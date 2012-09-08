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

/*jslint browser: true, maxerr: 50, maxlen: 79 */

/*global define */

define(['util', 'boards'], function (util, boards) {
    'use strict';

    var sideLen, // side length of canvas
        pos1 = [0, 0], // 1st corner of rectangle
        pos2 = [0, 0], // 2nd corner of rectangle
        isBeingDragged = false,
        isVisible = false,
        needsToBeRemoved = false,
        lineWidth = 1,
        el,
        onDragEnd2; // configurable handler, called at the end of `onDragEnd`

    // may be negative
    function width() {
        return pos2[0] - pos1[0];
    }

    // may be negative
    function height() {
        return pos2[1] - pos1[1];
    }

    function renderRubberBand() {
        var ctx = el.getContext('2d');

        if (!needsToBeRemoved) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = lineWidth;
            ctx.lineJoin = 'round';
            ctx.strokeRect(pos1[0], pos1[1], width(), height());
        } else {
            needsToBeRemoved = false;
        }
    }

    // Also clears the canvas.
    function updateDimensions(newSideLen) {
        el.height = el.width = sideLen = newSideLen;
        lineWidth = 0.005 * sideLen;
    }

    function newIsVisible() {
        return !boards.selectedBoard.isFinished;
    }

    function needsToBeRendered(newSideLen) {
        return (sideLen !== newSideLen || isBeingDragged || needsToBeRemoved ||
                isVisible !== newIsVisible());
    }

    function onDragStart(pos) {
        pos2 = pos1 = pos;
        isBeingDragged = true;
    }

    function onDrag(pos) {
        pos2 = pos;
    }

    function onDragEnd() {
        isBeingDragged = false;
        needsToBeRemoved = true;
        if (onDragEnd2 !== undefined) {
            onDragEnd2();
        }
        pos1 = pos2 = [0, 0]; // reset at the end - may be needed in `onDrag2`
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

    // top left corner
    function tlPos() {
        return [Math.min(pos1[0], pos2[0]), Math.min(pos1[1], pos2[1])];
    }

    // bottom right corner
    function brPos() {
        return [Math.max(pos1[0], pos2[0]), Math.max(pos1[1], pos2[1])];
    }

    function updateVisibility() {
        var style = el.style;

        isVisible = newIsVisible();
        if (isVisible) {
            style.display = 'block';
        } else {
            style.display = 'none';
        }
    }

    function render(newSideLen) {
        updateVisibility();
        updateDimensions(newSideLen);
        renderRubberBand();
    }

    util.whenDocumentIsReady(function () {
        el = document.getElementById('rubberBandCanvas');

        el.addEventListener('mousedown', onMouseDown);
        el.addEventListener('touchstart', onTouchStart);

        // Some events are assigned to `window` so that they are also
        // registered when the mouse is moved outside of the window.
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('touchmove', onTouchMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('touchend', onTouchEnd);
        window.addEventListener('touchcancel', onTouchEnd);
    });

    return Object.defineProperties({}, {
        animationStep: {value: function (newSideLen) {
            if (needsToBeRendered(newSideLen) && el !== undefined) {
                render(newSideLen);
            }
        }},

        isBeingDragged: {get: function () {
            return isBeingDragged;
        }},

        // Currently selected rectangle, defined by the positions of its top
        // left and its bottom right corner.
        selectedRect: {get: function () {
            return [tlPos(), brPos()];
        }},

        draggedToTheRight: {get: function () {
            return pos2[0] > pos1[0];
        }},

        onDragEnd: {set: function (x) {
            onDragEnd2 = x;
        }}
    });
});
