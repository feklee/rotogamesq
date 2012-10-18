// Creates lists of top players, associated with a certain board.

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

define(['socket_io'], function (socketIo) {
    'use strict';

    var isBetterOrEqual, saveProposal, listenToUpdates, create,
        maxLength = 7,
        lastNameSet = ''; // last name edited (preset for new proposals)

    isBetterOrEqual = function (hiscore1, hiscore2) {
        return (hiscore1 !== undefined &&
                (hiscore2 === undefined ||
                 hiscore1.nRotations <= hiscore2.nRotations));
    };

    saveProposal = function (internal) {
        if (internal.proposal !== undefined) {
            internal.unsavedHiscores.push(internal.proposal);
            // fixme: sort proposal, simply by score (no date available anyhow)
            socketIo.emit('hiscore for ' + internal.boardName,
                          internal.proposal);
            internal.proposal = undefined;
        }
    };

    listenToUpdates = function (internal) {
        var eventName = 'hiscores for ' + internal.boardName;

        socketIo.on(eventName, function (newSavedHiscores) {
            internal.savedHiscores = newSavedHiscores;
            internal.version += 1;
        });
    };

    create = function (boardName) {
        var internal = {
            proposal: undefined, // new, proposed hiscore (editable)
            version: 0, // incremented on every update
            savedHiscores: [],
            unsavedHiscores: [], // new hiscores, not yet on the server
            boardName: boardName
        };

        listenToUpdates(internal);

        return Object.create(null, {
            // Calls callback with three parameters: hiscore, index, and
            // status. Status is one of:
            //
            //   * 'saved'
            //
            //   * 'unsaved'
            //
            //   * 'editable' (appears no more than once)
            //
            // Priorities if equal number of rotations from new to old:
            //
            // editable -> unsaved -> editable
            forEach: {value: function (callback) {
                var i, savedI = 0, unsavedI = 0,
                    savedHiscore, unsavedHiscore,
                    savedHiscores = internal.savedHiscores,
                    unsavedHiscores = internal.unsavedHiscores,
                    maxSavedI = savedHiscores.length,
                    maxUnsavedI = unsavedHiscores.length,
                    proposal = internal.proposal,
                    proposalHasBeenShown = false;

                // fixme: avoid display of duplicates

                for (i = 0; i < maxLength; i += 1) {
                    savedHiscore = savedHiscores[savedI];
                    unsavedHiscore = unsavedHiscores[unsavedI];
                    if (!proposalHasBeenShown &&
                            isBetterOrEqual(proposal, unsavedHiscore) &&
                            isBetterOrEqual(proposal, savedHiscore)) {
                        callback(proposal, i, 'editable');
                        proposalHasBeenShown = true;
                    } else if (isBetterOrEqual(unsavedHiscore, savedHiscore)) {
                        callback(unsavedHiscore, i, 'unsaved');
                        unsavedI += 1;
                    } else if (savedHiscore !== undefined) {
                        callback(savedHiscore, i, 'saved');
                        savedI += 1;
                    }
                }

                // fixme: More saved hiscores cause unsaved to disappear.
                // Investigate!
            }},

            length: {get: function () {
                return (internal.savedHiscores.length +
                        internal.unsavedHiscores.length +
                        (internal.proposal !== undefined ? 1 : 0));
            }},

            hasProposal: {get: function () {
                return internal.proposal !== undefined;
            }},

            maxNameLen: {get: function () {
                return 8;
            }},

            nameInProposal: {set: function (name) {
                if (internal.proposal !== undefined) {
                    name = name.substring(0, this.maxNameLen);
                    internal.proposal.name = name;
                    lastNameSet = name;
                }
            }},

            saveProposal: {value: function () {
                saveProposal.call(this, internal);
            }},

            // proposes a new hiscore (name is to be entered by the player)
            propose: {value: function (rotations) {
                internal.proposal = {
                    name: lastNameSet,
                    rotations: rotations.slice(),
                    nRotations: rotations.length
                };
            }},

            rmProposal: {value: function () {
                internal.proposal = undefined;
            }},

            version: {get: function () {
                return internal.version;
            }}
        });
    };

    return Object.create(null, {
        create: {value: create}
    });
});
