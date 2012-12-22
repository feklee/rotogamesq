// Common configuration, for client and server.

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

define({
    boards: [ // shown in the specified order, from left to right
        {
            name: 'xmastree',
            sideLenT: 7, // px
            startPosT: [14, 31], // position of upper left corner of start
                                 // tiles in boards sprites
            endPosT: [14, 38]
        },
        {
            name: 'nikolaus',
            sideLenT: 5,
            startPosT: [12, 5],
            endPosT: [17, 5]
        },
        {
            name: 'smiley',
            sideLenT: 5,
            startPosT: [0, 5],
            endPosT: [5, 5]
        },
        {
            name: 'house',
            sideLenT: 7,
            startPosT: [0, 10],
            endPosT: [7, 10]
        },
        {
            name: '13',
            sideLenT: 5,
            startPosT: [0, 0],
            endPosT: [5, 0]
        },
        {
            name: 'rgbcmy',
            sideLenT: 6,
            startPosT: [0, 17],
            endPosT: [6, 17]
        },
        {
            name: 'logo',
            sideLenT: 5,
            startPosT: [12, 0],
            endPosT: [17, 0]
        },
        {
            name: 'star',
            sideLenT: 7,
            startPosT: [0, 31],
            endPosT: [7, 31]
        },
        {
            name: 'race',
            sideLenT: 7,
            startPosT: [0, 38],
            endPosT: [7, 38]
        },
        {
            name: 'chess',
            sideLenT: 8,
            startPosT: [0, 23],
            endPosT: [8, 23]
        }
    ]
});
