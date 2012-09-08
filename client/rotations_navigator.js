// Shows the number of steps and allows undo and redo operations.

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

define(['boards', 'util'], function (boards, util) {
    'use strict';

    var nRotations, selectedBoard;

    function needsToBeRendered() {
        var newSelectedBoard = boards.selectedBoard;

        return (selectedBoard !== newSelectedBoard ||
                nRotations !== selectedBoard.nRotations);
    }

    function buttonEl(type) {
        return document.querySelector('#stepsNavigator>.' + type +
                                      '.button');
    }

    function onUndoClick() {
        selectedBoard.undo();
    }

    function onRedoClick() {
        selectedBoard.redo();
    }

    function setupButton(type, onClick) {
        buttonEl(type).addEventListener('click', onClick);
    }

    function renderButton(type, isDisabled) {
        // `classList` is not used as it isn't supported by Android 2.3 browser

        var className = type + ' button';

        if (isDisabled) {
            className += ' disabled';
        }

        buttonEl(type).className = className;
    }

    function renderUndoButton() {
        renderButton('undo', !selectedBoard.undoIsPossible);
    }

    function renderRedoButton() {
        renderButton('redo', !selectedBoard.redoIsPossible);
    }

    function render() {
        selectedBoard = boards.selectedBoard;
        nRotations = selectedBoard.nRotations;

        document.getElementById('nRotations').textContent = nRotations;
        renderUndoButton();
        renderRedoButton();
    }

    util.whenDocumentIsReady(function () {
        setupButton('undo', onUndoClick);
        setupButton('redo', onRedoClick);
    });

    return Object.defineProperties({}, {
        animationStep: {value: function () {
            if (needsToBeRendered()) {
                render();
            }
        }}
    });
});
