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
    var board, nameInputFieldEl, boardIsFinished, inputIsAllowed,
        needsToBeRendered = true;

    function newTdEl(text) {
        var el = document.createElement('td');

        el.appendChild(document.createTextNode(text));

        return el;
    }

    function newTrEl(hiscore) {
        var el = document.createElement('tr');

        el.appendChild(newTdEl(hiscore.name));
        el.appendChild(newTdEl(hiscore.nRotations));

        return el;
    }

    // updates name in new hiscore entry, but does *not* save it yet
    function onNameInputFieldBlur() {
        board.hiscores.nameInProposal = nameInputFieldEl.value;
    }

    function newNameInputTdEl(name) {
        var el = document.createElement('td');

        if (nameInputFieldEl === undefined) {
            nameInputFieldEl = document.createElement('input');
            nameInputFieldEl.type = 'text';
            nameInputFieldEl.maxLength = nameInputFieldEl.size =
                board.hiscores.maxNameLen;
            nameInputFieldEl.addEventListener('blur', onNameInputFieldBlur);
        }
        nameInputFieldEl.value = name;
        el.appendChild(nameInputFieldEl);

        return el;
    }

    function newSubmitButtonTdEl() {
        var submitButtonEl = document.createElement('span'),
            el = document.createElement('td');

        submitButtonEl.appendChild(document.createTextNode('↵')); // &crarr;
        el.appendChild(submitButtonEl);

        return el;
    }

    function newInputTrEl(hiscore) {
        var el = document.createElement('tr');

        el.className = 'input';
        el.appendChild(newNameInputTdEl(hiscore.name));
        el.appendChild(newSubmitButtonTdEl());

        return el;
    }

    function render() {
        var i, hiscore,
            el = document.getElementById('hiscoresTable'),
            hiscores = board.hiscores,
            maxI = hiscores.length;

        util.clear(el);

        board.hiscores.forEach(function (hiscore, i, isEditable) {
            if (isEditable) {
                el.appendChild(newInputTrEl(hiscore));
            } else {
                el.appendChild(newTrEl(hiscore));
            }
        });
    }

    return Object.create(null, {
        animStep: {value: function () {
            if (boards.selected !== board) {
                board = boards.selected;
                boardIsFinished = board.isFinished;
                inputIsAllowed = false;
                needsToBeRendered = true;
            } else if (board.isFinished !== boardIsFinished) {
                boardIsFinished = board.isFinished;
                inputIsAllowed = boardIsFinished;
                needsToBeRendered = true;
            }

            if (needsToBeRendered) {
                render();
                needsToBeRendered = false;
            }
        }}
    });
});
