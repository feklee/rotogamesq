// Creates boards.

/*jslint browser: true, maxlen: 80 */

/*global define */

define(["hiscores_factory"], function (hiscoresFactory) {
    "use strict";

    // Updates `internal.isFinished`.
    var updateIsFinished = function (internal, board) {
        if (board.tiles.colorsAreEqualTo(board.endTiles)) {
            if (!internal.isFinished) {
                internal.isFinished = true;
                board.hiscores.propose(internal.rotations);
            }
        } else {
            internal.isFinished = false;
            board.hiscores.rmProposal(); // or else it would still appear
        }
    };

    // May also be used to reset.
    var initInternal = function (internal, startTiles) {
        if (startTiles !== undefined) {
            internal.startTiles = startTiles;
        }
        internal.tiles = internal.startTiles.copy();
        internal.rotations = []; // for undo, for counting, ...
        internal.futureRotations = []; // for redo
        internal.lastRotation = null;
        internal.isFinished = false; // true when game is finished
    };

    var prototype = Object.create(null, {
        rotate: {value: function (board, internal, rotation) {
            internal.rotations.push(rotation);
            internal.futureRotations.length = 0; // resets redo history
            board.tiles.rotate(rotation);
            updateIsFinished(internal, board);
            internal.lastRotation = rotation;
        }},

        undo: {value: function (board, internal) {
            var rotation = internal.rotations.pop();
            if (rotation !== undefined) {
                internal.futureRotations.push(rotation);
                board.tiles.rotateInverse(rotation);
                updateIsFinished(internal, board);
                internal.lastRotation = rotation.inverse;
            } // else: no more undo
        }},

        redo: {value: function (board, internal) {
            var rotation = internal.futureRotations.pop();
            if (rotation !== undefined) {
                internal.rotations.push(rotation);
                board.tiles.rotate(rotation);
                updateIsFinished(internal, board);
                internal.lastRotation = rotation;
            } // else: no more redo
        }}
    });

    var create = function (name, startTiles, endTiles) {
        var internal = {};
        var hiscores = hiscoresFactory.create(name);

        initInternal(internal, startTiles);

        var board = Object.create(prototype);

        return Object.defineProperties(board, {
            rotate: {value: function (rotation) {
                prototype.rotate(board, internal, rotation);
            }},

            tiles: {get: function () {
                return internal.tiles;
            }},

            endTiles: {get: function () {
                return endTiles;
            }},

            sideLenT: {get: function () {
                return internal.tiles.length;
            }},

            nRotations: {get: function () {
                return internal.rotations.length;
            }},

            rotationIsPossible: {get: function () {
                return internal.rotations.length < 99;
            }},

            // True, if user can rotate e.g. by selection or by doing undo /
            // redo. Once the board is finished, and the hiscore has been
            // saved, the board is not interactive anymore. Otherwise the user
            // could undo, redo, and then enter hiscore again.
            isInteractive: {get: function () {
                return !hiscores.proposalWasSaved;
            }},

            undoIsPossible: {get: function () {
                return (board.isInteractive &&
                        internal.rotations.length > 0);
            }},

            undo: {value: function () {
                if (board.undoIsPossible) {
                    prototype.undo(board, internal);
                }
            }},

            redoIsPossible: {get: function () {
                return (board.isInteractive &&
                        internal.futureRotations.length > 0);
            }},

            redo: {value: function () {
                if (board.redoIsPossible) {
                    prototype.redo(board, internal);
                }
            }},

            reset: {value: function () {
                initInternal(internal);
                hiscores.resetProposal();
            }},

            isFinished: {get: function () {
                return internal.isFinished;
            }},

            lastRotation: {get: function () {
                return internal.lastRotation;
            }},

            name: {get: function () {
                return name;
            }},

            hiscores: {get: function () {
                return hiscores;
            }}
        });
    };

    return Object.create(null, {
        create: {value: create}
    });
});
