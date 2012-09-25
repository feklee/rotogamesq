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
    'boards', 'rubber_band_canvas', 'rot_anim_canvas', 'arrow_canvas',
    'display_c_sys', 'display_canvas_factory', 'rotation_factory',
    'rect_t_factory'
], function (boards, rubberBandCanvas, rotAnimCanvas, arrowCanvas,
             displayCSys, displayCanvasFactory, rotationFactory,
             rectTFactory) {
    'use strict';

    var sideLen, tiles, board,
        needsToBeRendered = true,
        selectedRectT, // when dragged: currently selected rectangle
        draggedToTheRight, // when dragged: current drag direction
        animIsRunning,
        rotation,
        initRotAnimHasToBeTriggered = true;

    function updateRotation() {
        if (selectedRectT === undefined) {
            rotation = undefined;
        } else {
            rotation = rotationFactory.create(selectedRectT,
                                              draggedToTheRight);
        }
    }

    function tilesNeedUpdate() {
        return tiles === undefined || !board.tiles.areEqualTo(tiles);
    }

    function animIsRunningNeedsUpdate() {
        return (animIsRunning === undefined ||
                animIsRunning !== rotAnimCanvas.animIsRunning);
    }

    function boardNeedsUpdate() {
        return board === undefined || board !== boards.selected;
    }

    function onRubberBandDragStart() {
        arrowCanvas.show();
    }

    function onRubberBandDrag(newSelectedRectT, newDraggedToTheRight) {
        if (selectedRectT === undefined ||
                !newSelectedRectT.isEqualTo(selectedRectT) ||
                newDraggedToTheRight !== draggedToTheRight) {
            selectedRectT = newSelectedRectT;
            draggedToTheRight = newDraggedToTheRight;
            needsToBeRendered = true;
            updateRotation();
            arrowCanvas.rotation = rotation;
        }
    }

    function updateRubberBandCanvasVisibility() {
        var board = boards.selected;
        if (board.isFinished || !board.rotationIsPossible) {
            rubberBandCanvas.hide();
        } else {
            rubberBandCanvas.show(); // necessary e.g. after undoing finished
        }
    }

    function onRubberBandDragEnd() {
        if (rotation !== undefined && rotation.makesSense &&
                !boards.selected.isFinished) {
            boards.selected.rotate(rotation);
        }

        updateRubberBandCanvasVisibility();

        arrowCanvas.hide();

        selectedRectT = undefined;
        updateRotation();

        needsToBeRendered = true;
    }

    function tileIsSelected(posT) {
        return (rubberBandCanvas.isBeingDragged &&
                selectedRectT !== undefined &&
                posT[0] >= selectedRectT[0][0] &&
                posT[0] <= selectedRectT[1][0] &&
                posT[1] >= selectedRectT[0][1] &&
                posT[1] <= selectedRectT[1][1]);
    }

    function renderTile(ctx, posT) {
        var pos = displayCSys.posFromPosT(posT),
            color = tiles[posT[0]][posT[1]].color,
            showSelection = rubberBandCanvas.isBeingDragged,
            tileSideLen = displayCSys.tileSideLen,

            // to avoid ugly thin black lines when there is no spacing
            // (rendering error with many browsers as of Sept. 2012)
            lenAdd = displayCSys.spacing === 0 ? 1 : 0;

        if (rotAnimCanvas.animIsRunning && rotAnimCanvas.isInRotRect(posT)) {
            return; // don't show this tile, it's animated
        }

        ctx.globalAlpha = showSelection && tileIsSelected(posT) ? 0.5 : 1;
        ctx.fillStyle = color;
        ctx.fillRect(pos[0], pos[1],
                     tileSideLen + lenAdd, tileSideLen + lenAdd);
    }

    function render() {
        var xT, yT,
            sideLenT = board.sideLenT,
            el = document.getElementById('tilesCanvas'),
            ctx = el.getContext('2d'),
            renderAsFinished = (board.isFinished &&
                                !rotAnimCanvas.animIsRunning);

        el.height = el.width = sideLen;

        if (renderAsFinished) {
            displayCSys.disableSpacing();
        }

        for (xT = 0; xT < sideLenT; xT += 1) {
            for (yT = 0; yT < sideLenT; yT += 1) {
                renderTile(ctx, [xT, yT]);
            }
        }

        if (renderAsFinished) {
            displayCSys.enableSpacing();
        }
    }

    function startRotationAnim() {
        var lastRotation = board.lastRotation;
        if (lastRotation !== null) {
            rotAnimCanvas.startAnim(lastRotation);
        }
    }

    function updateTiles(boardHasChanged) {
        tiles = board.tiles.copy();

        if (!boardHasChanged) {
            startRotationAnim();
        } // else: change in tiles not due to rotation

        updateRubberBandCanvasVisibility();

        arrowCanvas.hide(); // necessary e.g. after undoing finished
    }

    // Triggers a rotation animation that is shown when the canvas is first
    // displayed. This rotation serves as a hint concerning how the game works.
    function triggerInitRotAnim() {
        var initRotation = rotationFactory.create(
            rectTFactory.create([0, 0], [tiles.widthT - 1, tiles.heightT - 1]),
            true
        );
        rotAnimCanvas.startAnim(initRotation);
    }

    rubberBandCanvas.onDragStart = onRubberBandDragStart;
    rubberBandCanvas.onDrag = onRubberBandDrag;
    rubberBandCanvas.onDragEnd = onRubberBandDragEnd;

    return Object.create(displayCanvasFactory.create(), {
        animStep: {value: function () {
            var boardHasChanged;

            if (boardNeedsUpdate()) {
                needsToBeRendered = true;
                board = boards.selected;
                boardHasChanged = true;
            } else {
                boardHasChanged = false;
            }

            if (tilesNeedUpdate()) {
                updateTiles(boardHasChanged);
                needsToBeRendered = true;
            }

            if (initRotAnimHasToBeTriggered) {
                triggerInitRotAnim();
                initRotAnimHasToBeTriggered = false;
            }

            if (animIsRunningNeedsUpdate()) {
                needsToBeRendered = true;
                animIsRunning = rotAnimCanvas.animIsRunning;
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
