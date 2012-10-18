// Creates objects that describe rotations.

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

/*jslint node: true, maxerr: 50, maxlen: 79 */

/*global define */

if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function () {
    'use strict';

    var prototype;

    // Returns false if `rectT` is false or `cw` is not boolean.
    function create(rectT, cw) {
        if (!rectT || typeof cw !== 'boolean') {
            return false;
        }

        return Object.create(prototype, {
            rectT: {get: function () { return rectT; },
                    enumerable: true},

            // direction (true: clock wise)
            cw: {get: function () { return cw; },
                 enumerable: true}
        });
    }

    prototype = Object.create(null, {
        isEqualTo: {value: function (rotation) {
            return (this.rectT.isEqualTo(rotation.rectT) &&
                    this.cw === rotation.cw);
        }},

        // rotations of just one tile don't make sense
        makesSense: {get: function () {
            return this.rectT.widthT > 0 || this.rectT.heightT > 0;
        }},

        direction: {get: function () {
            return this.cw ? -1 : 1;
        }},

        angleRad: {get: function () {
            return this.direction * (this.rectT.isSquare ?
                                     Math.PI / 2 : Math.PI);
        }},

        angleDeg: {get: function () {
            return this.direction * (this.rectT.isSquare ? 90 : 180);
        }},

        inverse: {get: function () {
            return create(this.rectT, !this.cw);
        }}
    });

    return Object.create(null, {
        create: {value: create}
    });
});
