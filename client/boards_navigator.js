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
    'boards', 'util', 'board_thumb_factory'
], function (boards, util, boardThumbFactory) {
    'use strict';

    var selectedBoardThumb = boardThumbFactory.create(boards.selectedBoard),
        prevBoardThumb = boardThumbFactory.create(boards.prevBoard),
        nextBoardThumb = boardThumbFactory.create(boards.nextBoard),
        width;

    util.whenDocumentIsReady(function () {
        var el = document.getElementById('boardsNavigator');

        el.appendChild(prevBoardThumb.element).className = 'prev boardThumb';
        el.appendChild(selectedBoardThumb.element).className =
            'selected boardThumb';
        el.appendChild(nextBoardThumb.element).className = 'next boardThumb';
    });

    return Object.create(null, {
        animationStep: {value: function () {
            prevBoardThumb.board = boards.prevBoard;
            prevBoardThumb.animationStep();
            selectedBoardThumb.board = boards.selectedBoard;
            selectedBoardThumb.animationStep();
            nextBoardThumb.board = boards.nextBoard;
            nextBoardThumb.animationStep();
        }},

        width: {set: function (x) {
            if (x !== width) {
                width = x;
                selectedBoardThumb.sideLen = width / 5;
                prevBoardThumb.sideLen = width / 10;
                nextBoardThumb.sideLen = width / 10;
            }
        }}
    });
});
