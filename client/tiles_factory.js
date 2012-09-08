// Creates tiles objects describing the status of a board.

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

define(function () {
    'use strict';

    var prototype;

    // Returns the specified triple as RGB string.
    function rgb(imgData, offs) {
        return ('rgb(' +
                imgData[offs] + ',' +
                imgData[offs + 1] + ',' +
                imgData[offs + 2] + ')');
    }

    // Reads the color values of the image into a two dimensional array of hex
    // values. Ignores the alpha channel.
    //
    // Tile colors are stored in objects and not directly as value of a tile.
    // This makes it possible to differentiate between tiles that have the same
    // color (when comparing them using e.g. `===`).
    function tilesFromCtx(ctx, width, height) {
        var tiles, tilesColumn, xT, yT, triple, offs,
            sideLenT = Math.min(width, height), // forces square dimensions
            imgData = ctx.getImageData(0, 0, sideLenT, sideLenT).data,
            tileId = 0;

        tiles = Object.create(prototype);
        for (xT = 0; xT < sideLenT; xT += 1) {
            tilesColumn = [];
            for (yT = 0; yT < sideLenT; yT += 1) {
                offs = 4 * (yT * sideLenT + xT);
                tilesColumn.push({
                    color: rgb(imgData, offs)
                });
            }
            tiles.push(tilesColumn);
        }

        return tiles;
    }

    function areEqual(tiles1, tiles2, isEqual) {
        var xT, yT, tiles2Column, tiles1Column;

        if (tiles2.widthT !== tiles1.widthT ||
                tiles2.heightT !== tiles1.heightT) {
            return false;
        }

        for (xT = 0; xT < tiles2.length; xT += 1) {
            tiles2Column = tiles2[xT];
            tiles1Column = tiles1[xT];
            for (yT = 0; yT < tiles2Column.length; yT += 1) {
                if (!isEqual(tiles2Column[yT], tiles1Column[yT])) {
                    return false;
                }
            }
        }

        return true;
    }

    prototype = Object.defineProperties([], {
        areEqualTo: {value: function (tiles) {
            return areEqual(this, tiles, function (tile1, tile2) {
                return tile1 === tile2;
            });
        }},

        colorsAreEqualTo: {value: function (tiles) {
            return areEqual(this, tiles, function (tile1, tile2) {
                return tile1.color === tile2.color;
            });
        }},

        widthT: {get: function () {
            return this.length;
        }},

        heightT: {get: function () {
            return this.widthT > 0 ? this[0].length : 0;
        }},

        // Returns a deep copy of `this`.
        copy: {value: function (rectT) {
            var newTiles = Object.create(prototype), xT;

            this.forEach(function (thisColumn) {
                newTiles.push(thisColumn.slice());
            });

            return newTiles;
        }}
    });

    return Object.create(null, {
        // Loads tiles (each identified by a color specifier), describing the
        // layout of a board. The data is read from the specified graphics
        // file.
        load: {value: function (imgUrl, onLoaded) {
            var img = new Image();

            img.onload = function () {
                var tmpCanvas = document.createElement('canvas'),
                    ctx = tmpCanvas.getContext('2d');
                tmpCanvas.width = img.width;
                tmpCanvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                onLoaded(tilesFromCtx(ctx, img.width, img.height));
            };
            img.src = imgUrl;
        }}
    });
});
