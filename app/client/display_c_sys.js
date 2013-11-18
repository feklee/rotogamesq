// Functionality for the coordinate system in the display canvases.

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

define(['boards'], function (boards) {
    'use strict';

    var updateDimensions,
        sideLen,
        board,
        tileSideLen = 0,
        spacing = 0,
        spacingIsDisabled = false;

    updateDimensions = function () {
        var sideLenT;

        if (board !== undefined) {
            sideLenT = board.sideLenT;
            spacing = spacingIsDisabled ? 0 : 0.05 * sideLen / sideLenT;
            tileSideLen = (sideLen - spacing * (sideLenT + 1)) / sideLenT;
        }
    };

    return Object.create(null, {
        sideLen: {set: function (x) {
            if (x !== sideLen) {
                sideLen = x;
                updateDimensions();
            }
        }},

        animStep: {value: function () {
            if (boards.selected !== board) {
                board = boards.selected;
                updateDimensions();
            }
        }},

        // Converts tile position to screen position.
        posFromPosT: {value: function (posT) {
            return posT.map(function (coordT) {
                return coordT * (tileSideLen + spacing) + spacing;
            });
        }},

        // inverse of `posFromPosT`, with `Math.floor` applied to each element
        posTFromPos: {value: function (pos) {
            return pos.map(function (coord) {
                return (coord - spacing) / (tileSideLen + spacing);
            });
        }},

        // If the specified position is in spacing between tiles, then
        // coordinates in question are shifted so that they are in the middle
        // of the next tile to the upper and/or left.
        decIfInSpacing: {value: function (pos) {
            return pos.map(function (coord) {
                var modulo = coord % (tileSideLen + spacing);
                return ((coord > 0 && modulo < spacing) ?
                        (coord - modulo - tileSideLen / 2) :
                        coord);
            });
        }},

        // Like `decIfInSpacing` but shifts to the tile to the lower and/or
        // right.
        incIfInSpacing: {value: function (pos) {
            return pos.map(function (coord) {
                var modulo = coord % (tileSideLen + spacing);
                return ((coord > 0 && modulo < spacing) ?
                        (coord - modulo + spacing + tileSideLen / 2) :
                        coord);
            });
        }},

        // Returns posT, if necessary truncates so that it fits into the board.
        posTInBounds: {value: function (posT) {
            return posT.map(function (coordT) {
                return Math.min(Math.max(coordT, 0), board.sideLenT - 1);
            });
        }},

        tileSideLen: {get: function () {
            return tileSideLen;
        }},

        spacing: {get: function () {
            return spacing;
        }},

        disableSpacing: {value: function () {
            spacingIsDisabled = true;
            updateDimensions();
        }},

        enableSpacing: {value: function () {
            spacingIsDisabled = false;
            updateDimensions();
        }}
    });
});
