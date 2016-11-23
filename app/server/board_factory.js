// Creates a board.

/*jslint node: true, maxlen: 80 */

'use strict';

var rotationFactory = require('../common/rotation_factory'),
    rectTFactory = require('../common/rect_t_factory'),
    create,
    isSolvedBy,
    isValidPosT,
    rectTFromData,
    rotationFromData;

// Returns false on invalid data.
rotationFromData = function (rotationData) {
    var rectTData = rotationData.rectT, rectT;

    if (!rotationData || !rectTData) {
        return false;
    }

    rectT = rectTFactory.create(rectTData[0], rectTData[1]);

    return rotationFactory.create(rectT, rotationData.cw);
};

// Returns true, iff the specified rotations are a valid array of rotations,
// and if they transform the start tiles into the end tiles.
//
// Note that rotations data at best (i.e. if not broken) is an array of data
// describing rotations; it is not an array of rotation objects.
isSolvedBy = function (rotationsData) {
    var i, rotation, tiles = this.startTiles.copy();

    try {
        if (Array.isArray(rotationsData)) {
            for (i = 0; i < rotationsData.length; i += 1) {
                rotation = rotationFromData(rotationsData[i]);
                if (rotation === false) {
                    return false; // invalid rotation
                }
                tiles.rotate(rotation);
            }

            return tiles.colorsAreEqualTo(this.endTiles);
        }
        return false;
    } catch (err) { // just in case some bad data is not handled correctly
        return false;
    }
};

// Loads a board synchronously.
create = function (name, startTiles, endTiles) {
    return Object.create(null, {
        name: {get: function () {
            return name;
        }},

        startTiles: {get: function () {
            return startTiles;
        }},

        endTiles: {get: function () {
            return endTiles;
        }},

        isSolvedBy: {value: isSolvedBy}
    });
};

module.exports = Object.create(null, {
    create: {value: create}
});
