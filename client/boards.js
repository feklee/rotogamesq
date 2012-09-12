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

    var selectedI = 0,
        object,
        boardNames = ['13', 'smiley', 'invaders', 'house', 'dogman', 'rgbcmy'];

    function allBoardsAreLoaded() {
        var i;

        for (i = 0; i < boardNames.length; i += 1) {
            if (object[i] === undefined) {
                return false;
            }
        }

        return true;
    }

    object = Object.create([], {
        load: {value: function (onLoaded) {
            this.length = boardNames.length;
            boardNames.forEach(function (boardName, i) {
                boardFactory.load(boardName, function (board) {
                    object[i] = board;
                    if (allBoardsAreLoaded()) {
                        onLoaded();
                    }
                });
            });
        }},

        selected: {get: function () {
            return this[selectedI];
        }},

        selectedI: {
            get: function () {
                return selectedI;
            },
            set: function (newSelectedI) {
                selectedI = newSelectedI;
            }
        }
    });

    return object;
});
