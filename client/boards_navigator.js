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

/*jslint browser: true, devel: true, maxerr: 50, maxlen: 79 */

/*global define */

define(['boards'], function (boards) {
    'use strict';

    var width;

    // Renders the board into a canvas. 
    //
    // Why not simply display the board image in an `<img>` tag, and scale
    // that? Rationale: As of Chrome 21.0, when scaling an image in an `<img>`
    // tag, then it is smoothed/blurred, and there is no way to turn off that
    // behavior. In particular, there is no equivalent to Firefox 14.0's
    // `-moz-crisp-edges`.
    function renderBoard(canvas, board) {
        var xT, yT,
            ctx = canvas.getContext('2d'),
            sideLen = canvas.width,
            sideLenT = board.sideLenT,
            factor = sideLen / sideLenT;

        for (xT = 0; xT < sideLenT; xT += 1) {
            for (yT = 0; yT < sideLenT; yT += 1) {
                ctx.fillStyle = board.endTiles[xT][yT];
                ctx.fillRect(xT * factor, yT * factor, factor, factor);
            }
        }
    }

    function updateDimensions(canvas, newWidth) {
        width = newWidth;

        canvas.width = canvas.height = Math.round(width / 5);
    }

    function needsToBeRendered(newWidth) {
        return width !== newWidth;
    }

    function render(newWidth) {
        var canvas = document.getElementById('endBoardCanvas');

        updateDimensions(canvas, newWidth);
        renderBoard(canvas, boards.selectedBoard);
    }

    return Object.defineProperties({}, {
        animationStep: {value: function (newWidth) {
            if (needsToBeRendered(newWidth)) {
                render(newWidth);
            }
        }}
    });
});
