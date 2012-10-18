 // Widget for selecting the current board.

// There are two ways to select a board:

//  * Click on one a thumbnail.

//  * Drag a thumbnail towards the middle.

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
    'boards', 'board_thumb_factory', 'util'
], function (boards, boardThumbFactory, util) {
    'use strict';

    var style, cycledBoardI, thumbSideLen, thumbX, thumbIFromThumbX,
        updateThumbsCoordinates, boardI, updateThumbs,
        startAnim, stopAnim, onThumbSelected, newThumb, createThumbs,
        thumbsAnimationSteps, appendElements, thumbsHaveBeenCreated,
        render, animPassedTime, animIsFinished, updateThumbI,
        onDragStart, onDrag, onDragEnd,
        onMouseDown, onTouchStart, onMouseMove,
        onTouchMove, onMouseUp, onTouchEnd,

        nSideThumbs = 2,  // thumbnails displayed to the left/right side of the
                          // currently selected one (needs to be large enough
                          // if e.g. the left-most thumb is the current)
                          //
                          // thumb indexes go from `-nSideThumbs` to
                          // `nSideThumbs`

        // Thumbs. Thumbs are referenced using *thumb indexes*. To get the
        // index for the array below, simply add `nSideThumbs` to a *thumb
        // index*.
        thumbs = [],

        // Index of thumb shown in the widget's center (index may be fractional
        // during animation or dragging, e.g. 0.5 means that the widget's
        // center is empty with thumbs on both sides):
        thumbIInCenter = 0,

        // Index of the board in the middle of the `thumbs` array:
        middleBoardI = 0,

        // values for animation:
        animStartThumbIInCenter,
        animEndThumbIInCenter, // destination
        animDirection, // direction of animation (-1, or +1)
        animIsRunning = false,
        animStartTime, // time when animation started, in milliseconds

        // values when dragging started:
        dragStartCursorX, // cursor x position on page
        dragStartThumbXAtCursor,
        dragStartThumbIInCenter,

        hasBeenClicked, // to differentiate between clicks and drags

        elementsNeedToBeAppended = true,
        isBeingDragged = false,
        needsToBeRendered = true,

        layout = {width: 1, height: 1, left: 0, top: 0};

    style = function () {
        return document.getElementById('boardsNavigator').style;
    };

    // Returns a board index that is within bounds, by cycling if `i` is too
    // small or too large.
    cycledBoardI = function (i) {
        return ((i % boards.length) + boards.length) % boards.length;
    };

    thumbSideLen = function (thumbI) {
        return layout.height / (1 + 0.5 * Math.abs(thumbI - thumbIInCenter));
    };

    // position of thumb with index `thumbI`
    thumbX = function (thumbI) {
        return ((thumbI - thumbIInCenter) * (layout.width / 3) +
                layout.width / 2);
    };

    // inverse of `thumbX`
    thumbIFromThumbX = function (thumbX) {
        return 3 * thumbX / layout.width - 3 / 2 + thumbIInCenter;
    };

    updateThumbsCoordinates = function () {
        var thumbI, thumb;

        thumbs.forEach(function (thumb, i) {
            var thumbI = i - nSideThumbs;
            thumb.maxSideLen = thumbSideLen(0); // center is largest
            thumb.sideLen = thumbSideLen(thumbI);
            thumb.x = thumbX(thumbI);
            thumb.y = layout.height / 2;
        });
    };

    // The index of the board (in `boards`) that corresponds to `thumbI`.
    boardI = function (thumbI) {
        return cycledBoardI(middleBoardI + thumbI);
    };

    // Updates the thumbnail images (reassigns board indexes) so that
    // `thumbIInCenter` is as close as possible to 0. This is necessary so that
    // there will be no missing thumbs at one side of the widget.
    updateThumbs = function () {
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
    startAnim = function (selectedThumbI) {
        animStartThumbIInCenter = thumbIInCenter;
        animEndThumbIInCenter = selectedThumbI;
        animDirection = (animEndThumbIInCenter > animStartThumbIInCenter ?
                         1 : -1);
        animStartTime = Date.now();
        animIsRunning = true;
    };

    stopAnim = function () {
        animIsRunning = false;
    };

    onThumbSelected = function (selectedThumbI) {
        startAnim(selectedThumbI);
    };

    newThumb = function (thumbI) {
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

    createThumbs = function () {
        var thumbI;

        thumbs.length = 0;
        for (thumbI = -nSideThumbs; thumbI <= nSideThumbs; thumbI += 1) {
            thumbs.push(newThumb(thumbI));
        }

        updateThumbsCoordinates();
    };

    thumbsAnimationSteps = function () {
        thumbs.forEach(function (thumb) {
            thumb.animStep();
        });
    };

    appendElements = function (el) {
        thumbs.forEach(function (thumb) {
            el.appendChild(thumb.element);
        });
    };

    thumbsHaveBeenCreated = function () {
        return thumbs.length > 0;
    };

    render = function () {
        var s = style();

        s.height = layout.height + 'px';
        s.top = layout.top + 'px';
        if (layout.portrait) {
            s.left = 0;
            s.margin = '0 ' + layout.horizontalMargin + 'px';
        } else {
            s.left = layout.left + 'px';
            s.margin = 0;
        }
        s.width = Math.round(layout.width) + 'px'; // to integer, to avoid
                                                   // display bugs in Chrome 21

        if (elementsNeedToBeAppended && thumbsHaveBeenCreated()) {
            // initializes (only once, at the beginning)
            appendElements(document.getElementById('boardsNavigator'));
            elementsNeedToBeAppended = false;
        }
    };

    animPassedTime = function () {
        return Date.now() - animStartTime;
    };

    animIsFinished = function () {
        return ((animDirection > 0 &&
                 thumbIInCenter >= animEndThumbIInCenter) ||
                (animDirection < 0 &&
                 thumbIInCenter <= animEndThumbIInCenter));
    };

    updateThumbI = function () {
        var speed = 0.005;

        thumbIInCenter = (animStartThumbIInCenter +
                          animDirection * speed * animPassedTime());

        if (animIsFinished()) {
            thumbIInCenter = animEndThumbIInCenter; // avoids movement that is
                                                    // too far
            animIsRunning = false;
        }

        updateThumbs();
        updateThumbsCoordinates();
    };

    onDragStart = function (cursorX) {
        var elPagePos =
                util.viewportPos(document.getElementById('boardsNavigator')),
            thumbXAtCursor = cursorX - elPagePos[0];

        stopAnim();
        isBeingDragged = true;
        dragStartCursorX = cursorX;
        dragStartThumbXAtCursor = thumbXAtCursor;
        dragStartThumbIInCenter = thumbIInCenter;

        hasBeenClicked = true; // may change later
    };

    onDrag = function (cursorX) {
        var deltaX = cursorX - dragStartCursorX,
            thumbXAtCursor = dragStartThumbXAtCursor + deltaX,
            deltaI = (thumbIFromThumbX(dragStartThumbXAtCursor) -
                      thumbIFromThumbX(thumbXAtCursor));

        if (deltaX !== 0) {
            hasBeenClicked = false;
        }

        thumbIInCenter = dragStartThumbIInCenter + deltaI;

        updateThumbs();
        updateThumbsCoordinates();

        boards.selectedI = boardI(0);
    };

    onDragEnd = function () {
        startAnim(0);

        isBeingDragged = false;
    };

    onMouseDown = function (e) {
        onDragStart(e.pageX);
    };

    onTouchStart = function (e) {
        var touches;

        touches = e.changedTouches;
        if (touches.length > 0) {
            onDragStart(touches[0].pageX);
        }
    };

    onMouseMove = function (e) {
        if (isBeingDragged) {
            onDrag(e.pageX);
        }
    };

    onTouchMove = function (e) {
        var touches = e.changedTouches;

        if (isBeingDragged) {
            if (touches.length > 0) {
                onDrag(touches[0].pageX);
            }
        }
    };

    onMouseUp = function () {
        if (isBeingDragged) {
            onDragEnd();
        }
    };

    onTouchEnd = function (e) {
        var touches = e.changedTouches;

        e.preventDefault();
        if (isBeingDragged) {
            onDragEnd();
        }
    };

    util.whenDocumentIsReady(function () {
        var el = document.getElementById('boardsNavigator');

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
