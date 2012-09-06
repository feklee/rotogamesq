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

/*jslint browser: true, devel: true, maxerr: 50, maxlen: 79 */

/*global define */

define(['board_loader'], function (boardLoader) {
    'use strict';

    var selectedBoard;

    function load(onLoaded) {
        boardLoader.load('smiley', function (board) {
            selectedBoard = board; // there's only one board at the moment
            onLoaded();
        });
    }

    return Object.defineProperties({}, {
        'load': {value: load},
        'selectedBoard': {get: function () { return selectedBoard; }}
    });
});
