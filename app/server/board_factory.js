// Creates a board.

/*jslint node: true, maxlen: 80 */

"use strict";

var rotationFactory = require("../common/rotation_factory");
var rectTFactory = require("../common/rect_t_factory");

// Returns false on invalid data.
var rotationFromData = function (rotationData) {
    var rectTData = rotationData.rectT;

    if (!rotationData || !rectTData) {
        return false;
    }

    var rectT = rectTFactory.create(rectTData[0], rectTData[1]);

    return rotationFactory.create(rectT, rotationData.cw);
};

var applyRotations = function (tiles, rotationsData) {
    rotationsData.forEach(function (rotationData) {
        var rotation = rotationFromData(rotationData);
        if (rotation === false) {
            return false; // invalid rotation
        }
        tiles.rotate(rotation);
    });
};

// Returns true, iff the specified rotations are a valid array of rotations,
// and if they transform the start tiles into the end tiles.
//
// Note that rotations data at best (i.e. if not broken) is an array of data
// describing rotations; it is not an array of rotation objects.
var isSolvedBy = function (board, rotationsData) {
    var tiles = board.startTiles.copy();

    try {
        if (Array.isArray(rotationsData)) {
            applyRotations(tiles, rotationsData);

            return tiles.colorsAreEqualTo(board.endTiles);
        }
        return false;
    } catch (ignore) { // just in case some bad data is not handled correctly
        return false;
    }
};

// Loads a board synchronously.
var create = function (name, startTiles, endTiles) {
    var board = Object.create(null);
    return Object.defineProperties(board, {
        name: {get: function () {
            return name;
        }},

        startTiles: {get: function () {
            return startTiles;
        }},

        endTiles: {get: function () {
            return endTiles;
        }},

        isSolvedBy: {value: function (rotationsData) {
            return isSolvedBy(board, rotationsData);
        }}
    });
};

module.exports = Object.create(null, {
    create: {value: create}
});
