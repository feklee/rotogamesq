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

    var board, nameInputFieldEl, submitButtonEl,
        boardIsFinished,
        submitIsEnabled = false,
        needsToBeRendered = true,

        layout = {width: 1, height: 1, left: 0, top: 0};

    function style() {
        return document.getElementById('hiscoresTable').style;
    }

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

    function onSubmit() {
        if (submitIsEnabled) {
            board.hiscores.nameInProposal = nameInputFieldEl.value;

            // Note that repeated calls to this function have no effect, since
            // after insertion (successful or not), the proposal is removed.
            board.hiscores.saveProposal();

            needsToBeRendered = true;
        }
    }

    function updateSubmitButtonClasses() {
        var className;

        if (submitButtonEl !== undefined) {
            className = 'submit button' + (submitIsEnabled ? '' : ' disabled');
            submitButtonEl.className = className;
        }
    }

    // Updates: no name => submit does not work, and submit button is disabled
    function updateAbilityToSubmit() {
        submitIsEnabled = nameInputFieldEl.value !== '';
        updateSubmitButtonClasses();
    }

    function onKeyUpInNameInputField(e) {
        updateAbilityToSubmit();
        if (e.keyCode === 13) { // enter key
            onSubmit();
        }
    }

    // Caches the input field element.
    function newNameInputTdEl(name) {
        var el = document.createElement('td');

        if (nameInputFieldEl === undefined) {
            nameInputFieldEl = document.createElement('input');
            nameInputFieldEl.type = 'text';
            nameInputFieldEl.maxLength = nameInputFieldEl.size =
                board.hiscores.maxNameLen;
            nameInputFieldEl.spellcheck = false;
            nameInputFieldEl.addEventListener('blur', onNameInputFieldBlur);
            nameInputFieldEl.addEventListener('keyup',
                                              onKeyUpInNameInputField);
            nameInputFieldEl.addEventListener('propertychange',
                                              updateAbilityToSubmit);
            nameInputFieldEl.addEventListener('input', updateAbilityToSubmit);
            nameInputFieldEl.addEventListener('paste', updateAbilityToSubmit);
        }
        nameInputFieldEl.value = name;
        el.appendChild(nameInputFieldEl);

        updateAbilityToSubmit(); // depends on `name`

        return el;
    }

    // Caches the submit button element.
    function newSubmitButtonTdEl() {
        var el = document.createElement('td');

        if (submitButtonEl === undefined) {
            submitButtonEl = document.createElement('span');
            submitButtonEl.appendChild(
                document.createTextNode('↵') // &crarr;
            );
            submitButtonEl.addEventListener('click', onSubmit);
            updateSubmitButtonClasses();
        }

        el.appendChild(submitButtonEl);

        return el;
    }

    function newInputTrEl(hiscore) {
        var el = document.createElement('tr');

        el.className = 'input';
        el.appendChild(newNameInputTdEl(hiscore.name));
        el.appendChild(newSubmitButtonTdEl());

        // focuses text entry when clicking anywhere in the line:
        el.addEventListener('mouseup', function () {
            nameInputFieldEl.focus();
        });

        return el;
    }

    function render() {
        var i, hiscore,
            el = document.getElementById('hiscoresTable'),
            s = style(),
            hiscores = board.hiscores,
            maxI = hiscores.length;

        s.width = layout.width + 'px';
        s.left = layout.left + 'px';
        s.fontSize = Math.ceil(0.12 * layout.height) + 'px';
        s.top = layout.top + 'px';

        util.clear(el);

        board.hiscores.forEach(function (hiscore, i, isEditable) {
            if (isEditable) {
                el.appendChild(newInputTrEl(hiscore));
                nameInputFieldEl.focus();
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
                needsToBeRendered = true;
            } else if (board.isFinished !== boardIsFinished) {
                boardIsFinished = board.isFinished;
                needsToBeRendered = true;
            }

            if (needsToBeRendered) {
                render();
                needsToBeRendered = false;
            }
        }},

        layout: {set: function (newLayout) {
            layout = newLayout;
            needsToBeRendered = true;
        }},

        show: {value: function () {
            style().display = 'table';
        }}
    });
});
