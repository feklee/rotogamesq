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

    var groupEl, tableEl, contTableEl, newTdEl, newTrEl, onNameInputFieldBlur,
        onSubmit, updateSubmitButtonClasses, updateAbilityToSubmit,
        onKeyUpInNameInputField, newNameInputTdEl, newSubmitButtonTdEl,
        newInputTrEl, renderRows, render,
        board, nameInputFieldEl, submitButtonEl,
        boardIsFinished,
        submitIsEnabled = false,
        needsToBeRendered = true,
        layout = {width: 1, height: 1, left: 0, top: 0, portrait: false},
        hiscoresVersion = 0;

    groupEl = function () {
        return document.getElementById('hiscoresTableGroup');
    };

    tableEl = function () {
        return document.querySelector('#hiscoresTableGroup>table');
    };

    contTableEl = function () {
        return document.querySelector('#hiscoresTableGroup>table.cont');
    };

    newTdEl = function (text) {
        var el = document.createElement('td');

        el.appendChild(document.createTextNode(text));

        return el;
    };

    newTrEl = function (hiscore) {
        var el = document.createElement('tr');

        el.appendChild(newTdEl(hiscore.name));
        el.appendChild(newTdEl(hiscore.nRotations));

        return el;
    };

    // updates name in new hiscore entry, but does *not* save it yet
    onNameInputFieldBlur = function () {
        board.hiscores.nameInProposal = nameInputFieldEl.value;
    };

    onSubmit = function () {
        if (submitIsEnabled) {
            board.hiscores.nameInProposal = nameInputFieldEl.value;

            // Note that repeated calls to this function have no effect, since
            // after insertion (successful or not), the proposal is removed.
            board.hiscores.saveProposal();

            needsToBeRendered = true;
        }
    };

    updateSubmitButtonClasses = function () {
        var className;

        if (submitButtonEl !== undefined) {
            className = 'submit button' + (submitIsEnabled ? '' : ' disabled');
            submitButtonEl.className = className;
        }
    };

    // Updates: no name => submit does not work, and submit button is disabled
    updateAbilityToSubmit = function () {
        submitIsEnabled = nameInputFieldEl.value !== '';
        updateSubmitButtonClasses();
    };

    onKeyUpInNameInputField = function (e) {
        updateAbilityToSubmit();
        if (e.keyCode === 13) { // enter key
            onSubmit();
        }
    };

    // Caches the input field element.
    newNameInputTdEl = function (name) {
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
    };

    // Caches the submit button element.
    newSubmitButtonTdEl = function () {
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
    };

    newInputTrEl = function (hiscore) {
        var el = document.createElement('tr');

        el.className = 'input';
        el.appendChild(newNameInputTdEl(hiscore.name));
        el.appendChild(newSubmitButtonTdEl());

        // focuses text entry when clicking anywhere in the line:
        el.addEventListener('mouseup', function () {
            nameInputFieldEl.focus();
        });

        return el;
    };

    renderRows = function () {
        var el = tableEl(),
            elc = contTableEl(),
            currentEl = el,
            iToContinue = Math.ceil(board.hiscores.length / 2);

        util.clear(el);
        util.clear(elc);

        board.hiscores.forEach(function (hiscore, i, isEditable) {
            if (isEditable) {
                if (iToContinue >= 4) {
                    iToContinue -= 1; // editable row needs more vertical space
                                      // => continue earlier
                }
            }

            if (layout.portrait && i >= iToContinue) {
                currentEl = elc;
            }

            if (isEditable) {
                currentEl.appendChild(newInputTrEl(hiscore));
                nameInputFieldEl.focus();
            } else {
                currentEl.appendChild(newTrEl(hiscore));
            }
        });
    };

    render = function () {
        var s = groupEl().style,
            ts = tableEl().style,
            cts = contTableEl().style,
            width2,
            lineHeight;

        // Setting `table-layout` to `fixed` in CSS file somehow has no effect
        // in Chrome 21.0, at least for the hiscores table group. Therefore:
        ts.tableLayout = cts.tableLayout = 'fixed';

        s.width = layout.width + 'px';
        s.height = layout.height + 'px';
        s.top = layout.top + 'px';
        if (layout.portrait) {
            // portrait => continue results display in second table
            cts.display = 'table';
            width2 = Math.floor((layout.width - 2 * layout.horizontalMargin) /
                                2);
            s.left = layout.horizontalMargin + 'px';
            cts.left = (width2 + 2 * layout.horizontalMargin) + 'px';
            ts.width = cts.width = width2 + 'px';
            lineHeight = layout.height / 4;
        } else {
            cts.display = 'none';
            s.left = layout.left + 'px';
            ts.width = s.width;
            lineHeight = layout.height / 7;
        }
        cts.lineHeight = ts.lineHeight = lineHeight + 'px';
        cts.fontSize = ts.fontSize = (0.85 * lineHeight) + 'px';

        renderRows();
    };

    return Object.create(null, {
        animStep: {value: function () {
            needsToBeRendered = (needsToBeRendered ||
                                 boards.selected !== board ||
                                 board.isFinished !== boardIsFinished ||
                                 board.hiscores.version !== hiscoresVersion);

            board = boards.selected;
            boardIsFinished = board.isFinished;
            hiscoresVersion = board.hiscores.version;

            if (needsToBeRendered) {
                render();
                needsToBeRendered = false;
            }
        }},

        layout: {set: function (newLayout) {
            layout = newLayout;
            needsToBeRendered = true;
        }}
    });
});
