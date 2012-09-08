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
    'boards', 'rubber_band_canvas', 'rot_anim_canvas', 'display_c_sys'
], function (boards, rubberBandCanvas, rotAnimCanvas, displayCSys) {
    'use strict';

    var sideLen, tiles, board,
        needsToBeRendered = true,
        selectedRectT, // selected rectangle in coordinates of tiles
        animIsRunning;

    function selectedRectTNeedsChange() {
        return (selectedRectT === undefined ||
                !selectedRectT.isEqualTo(rubberBandCanvas.selectedRectT));
    }

    function tilesNeedChange() {
        return tiles === undefined || !board.tiles.areEqualTo(tiles);
    }

    function animIsRunningNeedsChange() {
        return (animIsRunning === undefined ||
                animIsRunning !== rotAnimCanvas.animIsRunning);
    }

    function boardNeedsChange() {
        return board === undefined || board !== boards.selectedBoard;
    }

    function rotationMakesSense(selectedRectT) {
        return selectedRectT.widthT > 0 || selectedRectT.heightT > 0;
    }

    function onRubberBandDragEnd() {
        selectedRectT = rubberBandCanvas.selectedRectT; // to be on the safe
                                                        // side

        if (rotationMakesSense(selectedRectT) &&
                !boards.selectedBoard.isFinished) {
            boards.selectedBoard.rotate({
                rectT: selectedRectT,
                cw: rubberBandCanvas.draggedToTheRight
            });
        }
    }

    function tileIsSelected(posT) {
        return (posT[0] >= selectedRectT[0][0] &&
                posT[0] <= selectedRectT[1][0] &&
                posT[1] >= selectedRectT[0][1] &&
                posT[1] <= selectedRectT[1][1]);
    }

    function renderTile(ctx, posT) {
        var pos = displayCSys.posFromPosT(posT),
            color = tiles[posT[0]][posT[1]].color,
            showSelection = rubberBandCanvas.isBeingDragged,
            tileSideLen = displayCSys.tileSideLen;

        if (rotAnimCanvas.animIsRunning && rotAnimCanvas.isInRotRect(posT)) {
            return; // don't show this tile, it's animated
        }

        ctx.globalAlpha = showSelection && tileIsSelected(posT) ? 0.5 : 1;
        ctx.fillStyle = color;
        ctx.fillRect(pos[0], pos[1], tileSideLen, tileSideLen);
    }

    function updateBackgroundColor(el) {
        el.style['background-color'] = ((boards.selectedBoard.isFinished &&
                                         !rotAnimCanvas.animIsRunning) ?
                                        'white' : 'black');
    }

    function render() {
        var xT, yT,
            sideLenT = board.sideLenT,
            el = document.getElementById('tilesCanvas'),
            ctx = el.getContext('2d');

        el.height = el.width = sideLen;

        updateBackgroundColor(el);

        for (xT = 0; xT < sideLenT; xT += 1) {
            for (yT = 0; yT < sideLenT; yT += 1) {
                renderTile(ctx, [xT, yT]);
            }
        }
    }

    function startRotationAnim() {
        var lastRotation = board.lastRotation;
        if (lastRotation !== null) {
            rotAnimCanvas.startAnim(lastRotation);
        }
    }

    rubberBandCanvas.onDragEnd = onRubberBandDragEnd;

    return Object.create(null, {
        animationStep: {value: function () {
            var boardHasChanged;

            if (boardNeedsChange()) {
                needsToBeRendered = true;
                board = boards.selectedBoard;
                boardHasChanged = true;
            } else {
                boardHasChanged = false;
            }

            if (tilesNeedChange()) {
                needsToBeRendered = true;
                tiles = board.tiles.copy();
                if (!boardHasChanged) {
                    startRotationAnim();
                } // else: change in tiles not due to rotation
            }

            if (animIsRunningNeedsChange()) {
                needsToBeRendered = true;
                animIsRunning = rotAnimCanvas.animIsRunning;
            }

            if (selectedRectTNeedsChange()) {
                needsToBeRendered = true;
                selectedRectT = rubberBandCanvas.selectedRectT;
            }

            if (needsToBeRendered) {
                render();
                needsToBeRendered = false;
            }
        }},

        sideLen: {set: function (x) {
            if (x !== sideLen) {
                sideLen = x;
                needsToBeRendered = true;
            }
        }}
    });
});
