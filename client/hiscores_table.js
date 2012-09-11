// Displays the list of a board's top players as a table.

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

define(['util', 'boards'], function (util, boards) {
    'use strict';

    // fixme: remove if unused
    var board;

    function tdEl(text) {
        var el = document.createElement('td');

        el.appendChild(document.createTextNode(text));

        return el;
    }

    function trEl(hiscoreEntry) {
        var el = document.createElement('tr');

        el.appendChild(tdEl(hiscoreEntry.name));
        el.appendChild(tdEl(hiscoreEntry.nRotations));

        return el;
    }

    function render() {
        var el = document.getElementById('hiscoresTable'),
            hiscores = board.hiscores;

        util.clear(el);

        hiscores.forEach(function (hiscoreEntry) {
            el.appendChild(trEl(hiscoreEntry));
        });
    }

    return Object.create(null, {
        animStep: {value: function () {
            if (boards.selected !== board) {
                board = boards.selected;
                render();
            }
        }}
    });
});
