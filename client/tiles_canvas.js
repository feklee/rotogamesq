// Shows the tiles in the interactive board.

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

    var sideLen;

    function el() {
        return document.getElementById('tilesCanvas');
    }

    function updateDimensions(e, newSideLen) {
        e.width = sideLen = newSideLen;
        e.height = newSideLen;
    }

    function needsToBeRerendered(newSideLen) {
        return sideLen !== newSideLen;
    }

    function renderBoard(e) {
        var xT, yT, ctx = e.getContext('2d'),
            board = boards.selectedBoard,
            sideLenT = board.sideLenT,
            spacing = 0.1 * sideLen / sideLenT,
            tileLen = (sideLen - spacing * (sideLenT + 1)) / sideLenT;

        for (xT = 0; xT < sideLenT; xT += 1) {
            for (yT = 0; yT < sideLenT; yT += 1) {
                ctx.fillStyle = board.rows[yT][xT];
                ctx.fillRect(xT * (tileLen + spacing) + spacing,
                             yT * (tileLen + spacing) + spacing,
                             tileLen, tileLen);
            }
        }
    }

    function render(newSideLen) { // fixme: add border, totalSideLen
        var e;

        if (needsToBeRerendered(newSideLen)) {
            e = el();

            updateDimensions(e, newSideLen);
            renderBoard(e);
        }
    }

    return {
        render: render
    };
});
