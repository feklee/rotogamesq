// Creates tiles objects describing the status of a board.

/*jslint browser: true, maxlen: 80 */

/*global define, require, module */

var commonDefine;
try {
    commonDefine = define;
} catch (ignore) {
    commonDefine = require("amdefine")(module);
}

commonDefine(function () {
    'use strict';

    var prototype, rotate, rotateInverse, rotateWithRotator, selectedTiles,
        rotator90CW, rotator90CCW, rotator180, rgb, createFromCtx,
        createFromImgData, areEqual;

    selectedTiles = function (x1T, y1T, x2T, y2T) {
        var sTiles, sTilesColumn, xT, yT;

        sTiles = [];
        for (xT = x1T; xT <= x2T; xT += 1) {
            sTilesColumn = [];
            for (yT = y1T; yT <= y2T; yT += 1) {
                sTilesColumn.push(this[xT][yT]);
            }
            sTiles.push(sTilesColumn);
        }

        return sTiles;
    };

    rotator90CW = function (sTiles, xT, yT, dimensions) {
        return sTiles[yT][dimensions.widthT - xT];
    };

    rotator90CCW = function (sTiles, xT, yT, dimensions) {
        return sTiles[dimensions.heightT - yT][xT];
    };

    rotator180 = function (sTiles, xT, yT, dimensions) {
        return sTiles[dimensions.widthT - xT][dimensions.heightT - yT];
    };

    rotateWithRotator = function (rectT, rotator) {
        var xT, yT,
            x1T = rectT[0][0], y1T = rectT[0][1],
            x2T = rectT[1][0], y2T = rectT[1][1],
            dimensions = {
                widthT: x2T - x1T,
                heightT: y2T - y1T
            },
            sTiles = selectedTiles.call(this, x1T, y1T, x2T, y2T);

        for (xT = x1T; xT <= x2T; xT += 1) {
            for (yT = y1T; yT <= y2T; yT += 1) {
                this[xT][yT] = rotator(sTiles, xT - x1T, yT - y1T, dimensions);
            }
        }
    };

    // Rotates the tiles in the specified rectangle in the specified direction:
    // clockwise if `cw` is true
    //
    // The rectangle is defined by its top left and its bottom right corner, in
    // that order.
    rotate = function (rotation) {
        var rectT = rotation.rectT, cw = rotation.cw;

        if (rectT.isSquare) {
            if (cw) {
                rotateWithRotator.call(this, rectT, rotator90CW);
            } else {
                rotateWithRotator.call(this, rectT, rotator90CCW);
            }
        } else {
            rotateWithRotator.call(this, rectT, rotator180);
        }
    };

    // Applies the inverse of the specified rotation.
    rotateInverse = function (rotation) {
        rotate.call(this, rotation.inverse);
    };

    // Returns the specified triple as RGB string.
    rgb = function (imgData, offs) {
        return ('rgb(' +
                imgData[offs] + ',' +
                imgData[offs + 1] + ',' +
                imgData[offs + 2] + ')');
    };

    // Creates tiles (each identified by a color specifier), describing the
    // layout of a board. The data is read from the specified graphics
    // context at the given position (upper left corner) and with the given
    // side length.
    //
    // Reads color values of the image into a two dimensional array of hex
    // values. Ignores the alpha channel.
    //
    // Tile colors are stored in objects and not directly as value of a tile.
    // This makes it possible to differentiate between tiles that have the same
    // color (when comparing them using e.g. `===`).
    createFromCtx = function (ctx, posT, sideLenT) {
        var tiles, tilesColumn, xT, yT, offs,
            imgData = ctx.getImageData(posT[0], posT[1],
                                       sideLenT, sideLenT).data;

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
    };

    // Creates tiles from image data, as created with png.js for Node.js:
    //
    // <https://github.com/devongovett/png.js/>
    createFromImgData = function (imgData, imgWidth, posT, sideLenT) {
        var tiles, tilesColumn, xT, yT, offs;

        tiles = Object.create(prototype);
        for (xT = posT[0]; xT < posT[0] + sideLenT; xT += 1) {
            tilesColumn = [];
            for (yT = posT[1]; yT < posT[1] + sideLenT; yT += 1) {
                offs = 4 * (yT * imgWidth + xT);
                tilesColumn.push({
                    color: rgb(imgData, offs)
                });
            }
            tiles.push(tilesColumn);
        }

        return tiles;
    };

    areEqual = function (tiles1, tiles2, isEqual) {
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
    };

    prototype = Object.create([], {
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
        copy: {value: function () {
            var newTiles = Object.create(prototype);

            this.forEach(function (thisColumn) {
                newTiles.push(thisColumn.slice());
            });

            return newTiles;
        }},

        rotate: {value: rotate},

        rotateInverse: {value: rotateInverse}
    });

    return Object.create(null, {
        createFromCtx: {value: createFromCtx},
        createFromImgData: {value: createFromImgData}
    });
});
