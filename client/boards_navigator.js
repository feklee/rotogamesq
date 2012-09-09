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
        //fixme: animI = 0,
        selectedBoardI = 0,
        elementsNeedToBeAppended = true,
        needsToBeRendered = true,
        nSideThumbs = 2;  // thumbnails displayed to the left/right side of the
                          // currently selected one (needs to be large enough
                          // if e.g. the left-most thumb is the current)

    // Returns a board index that is within bounds, by cycling if `i` is too
    // small or too large.
    function cycledBoardI(i) {
        return ((i % boards.length) + boards.length) % boards.length;
    }

    // Selected board is always in the middle of the thumbs.
    function boardIFromThumbI(thumbI) {
        return cycledBoardI(selectedBoardI + (thumbI - nSideThumbs));
    }

    function updateThumbsCoordinates() {
        thumbs.forEach(function (thumb, i) {
            thumb.sideLen = width / (4 + 2 * Math.abs(i - nSideThumbs));
            thumb.x = (i - nSideThumbs) * (width / 3) + width / 2;
            thumb.y = width / 8;
        });
    }

    function createThumbs() {
        var i, thumb;

        thumbs.length = 0;
        for (i = 0; i < nSideThumbs + 1 + nSideThumbs; i += 1) {
            thumb = boardThumbFactory.create(boardIFromThumbI(i));
            thumbs.push(thumb);
        }

        updateThumbsCoordinates();
    }

    function updateThumbs() {
        thumbs.forEach(function (thumb, i) {
            thumb.boardI = boardIFromThumbI(i);
        });
    }

    function thumbsAnimationSteps() {
        thumbs.forEach(function (thumb) {
            thumb.animationStep();
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

    return Object.create(null, {
        animationStep: {value: function () {
            if (selectedBoardI !== boards.selectedI) {
                selectedBoardI = boards.selectedI;
                updateThumbs();
            }

            if (needsToBeRendered) {
                render();
                needsToBeRendered = false;
            }

            thumbsAnimationSteps();
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
