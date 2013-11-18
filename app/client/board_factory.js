// Creates boards.

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

define(['hiscores_factory'], function (hiscoresFactory) {
    'use strict';

    var prototype, updateIsFinished, initInternal, create;

    // Updates `internal.isFinished`.
    updateIsFinished = function (internal, board) {
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
    initInternal = function (internal, startTiles) {
        if (startTiles !== undefined) {
            internal.startTiles = startTiles;
        }
        internal.tiles = internal.startTiles.copy();
        internal.rotations = []; // for undo, for counting, ...
        internal.futureRotations = []; // for redo
        internal.lastRotation = null;
        internal.isFinished = false; // true when game is finished
    };

    prototype = Object.create(null, {
        rotate: {value: function (internal, rotation) {
            internal.rotations.push(rotation);
            internal.futureRotations.length = 0; // resets redo history
            this.tiles.rotate(rotation);
            updateIsFinished(internal, this);
            internal.lastRotation = rotation;
        }},

        undo: {value: function (internal) {
            var rotation = internal.rotations.pop();
            if (rotation !== undefined) {
                internal.futureRotations.push(rotation);
                this.tiles.rotateInverse(rotation);
                updateIsFinished(internal, this);
                internal.lastRotation = rotation.inverse;
            } // else: no more undo
        }},

        redo: {value: function (internal) {
            var rotation = internal.futureRotations.pop();
            if (rotation !== undefined) {
                internal.rotations.push(rotation);
                this.tiles.rotate(rotation);
                updateIsFinished(internal, this);
                internal.lastRotation = rotation;
            } // else: no more redo
        }}
    });

    create = function (name, startTiles, endTiles) {
        var board, internal = {}, hiscores = hiscoresFactory.create(name);

        initInternal(internal, startTiles);

        return Object.create(prototype, {
            rotate: {value: function (rotation) {
                prototype.rotate.call(this, internal, rotation);
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
                return (this.isInteractive &&
                        internal.rotations.length > 0);
            }},

            undo: {value: function () {
                if (this.undoIsPossible) {
                    prototype.undo.call(this, internal);
                }
            }},

            redoIsPossible: {get: function () {
                return (this.isInteractive &&
                        internal.futureRotations.length > 0);
            }},

            redo: {value: function () {
                if (this.redoIsPossible) {
                    prototype.redo.call(this, internal);
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
