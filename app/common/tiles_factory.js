// Creates tiles objects describing the status of a board.

/*jslint browser: true, maxlen: 80 */

/*global define, require, module */

if (typeof define !== "function") {
    var define = require("amdefine")(module);
}

define(function () {
    "use strict";

    var columnsAreEqual = function (tiles1Column, tiles2Column, isEqual) {
        var yT = 0;
        while (yT < tiles2Column.length) {
            if (!isEqual(tiles2Column[yT], tiles1Column[yT])) {
                return false;
            }
            yT += 1;
        }
        return true;
    };

    var areEqual = function (tiles1, tiles2, isEqual) {
        if (tiles2.widthT !== tiles1.widthT ||
                tiles2.heightT !== tiles1.heightT) {
            return false;
        }

        var xT = 0;
        while (xT < tiles2.length) {
            if (!columnsAreEqual(tiles1[xT], tiles2[xT], isEqual)) {
                return false;
            }
            xT += 1;
        }

        return true;
    };

    var selectedTilesInColumn = function (tiles, xT, y1T, y2T) {
        var sTilesColumn = [];
        var yT = y1T;
        while (yT <= y2T) {
            sTilesColumn.push(tiles[xT][yT]);
            yT += 1;
        }
        return sTilesColumn;
    };

    var selectedTiles = function (tiles, x1T, y1T, x2T, y2T) {
        var sTiles = [];
        var xT = x1T;
        while (xT <= x2T) {
            sTiles.push(selectedTilesInColumn(tiles, xT, y1T, y2T));
            xT += 1;
        }

        return sTiles;
    };

    var rotator90CW = function (sTiles, xT, yT, dimensions) {
        return sTiles[yT][dimensions.widthT - xT];
    };

    var rotator90CCW = function (sTiles, xT, yT, dimensions) {
        return sTiles[dimensions.heightT - yT][xT];
    };

    var rotator180 = function (sTiles, xT, yT, dimensions) {
        return sTiles[dimensions.widthT - xT][dimensions.heightT - yT];
    };

    var rotateColumnWithRotator = function (xT, tiles, sTiles, x1T, y1T, y2T,
            dimensions, rotator) {
        var yT = y1T;
        while (yT <= y2T) {
            tiles[xT][yT] = rotator(sTiles, xT - x1T, yT - y1T, dimensions);
            yT += 1;
        }
    };

    var rotateWithRotator = function (tiles, rectT, rotator) {
        var x1T = rectT[0][0];
        var y1T = rectT[0][1];
        var x2T = rectT[1][0];
        var y2T = rectT[1][1];
        var dimensions = {
            widthT: x2T - x1T,
            heightT: y2T - y1T
        };
        var sTiles = selectedTiles(tiles, x1T, y1T, x2T, y2T);

        var xT = x1T;
        while (xT <= x2T) {
            rotateColumnWithRotator(xT, tiles, sTiles, x1T, y1T, y2T,
                    dimensions, rotator);
            xT += 1;
        }
    };

    // Rotates the tiles in the specified rectangle in the specified direction:
    // clockwise if `cw` is true
    //
    // The rectangle is defined by its top left and its bottom right corner, in
    // that order.
    var rotate = function (tiles, rotation) {
        var rectT = rotation.rectT;
        var cw = rotation.cw;

        if (rectT.isSquare) {
            if (cw) {
                rotateWithRotator(tiles, rectT, rotator90CW);
            } else {
                rotateWithRotator(tiles, rectT, rotator90CCW);
            }
        } else {
            rotateWithRotator(tiles, rectT, rotator180);
        }
    };

    // Applies the inverse of the specified rotation.
    var rotateInverse = function (tiles, rotation) {
        rotate(tiles, rotation.inverse);
    };

    // Returns the specified triple as RGB string.
    var rgb = function (imgData, offs) {
        return ("rgb(" +
                imgData[offs] + "," +
                imgData[offs + 1] + "," +
                imgData[offs + 2] + ")");
    };

    var createColumnFromCtx = function (xT, sideLenT, imgData) {
        var tilesColumn = [];
        var offs;
        var yT = 0;
        while (yT < sideLenT) {
            offs = 4 * (yT * sideLenT + xT);
            tilesColumn.push({
                color: rgb(imgData, offs)
            });
            yT += 1;
        }
        return tilesColumn;
    };

    var create;
    create = function () {
        var newTiles = Object.create([]);

        return Object.defineProperties(newTiles, {
            areEqualTo: {value: function (tiles) {
                return areEqual(newTiles, tiles, function (tile1, tile2) {
                    return tile1 === tile2;
                });
            }},

            colorsAreEqualTo: {value: function (tiles) {
                return areEqual(newTiles, tiles, function (tile1, tile2) {
                    return tile1.color === tile2.color;
                });
            }},

            widthT: {get: function () {
                return newTiles.length;
            }},

            heightT: {get: function () {
                return newTiles.widthT > 0
                    ? newTiles[0].length
                    : 0;
            }},

            // Returns a deep copy of the object.
            copy: {value: function () {
                var copiedTiles = create();

                newTiles.forEach(function (thisColumn) {
                    copiedTiles.push(thisColumn.slice());
                });

                return copiedTiles;
            }},

            rotate: {value: function (rotation) {
                rotate(newTiles, rotation);
            }},

            rotateInverse: {value: function (rotation) {
                rotateInverse(newTiles, rotation);
            }}
        });
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
    var createFromCtx = function (ctx, posT, sideLenT) {
        var imgData = ctx.getImageData(
            posT[0],
            posT[1],
            sideLenT,
            sideLenT
        ).data;
        var tiles = create();
        var xT = 0;
        while (xT < sideLenT) {
            tiles.push(createColumnFromCtx(xT, sideLenT, imgData));
            xT += 1;
        }

        return tiles;
    };

    var createColumnFromImgData = function (xT, posT, sideLenT, imgWidth,
            imgData) {
        var tilesColumn = [];
        var offs;
        var yT = posT[1];
        while (yT < posT[1] + sideLenT) {
            offs = 4 * (yT * imgWidth + xT);
            tilesColumn.push({
                color: rgb(imgData, offs)
            });
            yT += 1;
        }
        return tilesColumn;
    };

    // Creates tiles from image data, as created with png.js for Node.js:
    //
    // <https://github.com/devongovett/png.js/>
    var createFromImgData = function (imgData, imgWidth, posT, sideLenT) {
        var tiles = create();
        var xT = posT[0];
        while (xT < posT[0] + sideLenT) {
            tiles.push(createColumnFromImgData(xT, posT, sideLenT, imgWidth,
                    imgData));
            xT += 1;
        }
        return tiles;
    };

    return Object.create(null, {
        createFromCtx: {value: createFromCtx},
        createFromImgData: {value: createFromImgData}
    });
});
