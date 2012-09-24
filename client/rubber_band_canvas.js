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

define([
    'util', 'rect_t_factory', 'display_c_sys', 'display_canvas_factory'
], function (util, rectTFactory, displayCSys, displayCanvasFactory) {
    'use strict';

    var sideLen, // side length of canvas
        canvasPagePos, // position of canvas on page
        pos1 = [0, 0], // 1st corner of rectangle
        pos2 = [0, 0], // 2nd corner of rectangle
        selectedRectT = rectTFactory.create([0, 0], [0, 0]),
        draggedToTheRight,
        needsToBeRendered = true,
        isBeingDragged = false,
        lineWidth = 1,
        onDrag2, // configurable handler, called at the end of `onDrag`
        onDragStart2,
        onDragEnd2;

    // may be negative
    function width() {
        return pos2[0] - pos1[0];
    }

    // may be negative
    function height() {
        return pos2[1] - pos1[1];
    }

    function render(el) {
        var ctx = el.getContext('2d');

        el.height = el.width = sideLen; // also clears canvas
        lineWidth = 0.005 * sideLen;

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = lineWidth;
        ctx.lineJoin = 'round';
        ctx.strokeRect(pos1[0], pos1[1], width(), height());
    }

    // top left corner
    function tlPos() {
        return [Math.min(pos1[0], pos2[0]), Math.min(pos1[1], pos2[1])];
    }

    // bottom right corner
    function brPos() {
        return [Math.max(pos1[0], pos2[0]), Math.max(pos1[1], pos2[1])];
    }

    // Updates the selected rectangle, which is represented by an array:
    //
    // * 0: position (tile coordinates) of top left selected tile
    //
    // * 1: position of bottom right selected tile
    //
    // A tile is selected, if it is inside or if it is touched by the rubber
    // band. Spacing is *not* part of tiles!
    function updateSelectedRectT() {
        var tlPos2 = displayCSys.incIfInSpacing(tlPos()),
            brPos2 = displayCSys.decIfInSpacing(brPos()),
            tlPosT = displayCSys.posTInBounds(
                displayCSys.posTFromPos(tlPos2).map(Math.floor)
            ),
            brPosT = displayCSys.posTInBounds(
                displayCSys.posTFromPos(brPos2).map(Math.floor)
            );

        selectedRectT = rectTFactory.create(tlPosT, brPosT);
    }

    function updateDraggedToTheRight() {
        draggedToTheRight = pos2[0] > pos1[0];
    }

    // Needed for calculating position when dragging.
    function updateCanvasPagePos() {
        canvasPagePos =
            util.pagePos(document.getElementById('rubberBandCanvas'));
    }

    // assumes that canvas is at position 0, 0 in the document
    function onDragStart(pos) {
        updateCanvasPagePos();
        pos2 = pos1 = [pos[0] - canvasPagePos[0], pos[1] - canvasPagePos[1]];
        updateSelectedRectT();
        updateDraggedToTheRight();
        isBeingDragged = true;
        needsToBeRendered = true;
        if (onDragStart2 !== undefined) {
            onDragStart2();
        }
    }

    function onDrag(pos) {
        pos2 = [pos[0] - canvasPagePos[0], pos[1] - canvasPagePos[1]];
        updateSelectedRectT();
        updateDraggedToTheRight();
        needsToBeRendered = true;
        if (onDrag2 !== undefined) {
            onDrag2(selectedRectT, draggedToTheRight);
        }
    }

    function onDragEnd() {
        isBeingDragged = false;
        needsToBeRendered = true;
        pos1 = pos2 = [0, 0]; // reset
        updateSelectedRectT();
        updateDraggedToTheRight();
        if (onDragEnd2 !== undefined) {
            onDragEnd2();
        }
    }

    function onMouseDown(e) {
        onDragStart([e.pageX, e.pageY]);
    }

    function onTouchStart(e) {
        var touches;

        e.preventDefault();
        touches = e.changedTouches;
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

    util.whenDocumentIsReady(function () {
        var el = document.getElementById('rubberBandCanvas');

        el.addEventListener('mousedown', onMouseDown);
        el.addEventListener('touchstart', onTouchStart);

        // Some events are assigned to `window` so that they are also
        // registered when the mouse is moved outside of the element.
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('touchmove', onTouchMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('touchend', onTouchEnd);
        window.addEventListener('touchcancel', onTouchEnd);
    });

    return Object.create(displayCanvasFactory.create(), {
        animStep: {value: function () {
            var el = document.getElementById('rubberBandCanvas');

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

        isBeingDragged: {get: function () {
            return isBeingDragged;
        }},

        sideLen: {set: function (x) {
            if (x !== sideLen) {
                sideLen = x;
                needsToBeRendered = true;
            }
        }},

        onDragStart: {set: function (x) {
            onDragStart2 = x;
        }},

        onDrag: {set: function (x) {
            onDrag2 = x;
        }},

        onDragEnd: {set: function (x) {
            onDragEnd2 = x;
        }}
    });
});
