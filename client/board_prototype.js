// Prototype of an object describing a board. As there may be missing
// properties, this prototype is not usable by itself!

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

define(function () {
    'use strict';

    function isSquare(rectT) {
        var pos1T = rectT[0], pos2T = rectT[1];

        return (pos2T[0] - pos1T[0]) === (pos2T[1] - pos1T[1]);
    }

    // rotates by 90° in the specified direction
    function rotateBy90(tiles, rectT, cw) {
        console.log('fixme: rotation by 90°');
    }

    // rotates by 180°
    function rotateBy180(tiles, rectT) {
        var xT, yT, tmpTiles, tmpTilesColumn,
            x1T = rectT[0][0], y1T = rectT[0][1],
            x2T = rectT[1][0], y2T = rectT[1][1];

        tmpTiles = [];
        for (xT = x2T; xT >= x1T; xT -= 1) {
            tmpTilesColumn = [];
            for (yT = y2T; yT >= y1T; yT -= 1) {
                tmpTilesColumn.push(tiles[xT][yT]);
            }
            tmpTiles.push(tmpTilesColumn);
        }

        for (xT = x1T; xT <= x2T; xT += 1) {
            for (yT = y1T; yT <= y2T; yT += 1) {
                tiles[xT][yT] = tmpTiles[xT - x1T][yT - y1T];
            }
        }
    }

    // Rotates the tiles in the specified rectangle in the specified direction:
    // clockwise if `cw` is true
    //
    // The rectangle is defined by its top left and its bottom right corner, in
    // that order.
    function rotate(tiles, rectT, cw) {
        if (isSquare(rectT)) {
            rotateBy90(tiles, rectT, cw);
        } else {
            rotateBy180(tiles, rectT);
        }
    }

    return Object.defineProperties({}, {
        rotate: {
            value: function (rectT, cw) { rotate(this.tiles, rectT, cw); }
        }
    });
});
