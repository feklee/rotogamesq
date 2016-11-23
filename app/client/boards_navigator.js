 // Widget for selecting the current board.

/*jslint browser: true, maxlen: 80, es6: true */

/*global define, window */

define([
    "boards", "board_thumb_factory", "util"
], function (boards, boardThumbFactory, util) {
    "use strict";

    var nSideThumbs = 2; // thumbnails displayed to the left/right side of the
                         // currently selected one (needs to be large enough if
                         // e.g. the left-most thumb is the current)
                         //
                         // thumb indexes go from `-nSideThumbs` to
                         // `nSideThumbs`

    // Thumbs. Thumbs are referenced using *thumb indexes*. To get the index
    // for the array below, simply add `nSideThumbs` to a *thumb index*.
    var thumbs = [];

    // Index of thumb shown in the widget's center (index may be fractional
    // during animation or dragging, e.g. 0.5 means that the widget's center is
    // empty with thumbs on both sides):
    var thumbIInCenter = 0;

    // Index of the board in the middle of the `thumbs` array:
    var middleBoardI = 0;

    // values for animation:
    var animStartThumbIInCenter;
    var animEndThumbIInCenter; // destination
    var animDirection; // direction of animation (-1, or +1)
    var animIsRunning = false;
    var animStartTime; // time when animation started, in milliseconds

    // values when dragging started:
    var dragStartCursorX; // cursor x position on page
    var dragStartThumbXAtCursor;
    var dragStartThumbIInCenter;

    var hasBeenClicked; // to differentiate between clicks and drags

    var elementsNeedToBeAppended = true;
    var isBeingDragged = false;
    var needsToBeRendered = true;

    var layout = {width: 1, height: 1, left: 0, top: 0};

    var style = function () {
        return document.getElementById("boardsNavigator").style;
    };

    // Returns a board index that is within bounds, by cycling if `i` is too
    // small or too large.
    var cycledBoardI = function (i) {
        return ((i % boards.length) + boards.length) % boards.length;
    };

    var thumbSideLen = function (thumbI) {
        return layout.height / (1 + 0.5 * Math.abs(thumbI - thumbIInCenter));
    };

    // position of thumb with index `thumbI`
    var thumbX = function (thumbI) {
        return ((thumbI - thumbIInCenter) * (layout.width / 3) +
                layout.width / 2);
    };

    // inverse of `thumbX`
    var thumbIFromThumbX = function (thumbX) {
        return 3 * thumbX / layout.width - 3 / 2 + thumbIInCenter;
    };

    var updateThumbsCoordinates = function () {
        thumbs.forEach(function (thumb, i) {
            var thumbI = i - nSideThumbs;
            thumb.maxSideLen = thumbSideLen(0); // center is largest
            thumb.sideLen = thumbSideLen(thumbI);
            thumb.x = thumbX(thumbI);
            thumb.y = layout.height / 2;
        });
    };

    // The index of the board (in `boards`) that corresponds to `thumbI`.
    var boardI = function (thumbI) {
        return cycledBoardI(middleBoardI + thumbI);
    };

    // Updates the thumbnail images (reassigns board indexes) so that
    // `thumbIInCenter` is as close as possible to 0. This is necessary so that
    // there will be no missing thumbs at one side of the widget.
    var updateThumbs = function () {
        var delta = Math.round(thumbIInCenter);

        if (delta !== 0) {
            middleBoardI += delta;
            thumbIInCenter -= delta;
            if (animIsRunning) {
                animStartThumbIInCenter -= delta;
                animEndThumbIInCenter -= delta;
            }

            if (isBeingDragged) {
                dragStartThumbIInCenter -= delta;
            }

            thumbs.forEach(function (thumb, i) {
                var thumbI = i - nSideThumbs;
                thumb.boardI = boardI(thumbI);
            });
        }
    };

    // Note: The index of the selected thumb will become 0, after the thumbs
    // have been rearrange (see: `updateThumbs`). So animation of the thumb
    // index is always towards 0.
    var startAnim = function (selectedThumbI) {
        animStartThumbIInCenter = thumbIInCenter;
        animEndThumbIInCenter = selectedThumbI;
        animDirection = animEndThumbIInCenter > animStartThumbIInCenter
            ? 1
            : -1;
        animStartTime = Date.now();
        animIsRunning = true;
    };

    var stopAnim = function () {
        animIsRunning = false;
    };

    var onThumbSelected = function (selectedThumbI) {
        startAnim(selectedThumbI);
    };

    var newThumb = function (thumbI) {
        return boardThumbFactory.create(
            boardI(thumbI),
            function (selectedBoardI) {
                if (hasBeenClicked) {
                    boards.selectedI = selectedBoardI;
                    onThumbSelected(thumbI);
                }
            }
        );
    };

    var createThumbs = function () {
        thumbs.length = 0;
        var thumbI = -nSideThumbs;
        while (thumbI <= nSideThumbs) {
            thumbs.push(newThumb(thumbI));
            thumbI += 1;
        }

        updateThumbsCoordinates();
    };

    var thumbsAnimationSteps = function () {
        thumbs.forEach(function (thumb) {
            thumb.animStep();
        });
    };

    var appendElements = function (el) {
        thumbs.forEach(function (thumb) {
            el.appendChild(thumb.element);
        });
    };

    var thumbsHaveBeenCreated = function () {
        return thumbs.length > 0;
    };

    var render = function () {
        var s = style();

        s.height = layout.height + "px";
        s.top = layout.top + "px";
        if (layout.portrait) {
            s.left = 0;
            s.margin = "0 " + layout.horizontalMargin + "px";
        } else {
            s.left = layout.left + "px";
            s.margin = 0;
        }
        s.width = Math.round(layout.width) + "px"; // to integer, to avoid
                                                   // display bugs in Chrome 21

        if (elementsNeedToBeAppended && thumbsHaveBeenCreated()) {
            // initializes (only once, at the beginning)
            appendElements(document.getElementById("boardsNavigator"));
            elementsNeedToBeAppended = false;
        }
    };

    var animPassedTime = function () {
        return Date.now() - animStartTime;
    };

    var animIsFinished = function () {
        return (
            (animDirection > 0 && thumbIInCenter >= animEndThumbIInCenter) ||
            (animDirection < 0 && thumbIInCenter <= animEndThumbIInCenter)
        );
    };

    var updateThumbI = function () {
        var speed = 0.005;

        thumbIInCenter = animStartThumbIInCenter +
                animDirection * speed * animPassedTime();

        if (animIsFinished()) {
            thumbIInCenter = animEndThumbIInCenter; // avoids movement that is
                                                    // too far
            animIsRunning = false;
        }

        updateThumbs();
        updateThumbsCoordinates();
    };

    var onDragStart = function (cursorX) {
        var elPagePos =
                util.viewportPos(document.getElementById("boardsNavigator"));
        var thumbXAtCursor = cursorX - elPagePos[0];

        stopAnim();
        isBeingDragged = true;
        dragStartCursorX = cursorX;
        dragStartThumbXAtCursor = thumbXAtCursor;
        dragStartThumbIInCenter = thumbIInCenter;

        hasBeenClicked = true; // may change later
    };

    var onDrag = function (cursorX) {
        var deltaX = cursorX - dragStartCursorX;
        var thumbXAtCursor = dragStartThumbXAtCursor + deltaX;
        var deltaI = thumbIFromThumbX(dragStartThumbXAtCursor) -
                thumbIFromThumbX(thumbXAtCursor);

        if (deltaX !== 0) {
            hasBeenClicked = false;
        }

        thumbIInCenter = dragStartThumbIInCenter + deltaI;

        updateThumbs();
        updateThumbsCoordinates();

        boards.selectedI = boardI(0);
    };

    var onDragEnd = function () {
        startAnim(0);

        isBeingDragged = false;
    };

    var onMouseDown = function (e) {
        onDragStart(e.pageX);
    };

    var onTouchStart = function (e) {
        var touches;

        touches = e.changedTouches;
        if (touches.length > 0) {
            onDragStart(touches[0].pageX);
        }
    };

    var onMouseMove = function (e) {
        if (isBeingDragged) {
            onDrag(e.pageX);
        }
    };

    var onTouchMove = function (e) {
        var touches = e.changedTouches;

        if (isBeingDragged) {
            if (touches.length > 0) {
                onDrag(touches[0].pageX);
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
        var el = document.getElementById("boardsNavigator");

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

    return Object.create(null, {
        animStep: {value: function () {
            if (needsToBeRendered) {
                render();
                needsToBeRendered = false;
            }

            thumbsAnimationSteps();

            if (animIsRunning) {
                updateThumbI();
                updateThumbsCoordinates();
            }
        }},

        layout: {set: function (newLayout) {
            layout = newLayout;
            updateThumbsCoordinates();
            needsToBeRendered = true;
        }},

        activate: {value: function () {
            // boards are now definitely loaded
            createThumbs();
            needsToBeRendered = true;
        }}
    });
});
