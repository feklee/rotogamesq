// Rubber band that the user may drag to select tiles.

/*jslint browser: true, maxlen: 80 */

/*global define, window */

define([
    "util", "../common/rect_t_factory", "display_c_sys",
    "display_canvas_factory"
], function (util, rectTFactory, displayCSys, displayCanvasFactory) {
    "use strict";

    var sideLen; // side length of canvas
    var canvasPagePos; // position of canvas on page
    var pos1 = [0, 0]; // 1st corner of rectangle
    var pos2 = [0, 0]; // 2nd corner of rectangle
    var selectedRectT = rectTFactory.create([0, 0], [0, 0]);
    var draggedToTheRight;
    var needsToBeRendered = true;
    var isBeingDragged = false;
    var lineWidth = 1;
    var onDrag2; // configurable handler, called at the end of `onDrag`
    var onDragStart2;
    var onDragEnd2;

    // may be negative
    var width = function () {
        return pos2[0] - pos1[0];
    };

    // may be negative
    var height = function () {
        return pos2[1] - pos1[1];
    };

    var render = function (el) {
        var ctx = el.getContext("2d");

        // also clears canvas:
        el.height = sideLen;
        el.width = el.height;

        lineWidth = 0.005 * sideLen;

        ctx.strokeStyle = "#fff";
        ctx.lineWidth = lineWidth;
        ctx.lineJoin = "round";
        ctx.strokeRect(pos1[0], pos1[1], width(), height());
    };

    // top left corner
    var tlPos = function () {
        return [Math.min(pos1[0], pos2[0]), Math.min(pos1[1], pos2[1])];
    };

    // bottom right corner
    var brPos = function () {
        return [Math.max(pos1[0], pos2[0]), Math.max(pos1[1], pos2[1])];
    };

    // Updates the selected rectangle, which is represented by an array:
    //
    // * 0: position (tile coordinates) of top left selected tile
    //
    // * 1: position of bottom right selected tile
    //
    // A tile is selected, if it is inside or if it is touched by the rubber
    // band. Spacing is *not* part of tiles!
    var updateSelectedRectT = function () {
        var tlPos2 = displayCSys.incIfInSpacing(tlPos());
        var brPos2 = displayCSys.decIfInSpacing(brPos());
        var tlPosT = displayCSys.posTInBounds(
            displayCSys.posTFromPos(tlPos2).map(Math.floor)
        );
        var brPosT = displayCSys.posTInBounds(
            displayCSys.posTFromPos(brPos2).map(Math.floor)
        );

        selectedRectT = rectTFactory.create(tlPosT, brPosT);
    };

    var updateDraggedToTheRight = function () {
        draggedToTheRight = pos2[0] > pos1[0];
    };

    // Needed for calculating position when dragging.
    var updateCanvasPagePos = function () {
        canvasPagePos = util.viewportPos(
            document.getElementById("rubberBandCanvas")
        );
    };

    // assumes that canvas is at position 0, 0 in the document
    var onDragStart = function (pos) {
        updateCanvasPagePos();
        pos2 = [pos[0] - canvasPagePos[0], pos[1] - canvasPagePos[1]];
        pos1 = pos2;
        updateSelectedRectT();
        updateDraggedToTheRight();
        isBeingDragged = true;
        needsToBeRendered = true;
        if (onDragStart2 !== undefined) {
            onDragStart2();
        }
    };

    var onDrag = function (pos) {
        pos2 = [pos[0] - canvasPagePos[0], pos[1] - canvasPagePos[1]];
        updateSelectedRectT();
        updateDraggedToTheRight();
        needsToBeRendered = true;
        if (onDrag2 !== undefined) {
            onDrag2(selectedRectT, draggedToTheRight);
        }
    };

    var onDragEnd = function () {
        isBeingDragged = false;
        needsToBeRendered = true;

        // reset:
        pos1 = [0, 0];
        pos2 = pos1;

        updateSelectedRectT();
        updateDraggedToTheRight();
        if (onDragEnd2 !== undefined) {
            onDragEnd2();
        }
    };

    var onMouseDown = function (e) {
        onDragStart([e.pageX, e.pageY]);
    };

    var onTouchStart = function (e) {
        var touches;

        touches = e.changedTouches;
        if (touches.length > 0) {
            onDragStart([touches[0].pageX, touches[0].pageY]);
        }
    };

    var onMouseMove = function (e) {
        if (isBeingDragged) {
            onDrag([e.pageX, e.pageY]);
        }
    };

    var onTouchMove = function (e) {
        var touches = e.changedTouches;

        if (isBeingDragged) {
            if (touches.length > 0) {
                onDrag([touches[0].pageX, touches[0].pageY]);
            }
        }
    };

    var onMouseUp = function () {
        if (isBeingDragged) {
            onDragEnd();
        }
    };

    var onTouchEnd = function () {
        if (isBeingDragged) {
            onDragEnd();
        }
    };

    util.onceDocumentIsInteractive(function () {
        var el = document.getElementById("rubberBandCanvas");

        el.addEventListener("mousedown", onMouseDown);
        el.addEventListener("touchstart", onTouchStart);

        // Some events are assigned to `window` so that they are also
        // registered when the mouse is moved outside of the element.
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("touchmove", onTouchMove);
        window.addEventListener("mouseup", onMouseUp);
        window.addEventListener("touchend", onTouchEnd);
        window.addEventListener("touchcancel", onTouchEnd);
    });

    var rubberBandCanvas = Object.create(displayCanvasFactory.create());

    return Object.defineProperties(rubberBandCanvas, {
        animStep: {value: function () {
            var el = document.getElementById("rubberBandCanvas");

            if (rubberBandCanvas.visibilityNeedsToBeUpdated) {
                rubberBandCanvas.updateVisibility(el);
                if (rubberBandCanvas.isVisible) {
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
