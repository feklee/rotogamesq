// Displays the tiles in the interactive board.

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
    'boards', 'tile_element_factory', 'rubber_band_canvas', 'rot_anim_canvas',
    'rect_t_factory', 'util'
], function (boards, tileElementFactory, rubberBandCanvas, rotAnimCanvas,
             rectTFactory, util) {
    'use strict';

    var sideLen, tileSideLenP, spacingP, tiles,
        selectedRectT; // selected rectangle in coordinates of tiles

    function el() {
        return document.getElementById('tilesDisplay');
    }

    // Converts tile position to screen position.
    function posPFromPosT(posT) {
        return posT.map(function (coordT) {
            return coordT * (tileSideLenP + spacingP) + spacingP;
        });
    }

    // inverse of `posPFromPosT`, with `Math.floor` applied to each element

    // fixme: use: FromPosP
    function posTFromPos(pos) {
        return pos.map(function (coord) {
            return (coord - spacingP) / (tileSideLenP + spacingP);
        });
    }

    // If the specified position is in spacing between tiles, then coordinates
    // in question are shifted so that they are in the middle of the next tile
    // to the upper and/or left.
    function decIfInSpacing(pos) {
        return pos.map(function (coord) {
            var modulo = coord % (tileSideLenP + spacingP);
            return ((coord > 0 && modulo < spacingP) ?
                    (coord - modulo - tileSideLenP / 2) :
                    coord);
        });
    }

    // Like `decIfInSpacing` but shifts to the tile to the lower and/or right.
    function incIfInSpacing(pos) {
        return pos.map(function (coord) {
            var modulo = coord % (tileSideLenP + spacingP);
            return ((coord > 0 && modulo < spacingP) ?
                    (coord - modulo + spacingP + tileSideLenP / 2) :
                    coord);
        });
    }

    // Returns posT, if necessary truncates so that it fits into the board.
    function posTInBounds(posT) {
        var board = boards.selectedBoard;

        return posT.map(function (coordT) {
            return Math.min(Math.max(coordT, 0), board.sideLenT - 1);
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
        var rect = rubberBandCanvas.selectedRect,
            tlPos = incIfInSpacing(rect[0]),
            brPos = decIfInSpacing(rect[1]),
            tlPosT = posTInBounds(posTFromPos(tlPos).map(Math.floor)),
            brPosT = posTInBounds(posTFromPos(brPos).map(Math.floor));

        return rectTFactory.create(tlPosT, brPosT);
    }

    function updateDimensions(e, newSideLen) {
        var sideLenT, s = e.style;

        // Dimensions of canvas:
        s.height = s.width = sideLen = newSideLen;

        // Dimensions of tiles (depends on dimensions of canvas):
        sideLenT = boards.selectedBoard.sideLenT;
        spacingP = 5 / sideLenT;
        tileSideLenP = (100 - spacingP * (sideLenT + 1)) / sideLenT;

        // Dimensions of selection (depends on dimensions of tiles):
        selectedRectT = newSelectedRectT();
    }

    function selectedRectHasChanged() {
        return !selectedRectT.isEqualTo(newSelectedRectT());
    }

    function tilesHaveChanged() {
        return (tiles === undefined ||
                !boards.selectedBoard.tiles.isEqualTo(tiles));
    }

    function rotationMakesSense(selectedRectT) {
        return selectedRectT.widthT > 0 || selectedRectT.heightT > 0;
    }

    function onRubberBandDragEnd() {
        selectedRectT = newSelectedRectT(); // rarely needed, but inexpensive

        if (rotationMakesSense(selectedRectT) &&
                !boards.selectedBoard.isFinished) {
            boards.selectedBoard.rotate({
                rectT: selectedRectT,
                cw: rubberBandCanvas.draggedToTheRight
            });
        }
    }

    function needsToBeRendered(newSideLen) {
        return (sideLen !== newSideLen ||
                selectedRectHasChanged() ||
                tilesHaveChanged());
    }

    function tileIsSelected(posT) {
        return (posT[0] >= selectedRectT[0][0] &&
                posT[0] <= selectedRectT[1][0] &&
                posT[1] >= selectedRectT[0][1] &&
                posT[1] <= selectedRectT[1][1]);
    }

    function alpha(posT) {
        var showSelection = rubberBandCanvas.isBeingDragged;

        return (showSelection && tileIsSelected(posT)) ? 0.5 : 1;
    }

    function renderBoard(e) {
        var xT, yT, posT, sideLenT = boards.selectedBoard.sideLenT;

        util.clearContainer(e);

        for (xT = 0; xT < sideLenT; xT += 1) {
            for (yT = 0; yT < sideLenT; yT += 1) {
                posT = [xT, yT];
                e.appendChild(tileElementFactory.create(
                    posPFromPosT(posT),
                    tileSideLenP,
                    tiles[xT][yT],
                    rubberBandCanvas.isBeingDragged && tileIsSelected(posT)
                ));
            }
        }
    }

    function updateTiles() {
        if (tilesHaveChanged()) {
            tiles = boards.selectedBoard.tiles.copy();
        }
    }

    function updateBackgroundColor(e) {
        e.style['background-color'] = (boards.selectedBoard.isFinished ?
                                       'white' : 'black');
    }

    function rotAnimShouldBeShown() {
        // fixme: check if has changed, etc. (perhaps put that in variable)
    }

    function render(newSideLen) {
        var e = el();

        updateTiles();
        updateDimensions(e, newSideLen);
        updateBackgroundColor(e);
        renderBoard(e);
    }

    rubberBandCanvas.onDragEnd = onRubberBandDragEnd;

    return Object.defineProperties({}, {
        animationStep: {value: function (newSideLen) {
            if (needsToBeRendered(newSideLen)) {
                render(newSideLen);
                // fixme: don't render if only sideLen changed
            }
        }}
    });
});
