// Creates rectangles in coordinates of tiles.

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

    var prototype, areSamePosT;

    areSamePosT = function (pos1T, pos2T) {
        return pos1T[0] === pos2T[0] && pos1T[1] === pos2T[1];
    };

    prototype = Object.defineProperties([], {
        isEqualTo: {value: function (rectT) {
            return (areSamePosT(this[0], rectT[0]) &&
                    areSamePosT(this[1], rectT[1]));
        }},
        widthT: {get: function () {
            return this[1][0] - this[0][0];
        }},
        heightT: {get: function () {
            return this[1][1] - this[0][1];
        }}
    });

    return Object.defineProperties({}, {
        // Creates rectangle from top-left and bottom-right corners.
        create: {value: function (tlPosT, brPosT) {
            var newRectT = Object.create(prototype);

            newRectT.push(tlPosT);
            newRectT.push(brPosT);

            return newRectT;
        }}
    });
});
