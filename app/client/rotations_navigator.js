// Shows the number of steps and allows undo and redo operations. Allows binds
// keys for undo / redo.

/*jslint browser: true, maxlen: 80 */

/*global define, window */

define(["boards", "util"], function (boards, util) {
    "use strict";

    var nRotations;
    var board;
    var needsToBeRendered = true;
    var layout = {width: 1, height: 1, left: 0, top: 0};
    var boardIsInteractive = false;

    var style = function () {
        return document.getElementById("rotationsNavigator").style;
    };

    var buttonEl = function (type) {
        return document.querySelector("#rotationsNavigator>button." + type);
    };

    var nRotationsEl = function () {
        return document.getElementById("nRotations");
    };

    var onUndoClick = function () {
        board.undo();
    };

    var onRedoClick = function () {
        board.redo();
    };

    var onResetClick = function () {
        board.reset();
    };

    var onKeyUp = function (e) {
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
            // Meta or Command pressed with "z" (e.g. on Mac OS X)
            if (e.shiftKey) {
                board.redo();
            } else {
                board.undo();
            }
        }
    };

    var setupButton = function (type, onClick) {
        buttonEl(type).addEventListener("click", onClick);
    };

    var renderButton = function (type, buttonIsDisabled) {
        var el = buttonEl(type);

        if (buttonIsDisabled) {
            el.setAttribute("disabled", true);
        } else {
            el.removeAttribute("disabled");
        }
    };

    var renderUndoButton = function () {
        renderButton("undo", !board.undoIsPossible);
    };

    var renderRedoButton = function () {
        renderButton("redo", !board.redoIsPossible);
    };

    var updateControlsVisibility = function () {
        var display = boardIsInteractive
            ? "inline"
            : "none";
        buttonEl("undo").style.display = display;
        buttonEl("redo").style.display = display;
        nRotationsEl().style.display = display;

        buttonEl("reset").style.display = boardIsInteractive
            ? "none"
            : "inline";
    };

    var render = function () {
        var s = style();

        s.width = layout.width + "px";
        s.lineHeight = layout.height + "px";
        s.height = s.lineHeight;
        s.fontSize = (0.8 * layout.height) + "px";
        s.top = layout.top + "px";
        if (layout.portrait) {
            s.left = "auto";
            s.right = 0;
            s.marginRight = layout.rightMargin + "px";
            s.width = "auto";
            s.textAlign = "right";
        } else {
            s.left = layout.left + "px";
            s.right = "auto";
            s.marginRight = 0;
            s.width = layout.width;
            s.textAlign = "center";
        }

        updateControlsVisibility();

        nRotationsEl().textContent = nRotations;
        renderUndoButton();
        renderRedoButton();
    };

    util.onceDocumentIsInteractive(function () {
        setupButton("undo", onUndoClick);
        setupButton("redo", onRedoClick);
        setupButton("reset", onResetClick);

        window.addEventListener("keyup", onKeyUp);
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
