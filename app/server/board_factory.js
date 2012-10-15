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
    rotationFromData;

rotationFromData = function (rotationData) {
    var rectTData;

    if (!rotationData || !rotationData.rectT ||
            rotationData.hasOwnProperty('cw')) {
        return false;
    }

    rectTData = rotationData.rectT;
    // fixme: check if rectT is correct (positions are valid, perhaps with
    // extra function)

    return true; // fixme: implement rotation
};

// Returns true, iff the specified rotations are a valid array of rotations,
// and if they transform the start tiles into the end tiles.
//
// Note that rotations data at best (i.e. if not broken) is an array of data
// describing rotations, but is not an array of rotation objects.
isSolvedBy = function (rotationsData) {
    var i, rotation, rectT, cw, tiles = this.startTiles.copy();

    if (rotationsData.isArray()) {
        for (i = 0; i < rotationsData.length; i += 1) {
            rotation = rotationFromData(rotationsData[i]);
            if (rotation === false) {
                return false; // invalid rotation
            }
            tiles.rotate(rotation);
        }
    } else {
        return false;
    }
};

// Loads a board synchronously.
create = function (name, startTiles, endTiles) {
    var hiscores = hiscoresFactory.create(name);

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

        listen: {value: hiscores.listen},

        emitHiscores: {value: hiscores.emit}
    });
};

module.exports = Object.create(null, {
    create: {value: create}
});
