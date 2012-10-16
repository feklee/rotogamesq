// Creates a board.

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

/*jslint node: true, maxerr: 50, maxlen: 79, nomen: true */

'use strict';

var hiscoresFactory = require('./hiscores_factory'),
    rotationFactory = require('../common/rotation_factory'),
    rectTFactory = require('../common/rect_t_factory'),
    create,
    isSolvedBy,
    isValidPosT,
    rectTFromData,
    rotationFromData;

isValidPosT = function (posT) {
    return (Array.isArray(posT) &&
            posT.length === 2 &&
            typeof posT[0] === 'number' &&
            typeof posT[1] === 'number');
};

// Returns false on invalid data.
rectTFromData = function (rectTData) {
    var tlPosT, brPosT;

    // Don't check for `Array.isArray`: May/Will fail for valid rectT object
    if (!rectTData.length || rectTData.length !== 2) {
        return false;
    }

    tlPosT = rectTData[0];
    brPosT = rectTData[1];

    if (!isValidPosT(tlPosT) || !isValidPosT(brPosT)) {
        return false;
    }

    return rectTFactory.create(tlPosT, brPosT);
};

// Returns false on invalid data.
rotationFromData = function (rotationData) {
    var rectT;

    if (!rotationData ||
            !rotationData.rectT ||
            typeof rotationData.cw !== 'boolean') {
        return false;
    }

    rectT = rectTFromData(rotationData.rectT);
    if (!rectT) {
        return false;
    }

    console.log('fixme4b');
    return rotationFactory(rectT, rotationData.cw);
};

// Returns true, iff the specified rotations are a valid array of rotations,
// and if they transform the start tiles into the end tiles.
//
// Note that rotations data at best (i.e. if not broken) is an array of data
// describing rotations; it is not an array of rotation objects.
isSolvedBy = function (rotationsData) {
    var i, rotation, rectT, cw, tiles = this.startTiles.copy();

    try {
        if (Array.isArray(rotationsData)) {
            console.log('fixme0');
            for (i = 0; i < rotationsData.length; i += 1) {
                console.log('fixme4');
                rotation = rotationFromData(rotationsData[i]);
                console.log('fixme5');
                if (rotation === false) {
                    console.log('fixme1');
                    return false; // invalid rotation
                }
                console.log('fixme6');
                tiles.rotate(rotation);
            }

            console.log('fixme2');
            return tiles.areEqualTo(this.endTiles);
        } else {
            console.log('fixme3');
            return false;
        }
    } catch (err) { // just in case some bad data is not handled correctly
        return false;
    }
};

// Loads a board synchronously.
create = function (name, startTiles, endTiles) {
    var hiscores = hiscoresFactory.create();

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

        isSolvedBy: {value: isSolvedBy},

        listen: {value: function (socket) {
            hiscores.listen(socket, this);
        }},

        emitHiscores: {value: function (socket) {
            hiscores.emit(socket, this);
        }}
    });
};

module.exports = Object.create(null, {
    create: {value: create}
});
