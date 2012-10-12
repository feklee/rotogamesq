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

    var maxLength = 7,
        lastNameSet = ''; // last name edited (preset for new proposals)

    function proposalIsBetterOrEqual(proposal, hiscore) {
        return proposal !== null && proposal.nRotations <= hiscore.nRotations;
    }

    function keepHiscoresLengthInBounds(rawHiscores) {
        rawHiscores.length = Math.min(rawHiscores.length, maxLength);
    }

    // Inserts proposal into hiscore:
    //
    //   * if it has sufficiently small number of rotations,
    //
    //   * and if name is not empty,
    //
    //   * and if there are no duplicates (same name) with a lower number of
    //     rotations.
    function insertProposal(internal) {
        // fixme: perhaps remove, and/or show spinner until update

//fixme:            internal.version += 1;

        var i, hiscore, proposalHasBeenInserted = false,
            rawHiscores = internal.rawHiscores,
            proposal = internal.proposal;

        socketIo.emit('hiscore for ' + internal.boardName, proposal);

        if (proposal.name !== '') {
            if (rawHiscores.length === 0) {
                // hiscores empty => just insert
                rawHiscores.push(proposal);
                return;
            }

            for (i = 0; i < rawHiscores.length; i += 1) {
                hiscore = rawHiscores[i];

                if (proposal.name === hiscore.name &&
                        proposal.nRotations >= hiscore.nRotations) {
                    return; // duplicate with lower/same number of rotations
                }

                if (proposal.nRotations <= hiscore.nRotations &&
                        !proposalHasBeenInserted) {
                    rawHiscores.splice(i, 0, proposal);
                    proposalHasBeenInserted = true;
                } else if (proposal.name === hiscore.name) {
                    rawHiscores.splice(i, 1); // duplicate that is not better
                }
            }

            if (!proposalHasBeenInserted) {
                rawHiscores.push(proposal);
                proposalHasBeenInserted = true;
            }
        }

        keepHiscoresLengthInBounds(rawHiscores); // done at the end (in case
                                                 // duplicates have been
                                                 // removed)
    }

    function listenToUpdates(internal) {
        var eventName = 'hiscores for ' + internal.boardName;

        socketIo.on(eventName, function (newRawHiscores) {
            internal.rawHiscores = newRawHiscores;
            internal.version += 1;
        });
    }

    // `rawHiscores`: raw internal hiscores data
    function create(boardName) {
        var internal = {
            proposal: null, // new, proposed hiscore (editable)
            version: 0, // incremented on every update
            rawHiscores: [],
            boardName: boardName
        };

        listenToUpdates(internal);

        return Object.create(null, {
            // Calls callback with two parameters: hiscore, index, and whether
            // the hiscore is editable (only appears once)
            forEach: {value: function (callback) {
                var i, iOffs = 0, hiscore,
                    maxI = internal.rawHiscores.length,
                    proposal = internal.proposal,
                    rawHiscores = internal.rawHiscores,
                    proposalHasBeenShown = false;

                for (i = 0; i < maxI; i += 1) {
                    hiscore = rawHiscores[i + iOffs];
                    if (proposalIsBetterOrEqual(proposal, hiscore) &&
                            !proposalHasBeenShown) {
                        callback(proposal, i, true);
                        iOffs = -1; // repeat current hiscore in next run
                        maxI = Math.min(maxI + 1, maxLength);
                        proposalHasBeenShown = true;
                    } else {
                        callback(hiscore, i, false);
                    }
                }

                if (i < maxLength && proposal !== null &&
                        !proposalHasBeenShown) {
                    // there is still space, and proposal hasn't been shown
                    callback(proposal, i, true);
                    return;
                }
            }},

            length: {get: function () {
                return internal.rawHiscores.length;
            }},

            maxNameLen: {get: function () {
                return 8;
            }},

            nameInProposal: {set: function (name) {
                if (internal.proposal !== null) {
                    name = name.substring(0, this.maxNameLen);
                    internal.proposal.name = name;
                    lastNameSet = name;
                }
            }},

            saveProposal: {value: function () {
                if (internal.proposal !== null) {
                    insertProposal(internal);
                    internal.proposal = null;
                }
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
                internal.proposal = null;
            }},

            version: {get: function () {
                return internal.version;
            }}
        });
    }

    return Object.create(null, {
        create: {value: create}
    });
});
