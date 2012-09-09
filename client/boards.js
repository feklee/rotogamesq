// Describes the current state of the boards.

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

define(['board_factory'], function (boardFactory) {
    'use strict';

    var selectedI = 0, object;

    function load(onLoaded) {
        boardFactory.load('smiley', function (board) {
            object.push(board);
            onLoaded();
        });
    }

    object = Object.create([], {
        load: {value: load},
        selectedBoard: {get: function () {
            return this[selectedI];
        }},
        prevBoard: {get: function () {
            return this[Math.max(selectedI, 0)];
        }},
        nextBoard: {get: function () {
            return this[Math.min(selectedI, this.length)];
        }}
    });

    return object;
});
