// Displays the list of a board's top players as a table.

/*jslint browser: true, maxlen: 80 */

/*global define */

define(["util", "boards"], function (util, boards) {
    "use strict";

    var board;
    var nameInputFieldEl;
    var submitButtonEl;
    var boardIsFinished;
    var submitIsEnabled = false;
    var needsToBeRendered = true;
    var layout = {width: 1, height: 1, left: 0, top: 0, portrait: false};
    var hiscoresVersion = 0;
    var nameInputFieldIsVisible;

    var groupEl = function () {
        return document.getElementById("hiscoresTableGroup");
    };

    var tableEl = function () {
        return document.querySelector("#hiscoresTableGroup>table");
    };

    var contTableEl = function () {
        return document.querySelector("#hiscoresTableGroup>table.cont");
    };

    var newTdEl = function (text) {
        var el = document.createElement("td");

        el.appendChild(document.createTextNode(text));

        return el;
    };

    var newTrEl = function (hiscore) {
        var el = document.createElement("tr");

        el.appendChild(newTdEl(hiscore.name));
        el.appendChild(newTdEl(hiscore.nRotations));

        return el;
    };

    // for unsaved hiscores entries
    var newUnsavedTrEl = function (hiscore, lineHeight) {
        var el = document.createElement("tr");

        // spinner shown instead of # rotations:
        var spinnerTdEl = newTdEl("");
        var spinnerEl = document.createElement("span");
        var s = spinnerEl.style;

        spinnerTdEl.appendChild(spinnerEl);
        s.width = (0.1 * lineHeight) + "px";
        s.height = 0.6 * lineHeight + "px";
        s.margin = "0 " + (0.25 * lineHeight) + "px";
        spinnerEl.className = "spinner";

        el.appendChild(newTdEl(hiscore.name));
        el.appendChild(spinnerTdEl);

        el.className = "unsaved";
        return el;
    };

    // updates name in new hiscore entry, but does *not* save it yet
    var onNameInputFieldBlur = function () {
        board.hiscores.nameInProposal = nameInputFieldEl.value;
    };

    var onSubmit = function () {
        if (submitIsEnabled) {
            board.hiscores.nameInProposal = nameInputFieldEl.value;

            // Note that repeated calls to this function have no effect, since
            // after insertion (successful or not), the proposal is removed.
            board.hiscores.saveProposal();

            nameInputFieldEl.blur();

            needsToBeRendered = true;
        }
    };

    var updateSubmitButtonClasses = function () {
        var className;

        if (submitButtonEl !== undefined) {
            className = "submit button" + (submitIsEnabled
                ? ""
                : " disabled");
            submitButtonEl.className = className;
        }
    };

    // Updates: no name => submit does not work, and submit button is disabled
    var updateAbilityToSubmit = function () {
        submitIsEnabled = nameInputFieldEl.value !== "";
        updateSubmitButtonClasses();
    };

    var onKeyUpInNameInputField = function (e) {
        updateAbilityToSubmit();
        if (e.keyCode === 13) { // enter key
            onSubmit();
        }
    };

    // Caches the input field element.
    var newNameInputTdEl = function (name) {
        var el = document.createElement("td");

        if (nameInputFieldEl === undefined) {
            nameInputFieldEl = document.createElement("input");
            nameInputFieldEl.type = "text";
            nameInputFieldEl.maxLength = board.hiscores.maxNameLen;
            nameInputFieldEl.size = board.hiscores.maxNameLen;
            nameInputFieldEl.spellcheck = false;
            nameInputFieldEl.addEventListener("blur", onNameInputFieldBlur);
            nameInputFieldEl.addEventListener("keyup",
                    onKeyUpInNameInputField);
            nameInputFieldEl.addEventListener("propertychange",
                    updateAbilityToSubmit);
            nameInputFieldEl.addEventListener("input", updateAbilityToSubmit);
            nameInputFieldEl.addEventListener("paste", updateAbilityToSubmit);
        }
        nameInputFieldEl.value = name;
        el.appendChild(nameInputFieldEl);

        updateAbilityToSubmit(); // depends on `name`

        return el;
    };

    // Caches the submit button element.
    var newSubmitButtonTdEl = function () {
        var el = document.createElement("td");

        if (submitButtonEl === undefined) {
            submitButtonEl = document.createElement("span");
            submitButtonEl.appendChild(document.createTextNode(""));
            submitButtonEl.addEventListener("click", onSubmit);
            updateSubmitButtonClasses();
        }

        el.appendChild(submitButtonEl);

        return el;
    };

    var newInputTrEl = function (hiscore) {
        var el = document.createElement("tr");

        el.className = "input";
        el.appendChild(newNameInputTdEl(hiscore.name));
        el.appendChild(newSubmitButtonTdEl());

        // focuses text entry when clicking anywhere in the line:
        el.addEventListener("mouseup", function () {
            nameInputFieldEl.focus();
        });

        return el;
    };

    nameInputFieldIsVisible = function () {
        return (nameInputFieldEl !== undefined &&
                util.elIsInDom(nameInputFieldEl));
    };

    var renderRows = function (lineHeight) {
        var el = tableEl();
        var elc = contTableEl();
        var currentEl = el;
        var iToContinue = Math.ceil(board.hiscores.length / 2);
        var nameInputFieldElNeedsFocus =
                (!nameInputFieldIsVisible() ||
                document.activeElement === nameInputFieldEl);

        util.clear(el);
        util.clear(elc);

        board.hiscores.forEach(function (hiscore, i, status) {
            if (status === "editable") {
                if (iToContinue >= 4) {
                    iToContinue -= 1; // editable row needs more vertical space
                                      // => continue earlier
                }
            }

            if (layout.portrait && i >= iToContinue) {
                currentEl = elc;
            }

            switch (status) {
            case "editable":
                currentEl.appendChild(newInputTrEl(hiscore));
                if (nameInputFieldElNeedsFocus) {
                    // input element is new or already had focus
                    nameInputFieldEl.focus();
                } // else: did not have focus before
                break;
            case "unsaved":
                currentEl.appendChild(newUnsavedTrEl(hiscore, lineHeight));
                break;
            default: // "saved"
                currentEl.appendChild(newTrEl(hiscore));
            }
        });
    };

    var render = function () {
        var s = groupEl().style;
        var ts = tableEl().style;
        var cts = contTableEl().style;
        var width2;
        var lineHeight;

        // Setting `table-layout` to `fixed` in CSS file somehow has no effect
        // in Chrome 21.0, at least for the hiscores table group. Therefore:
        ts.tableLayout = "fixed";
        cts.tableLayout = "fixed";

        s.width = layout.width + "px";
        s.height = layout.height + "px";
        s.top = layout.top + "px";
        if (layout.portrait) {
            // portrait => continue results display in second table
            cts.display = "table";
            width2 = Math.floor(
                (layout.width - 2 * layout.horizontalMargin) / 2
            );
            s.left = layout.horizontalMargin + "px";
            cts.left = (width2 + 2 * layout.horizontalMargin) + "px";
            ts.width = width2 + "px";
            cts.width = ts.width;
            lineHeight = layout.height / 4;
        } else {
            cts.display = "none";
            s.left = layout.left + "px";
            ts.width = s.width;
            lineHeight = layout.height / 7;
        }
        cts.lineHeight = lineHeight + "px";
        ts.lineHeight = cts.lineHeight;
        cts.fontSize = (0.85 * lineHeight) + "px";
        ts.fontSize = cts.fontSize;

        renderRows(lineHeight);
    };

    return Object.create(null, {
        animStep: {value: function () {
            needsToBeRendered = (
                needsToBeRendered ||
                    boards.selected !== board ||
                    board.isFinished !== boardIsFinished ||
                    board.hiscores.version !== hiscoresVersion
            );

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
        }},

        hasFocus: {get: function () {
            return document.activeElement === nameInputFieldEl;
        }}
    });
});
