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

// Loads a board synchronously.
exports.loadSync = function (name) {
    return Object.create(null, {
        name: {get: function () { return name; }},
        emitHiscores: {value: function (socket) {
            socket.emit('hiscores for ' + name, [
                {
                    name: 'Roger W.',
                    nRotations: 8
                },
                {
                    name: 'Felix',
                    nRotations: 10
                },
                {
                    name: 'Mario',
                    nRotations: 10
                }
            ]);
        }}
    });
};