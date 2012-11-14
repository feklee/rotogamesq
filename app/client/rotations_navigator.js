// Shows the number of steps and allows undo and redo operations. Allows binds
// keys for undo / redo.

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

    var style, buttonEl, onUndoClick, onRedoClick, onKeyUp, setupButton,
        renderButton, renderUndoButton, renderRedoButton, render,
        isDisabled, undoButtonIsDisabled, redoButtonIsDisabled,
        nRotations, board,
        needsToBeRendered = true,
        layout = {width: 1, height: 1, left: 0, top: 0},
        hiscoreWasSaved = false;

    style = function () {
        return document.getElementById('rotationsNavigator').style;
    };

    buttonEl = function (type) {
        return document.querySelector('#rotationsNavigator>.' + type +
                                      '.button');
    };

    isDisabled = function () {
        // Navigator is disabled when hiscore has been sent (or otherwise
        // player may do undo, redo, and then enter a new hiscore entry).
        return hiscoreWasSaved;
    };

    undoButtonIsDisabled = function () {
        return isDisabled() || !board.undoIsPossible;
    };

    redoButtonIsDisabled = function () {
        return isDisabled() || !board.redoIsPossible;
    };

    onUndoClick = function () {
        if (!undoButtonIsDisabled()) {
            board.undo();
        }
    };

    onRedoClick = function () {
        if (!redoButtonIsDisabled()) {
            board.redo();
        }
    };

    onKeyUp = function (e) {
        if (e.ctrlKey) {
            // Ctrl pressed (e.g. on Windows)
            switch (e.keyCode) {
            case 90: // z
                board.undo();
                break;
            case 89: // y
                board.redo();
                break;
            }
        } else if (e.metaKey && e.keyCode === 90) {
            // Meta or Command pressed with 'z' (e.g. on Mac OS X)
            if (e.shiftKey) {
                board.redo();
            } else {
                board.undo();
            }
        }
    };

    setupButton = function (type, onClick) {
        buttonEl(type).addEventListener('click', onClick);
    };

    renderButton = function (type, buttonIsDisabled) {
        // `classList` is not used as it isn't supported by Android 2.3 browser

        var className = type + ' button';

        if (buttonIsDisabled) {
            className += ' disabled';
        }

        buttonEl(type).className = className;
    };

    renderUndoButton = function () {
        renderButton('undo', undoButtonIsDisabled());
    };

    renderRedoButton = function () {
        renderButton('redo', redoButtonIsDisabled());
    };

    render = function () {
        var s = style();

        s.width = layout.width + 'px';
        s.lineHeight = s.height = layout.height + 'px';
        s.fontSize = (0.8 * layout.height) + 'px';
        s.top = layout.top + 'px';
        if (layout.portrait) {
            s.left = 'auto';
            s.right = 0;
            s.marginRight = layout.rightMargin + 'px';
            s.width = 'auto';
            s.textAlign = 'right';
        } else {
            s.left = layout.left + 'px';
            s.right = 'auto';
            s.marginRight = 0;
            s.width = layout.width;
            s.textAlign = 'center';
        }

        document.getElementById('rotationsNavigator').className =
             isDisabled() ? 'disabled' : '';
        document.getElementById('nRotations').textContent = nRotations;
        renderUndoButton();
        renderRedoButton();
    };

    util.onceDocumentIsInteractive(function () {
        setupButton('undo', onUndoClick);
        setupButton('redo', onRedoClick);

        window.addEventListener('keyup', onKeyUp);
    });

    return Object.create(null, {
        animStep: {value: function () {
            if (boards.selected !== board) {
                board = boards.selected;
                needsToBeRendered = true;
            }

            if (board.nRotations !== nRotations) {
                nRotations = board.nRotations;
                needsToBeRendered = true;
            }

            if (board.hiscores.proposalWasSaved !== hiscoreWasSaved) {
                hiscoreWasSaved = board.hiscores.proposalWasSaved;
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
        }}
    });
});
