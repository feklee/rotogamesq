// Creates lists of top players, associated with a certain board.

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
    // fixme: remove, if unused

    var prototype,
        maxNTopPlayers = 5;

    return Object.create([], {
        create: {value: function (rectT, cw) {
            var ;

            return Object.create(prototype, {
                rectT: {get: function () { return rectT; }},

                // direction (true: clock wise)
                cw: {get: function () { return cw; }}
            });
        }}
    });
});
