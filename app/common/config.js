// Common configuration, for client and server.

// 

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
            name: 'firtree:2013-12-01:2013-12-31',
            sideLenT: 5, // px
            startPosT: [17, 72], // position of upper left corner of start
                                 // tiles in boards sprites
            endPosT: [12, 72],
            start: '12-01',
            duration: 31
        },
        {
            name: 'apple',
            sideLenT: 5,
            startPosT: [15, 78],
            endPosT: [10, 78],
            start: '11-22',
            duration: 25
        },
        // {
        //     name: 'pumpkin',
        //     sideLenT: 7,
        //     startPosT: [0, 65],
        //     endPosT: [7, 65],
        //     start: '10-31',
        //     duration: 40
        // },
        // {
        //     name: 'pumpkins',
        //     sideLenT: 5,
        //     startPosT: [0, 78],
        //     endPosT: [5, 78],
        //     start: '10-31',
        //     duration: 25
        // },
        // {
        //     name: 'bee',
        //     sideLenT: 8,
        //     startPosT: [0, 57],
        //     endPosT: [8, 57]
        // },
        // {
        //     name: 'ebunny',
        //     sideLenT: 5,
        //     startPosT: [10, 45],
        //     endPosT: [15, 45]
        // },
        // {
        //     name: 'bfly',
        //     sideLenT: 7,
        //     startPosT: [0, 50],
        //     endPosT: [7, 50]
        // },
        // {
        //     name: 'flower',
        //     sideLenT: 5,
        //     startPosT: [0, 45],
        //     endPosT: [5, 45]
        // },
        {
            name: '20',
            sideLenT: 6,
            startPosT: [14, 10],
            endPosT: [14, 16],
            start: '01-01',
            duration: 330
        },
        {
            name: '13',
            sideLenT: 5,
            startPosT: [0, 0],
            endPosT: [5, 0],
            start: '2013-01-01',
            duration: 330
        },
        {
            name: 'chess',
            sideLenT: 8,
            startPosT: [0, 23],
            endPosT: [8, 23],
            start: '02-01',
            duration: 330
        },
        // {
        //     name: 'xmastree',
        //     sideLenT: 7,
        //     startPosT: [14, 31],
        //     endPosT: [14, 38]
        // },
        // {
        //     name: 'nikolaus',
        //     sideLenT: 5,
        //     startPosT: [12, 5],
        //     endPosT: [17, 5]
        // },
        {
            name: 'smiley',
            sideLenT: 5,
            startPosT: [0, 5],
            endPosT: [5, 5],
            start: '03-01',
            duration: 330
        },
        {
            name: 'house',
            sideLenT: 7,
            startPosT: [0, 10],
            endPosT: [7, 10],
            start: '04-01',
            duration: 330
        },
        {
            name: 'rgbcmy',
            sideLenT: 6,
            startPosT: [0, 17],
            endPosT: [6, 17],
            start: '05-01',
            duration: 330
        },
        {
            name: 'logo',
            sideLenT: 5,
            startPosT: [12, 0],
            endPosT: [17, 0],
            start: '06-01',
            duration: 330
        },
        {
            name: 'star',
            sideLenT: 7,
            startPosT: [0, 31],
            endPosT: [7, 31],
            start: '07-01',
            duration: 330
        },
        {
            name: 'race',
            sideLenT: 7,
            startPosT: [0, 38],
            endPosT: [7, 38],
            start: '08-01',
            duration: 330
        },
        // {
        //     name: 'pumpkinm',
        //     sideLenT: 6,
        //     startPosT: [0, 72],
        //     endPosT: [6, 72],
        //     start: '10-31'
        //     duration: 25
        // },
        {
            name: 'mushroom',
            sideLenT: 7,
            startPosT: [14, 65],
            endPosT: [14, 50],
            start: '11-22',
            duration: 25
        }
    ]
});
