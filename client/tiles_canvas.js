
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

define(['boards', 'rubber_band'], function (boards, rubberBand) {
    'use strict';

    var sideLen, tileLen, spacing,
        selectedRectT; // selected rectangle in tile coordinates

    function el() {
        return document.getElementById('tilesCanvas');
    }

    // Converts tile position to screen position.
    function posFromPosT(posT) {
        return posT.map(function (coordT) {
            return coordT * (tileLen + spacing) + spacing;
        });
    }

    // inverse of `posFromPosT`, with `Math.floor` applied to each element
    function posTFromPos(pos) {
        return pos.map(function (coord) {
            return (coord - spacing) / (tileLen + spacing);
        });
    }

    function areSamePosT(pos1T, pos2T) {
        return pos1T[0] === pos2T[0] && pos1T[1] === pos2T[1];
    }

    function areSameRectT(rectT1, rectT2) {
        return (areSamePosT(rectT1[0], rectT2[0]) &&
                areSamePosT(rectT1[1], rectT2[1]));
    }

    // If the specified position is in spacing between tiles, then coordinates
    // in question are shifted so that they are in the middle of the next tile
    // to the upper and/or left.
    function decIfInSpacing(pos) {
        return pos.map(function (coord) {
            var modulo = coord % (tileLen + spacing);
            return ((coord > 0 && modulo < spacing) ?
                    (coord - modulo - tileLen / 2) :
                    coord);
        });
    }

    // Like `decIfInSpacing` but shifts to the tile to the lower and/or right.
    function incIfInSpacing(pos) {
        return pos.map(function (coord) {
            var modulo = coord % (tileLen + spacing);
            return ((coord > 0 && modulo < spacing) ?
                    (coord - modulo + spacing + tileLen / 2) :
                    coord);
        });
    }

    // Returns selected rectangle, as an array:
    //
    // * 0: position (tile coordinates) of top left selected tile
    //
    // * 1: position bottom right selected tile
    //
    // A tile is selected, if it is inside or if it is touched by the rubber
    // band. Spacing is *not* part of tiles!
    function newSelectedRectT() {
        var rect = rubberBand.selectedRect,
            tlPos = incIfInSpacing(rect[0]),
            brPos = decIfInSpacing(rect[1]),
            tlPosT = posTFromPos(tlPos).map(Math.floor),
            brPosT = posTFromPos(brPos).map(Math.floor);

        return [tlPosT, brPosT];
    }

    function updateDimensions(e, newSideLen) {
        var sideLenT;

        // Dimensions of canvas:
        e.width = sideLen = newSideLen;
        e.height = newSideLen;

        // Dimensions of tiles (depends on dimensions of canvas):
        sideLenT = boards.selectedBoard.sideLenT;
        spacing = 0.1 * sideLen / sideLenT;
        tileLen = (sideLen - spacing * (sideLenT + 1)) / sideLenT;

        // Dimensions of selection (depends on dimensions of tiles):
        selectedRectT = newSelectedRectT();
    }

    function selectedRectHasChanged() {
        return !areSameRectT(selectedRectT, newSelectedRectT());
    }

    function onRubberBandDragEnd() {
        selectedRectT = newSelectedRectT(); // rarely needed, but inexpensive

        boards.selectedBoard.rotate(selectedRectT,
                                    rubberBand.draggedToTheRight);
    }

    function needsToBeRendered(newSideLen) {
        return sideLen !== newSideLen || selectedRectHasChanged();
    }

    function tileIsSelected(posT) {
        return (posT[0] >= selectedRectT[0][0] &&
                posT[0] <= selectedRectT[1][0] &&
                posT[1] >= selectedRectT[0][1] &&
                posT[1] <= selectedRectT[1][1]);
    }

    // fixme: make use of draggedToTheRight

    function renderBoard(e) {
        var pos, posT, xT, yT,
            ctx = e.getContext('2d'),
            sideLenT = boards.selectedBoard.sideLenT,
            tiles = boards.selectedBoard.tiles;

        for (xT = 0; xT < sideLenT; xT += 1) {
            for (yT = 0; yT < sideLenT; yT += 1) {
                ctx.fillStyle = tiles[xT][yT];
                posT = [xT, yT];
                ctx.globalAlpha = tileIsSelected(posT) ? 0.5 : 1;
                pos = posFromPosT(posT);
                ctx.fillRect(pos[0], pos[1], tileLen, tileLen);
            }
        }
    }

    function render(newSideLen) { // fixme: add border, totalSideLen
        var e;

        if (needsToBeRendered(newSideLen)) {
            e = el();

            updateDimensions(e, newSideLen);
            renderBoard(e);
        }
    }

    rubberBand.onDragEnd = onRubberBandDragEnd;

    return Object.defineProperties({}, {
        'render': {value: render}
    });
});
