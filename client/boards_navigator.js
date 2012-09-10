// For selecting the current board.

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
    'boards', 'board_thumb_factory'
], function (boards, boardThumbFactory) {
    'use strict';

    var width,
        thumbs = [],
        animThumbI = 0, // index of thumb shown in middle (fractional during
                        // animation)
        animStartThumbI,
        animDirection, // direction of animation (-1, or +1)
        animIsRunning = false,
        animStartTime, // time when animation started, in milliseconds
        selectedBoardI = 0,
        elementsNeedToBeAppended = true,
        needsToBeRendered = true,
        nSideThumbs = 2;  // thumbnails displayed to the left/right side of the
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
    function boardIFromThumbI(thumbI) {
        return cycledBoardI(selectedBoardI + thumbI);
    }

    function updateThumbsCoordinates() {
        var thumbI, thumb, j;

        thumbs.forEach(function (thumb, i) {
            var thumbI = i - nSideThumbs;
            j = thumbI - animThumbI; // `j` is 0 => board centered
            thumb.sideLen = width / (4 + 2 * Math.abs(j));
            thumb.x = j * (width / 3) + width / 2;
            thumb.y = width / 8;
        });
    }

    function updateThumbs() {
        thumbs.forEach(function (thumb, i) {
            var thumbI = i - nSideThumbs;
            thumb.boardI = boardIFromThumbI(thumbI);
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

    function onThumbSelected(selectedThumbI) {
        startAnim(selectedThumbI);
        updateSelectedBoardI();
    }

    function newThumb(thumbI) {
        return boardThumbFactory.create(boardIFromThumbI(thumbI), function () {
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
        var speed = 0.01;

        animThumbI = (animStartThumbI +
                      animDirection * speed * animPassedTime());

        if (animIsFinished()) {
            animThumbI = 0; // avoids movement that is too far
            animIsRunning = false;
        }

        updateThumbsCoordinates();
    }

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
