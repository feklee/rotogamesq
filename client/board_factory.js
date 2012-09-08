// Creates boards (by loading from URLs).

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

define(['tiles_factory'], function (tilesFactory) {
    'use strict';

    var prototype;

    function allTilesAreLoaded(board) {
        return (board.hasOwnProperty('tiles') &&
                board.hasOwnProperty('endTiles'));
    }

    function onAllTilesLoaded(board, onLoaded) {
        Object.defineProperty(board, 'sideLenT', {value: board.tiles.length});
        onLoaded(board);
    }

    // Start tiles form the *mutable* start layout of blocks, i.e. the current
    // state of the board.
    function onStartTilesLoaded(board, tiles, onLoaded) {
        Object.defineProperty(board, 'tiles', {value : tiles});
        if (allTilesAreLoaded(board)) {
            onAllTilesLoaded(board, onLoaded);
        }
    }

    // Start tiles form the *immutable* start layout of blocks, the destination
    // state of the board.
    function onEndTilesLoaded(board, tiles, onLoaded) {
        Object.defineProperty(board, 'endTiles', {value : tiles});
        if (allTilesAreLoaded(board)) {
            onAllTilesLoaded(board, onLoaded);
        }
    }

    function imgUrl(name, type) {
        return 'boards/' + name + '/' + type + '.gif';
    }

    function inverseRotation(rotation) {
        return {
            rectT: rotation.rectT,
            cw: !rotation.cw
        };
    }

    function isSquare(rectT) {
        var pos1T = rectT[0], pos2T = rectT[1];

        return (pos2T[0] - pos1T[0]) === (pos2T[1] - pos1T[1]);
    }

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

        if (isSquare(rectT)) {
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
        rotateTiles(tiles, inverseRotation(rotation));
    }

    prototype = Object.defineProperties({}, {
        rotate: {value: function (rotation, rotations, futureRotations) {
            var rectT = rotation.rectT, cw = rotation.cw, tiles = this.tiles;

            rotations.push(rotation);
            futureRotations.length = 0; // resets redo history
            rotateTiles(this.tiles, rotation);
        }},

        undo: {value: function (rotations, futureRotations) {
            var rotation = rotations.pop();
            if (rotation !== undefined) {
                futureRotations.push(rotation);
                rotateTilesInverse(this.tiles, rotation);
            } // else: no more undo
        }},

        redo: {value: function (rotations, futureRotations) {
            var rotation = futureRotations.pop();
            if (rotation !== undefined) {
                rotations.push(rotation);
                rotateTiles(this.tiles, rotation);
            } // else: no more redo
        }}
    });

    // Loads the board, and calls `onLoaded(board)` when done.
    function load(name, onLoaded) {
        var board = Object.create(prototype),
            rotations = [], // for undo, for counting, ...
            futureRotations = [], // for redo
            isFinished = false; // true when game is finished

        Object.defineProperties(board, {
            rotate: {value: function (rotation) {
                prototype.rotate.call(this, rotation,
                                      rotations, futureRotations);
                isFinished = this.tiles.isEqualTo(this.endTiles);
            }},

            nRotations: {get: function () {
                return rotations.length;
            }},

            undoIsPossible: {get: function () {
                return rotations.length > 0;
            }},

            undo: {value: function () {
                prototype.undo.call(this, rotations, futureRotations);
                isFinished = this.tiles.isEqualTo(this.endTiles);
            }},

            redoIsPossible: {get: function () {
                return futureRotations.length > 0;
            }},

            redo: {value: function () {
                prototype.redo.call(this, rotations, futureRotations);
                isFinished = this.tiles.isEqualTo(this.endTiles);
            }},

            isFinished: {get: function () {
                return isFinished;
            }}
        });

        tilesFactory.load(imgUrl(name, 'start'), function (tiles) {
            onStartTilesLoaded(board, tiles, onLoaded);
        });
        tilesFactory.load(imgUrl(name, 'end'), function (tiles) {
            onEndTilesLoaded(board, tiles, onLoaded);
        });
    }

    return Object.create(null, {
        'load': {value: load}
    });
});
