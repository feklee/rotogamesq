// For selecting the current board.

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

    var width,
        thumbs = [],

        // values for animation:
        animThumbI = 0, // index of thumb shown in middle (fractional during
                        // animation)
        animThumbX,
        animStartThumbI,
        animDirection, // direction of animation (-1, or +1)
        animIsRunning = false,
        animStartTime, // time when animation started, in milliseconds

        // values when dragging started:
        dragStartX, // input device x position
        dragStartAnimThumbX,

        selectedBoardI = 0,
        elementsNeedToBeAppended = true,
        isBeingDragged = false,
        needsToBeRendered = true,
        nSideThumbs = 4;  // thumbnails displayed to the left/right side of the
                          // currently selected one (needs to be large enough
                          // if e.g. the left-most thumb is the current)
                          //
                          // thumb indexes go from `-nSideThumbs` to
                          // `nSideThumbs`

    // Returns a board index that is within bounds, by cycling if `i` is too
    // small or too large.
    function cycledBoardI(i) {
        return ((i % boards.length) + boards.length) % boards.length;
    }

    // Selected board is always in the middle of the thumbs.
    function boardI(thumbI) {
        return cycledBoardI(selectedBoardI + thumbI);
    }

    function displayedThumbSideLen(displayedThumbI) {
        return width / (4 + 2 * Math.abs(displayedThumbI));
    }

    // `thumbI` is 0 => board centered
    function displayedThumbX(displayedThumbI) {
        return displayedThumbI * (width / 3) + width / 2;
    }

    // inverse of `displayedThumbX`
    function displayedThumbI(thumbX) {
        return 3 * thumbX / width - 3 / 2;
    }

    function updateThumbsCoordinates() {
        var thumbI, thumb;

        animThumbX = displayedThumbX(animThumbI);

        thumbs.forEach(function (thumb, i) {
            var thumbI = i - nSideThumbs;
            thumb.maxSideLen = displayedThumbSideLen(0); // center is largest
            thumb.sideLen = displayedThumbSideLen(thumbI - animThumbI);
            thumb.x = displayedThumbX(thumbI - animThumbI);
            thumb.y = width / 8;
        });
    }

    function updateThumbs() {
        thumbs.forEach(function (thumb, i) {
            var thumbI = i - nSideThumbs;
            thumb.boardI = boardI(thumbI);
        });
    }

    function updateSelectedBoardI() {
        selectedBoardI = boards.selectedI;
        updateThumbs();
    }

    // Note: The index of the selected thumb will become 0, after the thumbs
    // have been rearrange (see: `updateThumbs`). So animation of the thumb
    // index is always towards 0.
    function startAnim(selectedThumbI) {
        animStartThumbI = animThumbI - selectedThumbI;
        animDirection = animStartThumbI > 0 ? -1 : 1;
        animStartTime = Date.now();
        animIsRunning = true;
    }

    function pauseAnim() {
        animIsRunning = false;
    }

    function resumeAnim() {
        animIsRunning = true;
    }

    function onThumbSelected(selectedThumbI) {
        startAnim(selectedThumbI);
        updateSelectedBoardI();
    }

    function newThumb(thumbI) {
        return boardThumbFactory.create(boardI(thumbI), function () {
            onThumbSelected(thumbI);
        });
    }

    function createThumbs() {
        var thumbI;

        thumbs.length = 0;
        for (thumbI = -nSideThumbs; thumbI <= nSideThumbs; thumbI += 1) {
            thumbs.push(newThumb(thumbI));
        }

        updateThumbsCoordinates();
    }

    function thumbsAnimationSteps() {
        thumbs.forEach(function (thumb) {
            thumb.animStep();
        });
    }

    function appendElements(el) {
        thumbs.forEach(function (thumb) {
            el.appendChild(thumb.element);
        });
    }

    function thumbsHaveBeenCreated() {
        return thumbs.length > 0;
    }

    function render() {
        var el = document.getElementById('boardsNavigator'),
            s = el.style;

        s.width = width + 'px';
        s.height = width / 4 + 'px';

        if (elementsNeedToBeAppended && thumbsHaveBeenCreated()) {
            // initializes (only once, at the beginning)
            appendElements(el);
            elementsNeedToBeAppended = false;
        }
    }

    function animPassedTime() {
        return Date.now() - animStartTime;
    }

    function animIsFinished() {
        return ((animDirection > 0 && animThumbI >= 0) ||
                (animDirection < 0 && animThumbI <= 0));
    }

    function updateThumbI() {
        var speed = 0.0005; // fixme: 0.005

        animThumbI = (animStartThumbI +
                      animDirection * speed * animPassedTime());

        if (animIsFinished()) {
            animThumbI = 0; // avoids movement that is too far
            animIsRunning = false;
        }

        updateThumbsCoordinates();
    }

    function onDragStart(x) {
        pauseAnim();
        isBeingDragged = true;
        dragStartX = x;
        dragStartAnimThumbX = animThumbX;
    }

    function onDrag(x) {
        animThumbI = displayedThumbI(dragStartAnimThumbX - (x - dragStartX));
        updateThumbsCoordinates();
    }

    function onDragEnd() {
        var newSelectedBoardI;

        resumeAnim();
        isBeingDragged = false;

        newSelectedBoardI = cycledBoardI(selectedBoardI +
                                         Math.round(animThumbI));

        console.log(newSelectedBoardI); // fixme
        // fixme: if necessary, also update direction

/*fixme:        if (newSelectedBoardI !== selectedBoardI) {
            boards.selectedI = newSelectedBoardI;
            updateSelectedBoardI();
        }*/

        // fixme: update boards. Cancel further propagation or similar, if
        // cursor has been moved during drag. (perhaps set: dragWithMove =
        // true, and then cancel propagation right in mouse event, see
        // downwards.
    }

    function onDragCancel() {
        isBeingDragged = false;
        resumeAnim();
    }

    function onMouseDown(e) {
        onDragStart(e.pageX);
    }

    function onMouseOut(e) {
        if (isBeingDragged) {
            onDragCancel();
        }
    }

    function onMouseMove(e) {
        if (isBeingDragged) {
            onDrag(e.pageX);
        }
    }

    function onMouseUp(e) {
        if (isBeingDragged) {
            onDragEnd();
        }
    }

    util.whenDocumentIsReady(function () {
        var el = document.getElementById('boardsNavigator');

        el.addEventListener('mousedown', onMouseDown);
        el.addEventListener('mouseout', onMouseOut);

        // Some events are assigned to `window` so that they are also
        // registered when the mouse is moved outside of the element.
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
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

        activate: {value: function () {
            // boards are now definitely loaded
            createThumbs();
            needsToBeRendered = true;
        }},

        width: {set: function (newWidth) {
            if (newWidth !== width) {
                width = newWidth;
                updateThumbsCoordinates();
                needsToBeRendered = true;
            }
        }}
    });
});
