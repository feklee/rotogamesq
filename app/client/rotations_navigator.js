// Shows the number of steps and allows undo and redo operations. Allows binds
// keys for undo / redo.

/*jslint browser: true, maxlen: 80 */

/*global define */

define(['boards', 'util'], function (boards, util) {
    'use strict';

    var style, buttonEl, nRotationsEl,
        onUndoClick, onRedoClick, onResetClick, onKeyUp,
        setupButton, renderButton, renderUndoButton, renderRedoButton,
        updateControlsVisibility,
        render,
        nRotations, board,
        needsToBeRendered = true,
        layout = {width: 1, height: 1, left: 0, top: 0},
        boardIsInteractive = false;

    style = function () {
        return document.getElementById('rotationsNavigator').style;
    };

    buttonEl = function (type) {
        return document.querySelector('#rotationsNavigator>button.' + type);
    };

    nRotationsEl = function () {
        return document.getElementById('nRotations');
    };

    onUndoClick = function () {
        board.undo();
    };

    onRedoClick = function () {
        board.redo();
    };

    onResetClick = function () {
        board.reset();
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
        var el = buttonEl(type);

        if (buttonIsDisabled) {
            el.setAttribute('disabled', true);
        } else {
            el.removeAttribute('disabled');
        }
    };

    renderUndoButton = function () {
        renderButton('undo', !board.undoIsPossible);
    };

    renderRedoButton = function () {
        renderButton('redo', !board.redoIsPossible);
    };

    updateControlsVisibility = function () {
        buttonEl('undo').style.display =
            buttonEl('redo').style.display =
            nRotationsEl().style.display = (boardIsInteractive ?
                                            'inline' : 'none');
        buttonEl('reset').style.display = (boardIsInteractive ?
                                           'none' : 'inline');
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

        updateControlsVisibility();

        nRotationsEl().textContent = nRotations;
        renderUndoButton();
        renderRedoButton();
    };

    util.onceDocumentIsInteractive(function () {
        setupButton('undo', onUndoClick);
        setupButton('redo', onRedoClick);
        setupButton('reset', onResetClick);

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

            if (board.isInteractive !== boardIsInteractive) {
                boardIsInteractive = board.isInteractive;
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
