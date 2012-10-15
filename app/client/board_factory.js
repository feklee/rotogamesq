// Creates boards.

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

define(['hiscores_factory'], function (hiscoresFactory) {
    'use strict';

    var prototype;

    function selectedTiles(tiles, x1T, y1T, x2T, y2T) {
        var sTiles, sTilesColumn, xT, yT;

        sTiles = [];
        for (xT = x1T; xT <= x2T; xT += 1) {
            sTilesColumn = [];
            for (yT = y1T; yT <= y2T; yT += 1) {
                sTilesColumn.push(tiles[xT][yT]);
            }
            sTiles.push(sTilesColumn);
        }

        return sTiles;
    }

    function rotator90CW(sTiles, xT, yT, widthT, heightT) {
        return sTiles[yT][widthT - xT];
    }

    function rotator90CCW(sTiles, xT, yT, widthT, heightT) {
        return sTiles[heightT - yT][xT];
    }

    function rotator180(sTiles, xT, yT, widthT, heightT) {
        return sTiles[widthT - xT][heightT - yT];
    }

    function rotateTilesWithRotator(tiles, rectT, rotator) {
        var xT, yT,
            x1T = rectT[0][0], y1T = rectT[0][1],
            x2T = rectT[1][0], y2T = rectT[1][1],
            widthT = x2T - x1T,
            heightT = y2T - y1T,
            sTiles = selectedTiles(tiles, x1T, y1T, x2T, y2T);

        for (xT = x1T; xT <= x2T; xT += 1) {
            for (yT = y1T; yT <= y2T; yT += 1) {
                tiles[xT][yT] = rotator(sTiles,
                                        xT - x1T, yT - y1T,
                                        widthT, heightT);
            }
        }
    }

    // Rotates the tiles in the specified rectangle in the specified direction:
    // clockwise if `cw` is true
    //
    // The rectangle is defined by its top left and its bottom right corner, in
    // that order.
    function rotateTiles(tiles, rotation) {
        var rectT = rotation.rectT, cw = rotation.cw;

        if (rectT.isSquare) {
            if (cw) {
                rotateTilesWithRotator(tiles, rectT, rotator90CW);
            } else {
                rotateTilesWithRotator(tiles, rectT, rotator90CCW);
            }
        } else {
            rotateTilesWithRotator(tiles, rectT, rotator180);
        }
    }

    // Applies the inverse of the specified rotation.
    function rotateTilesInverse(tiles, rotation) {
        rotateTiles(tiles, rotation.inverse);
    }

    // Updates `internal.isFinished`.
    function updateIsFinished(internal, board, rotation) {
        if (board.tiles.colorsAreEqualTo(board.endTiles)) {
            if (!internal.isFinished) {
                internal.isFinished = true;
                board.hiscores.propose(internal.rotations);
            }
        } else {
            internal.isFinished = false;
            board.hiscores.rmProposal();
        }
    }

    prototype = Object.create(null, {
        rotate: {value: function (internal, rotation) {
            var rectT = rotation.rectT, cw = rotation.cw, tiles = this.tiles;

            internal.rotations.push(rotation);
            internal.futureRotations.length = 0; // resets redo history
            rotateTiles(this.tiles, rotation);
            updateIsFinished(internal, this);
            internal.lastRotation = rotation;
        }},

        undo: {value: function (internal) {
            var rotation = internal.rotations.pop();
            if (rotation !== undefined) {
                internal.futureRotations.push(rotation);
                rotateTilesInverse(this.tiles, rotation);
                updateIsFinished(internal, this);
                internal.lastRotation = rotation.inverse;
            } // else: no more undo
        }},

        redo: {value: function (internal) {
            var rotation = internal.futureRotations.pop();
            if (rotation !== undefined) {
                internal.rotations.push(rotation);
                rotateTiles(this.tiles, rotation);
                updateIsFinished(internal, this);
                internal.lastRotation = rotation;
            } // else: no more redo
        }}
    });

    function create(name, tiles, endTiles) {
        var internal = {
                rotations: [], // for undo, for counting, ...
                futureRotations: [], // for redo
                lastRotation: null,
                isFinished: false // true when game is finished
            },
            hiscores = hiscoresFactory.create(name);

        return Object.create(prototype, {
            rotate: {value: function (rotation) {
                prototype.rotate.call(this, internal, rotation);
            }},

            tiles: {get: function () {
                return tiles;
            }},

            endTiles: {get: function () {
                return endTiles;
            }},

            sideLenT: {get: function () {
                return tiles.length;
            }},

            nRotations: {get: function () {
                return internal.rotations.length;
            }},

            rotationIsPossible: {get: function () {
                return internal.rotations.length < 99;
            }},

            undoIsPossible: {get: function () {
                return internal.rotations.length > 0;
            }},

            undo: {value: function () {
                prototype.undo.call(this, internal);
            }},

            redoIsPossible: {get: function () {
                return internal.futureRotations.length > 0;
            }},

            redo: {value: function () {
                prototype.redo.call(this, internal);
            }},

            isFinished: {get: function () {
                return internal.isFinished;
            }},

            lastRotation: {get: function () {
                return internal.lastRotation;
            }},

            name: {get: function () {
                return name;
            }},

            hiscores: {get: function () {
                return hiscores;
            }}
        });
    }

    return Object.create(null, {
        create: {value: create}
    });
});
